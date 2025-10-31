import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const getConfidenceBadge = (confidence: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      high: 'default',
      medium: 'secondary',
      low: 'destructive'
    };
    return <Badge variant={variants[confidence] || 'secondary'}>{confidence}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {category}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {evidences.length} evidência(s) encontrada(s)
          </p>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {evidences.map((evidence, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{evidence.platform}</Badge>
                      {getConfidenceBadge(evidence.confidence)}
                      <span className="text-sm font-medium text-primary">
                        +{evidence.score} pts
                      </span>
                    </div>
                    <h4 className="font-medium text-sm mb-1">{evidence.title}</h4>
                    <p className="text-sm text-muted-foreground">{evidence.snippet}</p>
                  </div>
                </div>

                {evidence.totvs_products_mentioned && evidence.totvs_products_mentioned.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {evidence.totvs_products_mentioned.map((product, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {product}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <p className="text-xs text-muted-foreground">{evidence.reason}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-8"
                  >
                    <a
                      href={evidence.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <span className="text-xs">Ver fonte</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
