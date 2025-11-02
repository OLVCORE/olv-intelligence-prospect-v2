import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import TOTVSCheckCard from '@/components/totvs/TOTVSCheckCard';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, FileText, Maximize2, Minimize2, Download, Loader2, FileDown, Rocket, RefreshCw, Save, AlertTriangle } from 'lucide-react';
import { useApproveQuarantineBatch, useRejectQuarantine } from '@/hooks/useICPQuarantine';
import { toast } from 'sonner';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DiscardCompanyModal } from '@/components/icp/DiscardCompanyModal';
import SaveReportPDF from '@/components/reports/SaveReportPDF';

interface QuarantineReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string;
  companyName: string;
  cnpj?: string;
  domain?: string;
  companyId?: string;
}

export function QuarantineReportModal({
  open,
  onOpenChange,
  analysisId,
  companyName,
  cnpj,
  domain,
  companyId,
}: QuarantineReportModalProps) {
  const { mutate: approveBatch } = useApproveQuarantineBatch();
  const { mutate: rejectCompany } = useRejectQuarantine();

  const [showDiscard, setShowDiscard] = useState(false);
  const [stcResult, setStcResult] = useState<any | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activating, setActivating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasExistingReport, setHasExistingReport] = useState(false);
  const [reportDate, setReportDate] = useState<string | null>(null);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // VERIFICAR SE JÁ EXISTE RELATÓRIO SALVO
  useEffect(() => {
    if (!open) return;

    const verificarRelatorioExistente = async () => {
      setLoading(true);
      
      try {
        console.log('[RELATÓRIO] Verificando se existe relatório salvo...');

        const { data: quarantineData, error: quarantineError } = await supabase
          .from('icp_analysis_results')
          .select('relatorio_salvo, relatorio_gerado_em, stc_result')
          .eq('id', analysisId)
          .single();

        if (quarantineError) throw quarantineError;

        console.log('[RELATÓRIO] Dados encontrados:', {
          relatorio_salvo: quarantineData.relatorio_salvo,
          relatorio_gerado_em: quarantineData.relatorio_gerado_em,
          tem_stc_result: !!quarantineData.stc_result
        });

        // SE JÁ TEM RELATÓRIO SALVO
        if (quarantineData.relatorio_salvo && quarantineData.stc_result) {
          console.log('[RELATÓRIO] ✅ Relatório salvo encontrado! Carregando...');
          
          setHasExistingReport(true);
          setReportDate(quarantineData.relatorio_gerado_em);
          setStcResult(quarantineData.stc_result);

          toast.info('📄 Relatório Salvo Carregado', {
            description: `Gerado em ${new Date(quarantineData.relatorio_gerado_em).toLocaleString('pt-BR')}`,
          });
        } else {
          console.log('[RELATÓRIO] ⚠️ Nenhum relatório salvo encontrado.');
          setHasExistingReport(false);
        }
      } catch (error: any) {
        console.error('[RELATÓRIO] Erro ao verificar:', error);
        toast.error('Erro ao carregar relatório', {
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    verificarRelatorioExistente();
  }, [open, analysisId]);

  const handleReject = useCallback(() => {
    setShowDiscard(true);
  }, []);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // FUNÇÃO PARA ATUALIZAR ANÁLISE (COM CONFIRMAÇÃO)
  const handleAtualizarAnalise = useCallback(() => {
    setShowUpdateConfirm(true);
  }, []);

  const confirmAtualizarAnalise = useCallback(async () => {
    console.log('[ANÁLISE] 🔄 Usuário confirmou atualização. Forçando nova análise...');
    
    setShowUpdateConfirm(false);
    setLoading(true);
    setStcResult(null);
    setHasExistingReport(false);
    
    // Força o TOTVSCheckCard a refazer a análise
    setLoading(false);
  }, []);

  // FUNÇÃO PARA SALVAR RELATÓRIO (3 ABAS SIMULTANEAMENTE)
  const handleSalvarRelatorio = useCallback(async () => {
    if (!stcResult) {
      toast.error('Nenhum relatório para salvar');
      return;
    }

    try {
      console.log('[RELATÓRIO] 💾 Salvando relatório completo (3 abas)...');
      
      toast.info('💾 Salvando Relatório Completo', {
        description: 'Gerando PDFs das 3 abas...',
      });

      // ======================================== 
      // GERAR PDF DE CADA ABA SEPARADAMENTE
      // ========================================
      const generateTabPDF = async (tabId: string, tabName: string, reportType: string) => {
        const element = document.getElementById(tabId);
        if (!element) {
          console.warn(`[PDF] Elemento ${tabId} não encontrado, pulando...`);
          return null;
        }

        // Importar html2pdf
        const html2pdf = (await import('html2pdf.js')).default;

        // Criar elemento temporário com conteúdo formatado
        const tempElement = document.createElement('div');
        tempElement.style.position = 'absolute';
        tempElement.style.left = '-9999px';
        tempElement.style.width = '210mm';
        tempElement.style.padding = '20px';
        tempElement.style.backgroundColor = 'white';
        tempElement.style.color = 'black';

        // Adicionar cabeçalho
        tempElement.innerHTML = `
          <div style="margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
            <h1 style="font-size: 24px; margin: 0 0 10px 0; color: #000;">${companyName}</h1>
            <h2 style="font-size: 18px; margin: 0 0 10px 0; color: #666;">${tabName}</h2>
            <p style="margin: 5px 0; color: #666;">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        `;

        // Clonar e adicionar conteúdo da aba
        const clonedContent = element.cloneNode(true) as HTMLElement;
        tempElement.appendChild(clonedContent);

        // Adicionar ao DOM temporariamente
        document.body.appendChild(tempElement);

        try {
          // Gerar PDF
          const opt = {
            margin: 10,
            filename: `${reportType}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { 
              scale: 2, 
              useCORS: true, 
              scrollY: 0, 
              scrollX: 0,
              windowHeight: tempElement.scrollHeight,
            },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
          };

          const blob = await html2pdf().set(opt).from(tempElement).outputPdf('blob');

          // Converter para base64
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => {
              const base64 = reader.result as string;
              resolve(base64.split(',')[1]);
            };
            reader.readAsDataURL(blob);
          });

          const base64PDF = await base64Promise;

          return {
            tipo: reportType,
            titulo: tabName,
            file_name: `${reportType}-${companyName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
            file_url: `data:application/pdf;base64,${base64PDF}`,
            file_size: blob.size,
            content_text: element.innerText.substring(0, 5000),
          };
        } finally {
          // Remover elemento temporário
          document.body.removeChild(tempElement);
        }
      };

      // ======================================== 
      // GERAR PDFs DAS 3 ABAS EM PARALELO
      // ========================================
      const [pdf1, pdf2, pdf3] = await Promise.all([
        generateTabPDF('totvs-detection-tab', 'Verificação TOTVS', 'totvs_verification'),
        generateTabPDF('totvs-similar-tab', 'Empresas Similares', 'similar_companies'),
        generateTabPDF('totvs-analysis-tab', 'Análise 360°', 'analysis_360'),
      ]);

      console.log('[RELATÓRIO] PDFs gerados:', { 
        pdf1: !!pdf1, 
        pdf2: !!pdf2, 
        pdf3: !!pdf3 
      });

      // ======================================== 
      // SALVAR OS 3 PDFs NO BANCO
      // ========================================
      const documentsToInsert = [pdf1, pdf2, pdf3]
        .filter(pdf => pdf !== null)
        .map(pdf => ({
          quarantine_id: analysisId,
          company_id: companyId || null,
          tipo: pdf!.tipo,
          titulo: pdf!.titulo,
          descricao: `Relatório gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')}`,
          file_name: pdf!.file_name,
          file_url: pdf!.file_url,
          file_size: pdf!.file_size,
          mime_type: 'application/pdf',
          content_text: pdf!.content_text,
          status: 'active',
        }));

      if (documentsToInsert.length === 0) {
        throw new Error('Nenhum PDF foi gerado com sucesso');
      }

      const { data: documentsData, error: documentsError } = await supabase
        .from('company_documents')
        .insert(documentsToInsert)
        .select();

      if (documentsError) throw documentsError;

      console.log('[RELATÓRIO] Documentos salvos:', documentsData.length);

      // ======================================== 
      // MARCAR RELATÓRIO COMO SALVO
      // ========================================
      const { error: updateError } = await supabase
        .from('icp_analysis_results')
        .update({
          relatorio_salvo: true,
          relatorio_gerado_em: new Date().toISOString(),
          stc_result: stcResult,
        })
        .eq('id', analysisId);

      if (updateError) throw updateError;

      console.log('[RELATÓRIO] ✅ Relatório completo salvo com sucesso!');

      setHasExistingReport(true);
      setReportDate(new Date().toISOString());

      toast.success('✓ Relatório Completo Salvo', {
        description: `${documentsData.length} documentos salvos no sistema`,
      });

    } catch (error: any) {
      console.error('[RELATÓRIO] Erro ao salvar:', error);
      toast.error('Erro ao salvar relatório', {
        description: error.message,
      });
    }
  }, [stcResult, analysisId, companyName, companyId]);

  const handleActivatePipeline = useCallback(async () => {
    setActivating(true);

    try {
      // 1. BUSCAR DADOS DA QUARENTENA
      const { data: quarantineData, error: quarantineError } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (quarantineError) throw quarantineError;

      // 2. CRIAR EMPRESA NO PIPELINE
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          quarantine_id: analysisId,
          name: quarantineData.razao_social,
          cnpj: quarantineData.cnpj,
          domain: quarantineData.website,
          icp_score: quarantineData.icp_score,
          temperatura: quarantineData.temperatura,
          pipeline_status: 'ativo',
          raw_data: quarantineData.raw_data,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      console.log('[PIPELINE] Empresa criada:', companyData);

      // 3. ATUALIZAR DOCUMENTOS COM COMPANY_ID
      const { error: updateDocsError } = await supabase
        .from('company_documents')
        .update({ company_id: companyData.id })
        .eq('quarantine_id', analysisId);

      if (updateDocsError) {
        console.error('[PIPELINE] Erro ao atualizar documentos:', updateDocsError);
      }

      // 4. MARCAR COMO ATIVADA NA QUARENTENA
      await supabase
        .from('icp_analysis_results')
        .update({ 
          moved_to_pool: true,
          status: 'ativado'
        })
        .eq('id', analysisId);

      toast.success('✓ Empresa Ativada no Pipeline', {
        description: 'A empresa e todos os documentos foram enviados para o pipeline de vendas',
      });

      onOpenChange(false);

    } catch (error: any) {
      console.error('[PIPELINE] Erro ao ativar:', error);
      toast.error('Erro ao ativar empresa', {
        description: error.message,
      });
    } finally {
      setActivating(false);
    }
  }, [analysisId, onOpenChange]);

  const modalSize = useMemo(() => {
    return isExpanded 
      ? 'max-w-[98vw] w-[98vw] h-[98vh]' 
      : 'max-w-7xl w-[90vw] h-[85vh]';
  }, [isExpanded]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${modalSize} overflow-hidden p-0 flex flex-col`}
      >
        <div className="w-full h-full flex flex-col min-h-0">
          {/* Header com controles */}
          <div className="flex-shrink-0 border-b bg-gradient-to-r from-primary/5 to-primary/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-semibold truncate">
                  Relatório de Verificação TOTVS
                </DialogTitle>
                <DialogDescription className="text-sm mt-1 truncate">
                  {companyName}
                  {hasExistingReport && reportDate && (
                    <span className="text-xs text-muted-foreground ml-2">
                      📄 Salvo em {new Date(reportDate).toLocaleString('pt-BR')}
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 ml-4">
              {/* Botão Atualizar (só aparece se já tem relatório) */}
              {hasExistingReport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAtualizarAnalise}
                  className="text-orange-600 border-orange-600 hover:bg-orange-50 gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Atualizar
                </Button>
              )}

              {/* Botão Salvar (só aparece se ainda não salvou e tem resultado) */}
              {!hasExistingReport && stcResult && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSalvarRelatorio}
                  className="bg-green-600 hover:bg-green-700 gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar 3 Abas
                </Button>
              )}

              <SaveReportPDF
                contentId="totvs-report-content"
                fileName={`relatorio-completo-${cnpj || 'empresa'}`}
                reportType="totvs_verification"
                reportTitle="Relatório Consolidado de Verificação"
                quarantineId={analysisId}
                companyId={companyId}
                allTabs
              />
              
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleExpand}
                title={isExpanded ? 'Minimizar' : 'Maximizar'}
                className="h-9 w-9"
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Conteúdo scrollable */}
          <div 
            id="totvs-report-content"
            ref={contentRef}
            className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6"
            style={{ minHeight: 0 }}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-semibold">
                  Carregando relatório...
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Sem consumo de créditos
                </p>
              </div>
            ) : hasExistingReport && stcResult ? (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Relatório em Cache - 3 Documentos Salvos</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                    Este relatório foi salvo anteriormente com todas as 3 abas (TOTVS + Similares + 360°). Use o botão "Atualizar" se precisar de dados mais recentes.
                  </p>
                </div>
                <TOTVSCheckCard
                  companyId={companyId}
                  companyName={companyName}
                  cnpj={cnpj}
                  domain={domain}
                  autoVerify={false}
                  cachedData={stcResult}
                  onResult={setStcResult}
                />
              </div>
            ) : (
              <TOTVSCheckCard
                companyId={companyId}
                companyName={companyName}
                cnpj={cnpj}
                domain={domain}
                autoVerify={true}
                onResult={setStcResult}
              />
            )}
          </div>

          {/* Footer fixo */}
          <div className="flex-shrink-0 border-t bg-muted/30 p-4">
            <DialogFooter className="gap-2 sm:gap-2">
              <Button 
                variant="destructive" 
                onClick={handleReject} 
                className="gap-2"
                size="sm"
              >
                <XCircle className="w-4 h-4" />
                Descartar Empresa
              </Button>
              <Button 
                onClick={handleActivatePipeline} 
                className="gap-2 bg-green-600 hover:bg-green-700"
                size="sm"
                disabled={activating}
              >
                {activating ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Ativando...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    Ativar no Pipeline
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>

      {/* Modal de confirmação de atualização */}
      {showUpdateConfirm && (
        <Dialog open={showUpdateConfirm} onOpenChange={setShowUpdateConfirm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="w-6 h-6" />
                Atenção: Consumo de Créditos
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-foreground">
                Atualizar a análise irá <strong>consumir créditos novamente</strong> das seguintes fontes:
              </p>
              
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full" />
                  Firecrawl (scraping de websites)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full" />
                  APIs de busca e dados empresariais
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full" />
                  Análise de IA (OpenAI/Claude)
                </li>
              </ul>

              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  💡 Dica: Use "Atualizar" apenas quando:
                </p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• A empresa mudou significativamente</li>
                  <li>• Passaram mais de 30 dias desde a última análise</li>
                  <li>• Você precisa de dados mais recentes</li>
                </ul>
              </div>

              <p className="text-sm font-semibold text-foreground">
                Deseja realmente atualizar a análise?
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpdateConfirm(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={confirmAtualizarAnalise}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Sim, Atualizar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Descarte com motivos */}
      <DiscardCompanyModal
        open={showDiscard}
        onOpenChange={setShowDiscard}
        company={{ id: companyId || analysisId, name: companyName, cnpj }}
        analysisId={analysisId}
        stcResult={stcResult || undefined}
        onSuccess={() => {
          toast.success('Empresa descartada');
          onOpenChange(false);
        }}
      />
    </Dialog>
  );
}
