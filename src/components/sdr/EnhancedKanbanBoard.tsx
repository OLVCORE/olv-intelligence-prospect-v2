import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Filter, TrendingUp } from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { usePipelineStages } from '@/hooks/usePipelineStages';
import { DraggableDealCard } from './DraggableDealCard';
import { KanbanColumn } from './KanbanColumn';

export function EnhancedKanbanBoard() {
  const { data: stages, isLoading: stagesLoading } = usePipelineStages();
  const { data: deals, isLoading: dealsLoading } = useDeals({ status: 'open' });
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Handle deal movement
      console.log('Move deal', active.id, 'to stage', over.id);
    }
    
    setActiveId(null);
  };

  if (stagesLoading || dealsLoading) {
    return <div className="flex items-center justify-center h-96">Carregando...</div>;
  }

  const dealsByStage = deals?.reduce((acc, deal) => {
    if (!acc[deal.stage]) acc[deal.stage] = [];
    acc[deal.stage].push(deal);
    return acc;
  }, {} as Record<string, typeof deals>);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pipeline de Vendas</h2>
          <p className="text-sm text-muted-foreground">
            {deals?.length || 0} negócios ativos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="default" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Deal
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        onDragStart={(event) => setActiveId(event.active.id as string)}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCorners}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages?.filter(s => !s.is_closed).map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              deals={dealsByStage?.[stage.key] || []}
            />
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <DraggableDealCard
              deal={deals?.find(d => d.id === activeId)!}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Estatísticas do Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {stages?.filter(s => !s.is_closed).map((stage) => {
              const stageDeals = dealsByStage?.[stage.key] || [];
              const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
              return (
                <div key={stage.id} className="text-center">
                  <p className="text-xs text-muted-foreground">{stage.name}</p>
                  <p className="text-2xl font-bold">{stageDeals.length}</p>
                  <p className="text-xs text-muted-foreground">
                    R$ {(totalValue / 1000).toFixed(0)}k
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
