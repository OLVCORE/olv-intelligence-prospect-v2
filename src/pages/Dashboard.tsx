import { useDashboardExecutive } from "@/hooks/useDashboardExecutive";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EnhancedBatchEnrichment } from "@/components/admin/EnhancedBatchEnrichment";
import { EnrichmentMonitor } from "@/components/admin/EnrichmentMonitor";
import { SystemHealthPanel } from "@/components/admin/SystemHealthPanel";
import { ExportButton } from "@/components/export/ExportButton";
import { useNavigate } from "react-router-dom";
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
  Info,
  Lock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Tooltip as TooltipUI, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useState } from "react";
import FinancialOverview from "@/components/dashboard/FinancialOverview";
import ApolloCreditPanel from "@/components/dashboard/ApolloCreditPanel";
import APIManagementGrid from "@/components/dashboard/APIManagementGrid";
import RealTimeAlerts from "@/components/dashboard/RealTimeAlerts";
import AIPredictionBanner from "@/components/dashboard/AIPredictionBanner";
import QuickActionsPanel from "@/components/dashboard/QuickActionsPanel";
import PlatformCostsPanel from "@/components/dashboard/PlatformCostsPanel";
import ScrollToTop from "@/components/common/ScrollToTop";
import APICostExecutiveDashboard from "@/components/dashboard/APICostExecutiveDashboard";
import PlatformCostsCompact from "@/components/dashboard/PlatformCostsCompact";
import APIManagementCompact from "@/components/dashboard/APIManagementCompact";
import ApolloCreditPanelCollapsible from "@/components/dashboard/ApolloCreditPanelCollapsible";
import CostEvolutionChart from "@/components/dashboard/CostEvolutionChart";
import { DashboardActionsMenu } from "@/components/dashboard/DashboardActionsMenu";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import jsPDF from 'jspdf';
import 'jspdf-autotable';


const CHART_COLORS = {
  primary: 'hsl(var(--chart-1))',
  secondary: 'hsl(var(--chart-2))',
  tertiary: 'hsl(var(--chart-3))',
  quaternary: 'hsl(var(--chart-4))',
  quinary: 'hsl(var(--chart-5))',
};

