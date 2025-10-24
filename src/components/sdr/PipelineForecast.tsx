import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, Calendar, DollarSign, Target, 
  Sparkles, AlertTriangle 
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface Deal {
  id: string;
  status: string;
  estimated_value?: number;
  win_probability?: number;
  created_at: string;
}

interface PipelineForecastProps {
  deals: Deal[];
}

export function PipelineForecast({ deals }: PipelineForecastProps) {
  // Calcular forecast para próximos 3 meses
  const currentDate = new Date();
  const forecastMonths = 3;
  
  const forecastData = Array.from({ length: forecastMonths }, (_, i) => {
    const month = new Date(currentDate);
    month.setMonth(month.getMonth() + i);
    const monthName = month.toLocaleDateString('pt-BR', { month: 'short' });

    // Simular crescimento baseado em dados atuais
    const baseValue = deals.reduce((sum, d) => sum + (d.estimated_value || 0), 0);
    const growthRate = 1.15; // 15% de crescimento por mês
    
    const conservative = baseValue * Math.pow(growthRate * 0.9, i);
    const expected = baseValue * Math.pow(growthRate, i);
    const optimistic = baseValue * Math.pow(growthRate * 1.1, i);

    return {
      month: monthName,
      conservative: Math.round(conservative),
      expected: Math.round(expected),
      optimistic: Math.round(optimistic),
    };
  });

  // Calcular métricas de forecast
  const expectedValue = forecastData[forecastData.length - 1].expected;
  const currentValue = deals.reduce((sum, d) => sum + (d.estimated_value || 0), 0);
  const growthPercentage = currentValue > 0 
    ? ((expectedValue - currentValue) / currentValue * 100).toFixed(0)
    : 0;

  // Identificar riscos
  const atRiskDeals = deals.filter(d => 
    (d.win_probability || 0) < 30 && d.status !== 'new'
  ).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Forecast Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/20 blur-2xl" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Forecast (3 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{formatCurrency(expectedValue)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600 font-medium">+{growthPercentage}%</span>
                <span className="text-muted-foreground">vs atual</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-purple-500/20 blur-2xl" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Cenário Otimista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {formatCurrency(forecastData[forecastData.length - 1].optimistic)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Com aceleração de vendas
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-yellow-500/20 blur-2xl" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Deals em Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{atRiskDeals}</span>
                <Badge variant="outline" className="text-xs">
                  baixa prob.
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Requerem atenção imediata
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Projeção de Receita
          </CardTitle>
          <CardDescription>
            Cenários conservador, esperado e otimista para os próximos {forecastMonths} meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorConservative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="optimistic"
                stroke="hsl(var(--chart-5))"
                fill="url(#colorOptimistic)"
                name="Otimista"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="expected"
                stroke="hsl(var(--chart-1))"
                fill="url(#colorExpected)"
                name="Esperado"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="conservative"
                stroke="hsl(var(--chart-3))"
                fill="url(#colorConservative)"
                name="Conservador"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* AI Insights */}
          <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">AI Forecast Insights</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Pipeline está {growthPercentage as number > 10 ? 'crescendo fortemente' : 'estável'} com projeção de +{growthPercentage}% em 3 meses</li>
                  <li>• {atRiskDeals} deals com baixa probabilidade precisam de ação imediata</li>
                  <li>• Velocidade atual sugere atingir {formatCurrency(expectedValue)} até {forecastData[forecastData.length - 1].month}</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
