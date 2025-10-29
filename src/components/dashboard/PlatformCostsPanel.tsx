import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, DollarSign } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell } from "recharts";

const PLATFORM_COSTS = [
  { 
    name: 'Apollo', 
    cost: 80, 
    description: 'Enriquecimento de dados B2B, busca de decisores e geração de leads qualificados',
    color: 'hsl(var(--chart-1))'
  },
  { 
    name: 'Lovable', 
    cost: 25, 
    description: 'Plataforma de desenvolvimento low-code com IA para criação rápida de aplicações',
    color: 'hsl(var(--chart-2))'
  },
  { 
    name: 'Cursor', 
    cost: 20, 
    description: 'Editor de código com IA integrada para desenvolvimento assistido',
    color: 'hsl(var(--chart-3))'
  },
  { 
    name: 'Vercel', 
    cost: 25, 
    description: 'Plataforma de hospedagem e deploy com CDN global para aplicações React',
    color: 'hsl(var(--chart-4))'
  },
  { 
    name: 'Supabase', 
    cost: 20, 
    description: 'Backend-as-a-Service com banco de dados PostgreSQL, autenticação e storage',
    color: 'hsl(var(--chart-5))'
  },
  { 
    name: 'Adapta', 
    cost: 50, 
    description: 'Solução de automação e integração de processos empresariais',
    color: 'hsl(var(--chart-1))'
  },
  { 
    name: 'ChatGPT', 
    cost: 20, 
    description: 'API OpenAI para geração de conteúdo, análises e processamento de linguagem natural',
    color: 'hsl(var(--chart-2))'
  },
  { 
    name: 'OpenAI Keys', 
    cost: 25, 
    description: 'Chaves de API adicionais para integração com serviços OpenAI',
    color: 'hsl(var(--chart-3))'
  },
  { 
    name: 'Hostinger', 
    cost: 15, 
    description: 'Hospedagem de websites e domínios',
    color: 'hsl(var(--chart-4))'
  },
  { 
    name: 'GitHub', 
    cost: 25, 
    description: 'Controle de versão, CI/CD e colaboração em código',
    color: 'hsl(var(--chart-5))'
  },
];

const TOTAL_COST = PLATFORM_COSTS.reduce((sum, p) => sum + p.cost, 0);
const EXCHANGE_RATE_NOTE = "* Valores em US$ convertidos automaticamente para Reais pela taxa de fechamento do dia do cartão de crédito";

export function PlatformCostsPanel() {
  return (
    <Card className="bg-card/70 backdrop-blur-md border-border/50 elevation-2 border-glow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle>Custos de Plataformas</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-1 hover:bg-primary/10 rounded transition-colors">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Custos mensais das plataformas e ferramentas utilizadas no ecossistema tecnológico. Inclui desenvolvimento, infraestrutura, APIs e automações.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">US$ {TOTAL_COST}</p>
            <p className="text-xs text-muted-foreground">Total Mensal</p>
          </div>
        </div>
        <CardDescription className="text-xs italic text-muted-foreground mt-2">
          {EXCHANGE_RATE_NOTE}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Gráfico */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={PLATFORM_COSTS} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                type="number" 
                stroke="hsl(var(--foreground))" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={100}
                stroke="hsl(var(--foreground))" 
                fontSize={12}
                tickLine={false}
              />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 shadow-lg max-w-xs">
                        <p className="font-semibold text-sm mb-1">{data.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">{data.description}</p>
                        <p className="text-sm font-bold text-primary">US$ {data.cost}/mês</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                {PLATFORM_COSTS.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Lista detalhada */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            <TooltipProvider>
              {PLATFORM_COSTS.map((platform, i) => (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-help">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-2 h-8 rounded-full" 
                          style={{ backgroundColor: platform.color }}
                        />
                        <span className="font-medium text-sm">{platform.name}</span>
                      </div>
                      <span className="text-sm font-bold text-primary">US$ {platform.cost}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">{platform.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PlatformCostsPanel;
