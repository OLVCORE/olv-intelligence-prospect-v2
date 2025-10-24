import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Paperclip, RefreshCw } from 'lucide-react';
import type { CanvasBlock } from '@/hooks/useCanvasBlocks';

interface ReferenceBlockProps {
  block: CanvasBlock;
  onRefresh?: (blockId: string) => void;
}

export const ReferenceBlock = ({ block, onRefresh }: ReferenceBlockProps) => {
  const { source, snapshot_at, data } = block.content;

  const sourceLabels: Record<string, string> = {
    maturity: 'Maturidade Digital',
    fit: 'Fit TOTVS',
    tech: 'Tech Stack',
    decisors: 'Decisores',
    benchmark: 'Benchmark'
  };

  const isStale = snapshot_at && new Date().getTime() - new Date(snapshot_at).getTime() > 3600000; // 1 hora

  return (
    <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border-indigo-500/30">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-indigo-700 border-indigo-500/50">
              <Paperclip className="h-3 w-3 mr-1" />
              Referência
            </Badge>
            {onRefresh && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRefresh(block.id)}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Atualizar
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{sourceLabels[source] || source}</h3>
              {isStale && (
                <Badge variant="outline" className="text-yellow-700 border-yellow-500">
                  Desatualizado
                </Badge>
              )}
            </div>

            {snapshot_at && (
              <p className="text-xs text-muted-foreground">
                Snapshot: {new Date(snapshot_at).toLocaleString('pt-BR')}
              </p>
            )}

            {data && (
              <div className="bg-background/50 p-3 rounded-md border border-border/50">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};