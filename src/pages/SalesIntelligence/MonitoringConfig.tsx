import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Play, Pause, Clock, MapPin, Target, Filter, AlertCircle, CheckCircle2, Circle, Info, DollarSign, Users, TrendingUp, Cpu, Handshake, Globe, RefreshCw, Crosshair, Save, Building2, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMonitoringConfig, useSaveMonitoringConfig, useToggleMonitoring, useRunMonitoringNow } from '@/hooks/useIntelligenceMonitoring';
import { useBrazilStates, useBrazilRegions } from '@/hooks/useBrazilGeography';
import { useSectors } from '@/hooks/useSectors';
import { Checkbox } from '@/components/ui/checkbox';
import { useMonitoredCompanies } from '@/hooks/useMonitoredCompanies';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function MonitoringConfigPage() {
  const navigate = useNavigate();
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: config } = useMonitoringConfig(user?.id);
  const { data: brazilStates } = useBrazilStates();
  const { data: regions } = useBrazilRegions();
  const { data: sectors } = useSectors();
  const { data: monitoredCompanies = [], isLoading: loadingCompanies } = useMonitoredCompanies(user?.id);
  
  const saveConfigMutation = useSaveMonitoringConfig();
  const toggleMonitoringMutation = useToggleMonitoring();
  const runNowMutation = useRunMonitoringNow();

  // Estados locais para edição
  const [selectedRegions, setSelectedRegions] = useState<string[]>(config?.target_regions || []);
  const [selectedStates, setSelectedStates] = useState<string[]>(config?.target_states || []);
  const [selectedSectors, setSelectedSectors] = useState<string[]>(config?.target_sectors || []);
  const [minEmployees, setMinEmployees] = useState<number>(config?.min_employees || 10);
  const [maxEmployees, setMaxEmployees] = useState<number>(config?.max_employees || 10000);
  const [checkFrequency, setCheckFrequency] = useState<number>(config?.check_frequency_hours || 24);
  
  const [monitorFunding, setMonitorFunding] = useState(config?.monitor_funding ?? true);
  const [monitorLeadership, setMonitorLeadership] = useState(config?.monitor_leadership_changes ?? true);
  const [monitorExpansion, setMonitorExpansion] = useState(config?.monitor_expansion ?? true);
  const [monitorTech, setMonitorTech] = useState(config?.monitor_tech_adoption ?? true);
  const [monitorPartnerships, setMonitorPartnerships] = useState(config?.monitor_partnerships ?? true);
  const [monitorMarket, setMonitorMarket] = useState(config?.monitor_market_entry ?? true);
  const [monitorDigital, setMonitorDigital] = useState(config?.monitor_digital_transformation ?? true);
  const [monitorCompetitors, setMonitorCompetitors] = useState(config?.monitor_competitor_mentions ?? true);
  // Nome do agendamento e Palavras‑chave
  const [scheduleName, setScheduleName] = useState<string>(config?.schedule_name || '');
  const [keywordsWhitelistInput, setKeywordsWhitelistInput] = useState<string>((config?.keywords_whitelist || []).join(', '));
  const [keywordsBlacklistInput, setKeywordsBlacklistInput] = useState<string>((config?.keywords_blacklist || []).join(', '));

  // Atualizar estados quando config carregar
  useEffect(() => {
    if (config) {
      setSelectedRegions(config.target_regions || []);
      setSelectedStates(config.target_states || []);
      setSelectedSectors(config.target_sectors || []);
      setMinEmployees(config.min_employees || 10);
      setMaxEmployees(config.max_employees || 10000);
      setCheckFrequency(config.check_frequency_hours || 24);
      setMonitorFunding(config.monitor_funding ?? true);
      setMonitorLeadership(config.monitor_leadership_changes ?? true);
      setMonitorExpansion(config.monitor_expansion ?? true);
      setMonitorTech(config.monitor_tech_adoption ?? true);
      setMonitorPartnerships(config.monitor_partnerships ?? true);
      setMonitorMarket(config.monitor_market_entry ?? true);
      setMonitorDigital(config.monitor_digital_transformation ?? true);
      setMonitorCompetitors(config.monitor_competitor_mentions ?? true);
      setScheduleName(config.schedule_name || '');
      setKeywordsWhitelistInput((config.keywords_whitelist || []).join(', '));
      setKeywordsBlacklistInput((config.keywords_blacklist || []).join(', '));
    }
  }, [config]);

  // Detectar alterações não salvas
  const hasUnsavedChanges = config && (
    JSON.stringify(selectedRegions.sort()) !== JSON.stringify((config.target_regions || []).sort()) ||
    JSON.stringify(selectedStates.sort()) !== JSON.stringify((config.target_states || []).sort()) ||
    JSON.stringify(selectedSectors.sort()) !== JSON.stringify((config.target_sectors || []).sort()) ||
    minEmployees !== (config.min_employees || 10) ||
    maxEmployees !== (config.max_employees || 10000) ||
    checkFrequency !== (config.check_frequency_hours || 24) ||
    monitorFunding !== (config.monitor_funding ?? true) ||
    monitorLeadership !== (config.monitor_leadership_changes ?? true) ||
    monitorExpansion !== (config.monitor_expansion ?? true) ||
    monitorTech !== (config.monitor_tech_adoption ?? true) ||
    monitorPartnerships !== (config.monitor_partnerships ?? true) ||
    monitorMarket !== (config.monitor_market_entry ?? true) ||
    monitorDigital !== (config.monitor_digital_transformation ?? true) ||
    monitorCompetitors !== (config.monitor_competitor_mentions ?? true) ||
    scheduleName !== (config.schedule_name || '') ||
    keywordsWhitelistInput !== ((config.keywords_whitelist || []).join(', ')) ||
    keywordsBlacklistInput !== ((config.keywords_blacklist || []).join(', '))
  );

  const handleSave = () => {
    if (!user?.id) return;

    const whitelist = keywordsWhitelistInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const blacklist = keywordsBlacklistInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    saveConfigMutation.mutate({
      user_id: user.id,
      target_regions: selectedRegions.length > 0 ? selectedRegions : null,
      target_states: selectedStates.length > 0 ? selectedStates : null,
      target_sectors: selectedSectors.length > 0 ? selectedSectors : null,
      min_employees: minEmployees,
      max_employees: maxEmployees,
      check_frequency_hours: checkFrequency,
      monitor_funding: monitorFunding,
      monitor_leadership_changes: monitorLeadership,
      monitor_expansion: monitorExpansion,
      monitor_tech_adoption: monitorTech,
      monitor_partnerships: monitorPartnerships,
      monitor_market_entry: monitorMarket,
      monitor_digital_transformation: monitorDigital,
      monitor_competitor_mentions: monitorCompetitors,
      competitor_names: ['SAP', 'Oracle', 'Microsoft Dynamics', 'Salesforce', 'Senior', 'Linx', 'Omie', 'Bling'],
      schedule_name: scheduleName || null,
      keywords_whitelist: whitelist.length ? whitelist : null,
      keywords_blacklist: blacklist.length ? blacklist : null,
    });
  };

  const handleToggle = () => {
    if (!user?.id) return;
    toggleMonitoringMutation.mutate({
      userId: user.id,
      isActive: !config?.is_active,
    });
  };

  const handleRunNow = () => {
    runNowMutation.mutate();
  };

  // Mapeamento região -> estados
  const regionStateMap: Record<string, string[]> = {
    'Norte': ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
    'Nordeste': ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
    'Centro-Oeste': ['DF', 'GO', 'MT', 'MS'],
    'Sudeste': ['ES', 'MG', 'RJ', 'SP'],
    'Sul': ['PR', 'RS', 'SC'],
  };

  const toggleRegion = (region: string) => {
    const isRemoving = selectedRegions.includes(region);
    
    if (isRemoving) {
      // Remover região e seus estados
      setSelectedRegions(prev => prev.filter(r => r !== region));
      const statesToRemove = regionStateMap[region] || [];
      setSelectedStates(prev => prev.filter(s => !statesToRemove.includes(s)));
    } else {
      // Adicionar região e TODOS os seus estados automaticamente
      setSelectedRegions(prev => [...prev, region]);
      const statesToAdd = regionStateMap[region] || [];
      setSelectedStates(prev => {
        const newStates = [...prev];
        statesToAdd.forEach(state => {
          if (!newStates.includes(state)) {
            newStates.push(state);
          }
        });
        return newStates;
      });
    }
  };

  const toggleState = (stateCode: string) => {
    setSelectedStates(prev =>
      prev.includes(stateCode) ? prev.filter(s => s !== stateCode) : [...prev, stateCode]
    );
  };

  const toggleSector = (sectorCode: string) => {
    setSelectedSectors(prev =>
      prev.includes(sectorCode) ? prev.filter(s => s !== sectorCode) : [...prev, sectorCode]
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Configuração de Monitoramento Automático
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure os critérios para detecção automática de sinais de compra e oportunidades
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros & Configuração
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Navegação Rápida</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => navigate('/sales-intelligence/feed')}
                  className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Ver Feed de Sinais
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel>Ações Rápidas</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => navigate('/sales-intelligence/companies')}
                className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Empresas Monitoradas
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/companies')}
                className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Empresa Individual
              </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate('/sales-intelligence/config')}
                  className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
                  disabled
                >
                  <Crosshair className="h-4 w-4 mr-2" />
                  Configuração (Atual)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Badge variant={config?.is_active ? "default" : "secondary"} className="gap-1">
              <Circle className={`h-3 w-3 ${config?.is_active ? 'fill-green-500' : 'fill-gray-400'}`} />
              {config?.is_active ? 'Ativo' : 'Pausado'}
            </Badge>
            <Button
              variant={config?.is_active ? "outline" : "default"}
              onClick={handleToggle}
              disabled={toggleMonitoringMutation.isPending}
            >
              {config?.is_active ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {config?.is_active ? 'Pausar' : 'Ativar'}
            </Button>
            <Button
              onClick={handleRunNow}
              disabled={runNowMutation.isPending || !config?.is_active}
              variant="secondary"
            >
              <Play className="h-4 w-4 mr-2" />
              Executar Agora
            </Button>
          </div>
        </div>

        {/* Status Card */}
        {config && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Status do Monitoramento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Última verificação:</span>
                <span className="font-medium">
                  {config.last_check_at ? new Date(config.last_check_at).toLocaleString('pt-BR') : 'Nunca'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Próxima verificação:</span>
                <span className="font-medium">
                  {config.next_check_at ? new Date(config.next_check_at).toLocaleString('pt-BR') : 'Não agendada'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Frequência:</span>
                <span className="font-medium">A cada {config.check_frequency_hours}h</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuration Tabs */}
        <Tabs defaultValue="geography" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="geography">
              <MapPin className="h-4 w-4 mr-2" />
              Geografia
            </TabsTrigger>
            <TabsTrigger value="business">
              <Target className="h-4 w-4 mr-2" />
              Negócio
            </TabsTrigger>
            <TabsTrigger value="signals">
              <Filter className="h-4 w-4 mr-2" />
              Sinais
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Clock className="h-4 w-4 mr-2" />
              Agendamento
            </TabsTrigger>
            <TabsTrigger value="history">
              <AlertCircle className="h-4 w-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Geografia Tab */}
          <TabsContent value="geography" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Filtros Geográficos</CardTitle>
                <CardDescription>
                  Selecione as regiões, estados e municípios para monitorar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Regiões */}
                <div className="space-y-3">
                  <Label>Regiões do Brasil</Label>
                  <div className="flex flex-wrap gap-2">
                    {regions?.map((region) => (
                      <Badge
                        key={region}
                        variant={selectedRegions.includes(region) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleRegion(region)}
                      >
                        {region}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedRegions.length > 0 ? `${selectedRegions.length} região(ões) selecionada(s)` : 'Nenhuma região selecionada (todas serão monitoradas)'}
                  </p>
                </div>

                {/* Estados - Filtrados por região selecionada */}
                <div className="space-y-3">
                  <Label>Estados {selectedRegions.length > 0 && `(das regiões: ${selectedRegions.join(', ')})`}</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {brazilStates
                      ?.filter(state => {
                        // Se nenhuma região selecionada, mostrar todos
                        if (selectedRegions.length === 0) return true;
                        // Senão, mostrar apenas estados das regiões selecionadas
                        return selectedRegions.some(region => 
                          regionStateMap[region]?.includes(state.state_code)
                        );
                      })
                      .map((state) => (
                        <div key={state.state_code} className="flex items-center space-x-2">
                          <Checkbox
                            id={state.state_code}
                            checked={selectedStates.includes(state.state_code)}
                            onCheckedChange={() => toggleState(state.state_code)}
                          />
                          <label
                            htmlFor={state.state_code}
                            className="text-sm cursor-pointer"
                          >
                            {state.state_code}
                          </label>
                        </div>
                      ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedStates.length > 0 ? `${selectedStates.length} estado(s) selecionado(s)` : 'Nenhum estado selecionado (todos serão monitorados)'}
                  </p>
                  <p className="text-xs text-blue-600 flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Ao selecionar uma região, todos os estados dela são marcados automaticamente. Desmarque os que não deseja monitorar.</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Tab */}
          <TabsContent value="business" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Filtros de Negócio</CardTitle>
                <CardDescription>
                  Defina critérios de tamanho e setor das empresas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Setores */}
                <div className="space-y-3">
                  <Label>Setores</Label>
                  <div className="flex flex-wrap gap-2">
                    {sectors?.map((sector) => (
                      <Badge
                        key={sector.sector_code}
                        variant={selectedSectors.includes(sector.sector_code) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleSector(sector.sector_code)}
                      >
                        {sector.sector_name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tamanho */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mínimo de Funcionários</Label>
                    <Input
                      type="number"
                      value={minEmployees}
                      onChange={(e) => setMinEmployees(parseInt(e.target.value))}
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Máximo de Funcionários</Label>
                    <Input
                      type="number"
                      value={maxEmployees}
                      onChange={(e) => setMaxEmployees(parseInt(e.target.value))}
                      min={0}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Signals Tab */}
          <TabsContent value="signals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sinais Monitorados</CardTitle>
                <CardDescription>
                  Escolha quais tipos de sinais detectar automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rodadas de Investimento</Label>
                    <p className="text-xs text-muted-foreground">Detectar captações e aportes</p>
                  </div>
                  <Switch checked={monitorFunding} onCheckedChange={setMonitorFunding} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mudanças de Liderança</Label>
                    <p className="text-xs text-muted-foreground">Novo CEO, CTO, diretores</p>
                  </div>
                  <Switch checked={monitorLeadership} onCheckedChange={setMonitorLeadership} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Expansão</Label>
                    <p className="text-xs text-muted-foreground">Novos escritórios, unidades</p>
                  </div>
                  <Switch checked={monitorExpansion} onCheckedChange={setMonitorExpansion} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Adoção de Tecnologia</Label>
                    <p className="text-xs text-muted-foreground">Implementações e migrações</p>
                  </div>
                  <Switch checked={monitorTech} onCheckedChange={setMonitorTech} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Parcerias</Label>
                    <p className="text-xs text-muted-foreground">Acordos e contratos</p>
                  </div>
                  <Switch checked={monitorPartnerships} onCheckedChange={setMonitorPartnerships} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Entrada em Mercado</Label>
                    <p className="text-xs text-muted-foreground">Lançamentos e novos mercados</p>
                  </div>
                  <Switch checked={monitorMarket} onCheckedChange={setMonitorMarket} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Transformação Digital</Label>
                    <p className="text-xs text-muted-foreground">Digitalização e cloud</p>
                  </div>
                  <Switch checked={monitorDigital} onCheckedChange={setMonitorDigital} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Menções a Concorrentes</Label>
                    <p className="text-xs text-muted-foreground">Displacement opportunities</p>
                  </div>
                  <Switch checked={monitorCompetitors} onCheckedChange={setMonitorCompetitors} />
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="space-y-2">
                    <Label>Palavras‑chave desejadas</Label>
                    <Input
                      placeholder="ex: aquisição de software, expansão, frota"
                      value={keywordsWhitelistInput}
                      onChange={(e) => setKeywordsWhitelistInput(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Separe por vírgulas. Usado para refinar a busca.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Palavras‑chave a excluir</Label>
                    <Input
                      placeholder="ex: estagiário, vaga, curso"
                      value={keywordsBlacklistInput}
                      onChange={(e) => setKeywordsBlacklistInput(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Frequência de Verificação</CardTitle>
                <CardDescription>
                  Define com que frequência o sistema verificará novos sinais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Verificar a cada (horas)</Label>
                  <Select value={checkFrequency.toString()} onValueChange={(v) => setCheckFrequency(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hora (máximo)</SelectItem>
                      <SelectItem value="3">3 horas</SelectItem>
                      <SelectItem value="6">6 horas (recomendado)</SelectItem>
                      <SelectItem value="12">12 horas</SelectItem>
                      <SelectItem value="24">24 horas</SelectItem>
                      <SelectItem value="48">48 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nome do agendamento</Label>
                  <Input
                    placeholder="Ex.: Monitoramento Sudeste - Agro"
                    value={scheduleName}
                    onChange={(e) => setScheduleName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Esse nome aparecerá nos alertas.</p>
                </div>

                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Sobre o Monitoramento Automático</p>
                      <p className="text-xs text-muted-foreground">
                        O sistema executará automaticamente a cada {checkFrequency}h, buscando empresas que atendem aos critérios definidos e detectando sinais relevantes.
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Frequências menores = mais atualizações, mas maior consumo de APIs externas.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Histórico Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuração Atual</CardTitle>
                <CardDescription>
                  Resumo do que está sendo monitorado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Regiões</p>
                    <p className="font-medium">{selectedRegions.length > 0 ? selectedRegions.join(', ') : 'Todas'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Estados</p>
                    <p className="font-medium">{selectedStates.length > 0 ? `${selectedStates.length} selecionados` : 'Todos'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Setores</p>
                    <p className="font-medium">{selectedSectors.length > 0 ? `${selectedSectors.length} setores` : 'Todos'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Porte</p>
                    <p className="font-medium">{minEmployees} - {maxEmployees} funcionários</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Frequência</p>
                    <p className="font-medium">A cada {checkFrequency}h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sinais Ativos</p>
                    <p className="font-medium">
                      {[monitorFunding, monitorLeadership, monitorExpansion, monitorTech, monitorPartnerships, monitorMarket, monitorDigital, monitorCompetitors].filter(Boolean).length} de 8
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Tipos de sinais monitorados:</p>
                  <div className="flex flex-wrap gap-2">
                    {monitorFunding && <Badge variant="outline" className="gap-1"><DollarSign className="h-3 w-3" />Investimento</Badge>}
                    {monitorLeadership && <Badge variant="outline" className="gap-1"><Users className="h-3 w-3" />Liderança</Badge>}
                    {monitorExpansion && <Badge variant="outline" className="gap-1"><TrendingUp className="h-3 w-3" />Expansão</Badge>}
                    {monitorTech && <Badge variant="outline" className="gap-1"><Cpu className="h-3 w-3" />Tecnologia</Badge>}
                    {monitorPartnerships && <Badge variant="outline" className="gap-1"><Handshake className="h-3 w-3" />Parcerias</Badge>}
                    {monitorMarket && <Badge variant="outline" className="gap-1"><Globe className="h-3 w-3" />Mercado</Badge>}
                    {monitorDigital && <Badge variant="outline" className="gap-1"><RefreshCw className="h-3 w-3" />Digital</Badge>}
                    {monitorCompetitors && <Badge variant="outline" className="gap-1"><Crosshair className="h-3 w-3" />Displacement</Badge>}
                  </div>
                </div>

                {!config?.is_active && (
                  <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Monitoramento pausado.</strong> Clique em "Ativar" no topo da página para começar a monitorar empresas.
                    </p>
                  </div>
                )}

                {config?.is_active && (
                  <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>Monitoramento ativo!</strong> O sistema está executando automaticamente a cada {config.check_frequency_hours}h.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Empresas Potenciais</CardTitle>
                <CardDescription>
                  Empresas que atendem aos critérios e serão monitoradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingCompanies ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Carregando empresas...</p>
                  </div>
                ) : monitoredCompanies.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-center pb-4 border-b">
                      <p className="text-4xl font-bold text-primary">{monitoredCompanies.length}</p>
                      <p className="text-sm text-muted-foreground mt-1">empresas atendem aos critérios</p>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {monitoredCompanies.map((company: any) => (
                        <div key={company.id} className="flex items-center gap-2 p-2 rounded-md border hover:bg-accent transition-colors">
                          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{company.name}</p>
                            <p className="text-xs text-muted-foreground">{company.headquarters_state} • {company.employees || '?'} func.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                      O monitoramento verificará até 50 empresas por execução, priorizando as mais relevantes
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">Nenhuma empresa encontrada</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ajuste os filtros para incluir mais empresas
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-between items-center sticky bottom-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-lg p-4 shadow-lg">
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">Alterações não salvas</span>
            </div>
          )}
          {!hasUnsavedChanges && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Tudo salvo</span>
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={saveConfigMutation.isPending || !hasUnsavedChanges}
            size="lg"
            className="gap-2"
          >
            {saveConfigMutation.isPending ? (
              <>Salvando...</>
            ) : hasUnsavedChanges ? (
              <><Save className="h-4 w-4" />Salvar Alterações</>
            ) : (
              <><CheckCircle2 className="h-4 w-4" />Salvo</>
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
