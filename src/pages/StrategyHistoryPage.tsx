import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/common/BackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  History, 
  Search, 
  Calendar, 
  Building2, 
  FileText,
  Trash2,
  Eye,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { ScrollToTopButton } from '@/components/common/ScrollToTopButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function StrategyHistoryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');

  const { data: strategies, isLoading, refetch } = useQuery({
    queryKey: ['strategy-history', moduleFilter],
    queryFn: async () => {
      let query = supabase
        .from('account_strategy_modules')
        .select(`
          *,
          companies(id, name, cnpj)
        `)
        .order('updated_at', { ascending: false });

      if (moduleFilter !== 'all') {
        query = query.eq('module', moduleFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('account_strategy_modules')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir estratégia');
      return;
    }

    toast.success('Estratégia excluída com sucesso');
    refetch();
  };

  const handleOpenStrategy = (strategy: any) => {
    const module = strategy.module;
    const companyId = strategy.company_id;
    
    // Navegar para a página correta com a aba apropriada
    const tabMap: Record<string, string> = {
      'roi': 'roi',
      'cpq': 'cpq',
      'scenarios': 'scenarios',
      'proposals': 'proposals',
      'competitive': 'competitive',
      'value': 'value',
    };

    const tab = tabMap[module] || 'roi';
    navigate(`/account-strategy?company=${companyId}&tab=${tab}`);
  };

  const getModuleLabel = (module: string) => {
    const labels: Record<string, string> = {
      roi: 'ROI Calculator',
      cpq: 'CPQ / Cotação',
      scenarios: 'Cenários',
      proposals: 'Propostas',
      competitive: 'Competitivo',
      value: 'Valor Realizado',
    };
    return labels[module] || module;
  };

  const getModuleColor = (module: string): "default" | "secondary" | "destructive" | "outline" => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      roi: 'default',
      cpq: 'secondary',
      scenarios: 'outline',
      proposals: 'default',
      competitive: 'destructive',
      value: 'secondary',
    };
    return colors[module] || 'outline';
  };

  // Get unique companies for filter
  const companies = strategies?.reduce((acc: any[], strategy: any) => {
    const company = strategy.companies;
    if (company && !acc.find(c => c.id === company.id)) {
      acc.push(company);
    }
    return acc;
  }, []) || [];

  const filteredStrategies = strategies?.filter((strategy) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      strategy.title?.toLowerCase().includes(searchLower) ||
      strategy.companies?.name?.toLowerCase().includes(searchLower) ||
      strategy.companies?.cnpj?.includes(searchQuery)
    );
    const matchesCompany = companyFilter === 'all' || strategy.company_id === companyFilter;
    return matchesSearch && matchesCompany;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <BackButton to="/account-strategy" />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <History className="h-8 w-8 text-primary" />
              Histórico de Estratégias
            </h1>
            <p className="text-muted-foreground">
              Visualize e gerencie todas as estratégias salvas
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por empresa, título ou CNPJ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="min-w-[200px]">
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger>
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Empresas</SelectItem>
                    {companies.map((company: any) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[200px]">
                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Módulos</SelectItem>
                    <SelectItem value="roi">ROI Calculator</SelectItem>
                    <SelectItem value="cpq">CPQ / Cotação</SelectItem>
                    <SelectItem value="scenarios">Cenários</SelectItem>
                    <SelectItem value="proposals">Propostas</SelectItem>
                    <SelectItem value="competitive">Competitivo</SelectItem>
                    <SelectItem value="value">Valor Realizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategy List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : filteredStrategies && filteredStrategies.length > 0 ? (
          <div className="grid gap-4">
            {filteredStrategies.map((strategy) => (
              <Card key={strategy.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getModuleColor(strategy.module)}>
                          {getModuleLabel(strategy.module)}
                        </Badge>
                        {strategy.is_draft && (
                          <Badge variant="outline">Rascunho</Badge>
                        )}
                        <Badge variant="secondary">v{strategy.version}</Badge>
                      </div>
                      
                      <CardTitle className="flex items-center gap-2">
                        {strategy.companies && (
                          <>
                            <Building2 className="h-5 w-5 text-primary" />
                            {strategy.companies.name}
                          </>
                        )}
                        {!strategy.companies && strategy.title && (
                          <>
                            <FileText className="h-5 w-5 text-primary" />
                            {strategy.title}
                          </>
                        )}
                      </CardTitle>

                      <CardDescription className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Atualizado {formatDistanceToNow(new Date(strategy.updated_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                        {strategy.companies?.cnpj && (
                          <span className="text-sm">
                            CNPJ: {strategy.companies.cnpj}
                          </span>
                        )}
                      </CardDescription>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenStrategy(strategy)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Abrir
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Estratégia?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. A estratégia será permanentemente excluída.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(strategy.id)}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || moduleFilter !== 'all'
                  ? 'Nenhuma estratégia encontrada com os filtros aplicados'
                  : 'Nenhuma estratégia salva ainda'}
              </p>
            </CardContent>
          </Card>
        )}

        <ScrollToTopButton />
      </div>
    </AppLayout>
  );
}
