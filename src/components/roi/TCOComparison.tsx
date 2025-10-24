import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface TCOBreakdown {
  acquisition: {
    licenses: number;
    hardware: number;
    implementation: number;
    training: number;
  };
  operational: {
    maintenance: number;
    support: number;
    upgrades: number;
    cloudHosting: number;
    personnel: number;
  };
  hidden: {
    downtime: number;
    dataMigration: number;
    customizations: number;
    changeManagement: number;
  };
  endOfLife: {
    decommissioning: number;
    dataMigrationOut: number;
  };
  totalFiveYear: number;
  annualAverage: number;
}

interface TCOComparisonProps {
  currentTCO: TCOBreakdown;
  proposedTCO: TCOBreakdown;
}

export function TCOComparison({ currentTCO, proposedTCO }: TCOComparisonProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const savings = currentTCO.totalFiveYear - proposedTCO.totalFiveYear;
  const savingsPercent = ((savings / currentTCO.totalFiveYear) * 100).toFixed(1);

  const comparisonData = [
    {
      category: 'Sistema Atual',
      acquisition: currentTCO.acquisition.licenses + currentTCO.acquisition.hardware + currentTCO.acquisition.implementation + currentTCO.acquisition.training,
      operational: Object.values(currentTCO.operational).reduce((a, b) => a + b, 0),
      hidden: Object.values(currentTCO.hidden).reduce((a, b) => a + b, 0),
      endOfLife: Object.values(currentTCO.endOfLife).reduce((a, b) => a + b, 0),
    },
    {
      category: 'Solução TOTVS',
      acquisition: proposedTCO.acquisition.licenses + proposedTCO.acquisition.hardware + proposedTCO.acquisition.implementation + proposedTCO.acquisition.training,
      operational: Object.values(proposedTCO.operational).reduce((a, b) => a + b, 0),
      hidden: Object.values(proposedTCO.hidden).reduce((a, b) => a + b, 0),
      endOfLife: Object.values(proposedTCO.endOfLife).reduce((a, b) => a + b, 0),
    },
  ];

  const detailBreakdown = [
    {
      name: 'Aquisição',
      current: comparisonData[0].acquisition,
      proposed: comparisonData[1].acquisition,
      icon: CheckCircle2,
      color: 'hsl(var(--chart-1))',
    },
    {
      name: 'Operacional (5 anos)',
      current: comparisonData[0].operational,
      proposed: comparisonData[1].operational,
      icon: TrendingDown,
      color: 'hsl(var(--chart-2))',
    },
    {
      name: 'Custos Ocultos',
      current: comparisonData[0].hidden,
      proposed: comparisonData[1].hidden,
      icon: AlertTriangle,
      color: 'hsl(var(--chart-3))',
    },
    {
      name: 'Descontinuação',
      current: comparisonData[0].endOfLife,
      proposed: comparisonData[1].endOfLife,
      icon: CheckCircle2,
      color: 'hsl(var(--chart-4))',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">TCO Atual (5 anos)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentTCO.totalFiveYear)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Média anual: {formatCurrency(currentTCO.annualAverage)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">TCO Proposto (5 anos)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(proposedTCO.totalFiveYear)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Média anual: {formatCurrency(proposedTCO.annualAverage)}
            </p>
          </CardContent>
        </Card>

        <Card className={savings > 0 ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {savings > 0 ? 'Economia Total' : 'Custo Adicional'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${savings > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(savings))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {savingsPercent}% {savings > 0 ? 'redução' : 'aumento'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação de Custos por Categoria</CardTitle>
          <CardDescription>Total Cost of Ownership (TCO) - 5 anos</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="acquisition" stackId="a" fill="hsl(var(--chart-1))" name="Aquisição" />
              <Bar dataKey="operational" stackId="a" fill="hsl(var(--chart-2))" name="Operacional" />
              <Bar dataKey="hidden" stackId="a" fill="hsl(var(--chart-3))" name="Custos Ocultos" />
              <Bar dataKey="endOfLife" stackId="a" fill="hsl(var(--chart-4))" name="Descontinuação" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Breakdown Detalhado</CardTitle>
          <CardDescription>Comparação categoria por categoria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {detailBreakdown.map((item, index) => {
              const diff = item.current - item.proposed;
              const diffPercent = ((diff / item.current) * 100).toFixed(1);
              const Icon = item.icon;

              return (
                <div key={index} className="border-b pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4" style={{ color: item.color }} />
                    <h4 className="font-semibold">{item.name}</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Atual</div>
                      <div className="font-mono">{formatCurrency(item.current)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Proposto</div>
                      <div className="font-mono text-primary">{formatCurrency(item.proposed)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Diferença</div>
                      <div className={`font-mono font-bold ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {diff > 0 ? '-' : '+'}{formatCurrency(Math.abs(diff))} ({diffPercent}%)
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Hidden Costs Alert */}
      {comparisonData[0].hidden > comparisonData[1].hidden && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              Custos Ocultos Identificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              A solução atual possui <strong>{formatCurrency(comparisonData[0].hidden - comparisonData[1].hidden)}</strong> em custos ocultos
              que serão eliminados ou reduzidos com a solução TOTVS, incluindo:
            </p>
            <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
              <li>Downtime reduzido: {formatCurrency(currentTCO.hidden.downtime - proposedTCO.hidden.downtime)}</li>
              <li>Migração de dados simplificada: {formatCurrency(currentTCO.hidden.dataMigration - proposedTCO.hidden.dataMigration)}</li>
              <li>Customizações padronizadas: {formatCurrency(currentTCO.hidden.customizations - proposedTCO.hidden.customizations)}</li>
              <li>Change management eficiente: {formatCurrency(currentTCO.hidden.changeManagement - proposedTCO.hidden.changeManagement)}</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
