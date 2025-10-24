import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';

interface CashFlowChartProps {
  data: Array<{
    year: number;
    costs: number;
    benefits: number;
    netCashFlow: number;
    cumulativeCashFlow: number;
  }>;
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="year" 
          label={{ value: 'Ano', position: 'insideBottom', offset: -5 }}
          className="text-sm"
        />
        <YAxis 
          tickFormatter={formatCurrency}
          label={{ value: 'Valor', angle: -90, position: 'insideLeft' }}
          className="text-sm"
        />
        <Tooltip 
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
        <Area
          type="monotone"
          dataKey="cumulativeCashFlow"
          stroke="hsl(var(--primary))"
          fill="url(#colorCumulative)"
          name="Cash Flow Acumulado"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="benefits"
          stroke="hsl(var(--success))"
          strokeWidth={2}
          name="Benefícios"
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="costs"
          stroke="hsl(var(--destructive))"
          strokeWidth={2}
          name="Custos"
          dot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
