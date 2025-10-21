import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  TrendingUp, Users, DollarSign, Search,
  Building2, Mail, Phone, GripVertical, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Deal {
  id: string;
  contact_id: string;
  company_id?: string;
  channel: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  priority: string;
  last_message_at?: string;
  contact?: { name: string; email?: string; phone?: string };
  company?: { name: string };
}

const PIPELINE_STAGES = [
  { id: 'new', title: 'Novos Leads', color: 'bg-slate-100' },
  { id: 'contacted', title: 'Contactados', color: 'bg-blue-100' },
  { id: 'qualified', title: 'Qualificados', color: 'bg-purple-100' },
  { id: 'proposal', title: 'Proposta', color: 'bg-yellow-100' },
  { id: 'negotiation', title: 'Negociação', color: 'bg-orange-100' },
  { id: 'closed_won', title: 'Ganhos', color: 'bg-green-100' },
] as const;

function SortableDealCard({ deal }: { deal: Deal }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'p-4 cursor-move hover:shadow-md transition-all',
        isDragging && 'shadow-lg'
      )}
    >
      <div className="flex items-start gap-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium">{deal.contact?.name}</h3>
            <Badge
              variant={deal.priority === 'high' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {deal.priority}
            </Badge>
          </div>

          {deal.company && (
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {deal.company.name}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {deal.contact?.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
              </div>
            )}
            {deal.contact?.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2"
            onClick={() => navigate('/sdr/inbox')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Conversa
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function SDRPipelinePage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPipeline();

    const channel = supabase
      .channel('sdr-pipeline')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, loadPipeline)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPipeline = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          contact_id,
          company_id,
          channel,
          status,
          priority,
          last_message_at,
          contact:contacts(name, email, phone),
          company:companies(name)
        `)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setDeals((data || []) as Deal[]);
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
        const { error } = await supabase
          .from('conversations')
          .update({ status: newStatus })
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

  const filteredDeals = deals.filter(deal => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      deal.contact?.name?.toLowerCase().includes(query) ||
      deal.contact?.email?.toLowerCase().includes(query) ||
      deal.company?.name?.toLowerCase().includes(query)
    );
  });

  const getStageDeals = (stage: string) => {
    return filteredDeals.filter(deal => deal.status === stage);
  };

  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null;

  const stats = {
    total: deals.length,
    qualified: deals.filter(d => ['qualified', 'proposal', 'negotiation'].includes(d.status)).length,
    won: deals.filter(d => d.status === 'closed_won').length,
    conversion: deals.length > 0 
      ? ((deals.filter(d => d.status === 'closed_won').length / deals.length) * 100).toFixed(1)
      : 0,
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pipeline de Vendas</h1>
            <p className="text-muted-foreground">Arraste leads entre os estágios do funil</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
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
                <p className="text-sm text-muted-foreground">Ganhos</p>
                <p className="text-2xl font-bold">{stats.won}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold">{stats.conversion}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

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
              <Card className="p-4 rotate-3 shadow-xl">
                <div className="flex items-start gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <h3 className="font-medium">{activeDeal.contact?.name}</h3>
                    {activeDeal.company && (
                      <p className="text-sm text-muted-foreground">
                        {activeDeal.company.name}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </AppLayout>
  );
}
