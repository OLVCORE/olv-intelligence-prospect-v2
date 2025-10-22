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
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const NEON_COLORS = ['hsl(var(--neon-cyan))', 'hsl(var(--neon-blue))', 'hsl(var(--neon-green))', 'hsl(var(--neon-yellow))', 'hsl(var(--neon-purple))'];

export default function Dashboard() {
  const { data, isLoading } = useDashboardExecutive();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-glass-bg p-8">
        <div className="space-y-8">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-glass-bg">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header with Futuristic Design */}
        <div className="relative overflow-hidden rounded-2xl border border-glass-border bg-gradient-to-r from-glass-bg/50 to-glass-bg/30 backdrop-blur-xl p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/10 via-neon-blue/10 to-neon-purple/10" />
          <div className="relative flex items-center justify-between">
            <div>
              <Badge className="mb-4 bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50">
                INTELIGÊNCIA ARTIFICIAL 360°
              </Badge>
              <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple bg-clip-text text-transparent">
                Dashboard Executivo
              </h1>
              <p className="text-muted-foreground mt-3 text-lg">
                Análises preditivas e insights estratégicos em tempo real
              </p>
            </div>
            <div className="flex flex-col items-end gap-4">
              <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-glass-bg/50 border border-glass-border backdrop-blur-sm">
                <Sparkles className="h-6 w-6 text-neon-yellow animate-pulse" />
                <span className="text-sm font-medium">OLV Intelligence</span>
              </div>
              <BulkUploadDialog />
            </div>
          </div>
        </div>

        {/* KPIs Row with Glassmorphism */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Empresas no Pipeline"
            value={data.totalCompanies}
            change={15.5}
            icon={Building2}
            loading={isLoading}
            glowColor="cyan"
          />
          <KPICard
            title="Decisores Mapeados"
            value={data.totalDecisors}
            change={12.5}
            icon={Users}
            loading={isLoading}
            glowColor="blue"
          />
          <KPICard
            title="Pipeline Value"
            value={`R$ ${(data.pipelineValue / 1000000).toFixed(1)}M`}
            change={data.conversionRate}
            icon={DollarSign}
            loading={isLoading}
            glowColor="green"
          />
          <KPICard
            title="Taxa de Conversão"
            value={`${data.conversionRate.toFixed(1)}%`}
            change={data.conversionRate - 15}
            icon={Target}
            loading={isLoading}
            glowColor="purple"
          />
        </div>

        {/* Main Content Tabs with Futuristic Style */}
        <Tabs defaultValue="mercado" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto bg-glass-bg/30 backdrop-blur-xl border border-glass-border p-1">
            <TabsTrigger 
              value="mercado" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-cyan/20 data-[state=active]:to-neon-blue/20 data-[state=active]:text-neon-cyan data-[state=active]:border data-[state=active]:border-neon-cyan/50"
            >
              <Globe className="h-4 w-4" />
              Mercado
            </TabsTrigger>
            <TabsTrigger 
              value="fit" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-green/20 data-[state=active]:to-neon-cyan/20 data-[state=active]:text-neon-green data-[state=active]:border data-[state=active]:border-neon-green/50"
            >
              <Target className="h-4 w-4" />
              Fit TOTVS
            </TabsTrigger>
            <TabsTrigger 
              value="tech" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-blue/20 data-[state=active]:to-neon-purple/20 data-[state=active]:text-neon-blue data-[state=active]:border data-[state=active]:border-neon-blue/50"
            >
              <Zap className="h-4 w-4" />
              Tech
            </TabsTrigger>
            <TabsTrigger 
              value="saude" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-green/20 data-[state=active]:to-neon-yellow/20 data-[state=active]:text-neon-green data-[state=active]:border data-[state=active]:border-neon-green/50"
            >
              <Shield className="h-4 w-4" />
              Saúde
            </TabsTrigger>
            <TabsTrigger 
              value="pipeline" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-purple/20 data-[state=active]:to-neon-cyan/20 data-[state=active]:text-neon-purple data-[state=active]:border data-[state=active]:border-neon-purple/50"
            >
              <Briefcase className="h-4 w-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger 
              value="preditiva" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-yellow/20 data-[state=active]:to-neon-purple/20 data-[state=active]:text-neon-yellow data-[state=active]:border data-[state=active]:border-neon-yellow/50"
            >
              <Sparkles className="h-4 w-4" />
              IA Preditiva
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="mercado" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <GlassCard title="Distribuição Geográfica" icon={Globe} description="Empresas por região e estado">
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={data.companiesByRegion}>
                    <defs>
                      <linearGradient id="colorRegion" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="region" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--glass-bg))', 
                        border: '1px solid hsl(var(--glass-border))',
                        borderRadius: '0.5rem',
                        backdropFilter: 'blur(10px)'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="count" fill="url(#colorRegion)" name="Empresas" radius={[8, 8, 0, 0]} />
                    <Line type="monotone" dataKey="avgMaturity" stroke="hsl(var(--neon-yellow))" name="Maturidade Média" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </GlassCard>

              <GlassCard title="Segmentação por Indústria" icon={BarChart3} description="Top segmentos por volume">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.companiesByIndustry.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="industry" type="category" width={150} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--glass-bg))', 
                        border: '1px solid hsl(var(--glass-border))',
                        borderRadius: '0.5rem'
                      }} 
                    />
                    <Bar dataKey="count" fill="hsl(var(--neon-blue))" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            </div>
          </TabsContent>

          <TabsContent value="fit" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <GlassCard title="Fit por Produto TOTVS" icon={Award} description="Análise de compatibilidade">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.fitByProduct}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="product" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--glass-bg))', 
                        border: '1px solid hsl(var(--glass-border))',
                        borderRadius: '0.5rem'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="companies" fill="hsl(var(--neon-green))" name="Empresas" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>

              <GlassCard title="Top 10 Empresas - Fit Score" icon={Target} description="Maiores oportunidades">
                <div className="space-y-3">
                  {data.topFitCompanies.slice(0, 5).map((company, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-glass-bg/30 border border-glass-border hover:border-neon-green/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{company.name}</p>
                        <p className="text-xs text-muted-foreground">{company.recommendedProducts[0] || 'N/A'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={company.fitScore} className="w-24" />
                        <Badge variant="outline" className="bg-neon-green/10 text-neon-green border-neon-green/30">
                          {company.fitScore}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          <TabsContent value="tech" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <GlassCard title="Tecnologias Dominantes" icon={Zap} description="Stack tecnológico do mercado">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.topTechnologies.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="technology" angle={-45} textAnchor="end" height={100} stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--glass-bg))', 
                        border: '1px solid hsl(var(--glass-border))',
                        borderRadius: '0.5rem'
                      }} 
                    />
                    <Bar dataKey="count" fill="hsl(var(--neon-purple))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>

              <GlassCard title="Maturidade Digital" icon={BarChart3} description="Distribuição por nível">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.maturityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ level, percentage }) => `${level} (${percentage.toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.maturityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={NEON_COLORS[index % NEON_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </GlassCard>
            </div>
          </TabsContent>

          <TabsContent value="saude" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              {data.healthDistribution.map((health, i) => (
                <GlassCard key={i} title={health.category} icon={Shield} compact>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
                      {health.score.toFixed(1)}
                    </div>
                    <Progress value={health.score} className="h-2" />
                  </div>
                </GlassCard>
              ))}
            </div>

            <GlassCard title="Empresas em Risco" icon={AlertTriangle} description="Monitoramento prioritário">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg border-l-4 border-l-destructive bg-destructive/10">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <h4 className="font-semibold">Alto Risco</h4>
                  </div>
                  <p className="text-2xl font-bold">{data.companiesAtRisk}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Empresas com scores críticos
                  </p>
                </div>
                <div className="p-4 rounded-lg border-l-4 border-l-neon-yellow bg-neon-yellow/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-neon-yellow" />
                    <h4 className="font-semibold">Atenção</h4>
                  </div>
                  <p className="text-2xl font-bold">
                    {Math.round(data.totalCompanies * 0.15)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Empresas para monitorar
                  </p>
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <GlassCard title="Pipeline Total" icon={DollarSign} compact>
                <div className="text-3xl font-bold bg-gradient-to-r from-neon-cyan to-neon-blue bg-clip-text text-transparent">
                  R$ {(data.pipelineValue / 1000000).toFixed(1)}M
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Valor total em negociação
                </p>
              </GlassCard>

              <GlassCard title="Taxa de Conversão" icon={Target} compact>
                <div className="text-3xl font-bold text-neon-green">
                  {data.conversionRate.toFixed(1)}%
                </div>
                <Progress value={data.conversionRate} className="mt-2" />
              </GlassCard>

              <GlassCard title="Ticket Médio" icon={DollarSign} compact>
                <div className="text-3xl font-bold text-neon-purple">
                  R$ {(data.avgDealSize / 1000).toFixed(0)}K
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Por oportunidade
                </p>
              </GlassCard>
            </div>

            <GlassCard title="Conversas Ativas" icon={MessageSquare} description="Engajamento em tempo real">
              <div className="text-center py-8">
                <div className="text-5xl font-bold bg-gradient-to-r from-neon-cyan to-neon-blue bg-clip-text text-transparent">
                  {data.totalConversations}
                </div>
                <p className="text-muted-foreground mt-2">Conversas em andamento</p>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="preditiva" className="space-y-4">
            <GlassCard title="Oportunidades Emergentes" icon={Sparkles} description="IA identifica potencial de crescimento">
              <div className="space-y-3">
                {data.emergingOpportunities.slice(0, 5).map((opp, i) => (
                  <div key={i} className="p-4 rounded-lg bg-gradient-to-r from-glass-bg/50 to-glass-bg/30 border border-glass-border hover:border-neon-cyan/50 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{opp.type}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{opp.description}</p>
                      </div>
                      <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50">
                        {opp.companies} empresas
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{opp.potential}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard title="Tendências de Mercado" icon={TrendingUp} description="Análise preditiva baseada em IA">
              <div className="grid gap-4 md:grid-cols-2">
                {data.marketTrends.map((trend, i) => (
                  <div key={i} className="p-4 rounded-lg bg-glass-bg/30 border border-glass-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-neon-yellow" />
                      <h4 className="font-semibold">{trend.trend}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {trend.impact}
                    </p>
                    <p className="text-lg font-bold text-neon-cyan">
                      {trend.companies} empresas impactadas
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Componente de Card com Glassmorphism
function GlassCard({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  compact = false 
}: { 
  title: string; 
  description?: string; 
  icon: any; 
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden bg-glass-bg/30 backdrop-blur-xl border-glass-border hover:border-glass-border/60 transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl" />
      <CardHeader className={compact ? "pb-3" : ""}>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-neon-cyan" />
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

// KPI Card Component
function KPICard({
  title,
  value,
  change,
  icon: Icon,
  loading,
  glowColor = "cyan",
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: any;
  loading: boolean;
  glowColor?: "cyan" | "blue" | "green" | "purple";
}) {
  const glowColors = {
    cyan: "shadow-neon-cyan/20",
    blue: "shadow-neon-blue/20",
    green: "shadow-neon-green/20",
    purple: "shadow-neon-purple/20",
  };

  const borderColors = {
    cyan: "border-neon-cyan/30",
    blue: "border-neon-blue/30",
    green: "border-neon-green/30",
    purple: "border-neon-purple/30",
  };

  const iconColors = {
    cyan: "text-neon-cyan",
    blue: "text-neon-blue",
    green: "text-neon-green",
    purple: "text-neon-purple",
  };

  if (loading) {
    return (
      <Card className="bg-glass-bg/30 backdrop-blur-xl border-glass-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`relative overflow-hidden bg-glass-bg/30 backdrop-blur-xl border ${borderColors[glowColor]} ${glowColors[glowColor]} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${iconColors[glowColor]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
          {value}
        </div>
        {change !== undefined && (
          <p className={`text-xs mt-2 flex items-center gap-1 ${change > 0 ? 'text-neon-green' : 'text-destructive'}`}>
            <TrendingUp className={`h-3 w-3 ${change < 0 ? 'rotate-180' : ''}`} />
            {change > 0 ? "+" : ""}
            {change.toFixed(1)}% vs. período anterior
          </p>
        )}
      </CardContent>
    </Card>
  );
}
