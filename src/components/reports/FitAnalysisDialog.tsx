import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface FitAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: any | null;
}

export default function FitAnalysisDialog({ open, onOpenChange, analysis }: FitAnalysisDialogProps) {
  if (!analysis) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Análise de Fit TOTVS</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Nenhuma análise disponível.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Análise de Fit TOTVS</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge>Fit Score: {analysis.fitScore ?? 'N/A'}</Badge>
          </div>

          {analysis.summary && (
            <div>
              <h3 className="font-semibold mb-2">Resumo</h3>
              <p className="text-sm leading-relaxed">{analysis.summary}</p>
            </div>
          )}

          {Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Recomendações</h3>
              <div className="space-y-2">
                {analysis.recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-md border">
                    <div className="font-medium">{rec.product}</div>
                    {rec.reason && <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(analysis.gaps) && analysis.gaps.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Gaps Identificados</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {analysis.gaps.map((g: string, i: number) => <li key={i}>{g}</li>)}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}