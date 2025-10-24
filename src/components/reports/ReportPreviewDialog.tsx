import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CompanyReport } from "@/components/reports/CompanyReport";

interface ReportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export default function ReportPreviewDialog({ open, onOpenChange, companyId }: ReportPreviewDialogProps) {
  const handleDownloadPDF = () => {
    // Simplified PDF download - will implement later
    console.log('PDF download requested for company:', companyId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] overflow-hidden">
        <DialogHeader className="flex-row items-center justify-between">
          <DialogTitle>Pré-visualização do Relatório</DialogTitle>
          <Button size="sm" onClick={handleDownloadPDF}>Baixar PDF</Button>
        </DialogHeader>
        <div className="h-full overflow-y-auto pr-2">
          <CompanyReport companyId={companyId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}