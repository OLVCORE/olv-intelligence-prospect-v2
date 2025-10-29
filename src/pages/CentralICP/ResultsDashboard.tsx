import { useState } from 'react';
import { BarChart3, ArrowLeft, Filter, Download, Eye, ExternalLink, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface QualifiedCompany {
  id: string;
  name: string;
  cnpj?: string;
  state?: string;
  city?: string;
  totvs_detection_score?: number;
  totvs_last_checked_at?: string;
  intent_last_checked_at?: string;
  qualification_status?: 'qualified' | 'disqualified' | 'pending';
}

export default function ResultsDashboard() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Buscar empresas analisadas
  const { data: companies, isLoading } = useQuery({
    queryKey: ['qualified-companies', filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('companies')
        .select('id, name, cnpj, totvs_detection_score, totvs_last_checked_at')
        .not('totvs_last_checked_at', 'is', null)
        .order('totvs_last_checked_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(c => ({
        id: c.id,
        name: c.name,
        cnpj: c.cnpj || undefined,
        totvs_detection_score: c.totvs_detection_score || undefined,
        totvs_last_checked_at: c.totvs_last_checked_at || undefined,
        qualification_status: 
          (c.totvs_detection_score || 0) >= 70 ? 'disqualified' as const :
          (c.totvs_detection_score || 0) < 40 ? 'qualified' as const : 
          'pending' as const
      })) as QualifiedCompany[];
    },
  });

  // Calcular estatísticas
  const stats = {
    total: companies?.length || 0,
    qualified: companies?.filter(c => c.qualification_status === 'qualified').length || 0,
    disqualified: companies?.filter(c => c.qualification_status === 'disqualified').length || 0,
    hot: companies?.filter(c => (c.totvs_detection_score || 0) < 70).length || 0,
  };

  // Filtrar empresas
  const filteredCompanies = companies?.filter(company => {
    if (filterStatus !== 'all' && company.qualification_status !== filterStatus) return false;
    if (searchQuery && !company.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }) || [];

  const handleExportCSV = () => {
    if (!filteredCompanies.length) return;

    const csv = [
      ['Nome', 'CNPJ', 'Score TOTVS', 'Status', 'Última Análise'].join(','),
      ...filteredCompanies.map(c => [
        c.name,
        c.cnpj || '',
        c.totvs_detection_score || 0,
        c.qualification_status === 'qualified' ? 'Qualificada' :
        c.qualification_status === 'disqualified' ? 'Desqualificada' : 'Pendente',
        c.totvs_last_checked_at ? new Date(c.totvs_last_checked_at).toLocaleDateString('pt-BR') : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `icp-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'qualified':
        return <Badge className="bg-green-500">Qualificada</Badge>;
      case 'disqualified':
        return <Badge variant="destructive">Desqualificada</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-red-600 font-bold";
    if (score >= 40) return "text-yellow-600 font-semibold";
    return "text-green-600";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/central-icp')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-orange-600" />
            Dashboard de Resultados
          </h1>
          <p className="text-muted-foreground">
            Visualize todas as empresas analisadas e seus resultados
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!filteredCompanies.length}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Analisadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Todas as análises</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Qualificadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.qualified}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total ? ((stats.qualified / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Desqualificadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.disqualified}</div>
            <p className="text-xs text-muted-foreground mt-1">Já usam TOTVS</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hot Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.hot}</div>
            <p className="text-xs text-muted-foreground mt-1">Alto sinal de intenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Nome da empresa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="qualified">Qualificadas</SelectItem>
                  <SelectItem value="disqualified">Desqualificadas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas Analisadas ({filteredCompanies.length})</CardTitle>
          <CardDescription>Resultados detalhados de qualificação ICP</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando empresas...
            </div>
          ) : filteredCompanies.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead className="text-center">Score TOTVS</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Análise</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{company.name}</p>
                          {company.cnpj && (
                            <p className="text-xs text-muted-foreground">
                              CNPJ: {company.cnpj}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={getScoreColor(company.totvs_detection_score || 0)}>
                          {company.totvs_detection_score || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(company.qualification_status || 'pending')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {company.totvs_last_checked_at
                          ? new Date(company.totvs_last_checked_at).toLocaleDateString('pt-BR')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/central-icp/individual?company=${company.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/competitive-intelligence?company=${company.id}`)}
                          >
                            <Target className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p>Nenhuma empresa encontrada com os filtros aplicados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
