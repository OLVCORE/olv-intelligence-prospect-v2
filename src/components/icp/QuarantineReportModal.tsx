import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import TOTVSCheckCard from '@/components/totvs/TOTVSCheckCard';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, FileText, Maximize2, Minimize2, Download, Loader2, FileDown } from 'lucide-react';
import { useApproveQuarantineBatch, useRejectQuarantine } from '@/hooks/useICPQuarantine';
import { toast } from 'sonner';
import { useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DiscardCompanyModal } from '@/components/icp/DiscardCompanyModal';
import PrintReportButton from '@/components/reports/PrintReportButton';

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
  const contentRef = useRef<HTMLDivElement>(null);

  const handleApprove = useCallback(() => {
    approveBatch(
      [analysisId],
      {
        onSuccess: () => {
          toast.success('✓ Empresa Ativada no Pipeline');
          onOpenChange(false);
        },
      }
    );
  }, [analysisId, approveBatch, onOpenChange]);

  const handleSave = useCallback(async () => {
    if (!stcResult) {
      toast.info('Execute a verificação antes de salvar');
      return;
    }
    try {
      await supabase.from('stc_verification_history').insert({
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
      });
      toast.success('Relatório STC salvo');
    } catch (error: any) {
      toast.error('Erro ao salvar relatório', { description: error.message });
    }
  }, [stcResult, companyId, companyName, cnpj]);

  const handleReject = useCallback(() => {
    setShowDiscard(true);
  }, []);

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
              <PrintReportButton
                contentId="totvs-report-content"
                fileName={`relatorio-totvs-${cnpj || 'empresa'}`}
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
                variant="outline" 
                onClick={handleSave} 
                className="gap-2"
                size="sm"
              >
                <FileText className="w-4 h-4" />
                Salvar Relatório
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
                className="gap-2 bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <CheckCircle className="w-4 h-4" />
                Ativar no Pipeline
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
