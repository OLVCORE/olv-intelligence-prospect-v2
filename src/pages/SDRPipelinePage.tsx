import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TrendingUp, Users, DollarSign, Building2, GripVertical, BarChart3, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DealCard } from '@/components/sdr/DealCard';
import { PipelineFilters } from '@/components/sdr/PipelineFilters';
import { PipelineMetrics } from '@/components/sdr/PipelineMetrics';
import { PipelineForecast } from '@/components/sdr/PipelineForecast';

interface Deal {
  id: string;
  contact_id: string;
  company_id?: string;
  channel: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  priority: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  contact?: { name: string; email?: string; phone?: string };
  company?: { 
    name: string;
    industry?: string;
    employees?: number;
    digital_maturity_score?: number;
  };
  estimated_value?: number;
  win_probability?: number;
  next_action?: string;
  ai_insight?: string;
}

const PIPELINE_STAGES = [
  { id: 'new', title: 'Novos Leads', color: 'bg-slate-500/20 dark:bg-slate-700/40' },
  { id: 'contacted', title: 'Contactados', color: 'bg-blue-500/20 dark:bg-blue-700/40' },
  { id: 'qualified', title: 'Qualificados', color: 'bg-purple-500/20 dark:bg-purple-700/40' },
  { id: 'proposal', title: 'Proposta', color: 'bg-yellow-500/20 dark:bg-yellow-700/40' },
  { id: 'negotiation', title: 'Negociação', color: 'bg-orange-500/20 dark:bg-orange-700/40' },
  { id: 'won', title: 'Ganhos', color: 'bg-green-500/20 dark:bg-green-700/40' },
] as const;

function SortableDealCard({ deal }: { deal: Deal }) {
  return <DealCard deal={deal} />;
}

