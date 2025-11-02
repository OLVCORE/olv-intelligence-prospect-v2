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
  onSaved?: (documentId: string) => void;
}

export default function SaveReportPDF({
  contentId,
  fileName,
  reportType,
  reportTitle,
  quarantineId,
  companyId,
  onSaved
}: SaveReportPDFProps) {
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const generatePDFBlob = async (): Promise<Blob> => {
    const element = document.getElementById(contentId);
    
    if (!element) {
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
        windowHeight: element.scrollHeight,
      },
      jsPDF: { 
        unit: 'mm' as any, 
        format: 'a4' as any, 
        orientation: 'portrait' as any 
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    const pdf = await html2pdf().set(opt).from(element).outputPdf('blob');
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
      
      // 2. EXTRAIR TEXTO DO ELEMENTO (para busca)
      const element = document.getElementById(contentId);
      const contentText = element?.innerText || '';

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
