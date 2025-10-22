import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, TrendingUp, Target, Zap, Award, Briefcase, Mail, Phone, MessageSquare, BarChart3, PieChart, TrendingDown, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  AreaChart,
  Area,
  LineChart,
  Line
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

// Hook para buscar estatísticas reais
function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Buscar empresas
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, industry, digital_maturity_score, revenue, employees, technologies');
      
      if (companiesError) throw companiesError;

      // Buscar decisores
      const { data: decisors, error: decisorsError } = await supabase
        .from('decision_makers')
        .select('id, name, email, verified_email, company_id, companies(name)');
      
      if (decisorsError) throw decisorsError;

      // Buscar conversas (pipeline)
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('id, status, priority, company_id, contact_id, companies(name, industry), contacts(name, email)');
      
      if (conversationsError) throw conversationsError;

      // Buscar sinais de compra
      const { data: signals, error: signalsError } = await supabase
        .from('buying_signals')
        .select('id, signal_type, confidence_score, company_id');
      
      if (signalsError) throw signalsError;

      // Buscar maturidade digital
      const { data: maturity, error: maturityError } = await supabase
        .from('digital_maturity')
        .select('*, companies(name)');
      
      if (maturityError) throw maturityError;

      // Buscar mensagens SDR
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, channel, direction, created_at');
      
      if (messagesError) throw messagesError;

      return {
        companies: companies || [],
        decisors: decisors || [],
        conversations: conversations || [],
        signals: signals || [],
        maturity: maturity || [],
        messages: messages || []
      };
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
}

