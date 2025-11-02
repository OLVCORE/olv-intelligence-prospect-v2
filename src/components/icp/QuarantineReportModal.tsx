import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import TOTVSCheckCard from '@/components/totvs/TOTVSCheckCard';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, FileText, Maximize2, Minimize2, Download, Move } from 'lucide-react';
import { useApproveQuarantineBatch, useRejectQuarantine } from '@/hooks/useICPQuarantine';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DiscardCompanyModal } from '@/components/icp/DiscardCompanyModal';
import Draggable from 'react-draggable';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const contentRef = useRef<HTMLDivElement>(null);

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

  const handlePrintPDF = async () => {
    if (!contentRef.current) {
      toast.error('Erro ao gerar PDF');
      return;
    }

    try {
      toast.info('Gerando PDF...', { duration: 2000 });
      
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`relatorio-totvs-${companyName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
      
      toast.success('PDF gerado com sucesso');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    // Reset position when toggling expand
    setPosition({ x: 0, y: 0 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${isExpanded ? 'max-w-[95vw] h-[95vh]' : 'max-w-6xl max-h-[90vh]'} overflow-hidden p-0`}
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      >
        <Draggable
          handle=".drag-handle"
          position={position}
          onStop={(e, data) => setPosition({ x: data.x, y: data.y })}
          bounds="parent"
        >
          <div className="w-full h-full flex flex-col">
            {/* Header com controles */}
            <div className="drag-handle cursor-move border-b bg-gradient-to-r from-primary/5 to-primary/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Move className="w-5 h-5 text-primary/60" />
                <div>
                  <DialogTitle className="text-lg font-semibold">Relatório de Verificação TOTVS</DialogTitle>
                  <DialogDescription className="text-sm mt-1">
                    {companyName}
                  </DialogDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrintPDF}
                  title="Exportar como PDF"
                  className="h-8 w-8"
                >
                  <Download className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleExpand}
                  title={isExpanded ? 'Minimizar' : 'Maximizar'}
                  className="h-8 w-8"
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
            <div className="border-t bg-muted/30 p-4">
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={handleSave} className="gap-2">
                  <FileText className="w-4 h-4" />
                  Salvar Relatório
                </Button>
                <Button variant="destructive" onClick={handleReject} className="gap-2">
                  <XCircle className="w-4 h-4" />
                  Descartar Empresa
                </Button>
                <Button onClick={handleApprove} className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Aprovar e Mover para Pool
                </Button>
              </DialogFooter>
            </div>
          </div>
        </Draggable>
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
