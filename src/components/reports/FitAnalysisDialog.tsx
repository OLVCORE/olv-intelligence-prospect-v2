import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface FitAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: any | null;
}

export default function FitAnalysisDialog({ open, onOpenChange, analysis }: FitAnalysisDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Análise de Fit TOTVS</DialogTitle>
        </DialogHeader>
        {!analysis ? (
          <p className="text-sm text-muted-foreground">Nenhuma análise disponível.</p>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Badge>Fit Score: {analysis.fitScore ?? 'N/A'}</Badge>
              {analysis.tcoBenefit && (
                <span className="text-sm text-muted-foreground">{analysis.tcoBenefit}</span>
              )}
            </div>

            {analysis.summary && (
              <p className="text-sm leading-relaxed">{analysis.summary}</p>
            )}

            {Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Recomendações</h3>
                <div className="space-y-3">
                  {analysis.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-md border">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{rec.product}</div>
                        {rec.priority && <Badge variant="secondary">{rec.priority}</Badge>}
                      </div>
                      {rec.reason && <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>}
                      {rec.impact && <p className="text-sm mt-1">Impacto: {rec.impact}</p>}
                      {rec.implementation && <p className="text-xs text-muted-foreground mt-1">{rec.implementation}</p>}
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

            {analysis.strategy && (
              <div>
                <h3 className="font-semibold mb-2">Estratégia de Implementação</h3>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  {analysis.strategy.shortTerm && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Curto Prazo</div>
                      <Separator className="my-1" />
                      <ul className="list-disc list-inside space-y-1">
                        {analysis.strategy.shortTerm.map((s: string, i: number) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {analysis.strategy.mediumTerm && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Médio Prazo</div>
                      <Separator className="my-1" />
                      <ul className="list-disc list-inside space-y-1">
                        {analysis.strategy.mediumTerm.map((s: string, i: number) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {analysis.strategy.longTerm && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Longo Prazo</div>
                      <Separator className="my-1" />
                      <ul className="list-disc list-inside space-y-1">
                        {analysis.strategy.longTerm.map((s: string, i: number) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