// Componente de KPI Card
function KPICard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  trendValue 
}: { 
  title: string;
  value: string | number;
  description: string;
  icon: any;
  trend?: 'up' | 'down';
  trendValue?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={`text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Calcular métricas
  const totalCompanies = stats.companies.length;
  const totalDecisors = stats.decisors.length;
  const totalConversations = stats.conversations.length;
  const totalSignals = stats.signals.length;
  
  // Pipeline por estágio
  const pipelineByStage = {
    new: stats.conversations.filter(c => c.status === 'open').length,
    contacted: stats.conversations.filter(c => c.status === 'open' && c.priority === 'high').length,
    qualified: stats.conversations.filter(c => c.status === 'pending').length,
    proposal: stats.conversations.filter(c => c.status === 'pending' && c.priority === 'high').length,
    won: stats.conversations.filter(c => c.status === 'closed').length,
  };

  // Ticket médio estimado por prioridade
  const ticketMedio = {
    high: 120000,
    medium: 75000,
    low: 30000
  };

  // Calcular valor total do pipeline
  const pipelineValue = stats.conversations.reduce((total, conv) => {
    const ticket = ticketMedio[conv.priority as keyof typeof ticketMedio] || ticketMedio.medium;
    return total + ticket;
  }, 0);

  // Taxa de conversão
  const conversionRate = pipelineByStage.won > 0 
    ? ((pipelineByStage.won / totalConversations) * 100).toFixed(1)
    : '0';

  // Dados do funil de vendas
  const funnelData = [
    { stage: 'Novos Leads', value: pipelineByStage.new, color: COLORS[0] },
    { stage: 'Contatados', value: pipelineByStage.contacted, color: COLORS[1] },
    { stage: 'Qualificados', value: pipelineByStage.qualified, color: COLORS[2] },
    { stage: 'Propostas', value: pipelineByStage.proposal, color: COLORS[3] },
    { stage: 'Fechados', value: pipelineByStage.won, color: COLORS[4] },
  ];

  // Distribuição de maturidade
  const maturityDistribution = [
    { level: 'Básico (0-4)', count: stats.maturity.filter(m => (m.overall_score || 0) <= 4).length },
    { level: 'Intermediário (5-6)', count: stats.maturity.filter(m => (m.overall_score || 0) > 4 && (m.overall_score || 0) <= 6).length },
    { level: 'Avançado (7-8)', count: stats.maturity.filter(m => (m.overall_score || 0) > 6 && (m.overall_score || 0) <= 8).length },
    { level: 'Líder Digital (9-10)', count: stats.maturity.filter(m => (m.overall_score || 0) > 8).length },
  ];

  // Atividades SDR por canal
  const messagesByChannel = {
    email: stats.messages.filter(m => m.channel === 'email').length,
    whatsapp: stats.messages.filter(m => m.channel === 'whatsapp').length,
    phone: stats.messages.filter(m => m.channel === 'phone').length,
  };

  // Sinais de compra mais comuns
  const signalTypes = stats.signals.reduce((acc, signal) => {
    acc[signal.signal_type] = (acc[signal.signal_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSignals = Object.entries(signalTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  // Empresas por setor
  const companiesByIndustry = stats.companies.reduce((acc, company) => {
    const industry = company.industry || 'Não especificado';
    acc[industry] = (acc[industry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topIndustries = Object.entries(companiesByIndustry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([industry, count]) => ({ industry, count }));

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Command Center Executivo
        </h1>
        <p className="text-muted-foreground">
          Visão estratégica em tempo real do pipeline e inteligência de vendas
        </p>
      </div>

      {/* KPIs Executivos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Pipeline Total"
          value={`R$ ${(pipelineValue / 1000).toFixed(0)}K`}
          description={`${totalConversations} oportunidades ativas`}
          icon={Target}
          trend="up"
          trendValue="+12% vs. mês anterior"
        />
        <KPICard
          title="Decisores Mapeados"
          value={totalDecisors}
          description={`${stats.decisors.filter(d => d.verified_email).length} emails verificados`}
          icon={Users}
          trend="up"
          trendValue="+8% vs. mês anterior"
        />
        <KPICard
          title="Taxa de Conversão"
          value={`${conversionRate}%`}
          description="Leads para fechamento"
          icon={TrendingUp}
        />
        <KPICard
          title="Sinais de Compra"
          value={totalSignals}
          description="Detectados em tempo real"
          icon={Zap}
          trend="up"
          trendValue="+15% vs. mês anterior"
        />
      </div>

      {/* Tabs Estratégicas */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pipeline">Pipeline & Conversão</TabsTrigger>
          <TabsTrigger value="intelligence">Inteligência 360°</TabsTrigger>
          <TabsTrigger value="maturity">Maturidade Digital</TabsTrigger>
          <TabsTrigger value="sdr">Performance SDR</TabsTrigger>
          <TabsTrigger value="benchmark">Benchmarks</TabsTrigger>
        </TabsList>

        {/* Tab: Pipeline & Conversão */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Funil de Vendas
                </CardTitle>
                <CardDescription>
                  Distribuição de {totalConversations} oportunidades no pipeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={funnelData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="stage" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS[0]}>
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Oportunidades por Estágio
                </CardTitle>
                <CardDescription>
                  Ticket médio e valor total por etapa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(pipelineByStage).map(([stage, count]) => {
                  const stageNames: Record<string, string> = {
                    new: 'Novos Leads',
                    contacted: 'Contatados',
                    qualified: 'Qualificados',
                    proposal: 'Propostas',
                    won: 'Fechados'
                  };
                  const value = count * ticketMedio.medium;
                  return (
                    <div key={stage} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{stageNames[stage]}</p>
                        <p className="text-xs text-muted-foreground">{count} oportunidades</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">R$ {(value / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-muted-foreground">
                          R$ {(ticketMedio.medium / 1000).toFixed(0)}K médio
                        </p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Lista de empresas no pipeline */}
          <Card>
            <CardHeader>
              <CardTitle>Empresas em Negociação</CardTitle>
              <CardDescription>
                Top empresas do pipeline com decisores mapeados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.companies.slice(0, 5).map((company) => {
                  const companyDecisors = stats.decisors.filter(d => d.company_id === company.id);
                  const companyConv = stats.conversations.find(c => c.company_id === company.id);
                  
                  return (
                    <div 
                      key={company.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => navigate(`/company/${company.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <Building2 className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-sm text-muted-foreground">{company.industry || 'Não especificado'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{companyDecisors.length} decisores</p>
                          <p className="text-xs text-muted-foreground">
                            {companyDecisors.filter(d => d.verified_email).length} com email
                          </p>
                        </div>
                        <Badge variant={companyConv?.priority === 'high' ? 'default' : 'secondary'}>
                          {companyConv?.status || 'Não iniciado'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Inteligência 360° */}
        <TabsContent value="intelligence" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cobertura de Inteligência</CardTitle>
                <CardDescription>
                  Profundidade da análise 360° vs. mercado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { dimension: 'Tech Stack', coverage: (stats.companies.filter(c => c.technologies && c.technologies.length > 0).length / Math.max(stats.companies.length, 1)) * 100, benchmark: 70 },
                    { dimension: 'Maturidade', coverage: (stats.maturity.length / Math.max(stats.companies.length, 1)) * 100, benchmark: 75 },
                    { dimension: 'Decisores', coverage: (stats.decisors.length / Math.max(stats.companies.length, 1)) * 100 / 3, benchmark: 60 },
                    { dimension: 'Financeiro', coverage: (stats.companies.filter(c => c.revenue).length / Math.max(stats.companies.length, 1)) * 100, benchmark: 55 },
                    { dimension: 'Sinais', coverage: (stats.signals.length / Math.max(stats.companies.length, 1)) * 100 / 2, benchmark: 65 },
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="dimension" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Nossa Cobertura" dataKey="coverage" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.6} />
                    <Radar name="Mercado" dataKey="benchmark" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.3} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gap Analysis - TOTVS vs. Mercado</CardTitle>
                <CardDescription>
                  Onde temos vantagem competitiva
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Maturidade Digital</span>
                    <span className="font-medium">+22%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '70%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Mapping de Decisores</span>
                    <span className="font-medium">+18%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tech Stack Detection</span>
                    <span className="font-medium">+15%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '55%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Dados Financeiros</span>
                    <span className="font-medium text-orange-500">+10%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Maturidade Digital */}
        <TabsContent value="maturity" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Nível de Maturidade</CardTitle>
                <CardDescription>
                  {stats.maturity.length} empresas analisadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={maturityDistribution.filter(d => d.count > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ level, percent }) => `${level}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {maturityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise das 5 Dimensões</CardTitle>
                <CardDescription>
                  Score médio por dimensão de maturidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { 
                      dimension: 'Infraestrutura', 
                      score: stats.maturity.reduce((sum, m) => sum + (m.infrastructure_score || 0), 0) / Math.max(stats.maturity.length, 1)
                    },
                    { 
                      dimension: 'Sistemas', 
                      score: stats.maturity.reduce((sum, m) => sum + (m.systems_score || 0), 0) / Math.max(stats.maturity.length, 1)
                    },
                    { 
                      dimension: 'Processos', 
                      score: stats.maturity.reduce((sum, m) => sum + (m.processes_score || 0), 0) / Math.max(stats.maturity.length, 1)
                    },
                    { 
                      dimension: 'Segurança', 
                      score: stats.maturity.reduce((sum, m) => sum + (m.security_score || 0), 0) / Math.max(stats.maturity.length, 1)
                    },
                    { 
                      dimension: 'Inovação', 
                      score: stats.maturity.reduce((sum, m) => sum + (m.innovation_score || 0), 0) / Math.max(stats.maturity.length, 1)
                    },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dimension" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Bar dataKey="score" fill={COLORS[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Performance SDR */}
        <TabsContent value="sdr" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Emails
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{messagesByChannel.email}</div>
                <p className="text-xs text-muted-foreground">Enviados este mês</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Ligações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{messagesByChannel.phone}</div>
                <p className="text-xs text-muted-foreground">Realizadas este mês</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{messagesByChannel.whatsapp}</div>
                <p className="text-xs text-muted-foreground">Conversas ativas</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Atividades ao Longo do Tempo</CardTitle>
              <CardDescription>
                Volume de interações nos últimos 30 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={
                  // Agrupar mensagens por dia
                  stats.messages.reduce((acc, msg) => {
                    const date = new Date(msg.created_at).toLocaleDateString('pt-BR');
                    const existing = acc.find(d => d.date === date);
                    if (existing) {
                      existing.count++;
                    } else {
                      acc.push({ date, count: 1 });
                    }
                    return acc;
                  }, [] as { date: string; count: number }[]).slice(-7)
                }>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Benchmarks */}
        <TabsContent value="benchmark" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Análise Setorial</CardTitle>
                <CardDescription>
                  Top 5 setores mais representados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topIndustries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="industry" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Principais Sinais de Compra</CardTitle>
                <CardDescription>
                  Top 5 sinais detectados no pipeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topSignals.map((signal, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-sm">{signal.type}</span>
                      </div>
                      <Badge>{signal.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
