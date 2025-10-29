import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Play, Pause, Clock, MapPin, Target, Filter, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMonitoringConfig, useSaveMonitoringConfig, useToggleMonitoring, useRunMonitoringNow } from '@/hooks/useIntelligenceMonitoring';
import { useBrazilStates, useBrazilRegions } from '@/hooks/useBrazilGeography';
import { useSectors } from '@/hooks/useSectors';
import { Checkbox } from '@/components/ui/checkbox';

export default function MonitoringConfigPage() {
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

  const handleSave = () => {
    if (!user?.id) return;

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

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev =>
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
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
            <Badge variant={config?.is_active ? "default" : "secondary"}>
              {config?.is_active ? '🟢 Ativo' : '⏸️ Pausado'}
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
          <TabsList className="grid w-full grid-cols-4">
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

                {/* Estados */}
                <div className="space-y-3">
                  <Label>Estados</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {brazilStates?.map((state) => (
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
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saveConfigMutation.isPending}
            size="lg"
          >
            {saveConfigMutation.isPending ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
