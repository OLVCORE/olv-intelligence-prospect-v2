import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SimpleTOTVSCheckCard } from "./SimpleTOTVSCheckCard";

interface SimpleTOTVSCheckDialogProps {
  companyId: string;
  companyName: string;
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>TOTVS Check - {companyName}</DialogTitle>
        </DialogHeader>
        <SimpleTOTVSCheckCard
          companyId={companyId}
          companyName={companyName}
          cnpj={cnpj}
          domain={domain}
        />
      </DialogContent>
    </Dialog>
  );
}
