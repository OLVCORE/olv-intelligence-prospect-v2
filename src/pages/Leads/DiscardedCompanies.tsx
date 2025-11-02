import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { XCircle, Search, Filter, TrendingDown, BarChart3, FileText } from 'lucide-react';

export default function DiscardedCompanies() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: discarded, isLoading } = useQuery({
    queryKey: ['discarded-companies', categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('discarded_companies')
        .select('*')
        .order('discarded_at', { ascending: false });

      if (categoryFilter !== 'all') {
        query = query.eq('discard_category', categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: analytics } = useQuery({
    queryKey: ['discarded-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discarded_companies')
        .select('discard_category, discard_reason_id');

      if (error) throw error;

      // Calcular estatísticas
      const byCategory: Record<string, number> = {};
      const byReason: Record<string, number> = {};

      data.forEach(item => {
        byCategory[item.discard_category] = (byCategory[item.discard_category] || 0) + 1;
        byReason[item.discard_reason_id] = (byReason[item.discard_reason_id] || 0) + 1;
      });

      return {
        total: data.length,
        byCategory,
        byReason
      };
    }
  });

  const filteredData = discarded?.filter(company =>
    company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.cnpj?.includes(searchTerm)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <XCircle className="w-8 h-8 text-destructive" />
            Empresas Descartadas
          </h1>
          <p className="text-muted-foreground mt-1">
            Histórico completo de empresas descartadas com motivos e analytics
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Descartadas</p>
                  <p className="text-2xl font-bold">{analytics.total}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Por Categoria</p>
                <div className="space-y-1 text-xs">
                  {Object.entries(analytics.byCategory).map(([cat, count]) => (
                    <div key={cat} className="flex justify-between">
                      <span className="capitalize">{cat}:</span>
                      <span className="font-mono font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Top 3 Motivos</p>
                <div className="space-y-1 text-xs">
                  {Object.entries(analytics.byReason)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .slice(0, 3)
                    .map(([reason, count]) => (
                      <div key={reason} className="flex justify-between">
                        <span className="truncate max-w-[120px]">{reason}</span>
                        <span className="font-mono font-semibold">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Média Score</p>
                  <p className="text-2xl font-bold">
                    {discarded && discarded.length > 0
                      ? Math.round(
                          discarded.reduce((sum, c) => sum + (c.original_icp_score || 0), 0) /
                            discarded.length
                        )
                      : 0}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                <SelectItem value="blocker">Blocker</SelectItem>
                <SelectItem value="qualification">Qualificação</SelectItem>
                <SelectItem value="data">Dados</SelectItem>
                <SelectItem value="risk">Risco</SelectItem>
                <SelectItem value="other">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Histórico de Descartes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>STC Status</TableHead>
                <TableHead>Score ICP</TableHead>
                <TableHead>Data Descarte</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredData && filteredData.length > 0 ? (
                filteredData.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.company_name}</TableCell>
                    <TableCell>
                      {company.cnpj && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {company.cnpj}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div>
                        <p className="text-sm font-medium">{company.discard_reason_label}</p>
                        <p className="text-xs text-muted-foreground">
                          {company.discard_reason_description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {company.discard_category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {company.stc_status && (
                        <Badge
                          variant={
                            company.stc_status === 'no-go'
                              ? 'destructive'
                              : company.stc_status === 'revisar'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {company.stc_status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.original_icp_score && (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">
                            {company.original_icp_score}
                          </span>
                          {company.original_icp_temperature && (
                            <Badge
                              variant={
                                company.original_icp_temperature === 'hot'
                                  ? 'default'
                                  : company.original_icp_temperature === 'warm'
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="text-xs"
                            >
                              {company.original_icp_temperature}
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(company.discarded_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma empresa descartada encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
