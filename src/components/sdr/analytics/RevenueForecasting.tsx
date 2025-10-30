import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function RevenueForecasting() {
  const { data: deals, isLoading } = useDeals({ status: 'open' });

  // Calcular forecast para próximos 6 meses
  const forecastData = Array.from({ length: 6 }, (_, i) => {
    const month = addMonths(new Date(), i);
    const monthKey = format(month, 'MMM/yy', { locale: ptBR });

    // Deals que podem fechar neste mês
    const monthDeals = deals?.filter(d => {
      if (!d.expected_close_date) return false;
      const closeDate = new Date(d.expected_close_date);
      return closeDate.getMonth() === month.getMonth() && 
             closeDate.getFullYear() === month.getFullYear();
    }) || [];

    const optimisticRevenue = monthDeals.reduce((sum, d) => sum + d.value, 0);
    const realisticRevenue = monthDeals.reduce((sum, d) => sum + (d.value * (d.probability / 100)), 0);
    const pessimisticRevenue = monthDeals.reduce((sum, d) => sum + (d.value * (d.probability / 150)), 0);

    return {
      month: monthKey,
      optimistic: Math.round(optimisticRevenue / 1000),
      realistic: Math.round(realisticRevenue / 1000),
      pessimistic: Math.round(pessimisticRevenue / 1000),
      dealCount: monthDeals.length
    };
  });

  const totalForecast = {
    optimistic: forecastData.reduce((sum, d) => sum + d.optimistic, 0),
    realistic: forecastData.reduce((sum, d) => sum + d.realistic, 0),
    pessimistic: forecastData.reduce((sum, d) => sum + d.pessimistic, 0),
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <TrendingUp className="h-8 w-8 animate-pulse text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Previsão de Receita (6 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => `R$ ${value}k`}
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="optimistic" 
                stackId="1" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.3}
                name="Otimista" 
              />
              <Area 
                type="monotone" 
                dataKey="realistic" 
                stackId="2" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.5}
                name="Realista" 
              />
              <Area 
                type="monotone" 
                dataKey="pessimistic" 
                stackId="3" 
                stroke="#ef4444" 
                fill="#ef4444" 
                fillOpacity={0.3}
                name="Pessimista" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-green-700">Cenário Otimista</p>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-900">
              R$ {totalForecast.optimistic}k
            </p>
            <p className="text-xs text-green-600 mt-1">
              100% dos deals fecham
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-blue-700">Cenário Realista</p>
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">
              R$ {totalForecast.realistic}k
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Baseado em probabilidades
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-orange-700">Cenário Pessimista</p>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-900">
              R$ {totalForecast.pessimistic}k
            </p>
            <p className="text-xs text-orange-600 mt-1">
              33% de conversão
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {forecastData.map((month) => (
              <div key={month.month} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{month.month}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {month.dealCount} deals
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-green-600 font-medium">
                    R$ {month.optimistic}k
                  </span>
                  <span className="text-blue-600 font-medium">
                    R$ {month.realistic}k
                  </span>
                  <span className="text-orange-600 font-medium">
                    R$ {month.pessimistic}k
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
