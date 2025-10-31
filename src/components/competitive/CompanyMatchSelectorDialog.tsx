import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Info, TrendingUp, TrendingDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CompanyMatch {
  name: string;
  matchScore: number;
  confidence: 'high' | 'medium' | 'low';
  matchReasons: string[];
  sources: string[];
  signals: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
}

interface CompanyMatchSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalCompanyName: string;
  matches: CompanyMatch[];
  onSelectMatch: (match: CompanyMatch) => void;
  isProcessing?: boolean;
}

export function CompanyMatchSelectorDialog({
  open,
  onOpenChange,
  originalCompanyName,
  matches,
  onSelectMatch,
  isProcessing = false,
}: CompanyMatchSelectorDialogProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleConfirm = () => {
    if (selectedIndex !== null && matches[selectedIndex]) {
      onSelectMatch(matches[selectedIndex]);
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants = {
      high: { variant: "default" as const, icon: CheckCircle2, label: "Alta Confiança" },
      medium: { variant: "secondary" as const, icon: AlertCircle, label: "Média Confiança" },
      low: { variant: "outline" as const, icon: Info, label: "Baixa Confiança" },
    };
    const config = variants[confidence as keyof typeof variants];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-amber-500" />
            Múltiplas Empresas Encontradas
          </DialogTitle>
          <DialogDescription className="text-base">
            Encontramos <strong>{matches.length} empresas</strong> com nomes similares a{" "}
            <strong className="text-primary">"{originalCompanyName}"</strong>.
            <br />
            Selecione a empresa correta que deseja analisar:
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {matches.map((match, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedIndex === index
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => setSelectedIndex(index)}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base mb-1">{match.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {match.sources.slice(0, 3).map((source, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {source}
                          </Badge>
                        ))}
                        {match.sources.length > 3 && (
                          <span className="text-xs">+{match.sources.length - 3} fontes</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getConfidenceBadge(match.confidence)}
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(match.matchScore)}`}>
                          {match.matchScore}%
                        </div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                    </div>
                  </div>

                  {/* Match Reasons */}
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">
                      Análise de Correspondência:
                    </div>
                    <div className="space-y-0.5">
                      {match.matchReasons.map((reason, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground">
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Signals */}
                  {(match.signals.positive.length > 0 || match.signals.negative.length > 0) && (
                    <div className="space-y-2 pt-2 border-t">
                      {match.signals.positive.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-green-600 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Sinais Positivos ({match.signals.positive.length})
                          </div>
                          <div className="space-y-0.5">
                            {match.signals.positive.slice(0, 2).map((signal, idx) => (
                              <div key={idx} className="text-xs text-muted-foreground pl-4">
                                • {signal}
                              </div>
                            ))}
                            {match.signals.positive.length > 2 && (
                              <div className="text-xs text-muted-foreground pl-4 italic">
                                +{match.signals.positive.length - 2} sinais adicionais
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {match.signals.negative.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-red-600 flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" />
                            Sinais Negativos ({match.signals.negative.length})
                          </div>
                          <div className="space-y-0.5">
                            {match.signals.negative.slice(0, 2).map((signal, idx) => (
                              <div key={idx} className="text-xs text-muted-foreground pl-4">
                                • {signal}
                              </div>
                            ))}
                            {match.signals.negative.length > 2 && (
                              <div className="text-xs text-muted-foreground pl-4 italic">
                                +{match.signals.negative.length - 2} sinais adicionais
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selection Indicator */}
                  {selectedIndex === index && (
                    <div className="flex items-center gap-2 text-sm text-primary font-medium pt-2 border-t">
                      <CheckCircle2 className="h-4 w-4" />
                      Empresa Selecionada
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIndex === null || isProcessing}
          >
            {isProcessing ? "Processando..." : "Confirmar e Analisar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
