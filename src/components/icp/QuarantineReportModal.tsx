import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { SimpleTOTVSCheckCard } from '@/components/intelligence/SimpleTOTVSCheckCard';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useApproveQuarantineBatch, useRejectQuarantine } from '@/hooks/useICPQuarantine';
import { useSimpleTOTVSCheck } from '@/hooks/useSimpleTOTVSCheck';
import { toast } from 'sonner';

interface QuarantineReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string;
  companyName: string;
  cnpj?: string;
  domain?: string;
  companyId?: string;
}

export function QuarantineReportModal({ open, onOpenChange, analysisId, companyId, companyName, cnpj, domain }: QuarantineReportModalProps) {
  const { mutate: approveBatch, isPending: isApproving } = useApproveQuarantineBatch();
  const { mutate: rejectCompany, isPending: isRejecting } = useRejectQuarantine();
  const checkMutation = useSimpleTOTVSCheck();
  const resolvedCompanyId = companyId || analysisId;

  const handleApprove = () => {
    approveBatch([analysisId], {
      onSuccess: () => {
        toast.success('✅ Empresa aprovada e movida para o Pool');
        onOpenChange(false);
      }
    });
  };

  const handleReject = () => {
    rejectCompany({ analysisId, motivo: 'Descartado via modal de verificação' }, {
      onSuccess: () => {
        toast.success('❌ Empresa descartada');
        onOpenChange(false);
      }
    });
  };

  const handleReverify = () => {
    if (!cnpj && !domain) {
      toast.error('CNPJ ou domínio necessário para reverificação');
      return;
    }
    if (cnpj && cnpj.replace(/\D/g, '').length !== 14) {
      toast.error('CNPJ inválido', { description: 'O CNPJ deve conter exatamente 14 dígitos' });
      return;
    }

    checkMutation.mutate({
      companyId: resolvedCompanyId,
      companyName,
      cnpj,
      domain
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl">Relatório de Verificação (Quarentena)</DialogTitle>
          <DialogDescription>
            Analise as evidências de uso de TOTVS e decida se deve avançar ou descartar, sem sair da Quarentena.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="p-6">
          <SimpleTOTVSCheckCard 
            companyId={analysisId}
            realCompanyId={companyId}
            companyName={companyName}
            cnpj={cnpj}
            domain={domain}
          />
        </div>
        <Separator />
        <DialogFooter className="px-6 pb-6 flex gap-2">
          <Button
            variant="outline"
            onClick={handleReverify}
            disabled={checkMutation.isPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${checkMutation.isPending ? 'animate-spin' : ''}`} />
            Reverificar
          </Button>
          <div className="flex-1" />
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isRejecting || isApproving}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            Descartar Empresa
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isApproving || isRejecting}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Aprovar e Mover para Pool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
