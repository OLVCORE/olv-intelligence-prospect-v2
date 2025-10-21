import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, Plus, Building2, Mail, Phone, 
  TrendingUp, ExternalLink, Calendar, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useSDRPipeline } from '@/hooks/useSDRPipeline';

interface Lead {
  id: string;
  company_id: string;
  contact_id: string;
  stage: string;
  value: number;
  probability: number;
  next_action: string;
  next_action_date: string;
  created_at: string;
  company?: { id: string; name: string; website?: string };
  contact?: { name: string; email?: string; phone?: string };
}

const STAGES = [
  { id: 'new', label: 'Novo Lead', color: 'bg-slate-500' },
  { id: 'contacted', label: 'Contactado', color: 'bg-blue-500' },
  { id: 'qualified', label: 'Qualificado', color: 'bg-purple-500' },
  { id: 'proposal', label: 'Proposta', color: 'bg-orange-500' },
  { id: 'negotiation', label: 'Negociação', color: 'bg-yellow-500' },
  { id: 'won', label: 'Ganho', color: 'bg-green-500' },
];

export default function SDRPipelinePage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { leads, loading, updateLeadStage } = useSDRPipeline();
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedLead, setDraggedLead] = useState<any>(null);

  const handleDragStart = (lead: any) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stageId: string) => {
    if (!draggedLead || draggedLead.stage === stageId) {
      setDraggedLead(null);
      return;
    }

    try {
      await updateLeadStage(draggedLead.id, stageId);
      
      toast({
        title: 'Lead movido',
        description: `Lead movido para ${STAGES.find(s => s.id === stageId)?.label}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao mover lead',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDraggedLead(null);
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.company?.name?.toLowerCase().includes(query) ||
      lead.contact?.name?.toLowerCase().includes(query) ||
      lead.contact?.email?.toLowerCase().includes(query)
    );
  });

  const getLeadsByStage = (stageId: string) => {
    return filteredLeads.filter(lead => lead.stage === stageId);
  };

  const getTotalValue = (stageId: string) => {
    return getLeadsByStage(stageId).reduce((sum, lead) => sum + lead.value, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Pipeline de Vendas</h1>
              <p className="text-muted-foreground">Gestão visual de oportunidades</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Oportunidade
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Pipeline Board */}
        <div className="flex-1 overflow-x-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
          <div className="flex gap-4 h-full min-w-max">
            {STAGES.map(stage => {
              const stageLeads = getLeadsByStage(stage.id);
              const totalValue = getTotalValue(stage.id);

              return (
                <div
                  key={stage.id}
                  className="flex-shrink-0 w-80 flex flex-col"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(stage.id)}
                >
                  {/* Stage Header */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn('h-3 w-3 rounded-full', stage.color)} />
                      <h3 className="font-semibold">{stage.label}</h3>
                      <Badge variant="secondary" className="ml-auto">
                        {stageLeads.length}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(totalValue)}
                    </p>
                  </div>

                  {/* Leads Column */}
                  <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                    {stageLeads.map(lead => (
                      <Card
                        key={lead.id}
                        draggable
                        onDragStart={() => handleDragStart(lead)}
                        className="cursor-move hover:shadow-lg transition-shadow"
                      >
                        <CardHeader className="p-4 pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm font-semibold truncate">
                                {lead.company?.name}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground truncate">
                                {lead.contact?.name}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {lead.probability}%
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Valor</span>
                            <span className="font-semibold">{formatCurrency(lead.value)}</span>
                          </div>

                          {lead.contact?.email && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{lead.contact.email}</span>
                            </div>
                          )}

                          {lead.contact?.phone && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{lead.contact.phone}</span>
                            </div>
                          )}

                          <div className="pt-2 border-t">
                            <p className="text-xs font-medium mb-1">Próxima Ação:</p>
                            <p className="text-xs text-muted-foreground">{lead.next_action}</p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(new Date(lead.next_action_date), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => navigate(`/companies/${lead.company_id}`)}
                            >
                              <Building2 className="h-3 w-3 mr-1" />
                              Ver Empresa
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/sdr/inbox`)}
                            >
                              Ver Conversa
                            </Button>
                            {lead.company?.website && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => window.open(`https://${lead.company?.website}`, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {stageLeads.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Nenhum lead neste estágio
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
