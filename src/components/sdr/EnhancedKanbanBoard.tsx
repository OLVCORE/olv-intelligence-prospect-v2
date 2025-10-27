import { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Filter, TrendingUp, Trash2, MoveRight, X } from 'lucide-react';
import { useDeals, useMoveDeal, useBulkUpdateDeals, useDeleteDeal, type Deal } from '@/hooks/useDeals';
import { usePipelineStages } from '@/hooks/usePipelineStages';
import { DraggableDealCard } from './DraggableDealCard';
import { KanbanColumn } from './KanbanColumn';
import { DealDetailsDialog } from './DealDetailsDialog';
import { DealFiltersDialog, type DealFilters } from './DealFiltersDialog';
import { DealFormDialog } from './DealFormDialog';
import { toast } from 'sonner';

export function EnhancedKanbanBoard() {
  const { data: stages, isLoading: stagesLoading } = usePipelineStages();
  const { data: deals, isLoading: dealsLoading } = useDeals({ status: 'open' });
  const moveDeal = useMoveDeal();
  const bulkUpdate = useBulkUpdateDeals();
  const deleteDeal = useDeleteDeal();
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createDealOpen, setCreateDealOpen] = useState(false);
  const [filters, setFilters] = useState<DealFilters>({});

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const dealId = active.id as string;
      const newStage = over.id as string;
      await moveDeal.mutateAsync({ dealId, newStage });
    }
    
    setActiveId(null);
  };

  const handleSelectDeal = (dealId: string, selected: boolean) => {
    const newSelected = new Set(selectedDeals);
    if (selected) {
      newSelected.add(dealId);
    } else {
      newSelected.delete(dealId);
    }
    setSelectedDeals(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedDeals.size === 0) return;
    
    if (confirm(`Deletar ${selectedDeals.size} deals?`)) {
      for (const dealId of selectedDeals) {
        await deleteDeal.mutateAsync(dealId);
      }
      setSelectedDeals(new Set());
      toast.success(`${selectedDeals.size} deals deletados`);
    }
  };

  const handleBulkMove = async (stage: string) => {
    if (selectedDeals.size === 0) return;
    
    await bulkUpdate.mutateAsync({
      dealIds: Array.from(selectedDeals),
      updates: { stage }
    });
    setSelectedDeals(new Set());
    toast.success(`${selectedDeals.size} deals movidos para ${stage}`);
  };

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setDetailsOpen(true);
  };

  // Filter deals
  const filteredDeals = useMemo(() => {
    if (!deals) return [];
    
    return deals.filter(deal => {
      if (filters.search && !deal.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.priority && !filters.priority.includes(deal.priority)) {
        return false;
      }
      if (filters.status && !filters.status.includes(deal.status)) {
        return false;
      }
      if (filters.minValue && deal.value < filters.minValue) {
        return false;
      }
      if (filters.maxValue && deal.value > filters.maxValue) {
        return false;
      }
      if (filters.dateFrom && deal.expected_close_date && new Date(deal.expected_close_date) < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && deal.expected_close_date && new Date(deal.expected_close_date) > filters.dateTo) {
        return false;
      }
      return true;
    });
  }, [deals, filters]);

  if (stagesLoading || dealsLoading) {
    return <div className="flex items-center justify-center h-96">Carregando...</div>;
  }

  const dealsByStage = filteredDeals?.reduce((acc, deal) => {
    if (!acc[deal.stage]) acc[deal.stage] = [];
    acc[deal.stage].push(deal);
    return acc;
  }, {} as Record<string, typeof filteredDeals>);

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pipeline de Vendas</h2>
          <p className="text-sm text-muted-foreground">
            {filteredDeals?.length || 0} negócios {hasActiveFilters && '(filtrados)'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={hasActiveFilters ? "default" : "outline"} 
            size="sm"
            onClick={() => setFiltersOpen(true)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {Object.keys(filters).length}
              </Badge>
            )}
          </Button>
          <Button variant="default" size="sm" onClick={() => setCreateDealOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Deal
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedDeals.size > 0 && (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedDeals.size} selecionados</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDeals(new Set())}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar
                </Button>
                {stages?.filter(s => !s.is_closed).map((stage) => (
                  <Button
                    key={stage.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkMove(stage.key)}
                  >
                    <MoveRight className="h-4 w-4 mr-2" />
                    Mover para {stage.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              selectedDeals={selectedDeals}
              onSelectDeal={handleSelectDeal}
              onDealClick={handleDealClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <DraggableDealCard
              deal={filteredDeals?.find(d => d.id === activeId)!}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Dialogs */}
      <DealDetailsDialog
        deal={selectedDeal}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
      
      <DealFiltersDialog
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onApplyFilters={setFilters}
      />

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

      {/* Dialogs */}
      <DealFormDialog
        open={createDealOpen}
        onOpenChange={setCreateDealOpen}
        onSuccess={() => {
          // Deals will auto-refresh via realtime subscription
        }}
      />

      <DealDetailsDialog
        deal={selectedDeal}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <DealFiltersDialog
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onApplyFilters={setFilters}
      />
    </div>
  );
}
