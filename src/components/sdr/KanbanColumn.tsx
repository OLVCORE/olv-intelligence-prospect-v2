import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DraggableDealCard } from './DraggableDealCard';
import type { PipelineStage } from '@/hooks/usePipelineStages';
import type { Deal } from '@/hooks/useDeals';

interface KanbanColumnProps {
  stage: PipelineStage;
  deals: Deal[];
}

export function KanbanColumn({ stage, deals }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex-shrink-0 w-80">
      <Card className={`h-full transition-colors ${isOver ? 'ring-2 ring-primary' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              {stage.name}
              <Badge variant="secondary" className="ml-auto">
                {deals.length}
              </Badge>
            </CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            R$ {(totalValue / 1000).toFixed(1)}k
          </p>
        </CardHeader>
        <CardContent
          ref={setNodeRef}
          className="space-y-2 min-h-[400px] max-h-[600px] overflow-y-auto"
        >
          <SortableContext
            items={deals.map(d => d.id)}
            strategy={verticalListSortingStrategy}
          >
            {deals.map((deal) => (
              <DraggableDealCard key={deal.id} deal={deal} />
            ))}
          </SortableContext>
          {deals.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Nenhum deal neste estágio
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
