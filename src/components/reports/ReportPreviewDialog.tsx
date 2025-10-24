import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CompanyReport from "@/components/reports/CompanyReport";
import { useRef } from "react";

interface ReportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export default function ReportPreviewDialog({ open, onOpenChange, companyId }: ReportPreviewDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    const element = containerRef.current;
    if (!element) return;

    const html2canvasMod: any = await import("html2canvas");
    const jsPDFMod: any = await import("jspdf");
    const html2canvas = html2canvasMod.default || html2canvasMod;
    const jsPDF = jsPDFMod.default || jsPDFMod;

    // Use a white background to ensure good contrast in both themes
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = 0;
    let heightLeft = imgHeight;

    // Add first page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add extra pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("relatorio-empresa.pdf");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] overflow-hidden">
        <DialogHeader className="flex-row items-center justify-between">
          <DialogTitle>Pré-visualização do Relatório</DialogTitle>
          <Button size="sm" onClick={handleDownloadPDF}>Baixar PDF</Button>
        </DialogHeader>
        <div ref={containerRef} className="h-full overflow-y-auto pr-2">
          <CompanyReport companyId={companyId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
