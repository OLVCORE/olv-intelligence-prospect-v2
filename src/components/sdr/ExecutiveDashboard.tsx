import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, TrendingDown, DollarSign, Target, 
  Clock, AlertCircle, Award, Zap, BarChart3, LineChart
} from 'lucide-react';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import { 
  LineChart as RechartsLine, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export function ExecutiveDashboard() {
  const { data, isLoading } = useAdvancedAnalytics();

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 animate-pulse text-primary" />
          <p className="text-lg font-medium">Calculando métricas avançadas...</p>
        </div>
      </div>
    );
  }

  const { metrics, sdrPerformance, timeSeries } = data;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Conversion by stage data for pie chart
  const stageData = Object.entries(metrics.conversionByStage).map(([stage, rate]) => ({
    name: stage,
    value: rate
  }));

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Dashboard Executivo</h2>
            <p className="text-sm text-muted-foreground">
              Métricas e análises em tempo real
            </p>
          </div>
          <Badge variant="outline" className="gap-2">
            <Zap className="h-3 w-3" />
            Atualizado há 1min
          </Badge>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground">Pipeline Total</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics.totalPipelineValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ponderado: {formatCurrency(metrics.weightedPipelineValue)}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span className={cn(
                "text-sm font-medium",
                metrics.winRate >= 50 ? "text-green-600" : "text-orange-600"
              )}>
                {metrics.winRate.toFixed(1)}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold">{metrics.activeDeals}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Deals ativos
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">{metrics.averageSalesCycle.toFixed(0)}d</span>
            </div>
            <p className="text-sm text-muted-foreground">Ciclo de Vendas</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics.averageDealSize)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ticket médio
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Award className="h-5 w-5 text-orange-600" />
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground">Fechados este mês</p>
            <p className="text-2xl font-bold">{metrics.closedWonThisMonth}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(metrics.closedWonValue)}
            </p>
          </Card>
        </div>

        {/* Alerts Section */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 border-orange-200 bg-orange-50 dark:bg-orange-950">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold">Deals Parados</h3>
            </div>
            <p className="text-3xl font-bold text-orange-600">{metrics.staleDealCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Mais de 7 dias sem movimento
            </p>
          </Card>

          <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold">Em Risco (SLA)</h3>
            </div>
            <p className="text-3xl font-bold text-red-600">{metrics.atRiskDeals}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Menos de 7 dias para fechar
            </p>
          </Card>

          <Card className="p-4 border-purple-200 bg-purple-50 dark:bg-purple-950">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold">Alto Valor</h3>
            </div>
            <p className="text-3xl font-bold text-purple-600">{metrics.highValueDeals}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Acima de R$ 100k
            </p>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Pipeline Evolution */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Evolução do Pipeline (30 dias)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsLine data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pipelineValue" stroke="#8b5cf6" name="Valor" />
                <Line type="monotone" dataKey="dealsCreated" stroke="#06b6d4" name="Criados" />
              </RechartsLine>
            </ResponsiveContainer>
          </Card>

          {/* Conversion by Stage */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Taxa de Conversão por Estágio
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value.toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* SDR Performance */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Performance da Equipe</h3>
          <div className="space-y-3">
            {sdrPerformance.map((sdr) => (
              <div key={sdr.sdrId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{sdr.sdrName}</h4>
                  <p className="text-xs text-muted-foreground">
                    {sdr.activeDeals} deals ativos • {formatCurrency(sdr.totalValue)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-green-600">{sdr.wonDeals}</p>
                    <p className="text-xs text-muted-foreground">Ganhos</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-red-600">{sdr.lostDeals}</p>
                    <p className="text-xs text-muted-foreground">Perdidos</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-blue-600">{sdr.winRate.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-purple-600">{sdr.avgTimeToClose.toFixed(0)}d</p>
                    <p className="text-xs text-muted-foreground">Tempo Médio</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </ScrollArea>
  );
}
