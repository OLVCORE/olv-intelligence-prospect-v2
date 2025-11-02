import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import TOTVSCheckCard from '@/components/totvs/TOTVSCheckCard';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, FileText } from 'lucide-react';
import { useApproveQuarantineBatch, useRejectQuarantine } from '@/hooks/useICPQuarantine';
import { toast } from 'sonner';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DiscardCompanyModal } from '@/components/icp/DiscardCompanyModal';

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

  const handleApprove = () => {
    approveBatch(
      [analysisId],
      {
        onSuccess: () => {
          toast.success('✅ Empresa aprovada e movida para o Pool');
          onOpenChange(false);
        },
      }
    );
  };

  const handleSave = async () => {
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
  };

  const handleReject = () => {
    setShowDiscard(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Relatório de Verificação TOTVS</DialogTitle>
          <DialogDescription>
            {companyName}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <TOTVSCheckCard
          companyId={companyId}
          companyName={companyName}
          cnpj={cnpj}
          domain={domain}
          autoVerify={false}
          onResult={setStcResult}
        />
        <Separator />
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleSave}>
            <FileText className="w-4 h-4 mr-2" />
            Salvar Relatório
          </Button>
          <Button variant="destructive" onClick={handleReject}>
            <XCircle className="w-4 h-4 mr-2" />
            Descartar Empresa
          </Button>
          <Button onClick={handleApprove}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Aprovar e Mover para Pool
          </Button>
        </DialogFooter>
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
