import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useLeadsPool, useAddToQualified } from '@/hooks/useLeadsPool';
import { PoolRowActions } from '@/components/leads-pool/PoolRowActions';
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
import {
  Database,
  Flame,
  Thermometer,
  Snowflake,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export default function LeadsPoolPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [temperatura, setTemperatura] = useState<string>('');
  const pageSize = 50;

  const { data, isLoading, refetch } = useLeadsPool({
    page,
    pageSize,
    search,
    temperatura: temperatura || undefined,
  });

  const addToQualified = useAddToQualified();

  const handleAddToQualified = async (leadId: string) => {
    await addToQualified.mutateAsync(leadId);
    refetch();
  };

  const getTemperaturaBadge = (temp: string) => {
    switch (temp) {
      case 'hot':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            <Flame className="w-3 h-3 mr-1" />
            HOT
          </Badge>
        );
      case 'warm':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            <Thermometer className="w-3 h-3 mr-1" />
            WARM
          </Badge>
        );
      case 'cold':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <Snowflake className="w-3 h-3 mr-1" />
            COLD
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            Pool de Leads
          </h1>
          <p className="text-muted-foreground mt-1">
            {data?.count || 0} empresas prospectadas aguardando qualificação
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por razão social ou CNPJ..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={temperatura}
            onValueChange={(value) => {
              setTemperatura(value);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Temperatura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="hot">HOT</SelectItem>
              <SelectItem value="warm">WARM</SelectItem>
              <SelectItem value="cold">COLD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{data?.count || 0}</p>
            </div>
            <Database className="w-8 h-8 text-primary opacity-20" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Página Atual</p>
              <p className="text-2xl font-bold">{data?.data?.length || 0}</p>
            </div>
            <Database className="w-8 h-8 text-primary opacity-20" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Páginas</p>
              <p className="text-2xl font-bold">{data?.totalPages || 0}</p>
            </div>
            <Database className="w-8 h-8 text-primary opacity-20" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Score Médio</p>
              <p className="text-2xl font-bold">
                {data?.data?.length
                  ? Math.round(
                      data.data.reduce((acc, lead) => acc + (lead.icp_score || 0), 0) /
                        data.data.length
                    )
                  : 0}
              </p>
            </div>
            <Database className="w-8 h-8 text-primary opacity-20" />
          </div>
        </Card>
      </div>

      {/* Tabela */}
      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>UF</TableHead>
              <TableHead>Score ICP</TableHead>
              <TableHead>Temperatura</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data?.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{lead.razao_social}</div>
                    {lead.nome_fantasia && (
                      <div className="text-sm text-muted-foreground">
                        {lead.nome_fantasia}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{lead.cnpj}</TableCell>
                <TableCell>
                  <Badge variant="outline">{lead.uf}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="default">{lead.icp_score}/100</Badge>
                </TableCell>
                <TableCell>{getTemperaturaBadge(lead.temperatura)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddToQualified(lead.id)}
                      disabled={addToQualified.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Qualificar
                    </Button>
                    <PoolRowActions
                      lead={lead}
                      onQualify={handleAddToQualified}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Paginação */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Página {page + 1} de {data.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= data.totalPages - 1}
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {!data?.data?.length && (
          <div className="text-center py-12">
            <Database className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhuma empresa encontrada no pool
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
