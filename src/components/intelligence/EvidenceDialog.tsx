import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, Calendar, Award, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Evidence {
  source: string;
  platform: string;
  score: number;
  title: string;
  snippet: string;
  url: string;
  timestamp: string;
  confidence: 'high' | 'medium' | 'low';
  totvs_products_mentioned?: string[];
  reason: string;
}

interface EvidenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  evidences: Evidence[];
}

export const EvidenceDialog = ({ open, onOpenChange, category, evidences }: EvidenceDialogProps) => {
  const totalPoints = evidences.reduce((sum, ev) => sum + ev.score, 0);

  const getConfidenceBadge = (confidence: string) => {
    const variants = {
      high: { variant: "destructive" as const, label: "Alta Confiança", icon: AlertCircle },
      medium: { variant: "default" as const, label: "Média Confiança", icon: AlertCircle },
      low: { variant: "outline" as const, label: "Baixa Confiança", icon: AlertCircle },
    };
    return variants[confidence as keyof typeof variants] || variants.low;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            🔍 Evidências de Uso de TOTVS
            <Badge variant="destructive" className="text-sm">
              {evidences.length}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-base">
            <span className="font-semibold">{category}</span> • {totalPoints} pontos totais
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[65vh] pr-4">
          <div className="space-y-4">
            {evidences.map((evidence, idx) => (
              <div
                key={idx}
                className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors space-y-3"
              >
                {/* Header com título e badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="destructive" className="font-semibold">
                        <Award className="h-3 w-3 mr-1" />
                        {evidence.score} pts
                      </Badge>
                      <Badge {...getConfidenceBadge(evidence.confidence)}>
                        {getConfidenceBadge(evidence.confidence).label}
                      </Badge>
                      {evidence.totvs_products_mentioned && evidence.totvs_products_mentioned.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {evidence.totvs_products_mentioned.length} produto(s)
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm leading-tight text-foreground">
                      {evidence.title}
                    </h4>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => window.open(evidence.url, '_blank')}
                    className="shrink-0 gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="hidden sm:inline">Abrir</span>
                  </Button>
                </div>

                {/* Snippet/Descrição */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {evidence.snippet}
                </p>

                {/* Produtos TOTVS mencionados */}
                {evidence.totvs_products_mentioned && evidence.totvs_products_mentioned.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-xs font-medium text-muted-foreground">Produtos TOTVS:</span>
                    {evidence.totvs_products_mentioned.map((product) => (
                      <Badge key={product} variant="secondary" className="text-xs font-medium">
                        {product}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Footer com metadata */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(evidence.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <span className="text-xs font-medium">
                    {evidence.platform}
                  </span>
                </div>

                {/* Razão/Motivo da detecção */}
                <div className="text-xs bg-muted/50 rounded-md p-2.5">
                  <span className="font-semibold text-foreground">Motivo:</span>{' '}
                  <span className="text-muted-foreground">{evidence.reason}</span>
                </div>
              </div>
            ))}

            {evidences.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma evidência encontrada para esta categoria.</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground font-medium">
            {evidences.length} evidência(s) • {totalPoints} pontos totais
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
