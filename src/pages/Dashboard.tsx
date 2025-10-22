import { useDashboardExecutive } from "@/hooks/useDashboardExecutive";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BulkUploadDialog } from "@/components/companies/BulkUploadDialog";
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  TrendingUp,
  Users,
  Building2,
  Target,
  Briefcase,
  Award,
  AlertTriangle,
  Zap,
  Globe,
  Shield,
  DollarSign,
  MessageSquare,
  BarChart3,
  Sparkles,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const CHART_COLORS = {
  primary: 'hsl(var(--chart-1))',
  secondary: 'hsl(var(--chart-2))',
  tertiary: 'hsl(var(--chart-3))',
  quaternary: 'hsl(var(--chart-4))',
  quinary: 'hsl(var(--chart-5))',
};

export default function Dashboard() {
  const { data, isLoading } = useDashboardExecutive();

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 bg-background">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight">Dashboard Executivo</h1>
            <p className="text-muted-foreground text-lg">
              Visão estratégica completa • Análise em tempo real
            </p>
          </div>
          <BulkUploadDialog />
        </div>

        {/* KPIs principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total de Empresas"
            value={data.totalCompanies.toString()}
            change={15.5}
            trend="up"
            icon={Building2}
            color="blue"
          />
          <MetricCard
            title="Decisores Identificados"
            value={data.totalDecisors.toString()}
            change={12.3}
            trend="up"
            icon={Users}
            color="green"
          />
          <MetricCard
            title="Pipeline Total"
            value={`R$ ${(data.pipelineValue / 1000000).toFixed(1)}M`}
            change={data.conversionRate}
            trend="up"
            icon={DollarSign}
            color="cyan"
          />
          <MetricCard
            title="Taxa de Conversão"
            value={`${data.conversionRate.toFixed(1)}%`}
            change={8.2}
            trend="up"
            icon={Target}
            color="purple"
          />
        </div>

        {/* Tabs principais */}
        <Tabs defaultValue="mercado" className="space-y-4">
          <TabsList className="bg-muted p-1">
            <TabsTrigger value="mercado">
              <Globe className="mr-2 h-4 w-4" />
              Mercado
            </TabsTrigger>
            <TabsTrigger value="fit">
              <Award className="mr-2 h-4 w-4" />
              Fit TOTVS
            </TabsTrigger>
            <TabsTrigger value="tech">
              <Zap className="mr-2 h-4 w-4" />
              Tecnologia
            </TabsTrigger>
            <TabsTrigger value="saude">
              <Shield className="mr-2 h-4 w-4" />
              Saúde
            </TabsTrigger>
            <TabsTrigger value="pipeline">
              <Briefcase className="mr-2 h-4 w-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="preditiva">
              <Sparkles className="mr-2 h-4 w-4" />
              IA Preditiva
            </TabsTrigger>
          </TabsList>

          {/* Tab: Mercado */}
          <TabsContent value="mercado" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Distribuição Geográfica
                  </CardTitle>
                  <CardDescription>Empresas por região</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={data.companiesByRegion}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="region" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="count" fill={CHART_COLORS.primary} name="Empresas" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="avgMaturity" stroke={CHART_COLORS.tertiary} name="Maturidade Média" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Top Segmentos
                  </CardTitle>
                  <CardDescription>Principais indústrias</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.companiesByIndustry.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="industry" type="category" width={120} className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="count" fill={CHART_COLORS.secondary} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Fit TOTVS */}
          <TabsContent value="fit" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Fit por Produto
                  </CardTitle>
                  <CardDescription>Compatibilidade TOTVS</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.fitByProduct}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="product" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="companies" fill={CHART_COLORS.secondary} name="Empresas" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Top Empresas - Fit Score
                  </CardTitle>
                  <CardDescription>Maiores oportunidades</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.topFitCompanies.slice(0, 5).map((company, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{company.name}</p>
                          <p className="text-xs text-muted-foreground">{company.recommendedProducts[0] || 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <Progress value={company.fitScore} className="w-20" />
                          <Badge variant="secondary">{company.fitScore}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Tecnologia */}
          <TabsContent value="tech" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Stack Tecnológico
                  </CardTitle>
                  <CardDescription>Tecnologias mais usadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.topTechnologies.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="technology" angle={-45} textAnchor="end" height={100} className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="count" fill={CHART_COLORS.quaternary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Maturidade Digital
                  </CardTitle>
                  <CardDescription>Distribuição por nível</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.maturityDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ level, percentage }) => `${level} (${percentage.toFixed(0)}%)`}
                        outerRadius={100}
                        dataKey="count"
                      >
                        {data.maturityDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Saúde */}
          <TabsContent value="saude" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              {data.healthDistribution.map((health, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {health.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{health.score.toFixed(1)}</div>
                    <Progress value={health.score} className="mt-2 h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Empresas Críticas
                </CardTitle>
                <CardDescription>Requerem atenção imediata</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg border-l-4 border-l-destructive bg-destructive/10">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <h4 className="font-semibold">Alto Risco</h4>
                    </div>
                    <p className="text-3xl font-bold">{data.companiesAtRisk}</p>
                    <p className="text-sm text-muted-foreground mt-1">Empresas com scores críticos</p>
                  </div>
                  <div className="p-4 rounded-lg border-l-4 border-l-orange-500 bg-orange-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-orange-600" />
                      <h4 className="font-semibold">Monitoramento</h4>
                    </div>
                    <p className="text-3xl font-bold">{Math.round(data.totalCompanies * 0.15)}</p>
                    <p className="text-sm text-muted-foreground mt-1">Empresas para acompanhar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Pipeline */}
          <TabsContent value="pipeline" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pipeline Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">R$ {(data.pipelineValue / 1000000).toFixed(1)}M</div>
                  <p className="text-sm text-muted-foreground mt-1">Valor em negociação</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Taxa de Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.conversionRate.toFixed(1)}%</div>
                  <Progress value={data.conversionRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Ticket Médio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">R$ {(data.avgDealSize / 1000).toFixed(0)}K</div>
                  <p className="text-sm text-muted-foreground mt-1">Por oportunidade</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Conversas Ativas
                </CardTitle>
                <CardDescription>Engajamento com prospects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-5xl font-bold text-primary">{data.totalConversations}</div>
                  <p className="text-muted-foreground mt-2">Conversas em andamento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: IA Preditiva */}
          <TabsContent value="preditiva" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Oportunidades Emergentes
                </CardTitle>
                <CardDescription>Identificadas por IA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.emergingOpportunities.slice(0, 5).map((opp, i) => (
                    <div key={i} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{opp.type}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{opp.description}</p>
                        </div>
                        <Badge>{opp.companies} empresas</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{opp.potential}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Tendências de Mercado
                </CardTitle>
                <CardDescription>Análise preditiva</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {data.marketTrends.map((trend, i) => (
                    <div key={i} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">{trend.trend}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{trend.impact}</p>
                      <p className="text-2xl font-bold text-primary">{trend.companies}</p>
                      <p className="text-xs text-muted-foreground">empresas impactadas</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Componente de Métrica
function MetricCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: any;
  color: 'blue' | 'green' | 'cyan' | 'purple';
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20',
    green: 'text-green-600 bg-green-50 dark:bg-green-950/20',
    cyan: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/20',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          {trend === 'up' ? (
            <ArrowUp className="h-3 w-3 text-green-600" />
          ) : (
            <ArrowDown className="h-3 w-3 text-red-600" />
          )}
          <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
          <span>vs. período anterior</span>
        </div>
      </CardContent>
    </Card>
  );
}
