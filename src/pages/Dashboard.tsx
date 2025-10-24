import { useDashboardExecutive } from "@/hooks/useDashboardExecutive";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BatchEnrichmentButton } from "@/components/admin/BatchEnrichmentButton";
import { EnrichmentMonitor } from "@/components/admin/EnrichmentMonitor";
import { SystemHealthPanel } from "@/components/admin/SystemHealthPanel";
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  Area,
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
  ArrowUpRight,
  TrendingDown,
  Activity,
  Layers,
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
      <div className="min-h-screen p-8 gradient-mesh">
        <div className="container mx-auto space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-96" />
            <Skeleton className="h-6 w-64" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh">
      <div className="container mx-auto p-8 space-y-8">
        {/* Hero Header */}
        <div className="relative">
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-3 animate-float">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-primary/20">
                <Activity className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-sm font-medium">Live Intelligence</span>
              </div>
              <h1 className="text-6xl font-bold tracking-tight text-gradient">
                Command Center
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Análise estratégica em tempo real com inteligência artificial avançada
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <BatchEnrichmentButton />
            </div>
          </div>

          {/* Hero Metrics - Destaque */}
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            <HeroMetric
              title="Empresas Ativas"
              value={data.totalCompanies.toString()}
              change={null}
              icon={Building2}
              trend="neutral"
              color="blue"
            />
            <HeroMetric
              title="Decisores Mapeados"
              value={data.totalDecisors.toString()}
              change={null}
              icon={Users}
              trend="neutral"
              color="green"
            />
            <HeroMetric
              title="Pipeline Revenue"
              value={data.pipelineValue > 0 ? `R$ ${(data.pipelineValue / 1000000).toFixed(1)}M` : "R$ 0"}
              change={null}
              icon={DollarSign}
              trend="neutral"
              color="cyan"
              highlight
            />
            <HeroMetric
              title="Conversações"
              value={data.totalConversations.toString()}
              change={null}
              icon={MessageSquare}
              trend="neutral"
              color="purple"
            />
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="glass-card p-1.5 gap-1">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:glass-card">
              <Layers className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="mercado" className="gap-2 data-[state=active]:glass-card">
              <Globe className="h-4 w-4" />
              Market Intel
            </TabsTrigger>
            <TabsTrigger value="fit" className="gap-2 data-[state=active]:glass-card">
              <Award className="h-4 w-4" />
              Fit Analysis
            </TabsTrigger>
            <TabsTrigger value="tech" className="gap-2 data-[state=active]:glass-card">
              <Zap className="h-4 w-4" />
              Tech Stack
            </TabsTrigger>
            <TabsTrigger value="saude" className="gap-2 data-[state=active]:glass-card">
              <Shield className="h-4 w-4" />
              Health
            </TabsTrigger>
            <TabsTrigger value="preditiva" className="gap-2 data-[state=active]:glass-card">
              <Sparkles className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Monitoring Row */}
            <div className="grid gap-6 md:grid-cols-2">
              <EnrichmentMonitor />
              <SystemHealthPanel />
            </div>
            
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Chart grande - 2 colunas */}
              <div className="lg:col-span-2">
                <PremiumCard
                  title="Distribuição Geográfica & Maturidade"
                  description="Performance por região com análise de maturidade digital"
                  icon={Globe}
                >
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={data.companiesByRegion}>
                      <defs>
                        <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis 
                        dataKey="region" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          padding: '12px',
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="count" 
                        fill="url(#colorBar)" 
                        name="Empresas" 
                        radius={[8, 8, 0, 0]} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgMaturity" 
                        stroke={CHART_COLORS.tertiary} 
                        name="Maturidade" 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </PremiumCard>
              </div>

              {/* Sidebar com métricas */}
              <div className="space-y-6">
                <PremiumCard title="Performance Overview" icon={Activity} compact>
                  <div className="space-y-4">
                    <MetricRow
                      label="Total Pipeline"
                      value={`$${(data.pipelineValue / 1000000).toFixed(1)}M`}
                      progress={75}
                      color="blue"
                    />
                    <MetricRow
                      label="Avg Deal Size"
                      value={`$${(data.avgDealSize / 1000).toFixed(0)}K`}
                      progress={data.conversionRate}
                      color="green"
                    />
                    <MetricRow
                      label="Conversations"
                      value={data.totalConversations.toString()}
                      progress={65}
                      color="purple"
                    />
                  </div>
                </PremiumCard>

                <PremiumCard title="Health Status" icon={Shield} compact>
                  <div className="space-y-3">
                    {data.healthDistribution.slice(0, 3).map((health, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{health.category}</span>
                          <span className="text-muted-foreground">{health.score.toFixed(0)}</span>
                        </div>
                        <Progress value={health.score} className="h-2" />
                      </div>
                    ))}
                  </div>
                </PremiumCard>
              </div>
            </div>

            {/* Segunda linha - 3 cards */}
            <div className="grid gap-6 md:grid-cols-3">
              <PremiumCard
                title="Top Segmentos"
                description="Principais indústrias"
                icon={BarChart3}
              >
                <div className="space-y-3 mt-4">
                  {data.companiesByIndustry.slice(0, 5).map((industry, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-2 h-8 rounded-full bg-gradient-to-b from-primary to-accent-cyan" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{industry.industry}</p>
                          <p className="text-xs text-muted-foreground">
                            {industry.avgEmployees.toLocaleString()} funcionários
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{industry.count}</Badge>
                    </div>
                  ))}
                </div>
              </PremiumCard>

              <PremiumCard
                title="Maturidade Digital"
                description="Distribuição"
                icon={Zap}
              >
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.maturityDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {data.maturityDistribution.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={Object.values(CHART_COLORS)[index % 5]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 text-xs mt-4">
                  {data.maturityDistribution.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: Object.values(CHART_COLORS)[i % 5] }}
                      />
                      <span>{item.level}</span>
                    </div>
                  ))}
                </div>
              </PremiumCard>

              <PremiumCard
                title="Alertas Críticos"
                description="Empresas em risco"
                icon={AlertTriangle}
              >
                <div className="space-y-4 mt-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-red-500/20">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{data.companiesAtRisk}</p>
                        <p className="text-xs text-muted-foreground">Alto Risco</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-orange-500/20">
                        <Shield className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{Math.round(data.totalCompanies * 0.15)}</p>
                        <p className="text-xs text-muted-foreground">Monitorar</p>
                      </div>
                    </div>
                  </div>
                </div>
              </PremiumCard>
            </div>
          </TabsContent>

          {/* Market Intel Tab */}
          <TabsContent value="mercado" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <PremiumCard
                title="Distribuição Geográfica"
                description="Empresas por região"
                icon={Globe}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={data.companiesByRegion}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="region" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill={CHART_COLORS.primary} name="Empresas" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="avgMaturity" stroke={CHART_COLORS.tertiary} name="Maturidade" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </PremiumCard>

              <PremiumCard
                title="Top Segmentos"
                description="Principais indústrias"
                icon={BarChart3}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.companiesByIndustry.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" />
                    <YAxis dataKey="industry" type="category" width={120} className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="count" fill={CHART_COLORS.secondary} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </PremiumCard>
            </div>
          </TabsContent>

          {/* Fit Analysis Tab */}
          <TabsContent value="fit" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <PremiumCard
                title="Fit por Produto TOTVS"
                description="Compatibilidade"
                icon={Award}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.fitByProduct}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="product" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="companies" fill={CHART_COLORS.secondary} name="Empresas" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </PremiumCard>

              <PremiumCard
                title="Top Empresas - Fit Score"
                description="Maiores oportunidades"
                icon={Target}
              >
                <div className="space-y-3 mt-4">
                  {data.topFitCompanies.slice(0, 6).map((company, i) => (
                    <div key={i} className="group">
                      <div className="flex items-center justify-between p-3 rounded-xl glass-card glass-card-hover">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{company.name}</p>
                          <p className="text-xs text-muted-foreground">{company.recommendedProducts[0]}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <Progress value={company.fitScore} className="w-20" />
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 border-0">
                            {company.fitScore}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </PremiumCard>
            </div>
          </TabsContent>

          {/* Tech Stack Tab */}
          <TabsContent value="tech" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <PremiumCard
                title="Stack Tecnológico"
                description="Top 10 tecnologias"
                icon={Zap}
              >
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.topTechnologies.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="technology" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={CHART_COLORS.quaternary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </PremiumCard>

              <PremiumCard
                title="Maturidade Digital"
                description="Distribuição"
                icon={Activity}
              >
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={data.maturityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ level, percentage }) => `${level} ${percentage.toFixed(0)}%`}
                      outerRadius={110}
                      dataKey="count"
                    >
                      {data.maturityDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </PremiumCard>
            </div>
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="saude" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              {data.healthDistribution.map((health, i) => (
                <PremiumCard key={i} title={health.category} icon={Shield} compact>
                  <div className="space-y-3 mt-2">
                    <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent-cyan bg-clip-text text-transparent">
                      {health.score.toFixed(1)}
                    </div>
                    <Progress value={health.score} className="h-2" />
                  </div>
                </PremiumCard>
              ))}
            </div>

            <PremiumCard
              title="Status Crítico"
              description="Empresas que requerem atenção"
              icon={AlertTriangle}
            >
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border border-red-500/20">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 rounded-xl bg-red-500/20">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{data.companiesAtRisk}</p>
                      <p className="text-sm text-muted-foreground">Alto Risco</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Empresas com scores críticos que necessitam intervenção imediata
                  </p>
                </div>
                
                <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border border-orange-500/20">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 rounded-xl bg-orange-500/20">
                      <Shield className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{Math.round(data.totalCompanies * 0.15)}</p>
                      <p className="text-sm text-muted-foreground">Monitoramento</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Empresas com indicadores de atenção para acompanhamento regular
                  </p>
                </div>
              </div>
            </PremiumCard>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="preditiva" className="space-y-6">
            <PremiumCard
              title="Oportunidades Emergentes"
              description="Identificadas por Inteligência Artificial"
              icon={Sparkles}
            >
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                {data.emergingOpportunities.slice(0, 6).map((opp, i) => (
                  <div 
                    key={i} 
                    className="p-6 rounded-2xl glass-card glass-card-hover group cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant="secondary">{opp.companies} empresas</Badge>
                    </div>
                    <h4 className="font-semibold mb-2">{opp.type}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{opp.description}</p>
                    <div className="flex items-center gap-2 text-xs text-primary font-medium group-hover:gap-3 transition-all">
                      <span>{opp.potential}</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
            </PremiumCard>

            <PremiumCard
              title="Tendências de Mercado"
              description="Análise preditiva baseada em IA"
              icon={TrendingUp}
            >
              <div className="grid gap-4 md:grid-cols-3 mt-4">
                {data.marketTrends.map((trend, i) => (
                  <div 
                    key={i} 
                    className="p-6 rounded-2xl glass-card glass-card-hover"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent-cyan/20">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <h4 className="font-semibold text-sm">{trend.trend}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{trend.impact}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-primary">{trend.companies}</p>
                      <p className="text-xs text-muted-foreground">empresas</p>
                    </div>
                  </div>
                ))}
              </div>
            </PremiumCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Hero Metric Component - Premium
function HeroMetric({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
  highlight = false,
}: {
  title: string;
  value: string;
  change: number | null;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: 'blue' | 'green' | 'cyan' | 'purple';
  highlight?: boolean;
}) {
  const colorClasses = {
    blue: { bg: 'from-blue-500/20 to-blue-500/5', icon: 'text-blue-600', border: 'border-blue-500/20' },
    green: { bg: 'from-green-500/20 to-green-500/5', icon: 'text-green-600', border: 'border-green-500/20' },
    cyan: { bg: 'from-cyan-500/20 to-cyan-500/5', icon: 'text-cyan-600', border: 'border-cyan-500/20' },
    purple: { bg: 'from-purple-500/20 to-purple-500/5', icon: 'text-purple-600', border: 'border-purple-500/20' },
  };

  const colors = colorClasses[color];

  return (
    <div className={`relative overflow-hidden rounded-2xl glass-card glass-card-hover p-6 ${highlight ? 'ring-2 ring-primary' : ''}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-50`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border}`}>
            <Icon className={`h-5 w-5 ${colors.icon}`} />
          </div>
          {change !== null && trend !== 'neutral' && (
            <Badge 
              variant={trend === 'up' ? 'default' : 'destructive'} 
              className="gap-1 font-semibold"
            >
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground font-medium mb-2">{title}</p>
        <p className="text-4xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );
}

// Premium Card Component
function PremiumCard({
  title,
  description,
  icon: Icon,
  children,
  compact = false,
}: {
  title: string;
  description?: string;
  icon: any;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl glass-card glass-card-hover p-6">
      <div className={`flex items-center gap-3 ${compact ? 'mb-4' : 'mb-6'}`}>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

// Metric Row Component
function MetricRow({
  label,
  value,
  progress,
  color,
}: {
  label: string;
  value: string;
  progress: number;
  color: 'blue' | 'green' | 'purple';
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-lg font-bold">{value}</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
