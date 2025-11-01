import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TOTVSCheckCard from '@/components/totvs/TOTVSCheckCard';

interface SimpleTOTVSCheckDialogProps {
  companyId?: string;
  companyName?: string;
  cnpj?: string;
  domain?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SimpleTOTVSCheckDialog({
  companyId,
  companyName,
  cnpj,
  domain,
  open,
  onOpenChange,
}: SimpleTOTVSCheckDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verificação TOTVS - {companyName}</DialogTitle>
        </DialogHeader>
        <TOTVSCheckCard
          companyId={companyId}
          companyName={companyName}
          cnpj={cnpj}
          domain={domain}
          autoVerify={true}
        />
      </DialogContent>
    </Dialog>
  );
}
