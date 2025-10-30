import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Flame,
  Thermometer,
  Snowflake,
  ArrowRight,
  Trash2,
  RefreshCw,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { useICPQuarantine } from '@/hooks/useICPQuarantine';
import { AppLayout } from '@/components/layout/AppLayout';

export default function ICPQuarantinePage() {
  const {
    empresas,
    selecionadas,
    isLoading,
    toggleSelection,
    toggleAllSelection,
    moverParaPool,
    descartarSelecionadas,
    recarregar,
  } = useICPQuarantine();

  const getTemperatureIcon = (temp: string) => {
    switch (temp) {
      case 'hot':
        return <Flame className="w-4 h-4 text-red-500" />;
      case 'warm':
        return <Thermometer className="w-4 h-4 text-orange-500" />;
      case 'cold':
        return <Snowflake className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getTemperatureBadge = (temp: string) => {
    const variants = {
      hot: 'destructive',
      warm: 'default',
      cold: 'secondary',
    };
    const labels = {
      hot: 'QUENTE',
      warm: 'MORNO',
      cold: 'FRIO',
    };
    return (
      <Badge variant={variants[temp as keyof typeof variants] as any}>
        {labels[temp as keyof typeof labels]}
      </Badge>
    );
  };

  const renderCompanyTable = (companies: any[], type: 'aprovadas' | 'reprovadas' | 'totvs') => {
    if (!companies || companies.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhuma empresa nesta categoria</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {type === 'aprovadas' && (
              <TableHead className="w-12">
                <Checkbox
                  checked={companies.every((c) => selecionadas.has(c.id))}
                  onCheckedChange={(checked) => {
                    companies.forEach((c) => {
                      if (checked && !selecionadas.has(c.id)) {
                        toggleSelection(c.id);
                      } else if (!checked && selecionadas.has(c.id)) {
                        toggleSelection(c.id);
                      }
                    });
                  }}
                />
              </TableHead>
            )}
            <TableHead>Razão Social</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>UF</TableHead>
            <TableHead>Score ICP</TableHead>
            <TableHead>Temperatura</TableHead>
            {type === 'totvs' && <TableHead>Evidências</TableHead>}
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((empresa) => (
            <TableRow key={empresa.id}>
              {type === 'aprovadas' && (
                <TableCell>
                  <Checkbox
                    checked={selecionadas.has(empresa.id)}
                    onCheckedChange={() => toggleSelection(empresa.id)}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">{empresa.razao_social}</TableCell>
              <TableCell className="font-mono text-sm">{empresa.cnpj}</TableCell>
              <TableCell>
                <Badge variant="outline">{empresa.uf}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-lg">{empresa.icp_score || 0}</div>
                  <div className="text-xs text-muted-foreground">/100</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getTemperatureIcon(empresa.temperatura)}
                  {getTemperatureBadge(empresa.temperatura)}
                </div>
              </TableCell>
              {type === 'totvs' && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      // TODO: Abrir modal com evidências TOTVS
                      console.log('Evidências:', empresa.totvs_evidences);
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver Evidências ({empresa.totvs_evidences?.length || 0})
                  </Button>
                </TableCell>
              )}
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    // TODO: Ver análise completa
                    console.log('Análise:', empresa.analysis_data);
                  }}
                >
                  <FileText className="w-4 h-4" />
                  Ver Análise
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Quarentena ICP</h1>
            <p className="text-muted-foreground mt-1">
              Empresas analisadas aguardando aprovação para o Leads Pool
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={recarregar}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            {selecionadas.size > 0 && (
              <>
                <Button variant="outline" onClick={descartarSelecionadas}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Descartar ({selecionadas.size})
                </Button>
                <Button onClick={moverParaPool}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Mover para Pool ({selecionadas.size})
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aprovadas</p>
                <p className="text-2xl font-bold">{empresas.aprovadas?.length || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-100">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reprovadas</p>
                <p className="text-2xl font-bold">{empresas.reprovadas?.length || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-orange-100">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-orange-800">Clientes TOTVS</p>
                <p className="text-2xl font-bold text-orange-900">
                  {empresas.totvs?.length || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="aprovadas" className="w-full">
          <TabsList>
            <TabsTrigger value="aprovadas">
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprovadas ({empresas.aprovadas?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="reprovadas">
              <XCircle className="w-4 h-4 mr-2" />
              Reprovadas ({empresas.reprovadas?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="totvs">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Clientes TOTVS ({empresas.totvs?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aprovadas" className="mt-6">
            <Card className="p-6">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  ✅ Empresas que passaram na análise ICP (Score ≥40) e não são clientes TOTVS
                </p>
              </div>
              {renderCompanyTable(empresas.aprovadas || [], 'aprovadas')}
            </Card>
          </TabsContent>

          <TabsContent value="reprovadas" className="mt-6">
            <Card className="p-6">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  ❌ Empresas com ICP Score baixo (&lt;40) - Não atendem aos critérios mínimos
                </p>
              </div>
              {renderCompanyTable(empresas.reprovadas || [], 'reprovadas')}
            </Card>
          </TabsContent>

          <TabsContent value="totvs" className="mt-6">
            <Card className="p-6 bg-red-50 border-red-200">
              <div className="mb-4">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ Empresas identificadas como clientes TOTVS - Descartadas automaticamente
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Clique em "Ver Evidências" para visualizar onde foram encontradas referências aos produtos TOTVS
                </p>
              </div>
              {renderCompanyTable(empresas.totvs || [], 'totvs')}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