export default function SDRPipelinePage() {
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [valueRange, setValueRange] = useState<[number, number]>([0, 500000]);
  const [maturityRange, setMaturityRange] = useState<[number, number]>([0, 100]);

  useEffect(() => {
    loadPipeline();

    const channel = supabase
      .channel('sdr-pipeline')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sdr_opportunities' }, loadPipeline)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPipeline = async () => {
    setLoading(true);
    try {
      // DADOS REAIS da tabela sdr_opportunities
      const { data, error } = await supabase
        .from('sdr_opportunities')
        .select(`
          id,
          contact_id,
          company_id,
          conversation_id,
          stage,
          value,
          probability,
          next_action,
          metadata,
          created_at,
          updated_at,
          contact:contacts(name, email, phone),
          company:companies(
            name,
            industry,
            employees,
            digital_maturity_score
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapear para Deal interface (SEM mocks!)
      const mappedDeals = (data || []).map((opp: any) => ({
        id: opp.id,
        contact_id: opp.contact_id,
        company_id: opp.company_id,
        channel: opp.metadata?.channel || 'email',
        status: opp.stage,
        priority: opp.metadata?.priority || 'medium',
        last_message_at: opp.updated_at,
        created_at: opp.created_at,
        updated_at: opp.updated_at,
        contact: opp.contact,
        company: opp.company,
        estimated_value: Number(opp.value) || 0,
        win_probability: opp.probability || 0,
        next_action: opp.next_action || 'Definir próxima ação',
        ai_insight: opp.metadata?.ai_insight || null,
      }));

      setDeals(mappedDeals);
    } catch (error: any) {
      console.error('Error loading pipeline:', error);
      toast({
        title: 'Erro ao carregar pipeline',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const dealId = active.id as string;
    const newStatus = over.id as Deal['status'];

    if (PIPELINE_STAGES.some(stage => stage.id === newStatus)) {
      try {
        // Atualizar tabela REAL sdr_opportunities
        const { error } = await supabase
          .from('sdr_opportunities')
          .update({ 
            stage: newStatus,
            won_date: newStatus === 'won' ? new Date().toISOString() : null,
          })
          .eq('id', dealId);

        if (error) throw error;

        setDeals(deals.map(deal =>
          deal.id === dealId ? { ...deal, status: newStatus } : deal
        ));

        toast({
          title: 'Lead atualizado',
          description: `Movido para ${PIPELINE_STAGES.find(s => s.id === newStatus)?.title}`,
        });
      } catch (error: any) {
        toast({
          title: 'Erro ao atualizar lead',
          description: error.message,
          variant: 'destructive',
        });
      }
    }

    setActiveId(null);
  };

  // Get unique industries
  const industries = useMemo(() => {
    const uniqueIndustries = new Set(
      deals
        .map(d => d.company?.industry)
        .filter(Boolean)
    );
    return Array.from(uniqueIndustries) as string[];
  }, [deals]);

  // Filtered deals
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          deal.contact?.name?.toLowerCase().includes(query) ||
          deal.contact?.email?.toLowerCase().includes(query) ||
          deal.company?.name?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Industry
      if (industryFilter !== 'all' && deal.company?.industry !== industryFilter) {
        return false;
      }

      // Priority
      if (priorityFilter !== 'all' && deal.priority !== priorityFilter) {
        return false;
      }

      // Value range
      if (deal.estimated_value) {
        if (deal.estimated_value < valueRange[0] || deal.estimated_value > valueRange[1]) {
          return false;
        }
      }

      // Maturity range
      if (deal.company?.digital_maturity_score) {
        if (deal.company.digital_maturity_score < maturityRange[0] || 
            deal.company.digital_maturity_score > maturityRange[1]) {
          return false;
        }
      }

      return true;
    });
  }, [deals, searchQuery, industryFilter, priorityFilter, valueRange, maturityRange]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (industryFilter !== 'all') count++;
    if (priorityFilter !== 'all') count++;
    if (valueRange[0] !== 0 || valueRange[1] !== 500000) count++;
    if (maturityRange[0] !== 0 || maturityRange[1] !== 100) count++;
    return count;
  }, [searchQuery, industryFilter, priorityFilter, valueRange, maturityRange]);

  const clearFilters = () => {
    setSearchQuery('');
    setIndustryFilter('all');
    setPriorityFilter('all');
    setValueRange([0, 500000]);
    setMaturityRange([0, 100]);
  };

  const getStageDeals = (stage: string) => {
    return filteredDeals.filter(deal => deal.status === stage);
  };

  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null;

  const stats = useMemo(() => {
    const totalValue = filteredDeals.reduce((sum, d) => sum + (d.estimated_value || 0), 0);
    const avgProbability = filteredDeals.length > 0
      ? filteredDeals.reduce((sum, d) => sum + (d.win_probability || 0), 0) / filteredDeals.length
      : 0;
    
    return {
      total: filteredDeals.length,
      qualified: filteredDeals.filter(d => ['qualified', 'proposal', 'negotiation'].includes(d.status)).length,
      won: filteredDeals.filter(d => d.status === 'won').length,
      totalValue,
      avgProbability,
      conversion: deals.length > 0 
        ? ((deals.filter(d => d.status === 'won').length / deals.length) * 100).toFixed(1)
        : 0,
    };
  }, [filteredDeals, deals]);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              Sales Workspace
            </h1>
            <p className="text-muted-foreground">Gestão completa do pipeline com insights em tempo real</p>
          </div>
          <Button variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Leads</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Qualificados</p>
                <p className="text-2xl font-bold">{stats.qualified}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                  }).format(stats.totalValue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prob. Média</p>
                <p className="text-2xl font-bold">{stats.avgProbability.toFixed(0)}%</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold">{stats.conversion}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-cyan-600" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="kanban" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="space-y-6">
            {/* Filters */}
            <PipelineFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              industryFilter={industryFilter}
              onIndustryChange={setIndustryFilter}
              priorityFilter={priorityFilter}
              onPriorityChange={setPriorityFilter}
              valueRange={valueRange}
              onValueRangeChange={setValueRange}
              maturityRange={maturityRange}
              onMaturityRangeChange={setMaturityRange}
              industries={industries}
              activeFiltersCount={activeFiltersCount}
              onClearFilters={clearFilters}
            />

            {/* Pipeline Board */}
        <DndContext
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-4 md:grid-cols-6">
            {PIPELINE_STAGES.map((stage) => {
              const stageDeals = getStageDeals(stage.id);
              
              return (
                <div key={stage.id} className="space-y-3">
                  <div className={cn('p-3 rounded-lg', stage.color)}>
                    <h3 className="font-semibold text-sm flex items-center justify-between">
                      <span className="truncate">{stage.title}</span>
                      <Badge variant="secondary">{stageDeals.length}</Badge>
                    </h3>
                  </div>

                  <SortableContext
                    id={stage.id}
                    items={stageDeals.map(d => d.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 min-h-[300px]">
                      {stageDeals.map((deal) => (
                        <SortableDealCard key={deal.id} deal={deal} />
                      ))}
                      {stageDeals.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-xs">
                          Vazio
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeDeal && (
              <Card className="p-4 rotate-3 shadow-xl opacity-90">
                <div className="flex items-start gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <h3 className="font-medium">{activeDeal.contact?.name}</h3>
                    {activeDeal.company && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {activeDeal.company.name}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <PipelineMetrics deals={filteredDeals} />
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            <PipelineForecast deals={filteredDeals} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