export default function Dashboard() {
  const { data, isLoading } = useDashboardExecutive();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const { isAdmin, isLoading: isLoadingRole } = useUserRole();

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('Dashboard Executive - Command Center', 14, 22);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
      
      // Core Metrics
      doc.setFontSize(14);
      doc.text('Métricas Principais', 14, 45);
      (doc as any).autoTable({
        startY: 50,
        head: [['Métrica', 'Valor']],
        body: [
          ['Empresas Ativas', data.totalCompanies.toString()],
          ['Decisores Mapeados', data.totalDecisors.toString()],
          ['Pipeline Revenue', `R$ ${(data.pipelineValue / 1000000).toFixed(1)}M`],
          ['Conversações', data.totalConversations.toString()],
          ['Taxa de Conversão', `${data.conversionRate.toFixed(1)}%`],
        ],
      });

      doc.save(`dashboard_executive_${new Date().toISOString().slice(0,10)}.pdf`);
      
      toast({
        title: "✅ PDF Exportado",
        description: "Dashboard exportado com sucesso",
      });
    } catch (error) {
      toast({
        title: "❌ Erro ao exportar",
        description: "Não foi possível gerar o PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    try {
      setIsExporting(true);
      const csvData = [
        ['Métrica', 'Valor'],
        ['Empresas Ativas', data.totalCompanies],
        ['Decisores Mapeados', data.totalDecisors],
        ['Pipeline Revenue', data.pipelineValue],
        ['Conversações', data.totalConversations],
        ['Taxa de Conversão', data.conversionRate],
        ['Valor Médio de Deal', data.avgDealSize],
        ['Empresas em Risco', data.companiesAtRisk],
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard_executive_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "✅ CSV Exportado",
        description: "Dashboard exportado com sucesso",
      });
    } catch (error) {
      toast({
        title: "❌ Erro ao exportar",
        description: "Não foi possível gerar o CSV",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportXLS = () => {
    handleExportCSV(); // Por enquanto, usar CSV como XLS
  };

  const handleExportJSON = () => {
    try {
      setIsExporting(true);
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard_executive_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "✅ JSON Exportado",
        description: "Dashboard exportado com sucesso",
      });
    } catch (error) {
      toast({
        title: "❌ Erro ao exportar",
        description: "Não foi possível gerar o JSON",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

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
            <div className="space-y-4 animate-float">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-primary/20 shadow-lg shadow-primary/10">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <span className="text-sm font-medium bg-gradient-to-r from-primary to-accent-cyan bg-clip-text text-transparent">
                  Live Intelligence
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent-cyan/20 to-primary/20 blur-xl animate-pulse" />
                  <div className="relative p-3 rounded-2xl glass-card border-2 border-primary/30 shadow-lg shadow-primary/20">
                    <Activity className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                </div>
                <div>
                  <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gradient flex items-center gap-3">
                    Command Center
                  </h1>
                  <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
                    Análise estratégica em tempo real com inteligência artificial avançada
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">Powered by</span>
                    <span className="text-sm font-semibold bg-gradient-to-r from-primary via-accent-cyan to-primary bg-clip-text text-transparent">
                      OLV Internacional
                    </span>
                    <span className="text-sm text-muted-foreground">+</span>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-semibold bg-gradient-to-r from-accent-cyan to-primary bg-clip-text text-transparent">
                        IA Intelligence
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <DashboardActionsMenu
                data={data}
                isExporting={isExporting}
                onExportPDF={handleExportPDF}
                onExportCSV={handleExportCSV}
                onExportXLS={handleExportXLS}
                onExportJSON={handleExportJSON}
              />
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
              onClick={() => navigate('/companies')}
              tooltip="Total de empresas cadastradas e ativas na plataforma. Clique para ver a lista completa de empresas."
            />
            <HeroMetric
              title="Decisores Mapeados"
              value={data.totalDecisors.toString()}
              change={null}
              icon={Users}
              trend="neutral"
              color="green"
              onClick={() => navigate('/companies')}
              tooltip="Número total de decisores identificados e mapeados nas empresas. Clique para explorar a base de decisores."
            />
            <HeroMetric
              title="Pipeline Revenue"
              value={data.pipelineValue > 0 ? `R$ ${(data.pipelineValue / 1000000).toFixed(1)}M` : "R$ 0"}
              change={null}
              icon={DollarSign}
              trend="neutral"
              color="cyan"
              highlight
              onClick={() => navigate('/sdr/pipeline')}
              tooltip="Valor total estimado do pipeline de vendas. Representa o potencial de receita de todas as oportunidades em andamento. Clique para ver o pipeline detalhado."
            />
            <HeroMetric
              title="Conversações"
              value={data.totalConversations.toString()}
              change={null}
              icon={MessageSquare}
              trend="neutral"
              color="purple"
              onClick={() => navigate('/sdr/inbox')}
              tooltip="Total de conversações ativas com empresas e decisores. Inclui e-mails, mensagens e interações diversas. Clique para acessar a caixa de entrada."
            />
          </div>
        </div>

        {/* AI Prediction Banner - NEW */}
        <AIPredictionBanner />

        {/* Quick Actions - NEW */}
        <QuickActionsPanel />

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="glass-card p-1.5 gap-1">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:glass-card">
              <Layers className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="apis" className="gap-2 data-[state=active]:glass-card">
              <DollarSign className="h-4 w-4" />
              APIs & Cost
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
            <EnrichmentMonitor />

            <div className="grid gap-6 lg:grid-cols-3 items-start">
              {/* Chart grande - 2 colunas */}
              <div className="lg:col-span-2">
              <PremiumCard
                title="Distribuição Geográfica & Maturidade"
                description="Performance por região com análise de maturidade digital"
                icon={Globe}
                tooltip="Visualização combinada mostrando a distribuição de empresas por região e sua maturidade digital média. Regiões com maior maturidade apresentam melhor preparo para adoção de soluções tecnológicas."
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
                <PremiumCard title="Performance Overview" icon={Activity} compact tooltip="Resumo executivo das principais métricas de performance incluindo valor total do pipeline, tamanho médio de deals e volume de conversações ativas.">
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

                <PremiumCard title="Health Status" icon={Shield} compact tooltip="Indicadores de saúde das empresas no pipeline baseados em análise financeira, operacional e comportamental. Scores mais altos indicam maior estabilidade e potencial de conversão.">
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
                tooltip="Ranking dos segmentos de mercado com maior presença no pipeline. Mostra número de empresas por indústria e média de funcionários, permitindo identificar verticais estratégicos."
              >
                <div className="space-y-3 mt-4">
                  {data.companiesByIndustry.slice(0, 5).map((industry, i) => {
                    // Categorizar segmento para exibição limpa
                    const displayName = industry.industry.length > 50 
                      ? industry.industry.substring(0, 50) + '...'
                      : industry.industry;
                    
                    return (
                      <div 
                        key={i} 
                        className="flex items-center justify-between group cursor-pointer hover:bg-primary/5 p-3 rounded-xl transition-all"
                        onClick={() => navigate(`/companies?industry=${encodeURIComponent(industry.industry)}`)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-2 h-8 rounded-full bg-gradient-to-b from-primary to-accent-cyan group-hover:scale-110 transition-transform" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" title={industry.industry}>{displayName}</p>
                            <p className="text-xs text-muted-foreground">
                              {industry.avgEmployees.toLocaleString()} funcionários
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{industry.count}</Badge>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PremiumCard>

              <PremiumCard
                title="Maturidade Digital"
                description="Distribuição"
                icon={Zap}
                tooltip="Distribuição das empresas por níveis de maturidade digital: Emergente, Intermediário, Avançado e Líder. Empresas com maior maturidade têm processos mais digitalizados e maior propensão à inovação."
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
                tooltip="Monitor de empresas que requerem atenção imediata. Alto Risco: empresas com indicadores críticos que necessitam intervenção urgente. Monitoramento: empresas com sinais de atenção para acompanhamento."
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

          {/* APIs & Cost Tab - PROTECTED */}
          <TabsContent value="apis" className="space-y-6">
            {isLoadingRole ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
                  <p className="text-muted-foreground">Verificando permissões...</p>
                </div>
              </div>
            ) : !isAdmin ? (
              <Card className="bg-card/70 backdrop-blur-md border-border/50">
                <CardContent className="p-12">
                  <div className="text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 border-2 border-destructive/20">
                      <Lock className="h-10 w-10 text-destructive" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold">Acesso Restrito</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Esta seção contém informações sensíveis sobre custos e APIs. 
                        Apenas administradores têm permissão para acessar este conteúdo.
                      </p>
                    </div>
                    <div className="pt-4">
                      <p className="text-sm text-muted-foreground">
                        Se você precisa de acesso, entre em contato com um administrador do sistema.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Executive KPIs Dashboard */}
                <APICostExecutiveDashboard />

                {/* Cost Evolution Chart */}
                <CostEvolutionChart />

                {/* Apollo Credits + Platform Costs */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <ApolloCreditPanelCollapsible />
                  <PlatformCostsCompact />
                </div>

                {/* Real-Time Alerts */}
                <RealTimeAlerts />

                {/* APIs Management - Compact & Collapsible */}
                <APIManagementCompact />
              </>
            )}
          </TabsContent>

          {/* Market Intel Tab */}
          <TabsContent value="mercado" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <PremiumCard
                title="Distribuição Geográfica"
                description="Empresas por região"
                icon={Globe}
                tooltip="Mapa de calor mostrando concentração de empresas por região geográfica com análise de maturidade digital média. Identifique territórios estratégicos para expansão."
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
                tooltip="Ranking horizontal dos principais segmentos de mercado por volume de empresas. Use para priorizar verticais de maior penetração."
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={data.companiesByIndustry.slice(0, 8).map(item => ({
                      ...item,
                      shortIndustry: item.industry.length > 30 
                        ? item.industry.substring(0, 30) + '...'
                        : item.industry
                    }))} 
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      type="number" 
                      stroke="hsl(var(--foreground))" 
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      dataKey="shortIndustry" 
                      type="category" 
                      width={140} 
                      stroke="hsl(var(--foreground))" 
                      fontSize={11}
                      tickLine={false}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-card border border-border rounded-lg p-3 shadow-lg max-w-xs">
                              <p className="font-semibold text-sm mb-1">{data.industry}</p>
                              <p className="text-xs text-muted-foreground">Empresas: {data.count}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
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
                tooltip="Análise de fit score por linha de produto TOTVS. Mostra número de empresas compatíveis com cada produto baseado em perfil, segmento e necessidades detectadas."
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
                tooltip="Ranking das empresas com maior fit score. Scores acima de 80% indicam alta compatibilidade e probabilidade de conversão. Clique para ver detalhes da empresa."
              >
                <div className="space-y-3 mt-4">
                  {data.topFitCompanies.slice(0, 6).map((company, i) => (
                    <div 
                      key={i} 
                      className="group cursor-pointer"
                      onClick={() => navigate(`/companies/${company.id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center justify-between p-3 rounded-xl glass-card glass-card-hover hover:bg-primary/5 transition-all">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{company.name}</p>
                          <p className="text-xs text-muted-foreground">{company.recommendedProducts[0]}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <Progress value={company.fitScore} className="w-20" />
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 border-0">
                            {company.fitScore}%
                          </Badge>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
                tooltip="As 10 tecnologias mais utilizadas pelas empresas no pipeline. Identifique padrões de tech stack para personalizar abordagens de venda e integrações."
              >
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.topTechnologies.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="technology" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100} 
                      stroke="hsl(var(--foreground))" 
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--foreground))" 
                      fontSize={12}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill={CHART_COLORS.quaternary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </PremiumCard>

              <PremiumCard
                title="Maturidade Digital"
                description="Distribuição"
                icon={Activity}
                tooltip="Gráfico de pizza mostrando distribuição percentual de empresas por nível de maturidade digital. Quanto maior a maturidade, maior a receptividade para soluções avançadas."
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
                <PremiumCard 
                  key={i} 
                  title={health.category} 
                  icon={Shield} 
                  compact
                  tooltip={`Score de saúde ${health.category.toLowerCase()}: avalia ${
                    health.category.toLowerCase().includes('financeira') ? 'estabilidade financeira, faturamento e solidez econômica' :
                    health.category.toLowerCase().includes('operacional') ? 'eficiência operacional, processos e performance' :
                    health.category.toLowerCase().includes('digital') ? 'maturidade digital, presença online e adoção tecnológica' :
                    'indicadores gerais de performance e qualidade da empresa'
                  }. Scores acima de 70 indicam saúde boa.`}
                >
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
              tooltip="Dashboard de alertas críticos. Alto Risco: empresas com scores críticos necessitando intervenção imediata. Monitoramento: empresas com indicadores de atenção."
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
              tooltip="IA identifica oportunidades emergentes baseadas em padrões de comportamento, tendências de mercado e sinais digitais. Cada oportunidade inclui potencial de receita e empresas alvo."
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
              tooltip="Tendências de mercado detectadas por IA através de análise de dados públicos, notícias, tech stack e comportamento digital das empresas. Antecipe movimentos do mercado."
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

      {/* Botão flutuante para voltar ao topo */}
      <ScrollToTop />
    </div>
  );
}

// Hero Metric Component - Premium (Clicável)
function HeroMetric({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
  highlight = false,
  onClick,
  tooltip,
}: {
  title: string;
  value: string;
  change: number | null;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: 'blue' | 'green' | 'cyan' | 'purple';
  highlight?: boolean;
  onClick?: () => void;
  tooltip?: string;
}) {
  const colorClasses = {
    blue: { bg: 'from-blue-500/20 to-blue-500/5', icon: 'text-blue-600', border: 'border-blue-500/20' },
    green: { bg: 'from-green-500/20 to-green-500/5', icon: 'text-green-600', border: 'border-green-500/20' },
    cyan: { bg: 'from-cyan-500/20 to-cyan-500/5', icon: 'text-cyan-600', border: 'border-cyan-500/20' },
    purple: { bg: 'from-purple-500/20 to-purple-500/5', icon: 'text-purple-600', border: 'border-purple-500/20' },
  };

  const colors = colorClasses[color];

  const content = (
    <div 
      className={`relative overflow-hidden rounded-2xl glass-card glass-card-hover p-6 transition-all duration-300 ${
        highlight ? 'ring-2 ring-primary' : ''
      } ${onClick ? 'cursor-pointer hover:scale-105 active:scale-100 group' : ''}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-50 group-hover:opacity-70 transition-opacity`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border} group-hover:scale-110 transition-transform`}>
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
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-bold tracking-tight">{value}</p>
          {onClick && (
            <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <TooltipUI>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>{tooltip}</p>
          </TooltipContent>
        </TooltipUI>
      </TooltipProvider>
    );
  }

  return content;
}

// Premium Card Component
function PremiumCard({
  title,
  description,
  icon: Icon,
  children,
  compact = false,
  tooltip,
}: {
  title: string;
  description?: string;
  icon: any;
  children: React.ReactNode;
  compact?: boolean;
  tooltip?: string;
}) {
  return (
    <div className="rounded-2xl glass-card glass-card-hover p-6">
      <div className={`flex items-center gap-3 ${compact ? 'mb-4' : 'mb-6'}`}>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            {title}
            {tooltip && (
              <TooltipProvider>
                <TooltipUI>
                  <TooltipTrigger asChild>
                    <button className="p-0.5 hover:bg-primary/10 rounded transition-colors">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{tooltip}</p>
                  </TooltipContent>
                </TooltipUI>
              </TooltipProvider>
            )}
          </h3>
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
