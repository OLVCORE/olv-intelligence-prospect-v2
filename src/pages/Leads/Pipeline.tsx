import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, TrendingUp, DollarSign, Calendar, 
  Flame, Droplet, Snowflake, Clock, ArrowRight, Target 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { AdminDataCleanupDialog } from '@/components/admin/AdminDataCleanupDialog';

const STAGES = [
  { id: 'discovery', label: 'Descoberta', color: 'bg-blue-100 text-blue-800' },
  { id: 'qualification', label: 'Qualificação', color: 'bg-purple-100 text-purple-800' },
  { id: 'proposal', label: 'Proposta', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'negotiation', label: 'Negociação', color: 'bg-orange-100 text-orange-800' },
  { id: 'closed_won', label: 'Fechado (Ganho)', color: 'bg-green-100 text-green-800' },
  { id: 'closed_lost', label: 'Fechado (Perdido)', color: 'bg-red-100 text-red-800' },
];

export default function Pipeline() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [temperatureFilter, setTemperatureFilter] = useState('all');

  const { data: deals, isLoading } = useQuery({
    queryKey: ['pipeline-deals', temperatureFilter],
    queryFn: async () => {
      let query = supabase
        .from('companies')
        .select('*')
        .not('deal_stage', 'is', null)
        .order('stage_changed_at', { ascending: false });

      if (temperatureFilter !== 'all') {
        query = query.eq('temperature', temperatureFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  const moveDeal = useMutation({
    mutationFn: async ({ dealId, newStage }: { dealId: string; newStage: string }) => {
      const { error } = await supabase
        .from('companies')
        .update({
          deal_stage: newStage,
          stage_changed_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .eq('id', dealId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Deal movido!',
        description: 'Estágio atualizado com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['pipeline-deals'] });
    }
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const dealId = result.draggableId;
    const newStage = result.destination.droppableId;

    moveDeal.mutate({ dealId, newStage });
  };

  const getTemperatureIcon = (temp: string | null) => {
    switch (temp) {
      case 'hot': return <Flame className="w-4 h-4 text-red-500" />;
      case 'warm': return <Droplet className="w-4 h-4 text-yellow-500" />;
      case 'cold': return <Snowflake className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const filteredDeals = deals?.filter(deal =>
    deal.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const dealsByStage = STAGES.reduce((acc, stage) => {
    acc[stage.id] = filteredDeals.filter(deal => deal.deal_stage === stage.id);
    return acc;
  }, {} as Record<string, any[]>);

  const totalDeals = filteredDeals.length;
  const totalValue = filteredDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0);
  const hotDeals = filteredDeals.filter(d => d.temperature === 'hot').length;
  const closedThisMonth = filteredDeals.filter(d => {
    if (d.deal_stage !== 'closed_won') return false;
    const closedDate = new Date(d.stage_changed_at);
    const now = new Date();
    return closedDate.getMonth() === now.getMonth() && closedDate.getFullYear() === now.getFullYear();
  }).length;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <TrendingUp className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Carregando pipeline...</p>
        </div>
      </div>
    );
  }

  if (totalDeals === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pipeline de Vendas</h1>
            <p className="text-muted-foreground mt-1">Gerencie seus deals visualmente</p>
          </div>
          <AdminDataCleanupDialog />
        </div>

        <Card className="p-12 text-center">
          <Target className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-3">
            Nenhum deal no pipeline
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Comece capturando e qualificando leads para criar seus primeiros deals e visualizar o pipeline de vendas.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/leads/capture')} size="lg">
              <ArrowRight className="w-5 h-5 mr-2" />
              Capturar Leads
            </Button>
            <Button onClick={() => navigate('/leads/quarantine')} variant="outline" size="lg">
              Ver Quarentena
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pipeline de Vendas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus deals visualmente
          </p>
        </div>
        <div className="flex gap-2">
          <AdminDataCleanupDialog />
          <Button onClick={() => navigate('/leads/capture')}>
            <ArrowRight className="w-4 h-4 mr-2" />
            Capturar Leads
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Deals</p>
                <p className="text-2xl font-bold">{totalDeals}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Deals Quentes</p>
                <p className="text-2xl font-bold">{hotDeals}</p>
              </div>
              <Flame className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fechados (Mês)</p>
                <p className="text-2xl font-bold">{closedThisMonth}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar deal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={temperatureFilter} onValueChange={setTemperatureFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Temperatura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="hot">🔥 Hot</SelectItem>
              <SelectItem value="warm">🟡 Warm</SelectItem>
              <SelectItem value="cold">🔵 Cold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {STAGES.map((stage) => (
            <div key={stage.id} className="flex flex-col">
              <Card className="mb-2">
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <Badge className={stage.color}>
                      {stage.label}
                    </Badge>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {dealsByStage[stage.id]?.length || 0}
                    </span>
                  </div>
                </CardHeader>
              </Card>

              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 space-y-2 p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'bg-primary/10' : 'bg-secondary'
                    }`}
                    style={{ minHeight: '400px' }}
                  >
                    {dealsByStage[stage.id]?.map((deal, index) => (
                      <Draggable key={deal.id} draggableId={deal.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`cursor-move transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-sm line-clamp-2">
                                  {deal.name}
                                </h3>
                                {getTemperatureIcon(deal.temperature)}
                              </div>

                              {deal.deal_value && (
                                <p className="text-lg font-bold text-green-600 mb-2">
                                  {formatCurrency(deal.deal_value)}
                                </p>
                              )}

                              <div className="space-y-1 text-xs text-muted-foreground">
                                {deal.sector && (
                                  <div className="flex items-center gap-1">
                                    <Badge variant="outline" className="text-xs">
                                      {deal.sector}
                                    </Badge>
                                  </div>
                                )}

                                {deal.days_in_stage > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{deal.days_in_stage} dias neste estágio</span>
                                  </div>
                                )}

                                {deal.expected_close_date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      Previsão: {new Date(deal.expected_close_date).toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
