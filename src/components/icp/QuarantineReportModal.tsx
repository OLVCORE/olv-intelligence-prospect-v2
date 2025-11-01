import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import TOTVSVerificationCard from '@/components/totvs/TOTVSVerificationCard';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { useApproveQuarantineBatch, useRejectQuarantine } from '@/hooks/useICPQuarantine';
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

  const handleReject = () => {
    rejectCompany(
      { analysisId, motivo: 'Descartado via modal' },
      {
        onSuccess: () => {
          toast.success('❌ Empresa descartada da quarentena');
          onOpenChange(false);
        },
      }
    );
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
        <TOTVSVerificationCard
          companyId={companyId}
          companyName={companyName}
          cnpj={cnpj}
          domain={domain}
          autoVerify={false}
        />
        <Separator />
        <DialogFooter className="gap-2">
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
    </Dialog>
  );
}
