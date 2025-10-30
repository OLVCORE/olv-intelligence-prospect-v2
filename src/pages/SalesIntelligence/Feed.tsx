import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import NewMonitoringDialog from '@/components/SalesIntelligence/NewMonitoringDialog';
import AddCompanyDialog from '@/components/SalesIntelligence/AddCompanyDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Settings,
  Plus,
  Building2,
  MapPin,
  Crosshair,
  Search,
  Users,
  History
} from 'lucide-react';
import { useBuyingSignals, useUpdateSignalStatus, SignalType, SignalPriority, SignalStatus } from '@/hooks/useBuyingSignals';
import { useDisplacementOpportunities } from '@/hooks/useDisplacementOpportunities';
import { MonitoringStatusIndicator } from '@/components/MonitoringStatusIndicator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBrazilRegions, useBrazilStates } from '@/hooks/useBrazilGeography';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPriority, setSelectedPriority] = useState<SignalPriority | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewMonitoring, setShowNewMonitoring] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'new' | 'in_progress' | 'contacted' | 'ignored' | 'closed'>('new');
  const [selectedRegion, setSelectedRegion] = useState<string>('__ALL__');
  const [selectedState, setSelectedState] = useState<string>('__ALL__');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('__ALL__');
  const companyIdFromUrl = searchParams.get('company');

  const { data: regionsData } = useBrazilRegions();
  const { data: brazilStates = [] } = useBrazilStates();

  const regions = regionsData || [];

  // Mapa de regiões para estados
  const regionStateMap: Record<string, string[]> = {
    "Norte": ["AC", "AP", "AM", "PA", "RO", "RR", "TO"],
    "Nordeste": ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
    "Centro-Oeste": ["DF", "GO", "MT", "MS"],
    "Sudeste": ["ES", "MG", "RJ", "SP"],
    "Sul": ["PR", "RS", "SC"]
  };
  
  const { data: signals = [], isLoading: signalsLoading } = useBuyingSignals(companyIdFromUrl || undefined, {
    status: selectedStatus === 'all' ? undefined : (selectedStatus as SignalStatus),
    priority: selectedPriority,
    limit: 50,
  });

  const { data: opportunities = [], isLoading: oppsLoading } = useDisplacementOpportunities(companyIdFromUrl || undefined, {
    status: 'open',
    minScore: 0.7,
  });

  // Buscar dados das empresas para enriquecer sinais
  const companyIds = useMemo(() => {
    return Array.from(new Set(signals.map(s => s.company_id)));
  }, [signals]);

  const { data: companiesMap = {} } = useQuery({
    queryKey: ['companies-for-signals', companyIds],
    queryFn: async () => {
      if (companyIds.length === 0) return {};
      
      const { data } = await supabase
        .from('companies')
        .select('id, name, domain, headquarters_state, industry, employees')
        .in('id', companyIds);
      
      return (data || []).reduce((acc, company) => {
        acc[company.id] = company;
        return acc;
      }, {} as Record<string, any>);
    },
    enabled: companyIds.length > 0,
  });

  // Opções de indústria derivadas dos sinais carregados
  const industryOptions = useMemo(() => {
    const all = Object.values(companiesMap) as any[];
    const set = new Set<string>();
    all.forEach((c) => c?.industry && set.add(c.industry));
    return Array.from(set).sort();
  }, [companiesMap]);

  // Filtrar sinais por busca + filtros de status (na query), geografia e setor
  const filteredSignals = useMemo(() => {
    return signals.filter(signal => {
      const company = companiesMap[signal.company_id];
      if (!company) return false;

      // Busca por empresa/domínio
      if (searchTerm) {
        const match = company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      company.domain?.toLowerCase().includes(searchTerm.toLowerCase());
        if (!match) return false;
      }

      // Filtro por estado/região
      if (selectedState && selectedState !== '__ALL__') {
        if (company.headquarters_state !== selectedState) return false;
      } else if (selectedRegion && selectedRegion !== '__ALL__') {
        const statesInRegion = regionStateMap[selectedRegion] || [];
        if (!statesInRegion.includes(company.headquarters_state)) return false;
      }

      // Filtro por setor/indústria
      if (selectedIndustry && selectedIndustry !== '__ALL__') {
        if (company.industry !== selectedIndustry) return false;
      }

      return true;
    });
  }, [signals, companiesMap, searchTerm, selectedRegion, selectedState, selectedIndustry]);

  const updateStatus = useUpdateSignalStatus();

  const handleSignalAction = (signalId: string, action: 'contacted' | 'ignored') => {
    updateStatus.mutate({ signal_id: signalId, status: action });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Sales Intelligence Feed"
        description="Sinais de compra em tempo real e oportunidades de competitive displacement"
        actions={
          <>
            <Button variant="outline" onClick={() => setShowAddCompany(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Empresa
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros & Histórico
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 z-50 bg-popover">
                <DropdownMenuLabel>Navegação Rápida</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setSelectedStatus('all')}>
                  <History className="h-4 w-4 mr-2" /> Ver Todos (Histórico)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('new')}>
                  <Zap className="h-4 w-4 mr-2" /> Apenas Novos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/sales-intelligence/config')}>
                  <Settings className="h-4 w-4 mr-2" /> Configuração
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/sales-intelligence/companies')}>
                  <Building2 className="h-4 w-4 mr-2" /> Empresas Monitoradas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={() => setShowNewMonitoring(true)}>
              <Plus className="w-4 w-4 mr-2" />
              Novo Monitoramento
            </Button>
          </>
        }
      />

      {/* Indicador de Status em Tempo Real */}
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
            Sinais de Compra ({filteredSignals.length})
          </TabsTrigger>
          <TabsTrigger value="displacement">
            <Target className="h-4 w-4 mr-2" />
            Displacement Radar ({opportunities.length})
          </TabsTrigger>
        </TabsList>

        {/* Buying Signals Tab */}
        <TabsContent value="signals" className="space-y-4">
          {/* Filtros de busca */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por empresa..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {companyIdFromUrl && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchParams({});
                        setSearchTerm('');
                      }}
                    >
                      Limpar Filtro
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Status</label>
                    <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="new">Novos</SelectItem>
                        <SelectItem value="in_progress">Em Progresso</SelectItem>
                        <SelectItem value="contacted">Contatados</SelectItem>
                        <SelectItem value="ignored">Ignorados</SelectItem>
                        <SelectItem value="closed">Fechados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground">Região</label>
                    <Select value={selectedRegion} onValueChange={(v) => { setSelectedRegion(v); setSelectedState('__ALL__'); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__ALL__">Todas</SelectItem>
                        {regions.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground">Estado</label>
                    <Select value={selectedState} onValueChange={(v) => setSelectedState(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__ALL__">Todos</SelectItem>
                        {(selectedRegion ? brazilStates.filter(s => (regionStateMap[selectedRegion]||[]).includes(s.state_code)) : brazilStates)
                          .map((s) => (
                            <SelectItem key={s.state_code} value={s.state_code}>{s.state_code}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground">Setor</label>
                    <Select value={selectedIndustry} onValueChange={(v) => setSelectedIndustry(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__ALL__">Todos</SelectItem>
                        {industryOptions.map((i) => (
                          <SelectItem key={i} value={i}>{i}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(selectedRegion || selectedState !== '__ALL__' || selectedIndustry !== '__ALL__' || selectedStatus !== 'new' || searchTerm) && (
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedStatus('new');
                      setSelectedRegion('__ALL__');
                      setSelectedState('__ALL__');
                      setSelectedIndustry('__ALL__');
                      setSearchTerm('');
                    }}>
                      Limpar filtros
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {signalsLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando sinais...</p>
            </div>
          ) : filteredSignals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhum sinal encontrado</p>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Tente ajustar os filtros de busca' : 'Execute a detecção de sinais em empresas para ver resultados aqui'}
                </p>
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

              {filteredSignals.map((signal) => {
                const company = companiesMap[signal.company_id];
                
                return (
                  <Card key={signal.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          {/* Empresa */}
                          {company && (
                            <div className="flex items-center gap-2 mb-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <Button
                                variant="link"
                                className="p-0 h-auto font-semibold"
                                onClick={() => navigate(`/companies/${company.id}`)}
                              >
                                {company.name}
                              </Button>
                              {company.headquarters_state && (
                                <Badge variant="outline" className="gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {company.headquarters_state}
                                </Badge>
                              )}
                              {company.employees && (
                                <Badge variant="outline" className="gap-1">
                                  <Users className="h-3 w-3" />
                                  {company.employees}
                                </Badge>
                              )}
                            </div>
                          )}
                          
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
                          {company && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/companies/${company.id}`)}
                            >
                              <Building2 className="h-4 w-4 mr-2" />
                              Ver Empresa
                            </Button>
                          )}
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
                );
              })}
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

      {/* Modais */}
      <NewMonitoringDialog
        open={showNewMonitoring}
        onOpenChange={setShowNewMonitoring}
      />
      <AddCompanyDialog
        open={showAddCompany}
        onOpenChange={setShowAddCompany}
      />
    </div>
  );
}
