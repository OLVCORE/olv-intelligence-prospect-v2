import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TOTVSDetectionReport } from "@/hooks/useTOTVSDetectionReports";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface TOTVSDetectionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reports: TOTVSDetectionReport[];
}

export const TOTVSDetectionHistory = ({ open, onOpenChange, reports }: TOTVSDetectionHistoryProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-destructive";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return "ALTO RISCO";
    if (score >= 40) return "MÉDIO RISCO";
    return "BAIXO RISCO";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Histórico de Análises TOTVS
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {reports.length} análise(s) realizada(s)
          </p>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {reports.map((report, idx) => (
              <Card key={report.id} className={idx === 0 ? "border-primary" : ""}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {/* Cabeçalho */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {idx === 0 && (
                            <Badge variant="default">Mais recente</Badge>
                          )}
                          <Badge variant={report.detection_status === 'disqualified' ? 'destructive' : 'default'}>
                            {getScoreLabel(report.score)}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(report.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(report.score)}`}>
                          {report.score}
                        </div>
                        <div className="text-xs text-muted-foreground">pontos</div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      {report.detection_status === 'disqualified' ? (
                        <>
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <span className="text-sm font-medium text-destructive">
                            DESQUALIFICADO - Empresa já usa TOTVS
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">
                            QUALIFICADO - Sem uso de TOTVS detectado
                          </span>
                        </>
                      )}
                    </div>

                    {/* Estatísticas */}
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                      <div>
                        <div className="text-xs text-muted-foreground">Evidências</div>
                        <div className="text-lg font-semibold">
                          {report.evidences?.length || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Fontes</div>
                        <div className="text-lg font-semibold">
                          {report.sources_checked}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Com resultados</div>
                        <div className="text-lg font-semibold">
                          {report.sources_with_results}
                        </div>
                      </div>
                    </div>

                    {/* Confiança */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Confiança:</span>
                      <Badge variant={
                        report.confidence === 'high' ? 'default' : 
                        report.confidence === 'medium' ? 'secondary' : 
                        'outline'
                      }>
                        {report.confidence === 'high' ? 'Alta' : 
                         report.confidence === 'medium' ? 'Média' : 
                         'Baixa'}
                      </Badge>
                    </div>

                    {/* Tempo de execução */}
                    {report.execution_time_ms && (
                      <div className="text-xs text-muted-foreground">
                        Tempo de execução: {(report.execution_time_ms / 1000).toFixed(2)}s
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
