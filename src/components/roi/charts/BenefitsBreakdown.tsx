import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface BenefitsBreakdownProps {
  data: {
    timeSavingsValue: number;
    errorReductionValue: number;
    revenueGrowthValue: number;
    totalAnnualBenefit: number;
  };
}

export function BenefitsBreakdown({ data }: BenefitsBreakdownProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const chartData = [
    {
      name: 'Economia de Tempo',
      value: data.timeSavingsValue,
      percentage: ((data.timeSavingsValue / data.totalAnnualBenefit) * 100).toFixed(1),
    },
    {
      name: 'Redução de Erros',
      value: data.errorReductionValue,
      percentage: ((data.errorReductionValue / data.totalAnnualBenefit) * 100).toFixed(1),
    },
    {
      name: 'Crescimento de Receita',
      value: data.revenueGrowthValue,
      percentage: ((data.revenueGrowthValue / data.totalAnnualBenefit) * 100).toFixed(1),
    },
  ];

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
  ];

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" tickFormatter={formatCurrency} />
          <YAxis dataKey="name" type="category" width={150} />
          <Tooltip 
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="value" name="Benefício Anual">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid gap-2">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: COLORS[index] }}
              />
              <span className="text-sm font-medium">{item.name}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold">{formatCurrency(item.value)}</div>
              <div className="text-xs text-muted-foreground">{item.percentage}% do total</div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold">Benefício Total Anual:</span>
          <span className="text-xl font-bold text-primary">
            {formatCurrency(data.totalAnnualBenefit)}
          </span>
        </div>
      </div>
    </div>
  );
}
