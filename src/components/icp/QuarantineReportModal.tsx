import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { SimpleTOTVSCheckCard } from '@/components/intelligence/SimpleTOTVSCheckCard';

interface QuarantineReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string;
  companyName: string;
  cnpj?: string;
  domain?: string;
}

export function QuarantineReportModal({ open, onOpenChange, analysisId, companyName, cnpj, domain }: QuarantineReportModalProps) {
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
            companyName={companyName}
            cnpj={cnpj}
            domain={domain}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
