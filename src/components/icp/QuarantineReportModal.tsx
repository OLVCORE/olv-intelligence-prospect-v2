import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import TOTVSCheckCard from '@/components/totvs/TOTVSCheckCard';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, FileText, Maximize2, Minimize2, Download, Loader2, FileDown, Rocket } from 'lucide-react';
import { useApproveQuarantineBatch, useRejectQuarantine } from '@/hooks/useICPQuarantine';
import { toast } from 'sonner';
import { useState, useRef, useCallback, useMemo } from 'react';
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
  const contentRef = useRef<HTMLDivElement>(null);

  const handleReject = useCallback(() => {
    setShowDiscard(true);
  }, []);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

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
      : 'max-w-7xl w-[90vw] max-h-[90vh]';
  }, [isExpanded]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${modalSize} overflow-hidden p-0 flex flex-col`}
      >
        <div className="w-full h-full flex flex-col">
          {/* Header com controles */}
          <div className="shrink-0 border-b bg-gradient-to-r from-primary/5 to-primary/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-semibold truncate">
                  Relatório de Verificação TOTVS
                </DialogTitle>
                <DialogDescription className="text-sm mt-1 truncate">
                  {companyName}
                </DialogDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 ml-4">
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
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            <TOTVSCheckCard
              companyId={companyId}
              companyName={companyName}
              cnpj={cnpj}
              domain={domain}
              autoVerify={false}
              onResult={setStcResult}
            />
          </div>

          {/* Footer fixo */}
          <div className="shrink-0 border-t bg-muted/30 p-4">
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
