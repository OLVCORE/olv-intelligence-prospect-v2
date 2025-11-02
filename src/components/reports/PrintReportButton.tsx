import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { toast } from 'sonner';

interface PrintReportButtonProps {
  contentId: string;
  fileName: string;
  title?: string;
}

export default function PrintReportButton({ 
  contentId, 
  fileName, 
  title = 'Imprimir Relatório' 
}: PrintReportButtonProps) {
  
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById(contentId);
    
    if (!element) {
      console.error('[PDF] Elemento não encontrado:', contentId);
      toast.error('Erro ao gerar PDF', {
        description: 'Conteúdo do relatório não encontrado'
      });
      return;
    }

    try {
      // Importar html2pdf dinamicamente
      const html2pdf = (await import('html2pdf.js')).default;

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
          scrollX: 0,
          windowHeight: element.scrollHeight,
        },
        jsPDF: { 
          unit: 'mm' as const, 
          format: 'a4' as const, 
          orientation: 'portrait' as const
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      toast.loading('Gerando PDF...', { id: 'pdf-generation' });
      await html2pdf().set(opt).from(element).save();
      toast.dismiss('pdf-generation');
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('[PDF] Erro ao gerar:', error);
      toast.dismiss('pdf-generation');
      toast.error('Erro ao gerar PDF', {
        description: 'Tente novamente ou use a opção Imprimir'
      });
    }
  };

  return (
    <div className="flex gap-2 print:hidden">
      <Button
        variant="outline"
        onClick={handlePrint}
        size="sm"
      >
        <Printer className="w-4 h-4 mr-2" />
        Imprimir
      </Button>
      <Button
        onClick={handleDownloadPDF}
        size="sm"
      >
        <Download className="w-4 h-4 mr-2" />
        Baixar PDF
      </Button>
    </div>
  );
}
