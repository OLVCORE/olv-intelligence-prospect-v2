import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import TOTVSCheckCard from '@/components/totvs/TOTVSCheckCard';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, FileText, Maximize2, Minimize2, Download, Loader2, FileDown, Database, Send, History } from 'lucide-react';
import { useApproveQuarantineBatch, useRejectQuarantine } from '@/hooks/useICPQuarantine';
import { useCreateDeal } from '@/hooks/useDeals';
import { useLatestSTCReport } from '@/hooks/useSTCHistory';
import { toast } from 'sonner';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DiscardCompanyModal } from '@/components/icp/DiscardCompanyModal';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const { mutate: createDeal } = useCreateDeal();
  const navigate = useNavigate();
  
  // Buscar último relatório salvo
  const { data: latestReport, isLoading: loadingHistory } = useLatestSTCReport(companyId, companyName);

  const [showDiscard, setShowDiscard] = useState(false);
  const [stcResult, setStcResult] = useState<any | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingToPipeline, setIsSendingToPipeline] = useState(false);
  const [loadedFromHistory, setLoadedFromHistory] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // ✅ Carregar relatório salvo automaticamente ao abrir modal
  useEffect(() => {
    if (open && latestReport && latestReport.full_report && !loadedFromHistory) {
      setStcResult(latestReport.full_report);
      setLoadedFromHistory(true);
      toast.success('📋 Relatório carregado do histórico', {
        description: `Salvo em ${new Date(latestReport.created_at).toLocaleString('pt-BR')}`,
        duration: 3000,
      });
    }
  }, [open, latestReport, loadedFromHistory]);

  const handleApprove = useCallback(() => {
    approveBatch(
      [analysisId],
      {
        onSuccess: () => {
          toast.success('Empresa aprovada e movida para o Pool');
          onOpenChange(false);
        },
      }
    );
  }, [analysisId, approveBatch, onOpenChange]);

  const handleSaveToSystem = useCallback(async () => {
    if (!stcResult) {
      toast.info('Execute a verificação TOTVS antes de salvar');
      return;
    }
    
    setIsSaving(true);
    try {
      // ===== CAPTURAR DADOS DE TODAS AS ABAS =====
      
      // 1. Competitors (do localStorage)
      let competitors: any | null = null;
      try {
        const key = `competitors:${(companyName || '').toLowerCase()}`;
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          competitors = parsed.data || null;
        }
      } catch {}

      // 2. Similar Companies (do banco de dados)
      let similarCompanies: any[] = [];
      if (companyId) {
        try {
          const { data } = await supabase
            .from('similar_companies')
            .select('*')
            .eq('company_id', companyId)
            .order('similarity_score', { ascending: false });
          similarCompanies = data || [];
        } catch (err) {
          console.error('Erro ao capturar similar companies:', err);
        }
      }

      // 3. Keywords SEO (do localStorage se disponível)
      let keywordsSEO: any | null = null;
      try {
        const keywordsKey = `seo-keywords:${(companyName || '').toLowerCase()}`;
        const keywordsCached = localStorage.getItem(keywordsKey);
        if (keywordsCached) {
          const parsed = JSON.parse(keywordsCached);
          keywordsSEO = parsed.data || null;
        }
      } catch {}

      // Montar relatório completo com TODAS as abas
      const fullReport = { 
        ...stcResult, 
        competitors_report: competitors,
        similar_companies_report: similarCompanies,
        keywords_seo_report: keywordsSEO,
        saved_at: new Date().toISOString()
      };

      // 1. Salvar relatório STC COMPLETO (incluindo full_report para reabertura)
      const { error: insertError } = await supabase.from('stc_verification_history').insert({
        company_id: companyId || null,
        company_name: companyName,
        cnpj: cnpj || null,
        status: stcResult.status || 'unknown',
        confidence: stcResult.confidence || 'low',
        triple_matches: stcResult.tripleMatches || (stcResult as any).triple_matches || 0,
        double_matches: stcResult.doubleMatches || (stcResult as any).double_matches || 0,
        single_matches: stcResult.singleMatches || (stcResult as any).single_matches || 0,
        total_score: stcResult.totalScore || (stcResult as any).total_weight || 0,
        evidences: (stcResult as any).evidences || [],
        sources_consulted: (stcResult as any).methodology?.searched_sources || (stcResult as any).sourcesConsulted || 0,
        queries_executed: (stcResult as any).methodology?.total_queries || (stcResult as any).queriesExecuted || 0,
        verification_duration_ms: (stcResult as any).methodology?.execution_ms || (stcResult as any).verificationDurationMs || 0,
        // ✅ SALVAR RELATÓRIO COMPLETO para reabertura sem nova consulta
        full_report: fullReport,
      });

      if (insertError) throw insertError;

      // 2. Salvar/atualizar empresa no banco (se tiver companyId)
      if (companyId) {
        const { error: updateError } = await supabase
          .from('companies')
          .update({
            totvs_detection_score: stcResult.totalScore || 0,
            totvs_last_checked_at: new Date().toISOString(),
          })
          .eq('id', companyId);
        
        if (updateError) throw updateError;
      }

      toast.success('✅ Relatório salvo com sucesso!', { 
        duration: 4000,
        description: 'Pode ser reaberto a qualquer momento sem consumir créditos'
      });
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar no sistema', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  }, [stcResult, companyId, companyName, cnpj]);

  const handleSendToPipeline = useCallback(async () => {
    if (!companyId) {
      toast.error('ID da empresa não encontrado');
      return;
    }

    setIsSendingToPipeline(true);
    try {
      // Criar deal no pipeline de vendas
      createDeal(
        {
          title: `Prospecção - ${companyName}`,
          company_id: companyId,
          stage: 'lead',
          priority: 'medium',
          value: 0,
          description: `Empresa originada do ICP Quarantine. CNPJ: ${cnpj || 'N/A'}`,
        },
        {
          onSuccess: () => {
            toast.success('✅ Enviado para o Pipeline!', {
              duration: 4000,
              description: 'Empresa adicionada no estágio Lead',
            });
            onOpenChange(false);
            // Redirecionar para o Sales Workspace
            setTimeout(() => {
              navigate('/sdr/workspace');
            }, 500);
          },
          onError: (error: any) => {
            toast.error('Erro ao enviar para pipeline', { 
              description: error.message 
            });
            setIsSendingToPipeline(false);
          },
        }
      );
    } catch (error: any) {
      toast.error('Erro ao criar deal', { description: error.message });
      setIsSendingToPipeline(false);
    }
  }, [companyId, companyName, cnpj, createDeal, onOpenChange, navigate]);

  const handleReject = useCallback(() => {
    setShowDiscard(true);
  }, []);

  const handlePrintPDF = useCallback(async () => {
    if (!contentRef.current || isGeneratingPDF) {
      return;
    }

    try {
      setIsGeneratingPDF(true);
      toast.info('Gerando PDF...', { duration: 2000 });
      
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: contentRef.current.scrollWidth,
        windowHeight: contentRef.current.scrollHeight,
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png', 0.95);
      
      let position = 0;
      const pageHeight = 297;
      
      while (position < imgHeight) {
        pdf.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight);
        position += pageHeight;
        
        if (position < imgHeight) {
          pdf.addPage();
        }
      }
      
      pdf.save(`relatorio-totvs-${companyName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
      toast.success('PDF gerado com sucesso');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [companyName, isGeneratingPDF]);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const modalSize = useMemo(() => {
    return isExpanded 
      ? 'max-w-[98vw] w-[98vw] h-[98vh]' 
      : 'max-w-7xl w-[90vw] max-h-[90vh]';
  }, [isExpanded]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${modalSize} p-0 flex flex-col`}
      >
        <div className="w-full h-full flex flex-col overflow-hidden">
          {/* Header com controles */}
          <div className="shrink-0 border-b bg-gradient-to-r from-primary/5 to-primary/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-semibold truncate flex items-center gap-2">
                  Relatório de Verificação TOTVS
                  {loadedFromHistory && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                      <History className="w-3 h-3" />
                      Histórico
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="text-sm mt-1 truncate">
                  {companyName}
                  {latestReport && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      • Último relatório: {new Date(latestReport.created_at).toLocaleString('pt-BR')}
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <Button
                variant="default"
                size="sm"
                onClick={handlePrintPDF}
                disabled={isGeneratingPDF}
                title="Exportar como PDF"
                className="h-9 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Gerando...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    <span className="text-sm font-medium">Exportar PDF</span>
                  </>
                )}
              </Button>
              
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
            ref={contentRef}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            <TOTVSCheckCard
              companyId={companyId}
              companyName={companyName}
              cnpj={cnpj}
              domain={domain}
              autoVerify={false}
              onResult={setStcResult}
              latestReport={latestReport}
            />
          </div>

          {/* Footer fixo */}
          <div className="shrink-0 border-t bg-muted/30 p-4">
            <DialogFooter className="gap-2 sm:gap-2 flex-wrap">
              <Button 
                variant="outline" 
                onClick={handleSaveToSystem} 
                disabled={isSaving || !stcResult}
                className="gap-2"
                size="sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Salvar no Sistema
                  </>
                )}
              </Button>
              
              <Button 
                variant="default" 
                onClick={handleSendToPipeline} 
                disabled={isSendingToPipeline || !companyId}
                className="gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                size="sm"
              >
                {isSendingToPipeline ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar para Pipeline
                  </>
                )}
              </Button>
              
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
                onClick={handleApprove} 
                className="gap-2"
                size="sm"
              >
                <CheckCircle className="w-4 h-4" />
                Aprovar e Mover para Pool
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
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
