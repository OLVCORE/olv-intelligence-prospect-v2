import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/layout/PageHeader';
import AddCompanyDialog from '@/components/SalesIntelligence/AddCompanyDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, AlertCircle, TrendingUp, Search, ExternalLink, Activity, Filter, Users, MapPin, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMonitoredCompanies as useMonitoredCompaniesHook, useToggleCompanyMonitoring } from '@/hooks/useCompanyMonitoring';

interface CompanyWithSignals {
  id: string;
  name: string;
  domain: string;
  headquarters_state: string;
  industry: string;
  employees: number;
  signal_count: number;
  urgent_signals: number;
  high_priority_signals: number;
  last_signal_date: string | null;
  newest_signal_type: string | null;
}

export default function MonitoredCompaniesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [addResults, setAddResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: monitored = [], isLoading } = useMonitoredCompaniesHook();
  const toggleMonitoring = useToggleCompanyMonitoring();

  // Montar lista a partir da tabela company_monitoring
  const companies = (monitored || []).map((row: any) => ({
    id: row.companies?.id,
    name: row.companies?.name,
    domain: row.companies?.domain,
    headquarters_state: row.companies?.headquarters_state,
    industry: row.companies?.industry,
    employees: row.companies?.employees,
    signal_count: 0,
    urgent_signals: 0,
    high_priority_signals: 0,
    last_signal_date: null as string | null,
    newest_signal_type: null as string | null,
  })).filter(c => c.id && c.name);

  // Opcional: enriquecer com sinais recentes para ranking simples
  const { data: enriched = companies } = useQuery({
    queryKey: ['monitored-companies-signals', companies.map(c => c.id).join(',')],
    queryFn: async () => {
      const enrichedList = await Promise.all(companies.map(async (c) => {
        const { data: signals } = await supabase
          .from('buying_signals')
          .select('priority, signal_type, detected_at')
          .eq('company_id', c.id)
          .order('detected_at', { ascending: false })
          .limit(50);
        return {
          ...c,
          signal_count: signals?.length || 0,
          urgent_signals: signals?.filter(s => s.priority === 'urgent').length || 0,
          high_priority_signals: signals?.filter(s => s.priority === 'high').length || 0,
          last_signal_date: signals?.[0]?.detected_at || null,
          newest_signal_type: signals?.[0]?.signal_type || null,
        };
      }));
      return enrichedList;
    },
    enabled: companies.length > 0,
  });

  const filteredCompanies = (enriched || companies).filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (urgent: number, high: number) => {
    if (urgent > 0) return 'bg-red-500';
    if (high > 0) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getPriorityLabel = (urgent: number, high: number) => {
    if (urgent > 0) return 'Urgente';
    if (high > 0) return 'Alta Prioridade';
    return 'Normal';
  };

  const getSignalTypeLabel = (type: string | null) => {
    const types: Record<string, string> = {
      'funding': 'Investimento',
      'leadership_change': 'Mudança de Liderança',
      'expansion': 'Expansão',
      'tech_adoption': 'Adoção de Tecnologia',
      'partnership': 'Parceria',
      'market_entry': 'Entrada no Mercado',
      'digital_transformation': 'Transformação Digital',
    };
    return type ? types[type] || type : 'Desconhecido';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Activity className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando empresas monitoradas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas Monitoradas"
        description={`${filteredCompanies.length} empresa(s) com monitoramento ativo`}
        actions={
          <>
            <Button size="sm" onClick={() => setShowAddCompany(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Monitorar Empresa
            </Button>
          </>
        }
      />

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Busca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou domínio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Empresas */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhuma empresa encontrada</p>
              <p className="text-sm text-muted-foreground">
                Ajuste os filtros ou configure o monitoramento
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/sales-intelligence/config')}
              >
                Configurar Monitoramento
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredCompanies.map((company) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Info da Empresa */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-xl font-semibold">{company.name}</h3>
                      
                      {/* Indicador de Prioridade */}
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${getPriorityColor(company.urgent_signals, company.high_priority_signals)} animate-pulse`} />
                        <Badge variant={company.urgent_signals > 0 ? 'destructive' : company.high_priority_signals > 0 ? 'default' : 'secondary'}>
                          {getPriorityLabel(company.urgent_signals, company.high_priority_signals)}
                        </Badge>
                      </div>
                    </div>

                    {/* Metadados */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      {company.headquarters_state && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {company.headquarters_state}
                        </div>
                      )}
                      {company.industry && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {company.industry}
                        </div>
                      )}
                      {company.employees && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {company.employees} funcionários
                        </div>
                      )}
                    </div>

                    {/* Sinais */}
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="gap-1">
                        <Activity className="h-3 w-3" />
                        {company.signal_count} {company.signal_count === 1 ? 'sinal' : 'sinais'}
                      </Badge>
                      
                      {company.urgent_signals > 0 && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {company.urgent_signals} urgente{company.urgent_signals > 1 ? 's' : ''}
                        </Badge>
                      )}

                      {company.newest_signal_type && (
                        <Badge variant="secondary">
                          Último: {getSignalTypeLabel(company.newest_signal_type)}
                        </Badge>
                      )}

                      {company.last_signal_date && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(company.last_signal_date).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/companies/${company.id}`)}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ver Empresa
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/sales-intelligence/feed?company=${company.id}`)}
                      className="gap-2"
                    >
                      <Activity className="h-4 w-4" />
                      Ver Sinais
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Resumo */}
      {filteredCompanies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resumo do Monitoramento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold">{filteredCompanies.length}</p>
                <p className="text-xs text-muted-foreground">Empresas Monitoradas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">
                  {filteredCompanies.reduce((acc, c) => acc + c.urgent_signals, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Sinais Urgentes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-500">
                  {filteredCompanies.reduce((acc, c) => acc + c.high_priority_signals, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Alta Prioridade</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredCompanies.reduce((acc, c) => acc + c.signal_count, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total de Sinais</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
