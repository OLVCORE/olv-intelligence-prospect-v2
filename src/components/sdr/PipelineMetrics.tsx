import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, DollarSign, Target, 
  Clock, Zap, Users, AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Deal {
  id: string;
  status: string;
  priority: string;
  estimated_value?: number;
  win_probability?: number;
  created_at: string;
}

interface PipelineMetricsProps {
  deals: Deal[];
}

export function PipelineMetrics({ deals }: PipelineMetricsProps) {
  // Calcular métricas
  const totalValue = deals.reduce((sum, d) => sum + (d.estimated_value || 0), 0);
  const avgDealSize = deals.length > 0 ? totalValue / deals.length : 0;
  const weightedValue = deals.reduce((sum, d) => 
    sum + ((d.estimated_value || 0) * ((d.win_probability || 0) / 100)), 0
  );
  
  const stageDistribution = {
    new: deals.filter(d => d.status === 'new').length,
    contacted: deals.filter(d => d.status === 'contacted').length,
    qualified: deals.filter(d => d.status === 'qualified').length,
    proposal: deals.filter(d => d.status === 'proposal').length,
    negotiation: deals.filter(d => d.status === 'negotiation').length,
    won: deals.filter(d => d.status === 'closed_won').length,
  };

  const highPriorityCount = deals.filter(d => d.priority === 'high').length;
  const avgWinProbability = deals.length > 0
    ? deals.reduce((sum, d) => sum + (d.win_probability || 0), 0) / deals.length
    : 0;

  // Calcular velocity (deals nos últimos 7 dias)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentDeals = deals.filter(d => new Date(d.created_at) > sevenDaysAgo);
  const velocity = recentDeals.length;

  // Calcular health score
  const healthScore = Math.min(100, (
    (avgWinProbability * 0.4) +
    (Math.min(velocity / 5, 1) * 30) +
    ((stageDistribution.qualified + stageDistribution.proposal) / Math.max(deals.length, 1) * 30)
  ));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Pipeline Health */}
      <Card className="relative overflow-hidden">
        <div className={cn(
          "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20",
          healthScore >= 70 ? "bg-green-500" : healthScore >= 40 ? "bg-yellow-500" : "bg-red-500"
        )} />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Pipeline Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{healthScore.toFixed(0)}</span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <Progress value={healthScore} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {healthScore >= 70 ? '🟢 Excelente' : healthScore >= 40 ? '🟡 Moderado' : '🔴 Requer atenção'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Weighted Pipeline Value */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/20 blur-3xl" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Valor Ponderado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{formatCurrency(weightedValue)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">{formatCurrency(totalValue)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Baseado em probabilidades de ganho
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sales Velocity */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-500/20 blur-3xl" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Velocidade (7d)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{velocity}</span>
              <Badge variant={velocity >= 5 ? "default" : "secondary"} className="text-xs">
                novos leads
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span>+{Math.round((velocity / Math.max(deals.length, 1)) * 100)}% vs total</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* High Priority Deals */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-red-500/20 blur-3xl" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Alta Prioridade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{highPriorityCount}</span>
              <Badge variant="destructive" className="text-xs">
                urgente
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {((highPriorityCount / Math.max(deals.length, 1)) * 100).toFixed(0)}% do pipeline
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stage Distribution */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Distribuição por Estágio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-3">
            {Object.entries(stageDistribution).map(([stage, count]) => {
              const percentage = (count / Math.max(deals.length, 1)) * 100;
              const stageLabels: Record<string, string> = {
                new: 'Novos',
                contacted: 'Contactados',
                qualified: 'Qualificados',
                proposal: 'Proposta',
                negotiation: 'Negociação',
                won: 'Ganhos',
              };

              return (
                <div key={stage} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{stageLabels[stage]}</span>
                    <span className="text-xs text-muted-foreground">{count}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <span className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
