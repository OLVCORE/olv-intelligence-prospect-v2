import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

// Dados simulados dos últimos 6 meses
const COST_EVOLUTION_DATA = [
  { 
    month: 'Out/24', 
    plataformas: 220, 
    apis: 80,
    total: 300,
  },
  { 
    month: 'Nov/24', 
    plataformas: 245, 
    apis: 95,
    total: 340,
  },
  { 
    month: 'Dez/24', 
    plataformas: 270, 
    apis: 110,
    total: 380,
  },
  { 
    month: 'Jan/25', 
    plataformas: 285, 
    apis: 125,
    total: 410,
  },
  { 
    month: 'Fev/25', 
    plataformas: 295, 
    apis: 135,
    total: 430,
  },
  { 
    month: 'Mar/25', 
    plataformas: 305, 
    apis: 150,
    total: 455,
  },
];

export function CostEvolutionChart() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent-cyan/10 border border-primary/20">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Evolução de Custos Mensais</CardTitle>
            <p className="text-sm text-muted-foreground">Histórico de 6 meses - Plataformas + APIs</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={COST_EVOLUTION_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--foreground))" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(var(--foreground))" 
              fontSize={12}
              tickLine={false}
              label={{ 
                value: 'US$ / mês', 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: 12, fill: 'hsl(var(--foreground))' }
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold text-sm mb-2">{payload[0].payload.month}</p>
                      <div className="space-y-1">
                        <p className="text-xs flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-blue-500" />
                          <span>Plataformas:</span>
                          <span className="font-bold">US$ {payload[0].payload.plataformas}</span>
                        </p>
                        <p className="text-xs flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-green-500" />
                          <span>APIs:</span>
                          <span className="font-bold">US$ {payload[0].payload.apis}</span>
                        </p>
                        <p className="text-xs flex items-center gap-2 pt-1 border-t border-border mt-1">
                          <span className="w-3 h-3 rounded-full bg-primary" />
                          <span>Total:</span>
                          <span className="font-bold text-primary">US$ {payload[0].payload.total}</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
              iconType="circle"
            />
            <Bar 
              dataKey="plataformas" 
              fill="hsl(var(--chart-1))" 
              radius={[4, 4, 0, 0]}
              name="Plataformas"
            />
            <Bar 
              dataKey="apis" 
              fill="hsl(var(--chart-2))" 
              radius={[4, 4, 0, 0]}
              name="APIs"
            />
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              name="Total Mensal"
            />
          </ComposedChart>
        </ResponsiveContainer>
        
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Crescimento</p>
              <p className="text-lg font-bold text-green-500">+51.7%</p>
              <p className="text-xs text-muted-foreground">últimos 6 meses</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Média Mensal</p>
              <p className="text-lg font-bold text-primary">US$ 386</p>
              <p className="text-xs text-muted-foreground">período completo</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Projeção Abr/25</p>
              <p className="text-lg font-bold text-amber-500">US$ 480</p>
              <p className="text-xs text-muted-foreground">tendência atual</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CostEvolutionChart;
