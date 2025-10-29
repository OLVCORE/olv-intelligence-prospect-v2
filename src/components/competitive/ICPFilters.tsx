import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, MapPin, Building2, TrendingUp, Layers, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ICPFiltersProps {
  filters: {
    region?: string;
    sector?: string;
    niche?: string;
    status?: string;
    temperature?: string;
  };
  onFilterChange: (key: string, value: string) => void;
  stats?: {
    total: number;
    qualified: number;
    disqualified: number;
    hot: number;
    warm: number;
    cold: number;
  };
}

const REGIONS = [
  { value: 'all', label: 'Todas as Regiões' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'Sudeste', label: 'Sudeste' },
  { value: 'Sul', label: 'Sul' },
  { value: 'Nordeste', label: 'Nordeste' },
  { value: 'Norte', label: 'Norte' },
  { value: 'Centro-Oeste', label: 'Centro-Oeste' },
];

const SECTORS = [
  { value: 'all', label: 'Todos os Setores' },
  { value: 'Agro', label: 'Agronegócio' },
  { value: 'Construção', label: 'Construção' },
  { value: 'Distribuição', label: 'Distribuição' },
  { value: 'Financial Services', label: 'Serviços Financeiros' },
  { value: 'Logística', label: 'Logística' },
  { value: 'Manufatura', label: 'Manufatura' },
  { value: 'Prestadores de Serviços', label: 'Prestadores de Serviços' },
  { value: 'Saúde', label: 'Saúde' },
  { value: 'Varejo', label: 'Varejo' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'qualified', label: '✅ Qualificado' },
  { value: 'disqualified', label: '⛔ Desqualificado' },
];

const TEMPERATURE_OPTIONS = [
  { value: 'all', label: 'Todas as Temperaturas' },
  { value: 'hot', label: '🔥 Hot Lead' },
  { value: 'warm', label: '🌡️ Warm Lead' },
  { value: 'cold', label: '❄️ Cold Lead' },
];

export function ICPFilters({ filters, onFilterChange, stats }: ICPFiltersProps) {
  // Buscar nichos baseado no setor selecionado
  const { data: niches } = useQuery({
    queryKey: ['niches', filters.sector],
    queryFn: async () => {
      if (!filters.sector || filters.sector === 'all') return [];

      const { data, error } = await supabase
        .from('niches')
        .select('*')
        .eq('sector', filters.sector)
        .order('niche_name');

      if (error) {
        console.error('Error fetching niches:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!filters.sector && filters.sector !== 'all'
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros de Qualificação ICP
        </CardTitle>
        <CardDescription>
          Filtre empresas por região, setor, status e temperatura
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pb-4 border-b">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.qualified}</div>
              <div className="text-xs text-muted-foreground">Qualificados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{stats.disqualified}</div>
              <div className="text-xs text-muted-foreground">Desqualificados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.hot}</div>
              <div className="text-xs text-muted-foreground">🔥 Hot</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.warm}</div>
              <div className="text-xs text-muted-foreground">🌡️ Warm</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.cold}</div>
              <div className="text-xs text-muted-foreground">❄️ Cold</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Região
            </label>
            <Select
              value={filters.region || 'all'}
              onValueChange={(value) => onFilterChange('region', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a região" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((region) => (
                  <SelectItem key={region.value} value={region.value}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Setor
            </label>
            <Select
              value={filters.sector || 'all'}
              onValueChange={(value) => onFilterChange('sector', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o setor" />
              </SelectTrigger>
              <SelectContent>
                {SECTORS.map((sector) => (
                  <SelectItem key={sector.value} value={sector.value}>
                    {sector.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Nicho
            </label>
            <Select
              value={filters.niche || 'all'}
              onValueChange={(value) => onFilterChange('niche', value)}
              disabled={!filters.sector || filters.sector === 'all'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o nicho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os nichos</SelectItem>
                {niches && niches.length > 0 ? (
                  niches.map((niche: any) => (
                    <SelectItem key={niche.id} value={niche.niche_name}>
                      {niche.niche_name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    {filters.sector && filters.sector !== 'all' 
                      ? 'Nenhum nicho disponível' 
                      : 'Selecione um setor primeiro'}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Status TOTVS
            </label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => onFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Temperatura
            </label>
            <Select
              value={filters.temperature || 'all'}
              onValueChange={(value) => onFilterChange('temperature', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a temperatura" />
              </SelectTrigger>
              <SelectContent>
                {TEMPERATURE_OPTIONS.map((temp) => (
                  <SelectItem key={temp.value} value={temp.value}>
                    {temp.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters */}
        <div className="flex flex-wrap gap-2 pt-2">
          {filters.region && filters.region !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              <MapPin className="h-3 w-3" />
              {REGIONS.find(r => r.value === filters.region)?.label}
            </Badge>
          )}
          {filters.sector && filters.sector !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              <Building2 className="h-3 w-3" />
              {SECTORS.find(s => s.value === filters.sector)?.label}
            </Badge>
          )}
          {filters.niche && filters.niche !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              <Target className="h-3 w-3" />
              {filters.niche}
            </Badge>
          )}
          {filters.status && filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              <Layers className="h-3 w-3" />
              {STATUS_OPTIONS.find(s => s.value === filters.status)?.label}
            </Badge>
          )}
          {filters.temperature && filters.temperature !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {TEMPERATURE_OPTIONS.find(t => t.value === filters.temperature)?.label}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
