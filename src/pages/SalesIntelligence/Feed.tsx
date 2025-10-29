import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  TrendingUp, 
  Zap, 
  Target, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBuyingSignals, useUpdateSignalStatus, SignalType, SignalPriority } from '@/hooks/useBuyingSignals';
import { useDisplacementOpportunities } from '@/hooks/useDisplacementOpportunities';
import { MonitoringStatusIndicator } from '@/components/MonitoringStatusIndicator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const signalTypeLabels: Record<SignalType, string> = {
  funding_round: 'Rodada de Investimento',
  leadership_change: 'Mudança de Liderança',
  expansion: 'Expansão',
  technology_adoption: 'Adoção de Tecnologia',
  partnership: 'Parceria',
  market_entry: 'Entrada no Mercado',
  digital_transformation: 'Transformação Digital',
  linkedin_activity: 'Atividade no LinkedIn',
  job_posting: 'Vagas Abertas',
  competitor_mention: 'Menção a Concorrente',
  negative_review: 'Review Negativo',
};

const priorityColors: Record<SignalPriority, 'default' | 'destructive' | 'outline' | 'secondary'> = {
  urgent: 'destructive',
  high: 'default',
  medium: 'secondary',
  low: 'outline',
};

export default function SalesIntelligenceFeed() {
  const navigate = useNavigate();
  const [selectedPriority, setSelectedPriority] = useState<SignalPriority | undefined>();
  
  const { data: signals = [], isLoading: signalsLoading } = useBuyingSignals(undefined, {
    status: 'new',
    priority: selectedPriority,
    limit: 50,
  });

  const { data: opportunities = [], isLoading: oppsLoading } = useDisplacementOpportunities(undefined, {
    status: 'open',
    minScore: 0.7,
  });

  const updateStatus = useUpdateSignalStatus();

  const handleSignalAction = (signalId: string, action: 'contacted' | 'ignored') => {
    updateStatus.mutate({ signal_id: signalId, status: action });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            Sales Intelligence Feed
          </h1>
          <p className="text-muted-foreground mt-1">
            Sinais de compra em tempo real e oportunidades de competitive displacement
          </p>
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros & Configuração
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filtros de Prioridade</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSelectedPriority(undefined)}>
                <Target className="h-4 w-4 mr-2" />
                Todos os Sinais
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPriority('urgent')}>
                <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                Urgente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPriority('high')}>
                <TrendingUp className="h-4 w-4 mr-2 text-orange-500" />
                Alta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPriority('medium')}>
                <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                Média
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Monitoramento 24/7</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate('/sales-intelligence/config')}>
                <Settings className="h-4 w-4 mr-2" />
                Configurar Monitoramento
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 🚦 SEMÁFORO DE STATUS EM TEMPO REAL 24/7 */}
      <MonitoringStatusIndicator variant="full" />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sinais Novos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signals.length}</div>
            <p className="text-xs text-muted-foreground">Últimas 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alta Prioridade</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {signals.filter(s => s.priority === 'urgent' || s.priority === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">Requerem atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Displacement</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{opportunities.length}</div>
            <p className="text-xs text-muted-foreground">Oportunidades abertas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {signals.length > 0 
                ? Math.round((signals.reduce((sum, s) => sum + (s.confidence_score || 0), 0) / signals.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Confiança média</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Feed */}
      <Tabs defaultValue="signals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="signals">
            <Zap className="h-4 w-4 mr-2" />
            Sinais de Compra ({signals.length})
          </TabsTrigger>
          <TabsTrigger value="displacement">
            <Target className="h-4 w-4 mr-2" />
            Displacement Radar ({opportunities.length})
          </TabsTrigger>
        </TabsList>

        {/* Buying Signals Tab */}
        <TabsContent value="signals" className="space-y-4">
          {signalsLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando sinais...</p>
            </div>
          ) : signals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhum sinal novo</p>
                <p className="text-muted-foreground">Execute a detecção de sinais em empresas para ver resultados aqui</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Priority Filter */}
              <div className="flex gap-2">
                <Button
                  variant={selectedPriority === undefined ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPriority(undefined)}
                >
                  Todos
                </Button>
                <Button
                  variant={selectedPriority === 'urgent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPriority('urgent')}
                >
                  Urgente
                </Button>
                <Button
                  variant={selectedPriority === 'high' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPriority('high')}
                >
                  Alta
                </Button>
                <Button
                  variant={selectedPriority === 'medium' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPriority('medium')}
                >
                  Média
                </Button>
              </div>

              {signals.map((signal) => (
                <Card key={signal.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={priorityColors[signal.priority]}>
                            {signal.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {signalTypeLabels[signal.signal_type]}
                          </Badge>
                          {signal.confidence_score && (
                            <Badge variant="secondary">
                              {Math.round(signal.confidence_score * 100)}% confiança
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{signal.signal_title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 text-xs">
                          <Clock className="h-3 w-3" />
                          {format(new Date(signal.detected_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {signal.signal_description && (
                      <p className="text-sm text-muted-foreground">{signal.signal_description}</p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex gap-2">
                        {signal.source_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={signal.source_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ver Fonte
                            </a>
                          </Button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSignalAction(signal.id, 'contacted')}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Entrar em Contato
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSignalAction(signal.id, 'ignored')}
                        >
                          Ignorar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        {/* Displacement Opportunities Tab */}
        <TabsContent value="displacement" className="space-y-4">
          {oppsLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando oportunidades...</p>
            </div>
          ) : opportunities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhuma oportunidade detectada</p>
                <p className="text-muted-foreground">Execute a análise de displacement em empresas para ver resultados</p>
              </CardContent>
            </Card>
          ) : (
            opportunities.map((opp) => (
              <Card key={opp.id} className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">
                          {opp.competitor_name}
                        </Badge>
                        {opp.opportunity_score && (
                          <Badge variant="secondary">
                            Score: {Math.round(opp.opportunity_score * 100)}%
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">
                        Oportunidade de Displacement
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-xs">
                        <Clock className="h-3 w-3" />
                        {format(new Date(opp.detected_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Motivo:</p>
                    <p className="text-sm text-muted-foreground">{opp.displacement_reason.replace(/_/g, ' ')}</p>
                  </div>

                  {opp.evidence && (
                    <div>
                      <p className="text-sm font-medium mb-1">Evidência:</p>
                      <p className="text-sm text-muted-foreground italic">"{opp.evidence}"</p>
                    </div>
                  )}

                  {opp.next_action && (
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                      <p className="text-sm font-medium mb-1">Próxima Ação:</p>
                      <p className="text-sm">{opp.next_action}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex gap-2">
                      {opp.estimated_revenue && (
                        <Badge variant="outline">
                          Valor Estimado: R$ {opp.estimated_revenue.toLocaleString('pt-BR')}
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="default" size="sm">
                        <Target className="h-4 w-4 mr-2" />
                        Iniciar Abordagem
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
