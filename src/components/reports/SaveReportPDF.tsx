import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SaveReportPDFProps {
  contentId: string;
  fileName: string;
  reportType: 'totvs_verification' | 'similar_companies' | 'analysis_360' | 'proposal' | 'contract' | 'other';
  reportTitle: string;
  quarantineId: string;
  companyId?: string;
  allTabs?: boolean;
  onSaved?: (documentId: string) => void;
}

export default function SaveReportPDF({
  contentId,
  fileName,
  reportType,
  reportTitle,
  quarantineId,
  companyId,
  allTabs,
  onSaved
}: SaveReportPDFProps) {
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Monta um container temporário com TODAS as abas ativas em sequência
  const buildFullReportContainer = async (): Promise<{ container: HTMLDivElement; cleanup: () => void }> => {
    const root = document.getElementById(contentId);
    if (!root) throw new Error('Conteúdo não encontrado');

    // Container temporário oculto
    const full = document.createElement('div');
    full.id = 'full-report-temp';
    full.style.position = 'absolute';
    full.style.left = '-9999px';
    full.style.top = '0';
    full.style.width = '210mm';
    full.style.padding = '20px';
    full.style.backgroundColor = '#ffffff';
    full.style.color = '#111827';

    // Cabeçalho simples
    const header = document.createElement('div');
    header.innerHTML = `
      <div style="margin-bottom: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
        <h1 style="font-size: 20px; margin: 0 0 6px 0;">${reportTitle}</h1>
        <p style="margin: 0; color: #6b7280;">${new Date().toLocaleString('pt-BR')}</p>
      </div>
    `;
    full.appendChild(header);

    // Tenta encontrar triggers das tabs Radix
    const triggers = Array.from(root.querySelectorAll('[role="tab"]')) as HTMLElement[];
    let originalIndex = triggers.findIndex(t => t.getAttribute('data-state') === 'active');
    if (originalIndex < 0) originalIndex = 0;

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Se não existirem abas, apenas clonar o conteúdo inteiro
    if (triggers.length === 0) {
      full.appendChild(root.cloneNode(true));
    } else {
      for (let i = 0; i < triggers.length; i++) {
        const trigger = triggers[i];
        // Ativar aba
        trigger.click();
        await wait(300);

        const panel = root.querySelector('[role="tabpanel"][data-state="active"]') as HTMLElement | null
          || root.querySelector('[data-state="active"]') as HTMLElement | null;

        const section = document.createElement('div');
        section.style.marginBottom = '24px';
        section.style.pageBreakInside = 'avoid';
        const title = trigger.textContent?.trim() || `Seção ${i + 1}`;
        section.innerHTML = `
          <h2 style="font-size: 16px; margin: 24px 0 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">${title}</h2>
        `;
        if (panel) section.appendChild(panel.cloneNode(true));
        full.appendChild(section);
      }

      // Voltar à aba original
      triggers[originalIndex]?.click();
      await wait(100);
    }

    document.body.appendChild(full);

    return {
      container: full,
      cleanup: () => {
        try { document.body.removeChild(full); } catch {}
      }
    };
  };

  const handlePrint = async () => {
    try {
      const element = allTabs ? (await buildFullReportContainer()).container : document.getElementById(contentId);
      if (!element) {
        toast.error('Conteúdo não encontrado');
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Bloqueador de pop-up ativo. Permita pop-ups para imprimir.');
        return;
      }

      const baseStyles = `
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { margin: 0; padding: 20px; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
        @page { size: A4; margin: 15mm; }
        .page-break { page-break-after: always; }
      `;

      printWindow.document.write(`<!DOCTYPE html><html><head><title>${fileName}</title><style>${baseStyles}</style></head><body>${element.innerHTML}</body></html>`);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      };
    } catch (e) {
      console.error('[PRINT] Erro:', e);
      toast.error('Falha ao preparar impressão');
    }
  };
  const generatePDFBlob = async (): Promise<Blob> => {
    let targetEl: HTMLElement | null = null;
    let cleanup: (() => void) | undefined;

    if (allTabs) {
      const built = await buildFullReportContainer();
      targetEl = built.container;
      cleanup = built.cleanup;
    } else {
      targetEl = document.getElementById(contentId);
    }
    
    if (!targetEl) {
      throw new Error('Elemento não encontrado');
    }

    const html2pdf = (await import('html2pdf.js')).default;

    const opt = {
      margin: 10 as any,
      filename: `${fileName}.pdf`,
      image: { type: 'jpeg' as any, quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        scrollY: 0,
        scrollX: 0,
        windowHeight: targetEl.scrollHeight,
      },
      jsPDF: { 
        unit: 'mm' as any, 
        format: 'a4' as any, 
        orientation: 'portrait' as any 
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    } as const;

    const pdf = await html2pdf().set(opt).from(targetEl).outputPdf('blob');

    // Limpar se usamos container temporário
    cleanup?.();

    return pdf;
  };

  const handleDownloadPDF = async () => {
    try {
      toast.info('Gerando PDF...', {
        description: 'Aguarde enquanto o documento é gerado',
      });

      const blob = await generatePDFBlob();
      
      // Download local
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('✓ PDF Baixado', {
        description: 'O documento foi salvo no seu computador',
      });

    } catch (error: any) {
      console.error('[PDF] Erro ao baixar:', error);
      toast.error('Erro ao gerar PDF', {
        description: error.message,
      });
    }
  };

  const handleSavePDF = async () => {

    setSaving(true);

    try {
      toast.info('💾 Salvando Documento...', {
        description: 'Gerando e salvando PDF no sistema',
      });

      // 1. GERAR PDF
      const blob = await generatePDFBlob();
      
      // 2. EXTRAIR TEXTO PARA BUSCA
      let contentText = '';
      let cleanupText: (() => void) | undefined;
      if (allTabs) {
        try {
          const built = await buildFullReportContainer();
          contentText = built.container.innerText || '';
          cleanupText = built.cleanup;
        } catch {}
      } else {
        const element = document.getElementById(contentId);
        contentText = element?.innerText || '';
      }

      // 3. CONVERTER BLOB PARA BASE64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]); // Remove "data:application/pdf;base64,"
        };
        reader.readAsDataURL(blob);
      });

      const base64PDF = await base64Promise;

      // 4. SALVAR NO BANCO DE DADOS
      const { data: documentData, error: documentError } = await supabase
        .from('company_documents')
        .insert({
          company_id: companyId || null,
          quarantine_id: quarantineId,
          tipo: reportType,
          titulo: reportTitle,
          descricao: `Relatório gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')}`,
          file_name: `${fileName}.pdf`,
          file_url: `data:application/pdf;base64,${base64PDF}`, // Salvar inline
          file_size: blob.size,
          mime_type: 'application/pdf',
          content_text: contentText.substring(0, 5000), // Primeiros 5000 chars para busca
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
          status: 'active',
        })
        .select()
        .single();

      // limpar container temporário usado só para extrair texto
      cleanupText?.();

      if (documentError) throw documentError;

      console.log('[PDF] Documento salvo:', documentData);

      setSaved(true);

      toast.success('✓ Documento Salvo', {
        description: 'O relatório foi salvo e será enviado junto com a empresa para o pipeline',
      });

      if (onSaved) {
        onSaved(documentData.id);
      }

    } catch (error: any) {
      console.error('[PDF] Erro ao salvar:', error);
      toast.error('Erro ao salvar documento', {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="w-4 h-4 mr-2" />
        Imprimir
      </Button>
      
      <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
        <Download className="w-4 h-4 mr-2" />
        Baixar PDF
      </Button>

      <Button 
        size="sm"
        onClick={handleSavePDF}
        disabled={saving || saved}
        className={saved ? 'bg-green-600 hover:bg-green-700' : ''}
      >
        {saving ? (
          <>
            <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Salvando...
          </>
        ) : saved ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Salvo ✓
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Salvar no Sistema
          </>
        )}
      </Button>
    </div>
  );
}
