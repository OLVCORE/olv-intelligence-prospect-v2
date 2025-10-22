import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, Users, TrendingUp, Target, Zap, 
  MapPin, Globe, Loader2, Brain, 
  Shield, DollarSign, Star, Code, Activity, AlertTriangle,
  Rocket, BarChart3, PieChart as PieChartIcon, Award
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  ComposedChart,
  Line
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDashboardExecutive } from "@/hooks/useDashboardExecutive";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

// Componente de KPI Card Executivo
function ExecutiveKPICard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  trendValue,
  color = "primary"
}: { 
  title: string;
  value: string | number;
  description: string;
  icon: any;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: string;
}) {
  return (
    <Card className="relative overflow-hidden border-l-4" style={{ borderLeftColor: `hsl(var(--${color}))` }}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {value}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend && trendValue && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className={`h-3 w-3 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: executive, isLoading } = useDashboardExecutive();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-5 w-[600px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!executive) return null;

  return (
    <div className="p-8 space-y-8">
      {/* Header Executivo */}
      <div className="space-y-3">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          Intelligence 360° Command Center
        </h1>
        <p className="text-lg text-muted-foreground">
          Visão estratégica em tempo real • Análise preditiva • Inteligência de mercado
        </p>
      </div>

      {/* KPIs Executivos Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ExecutiveKPICard
          title="Portfólio Total"
          value={executive.totalCompanies}
          description={`${executive.companiesByIndustry.length} segmentos mapeados`}
          icon={Building2}
          color="primary"
        />
        <ExecutiveKPICard
          title="Pipeline Ativo"
          value={`R$ ${(executive.pipelineValue / 1000000).toFixed(1)}M`}
          description={`${executive.totalConversations} oportunidades • ${executive.conversionRate}% conversão`}
          icon={Target}
          trend="up"
          trendValue="+18% vs. trimestre"
          color="chart-2"
        />
        <ExecutiveKPICard
          title="Decisores Mapeados"
          value={executive.totalDecisors}
          description={`Cobertura em ${executive.totalCompanies} empresas`}
          icon={Users}
          color="chart-3"
        />
        <ExecutiveKPICard
          title="Digital Health Score"
          value={executive.avgDigitalHealth.toFixed(1)}
          description={`${executive.companiesAtRisk} empresas em risco`}
          icon={Activity}
          color="chart-4"
        />
      </div>

      {/* Tabs Estratégicas */}
      <Tabs defaultValue="market" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 h-auto p-1">
          <TabsTrigger value="market" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Globe className="mr-2 h-4 w-4" />
            Inteligência de Mercado
          </TabsTrigger>
          <TabsTrigger value="fit" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Award className="mr-2 h-4 w-4" />
            Fit TOTVS
          </TabsTrigger>
          <TabsTrigger value="tech" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Code className="mr-2 h-4 w-4" />
            Tech & Maturidade
          </TabsTrigger>
          <TabsTrigger value="health" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Shield className="mr-2 h-4 w-4" />
            Saúde Empresarial
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChart3 className="mr-2 h-4 w-4" />
            Pipeline & Vendas
          </TabsTrigger>
          <TabsTrigger value="predictive" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Brain className="mr-2 h-4 w-4" />
            Análise Preditiva
          </TabsTrigger>
        </TabsList>

        {/* Tab: Inteligência de Mercado */}
        <TabsContent value="market" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Distribuição Geográfica
                </CardTitle>
                <CardDescription>
                  Empresas por região • Potencial de mercado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={executive.companiesByRegion}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="region" angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" name="Empresas" fill={COLORS[0]} />
                    <Line yAxisId="right" type="monotone" dataKey="avgMaturity" name="Maturidade Média" stroke={COLORS[2]} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {executive.companiesByRegion.slice(0, 3).map((region, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-accent rounded">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium">{region.region}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">{region.count} empresas</Badge>
                        <span className="text-sm text-muted-foreground">
                          Maturidade: {region.avgMaturity.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Segmentação por Indústria
                </CardTitle>
                <CardDescription>
                  Top setores • Porte médio • Maturidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={executive.companiesByIndustry.slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis type="number" />
                    <YAxis dataKey="industry" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="count" name="Empresas" fill={COLORS[1]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {executive.companiesByIndustry.slice(0, 3).map((industry, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border-l-2" style={{ borderColor: COLORS[idx] }}>
                      <span className="font-medium text-sm">{industry.industry}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {Math.round(industry.avgEmployees)} funcionários médio
                        </span>
                        <Badge>{industry.count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Insights */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Insights de Mercado
              </CardTitle>
              <CardDescription>
                Análise estratégica baseada em dados consolidados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-primary/5 rounded-lg">
                  <h4 className="font-semibold mb-2">Concentração Regional</h4>
                  <p className="text-sm text-muted-foreground">
                    {executive.companiesByRegion[0]?.region} lidera com {executive.companiesByRegion[0]?.count} empresas,
                    representando {Math.round((executive.companiesByRegion[0]?.count / executive.totalCompanies) * 100)}% do portfólio
                  </p>
                </div>
                <div className="p-4 bg-chart-2/10 rounded-lg">
                  <h4 className="font-semibold mb-2">Setor Dominante</h4>
                  <p className="text-sm text-muted-foreground">
                    {executive.companiesByIndustry[0]?.industry} concentra {executive.companiesByIndustry[0]?.count} empresas
                    com maturidade média de {executive.companiesByIndustry[0]?.avgMaturity.toFixed(1)}
                  </p>
                </div>
                <div className="p-4 bg-chart-3/10 rounded-lg">
                  <h4 className="font-semibold mb-2">Oportunidade de Expansão</h4>
                  <p className="text-sm text-muted-foreground">
                    Regiões sub-representadas indicam potencial de {executive.companiesByRegion.length * 15}% de crescimento
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Fit TOTVS */}
        <TabsContent value="fit" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Fit por Produto TOTVS
                </CardTitle>
                <CardDescription>
                  Análise de adequação • Recomendações inteligentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={executive.fitByProduct}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="product" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="companies" name="Empresas com Fit" fill={COLORS[0]} />
                    <Line yAxisId="right" type="monotone" dataKey="avgScore" name="Score Médio" stroke={COLORS[3]} strokeWidth={2} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Distribuição de Fit
                </CardTitle>
                <CardDescription>
                  Proporção de empresas por produto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={executive.fitByProduct}
                      dataKey="companies"
                      nameKey="product"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.product}: ${entry.companies}`}
                    >
                      {executive.fitByProduct.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Fit Companies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Empresas com Maior Fit
              </CardTitle>
              <CardDescription>
                Top 10 prospects qualificados • Produtos recomendados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {executive.topFitCompanies.slice(0, 10).map((company, idx) => (
                  <div key={company.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium">{company.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Score de Fit: {company.fitScore.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {company.recommendedProducts.map((product, pidx) => (
                        <Badge key={pidx} variant="secondary" className="text-xs">
                          {product}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fit Analysis Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Potencial Protheus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {executive.fitByProduct.find(p => p.product === 'Protheus')?.companies || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Empresas de médio porte em manufatura
                </p>
                <Progress 
                  value={(executive.fitByProduct.find(p => p.product === 'Protheus')?.companies || 0) / executive.totalCompanies * 100} 
                  className="mt-3"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Potencial Fluig</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-chart-2">
                  {executive.fitByProduct.find(p => p.product === 'Fluig')?.companies || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Empresas com alta maturidade digital
                </p>
                <Progress 
                  value={(executive.fitByProduct.find(p => p.product === 'Fluig')?.companies || 0) / executive.totalCompanies * 100} 
                  className="mt-3"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Potencial RM</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-chart-3">
                  {executive.fitByProduct.find(p => p.product === 'RM')?.companies || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Setores de educação e saúde
                </p>
                <Progress 
                  value={(executive.fitByProduct.find(p => p.product === 'RM')?.companies || 0) / executive.totalCompanies * 100} 
                  className="mt-3"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Tech & Maturidade */}
        <TabsContent value="tech" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  Stack Tecnológico Dominante
                </CardTitle>
                <CardDescription>
                  Top 15 tecnologias identificadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {executive.topTechnologies.map((tech, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <Badge variant="outline" className="text-xs">{tech.category}</Badge>
                        <span className="text-sm font-medium">{tech.tech}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32">
                          <Progress value={(tech.count / executive.totalCompanies) * 100} />
                        </div>
                        <span className="text-sm font-bold w-8">{tech.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Maturidade Digital
                </CardTitle>
                <CardDescription>
                  Distribuição por nível de maturidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={executive.maturityDistribution}
                      dataKey="count"
                      nameKey="level"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      label={(entry) => `${entry.percentage}%`}
                    >
                      {executive.maturityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {executive.maturityDistribution.map((level, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                        <span>{level.level}</span>
                      </div>
                      <span className="font-medium">{level.count} empresas ({level.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tech Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Insights Tecnológicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-primary/5 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Stack Moderno
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {executive.topTechnologies.filter(t => ['React', 'Node.js', 'AWS'].includes(t.tech)).reduce((sum, t) => sum + t.count, 0)} empresas
                    utilizam stack moderno (React, Node, Cloud)
                  </p>
                </div>
                <div className="p-4 bg-chart-2/10 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Alta Maturidade
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {executive.maturityDistribution.find(m => m.level.includes('Avançado'))?.count || 0} empresas
                    com maturidade avançada prontas para inovação
                  </p>
                </div>
                <div className="p-4 bg-chart-3/10 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Rocket className="h-4 w-4" />
                    Oportunidade
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {executive.maturityDistribution.filter(m => m.level.includes('Básico') || m.level.includes('Intermediário')).reduce((sum, m) => sum + m.count, 0)} empresas
                    têm potencial de evolução
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Saúde Empresarial */}
        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Saúde por Categoria
                </CardTitle>
                <CardDescription>
                  Score consolidado de 4 dimensões
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={executive.healthDistribution}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Score" dataKey="score" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.6} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Status de Saúde
                </CardTitle>
                <CardDescription>
                  Empresas analisadas por categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {executive.healthDistribution.map((health, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{health.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{health.score}</span>
                          <Badge variant="secondary">{health.count} empresas</Badge>
                        </div>
                      </div>
                      <Progress value={health.score} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Health Alerts */}
          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Alertas de Risco
              </CardTitle>
              <CardDescription>
                Empresas que requerem atenção imediata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border-l-4 border-l-red-500">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <h4 className="font-semibold text-red-600">Risco Financeiro</h4>
                  </div>
                  <p className="text-2xl font-bold text-red-700">{executive.companiesAtRisk}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Empresas com score &lt; 50 ou classificação D
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border-l-4 border-l-yellow-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-yellow-600" />
                    <h4 className="font-semibold text-yellow-600">Monitoramento</h4>
                  </div>
                  <p className="text-2xl font-bold text-yellow-700">
                    {Math.round(executive.totalCompanies * 0.15)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Empresas com indicadores de atenção
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Presença Digital
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {executive.healthDistribution.find(h => h.category === 'Presença Digital')?.score.toFixed(1) || 'N/A'}
                </div>
                <Progress 
                  value={executive.healthDistribution.find(h => h.category === 'Presença Digital')?.score || 0} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Saúde Jurídica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {executive.healthDistribution.find(h => h.category === 'Saúde Jurídica')?.score.toFixed(1) || 'N/A'}
                </div>
                <Progress 
                  value={executive.healthDistribution.find(h => h.category === 'Saúde Jurídica')?.score || 0} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Saúde Financeira
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {executive.healthDistribution.find(h => h.category === 'Saúde Financeira')?.score.toFixed(1) || 'N/A'}
                </div>
                <Progress 
                  value={executive.healthDistribution.find(h => h.category === 'Saúde Financeira')?.score || 0} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Reputação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {executive.healthDistribution.find(h => h.category === 'Reputação')?.score.toFixed(1) || 'N/A'}
                </div>
                <Progress 
                  value={executive.healthDistribution.find(h => h.category === 'Reputação')?.score || 0} 
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Pipeline & Vendas */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Valor do Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  R$ {(executive.pipelineValue / 1000000).toFixed(2)}M
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {executive.totalConversations} oportunidades ativas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Taxa de Conversão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-chart-2">
                  {executive.conversionRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Meta: 25% até fim do trimestre
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Ticket Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-chart-3">
                  R$ {(executive.avgDealSize / 1000).toFixed(0)}K
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Por oportunidade fechada
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Performance por Canal
              </CardTitle>
              <CardDescription>
                Volume e efetividade de cada canal de comunicação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executive.topPerformingChannels.map((channel, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-2 h-8 rounded" style={{ backgroundColor: COLORS[idx] }} />
                      <div>
                        <p className="font-medium capitalize">{channel.channel}</p>
                        <p className="text-xs text-muted-foreground">{channel.count} interações</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-48">
                        <Progress value={(channel.count / executive.topPerformingChannels[0].count) * 100} />
                      </div>
                      <Badge>{channel.conversionRate}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Análise Preditiva */}
        <TabsContent value="predictive" className="space-y-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Oportunidades Emergentes
              </CardTitle>
              <CardDescription>
                IA identifica padrões e tendências de mercado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executive.emergingOpportunities.map((opp, idx) => (
                  <div key={idx} className="p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border-l-4 border-l-primary">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Rocket className="h-4 w-4 text-primary" />
                        {opp.type}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={opp.potential === 'Alto' ? 'default' : 'secondary'}>
                          {opp.potential} potencial
                        </Badge>
                        <Badge variant="outline">{opp.companies} empresas</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{opp.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Tendências de Mercado
              </CardTitle>
              <CardDescription>
                Movimentos detectados no portfólio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {executive.marketTrends.map((trend, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                        style={{ backgroundColor: COLORS[idx] }}
                      >
                        {trend.companies}
                      </div>
                      <div>
                        <p className="font-medium">{trend.trend}</p>
                        <p className="text-xs text-muted-foreground">
                          Impacto: {trend.impact}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{trend.companies} empresas</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Predictive Summary */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gradient-to-br from-primary/10 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Recomendação Prioritária
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium mb-2">Foco em Transformação Digital</p>
                <p className="text-sm text-muted-foreground">
                  {executive.emergingOpportunities[0]?.companies} empresas no estágio ideal para investir em modernização.
                  Potencial de R$ {((executive.emergingOpportunities[0]?.companies || 0) * 75000 / 1000).toFixed(0)}K em receita.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-chart-2/10 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Próximos Passos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                    <span>Priorizar contato com {executive.topFitCompanies.slice(0, 5).length} empresas de alto fit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                    <span>Expandir presença em {executive.companiesByRegion[1]?.region}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                    <span>Desenvolver playbook para setor {executive.companiesByIndustry[0]?.industry}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
