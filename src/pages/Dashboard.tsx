import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, TrendingUp, Target, Zap, Award, Briefcase, Mail, Phone, MessageSquare, BarChart3, PieChart, TrendingDown } from "lucide-react";
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
  Area
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

function SalesFunnelChart() {
  const funnelData = [
    { stage: 'Leads Identificados', value: 450, color: COLORS[0] },
    { stage: 'Qualificados', value: 280, color: COLORS[1] },
    { stage: 'Em Negociação', value: 120, color: COLORS[2] },
    { stage: 'Propostas Enviadas', value: 65, color: COLORS[3] },
    { stage: 'Fechados', value: 28, color: COLORS[4] },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={funnelData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="stage" type="category" width={140} />
        <Tooltip />
        <Bar dataKey="value" fill={COLORS[0]}>
          {funnelData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function Intelligence360Radar() {
  const radarData = [
    { dimension: 'Tech Stack', coverage: 85, benchmark: 70 },
    { dimension: 'Maturidade', coverage: 92, benchmark: 75 },
    { dimension: 'Decisores', coverage: 78, benchmark: 60 },
    { dimension: 'Financeiro', coverage: 65, benchmark: 55 },
    { dimension: 'Sinais de Compra', coverage: 88, benchmark: 65 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={radarData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="dimension" />
        <PolarRadiusAxis angle={90} domain={[0, 100]} />
        <Radar name="Nossa Cobertura" dataKey="coverage" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.6} />
        <Radar name="Mercado" dataKey="benchmark" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.3} />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function MaturityDistribution() {
  const maturityData = [
    { level: 'Básico', count: 45, color: COLORS[4] },
    { level: 'Intermediário', count: 120, color: COLORS[3] },
    { level: 'Avançado', count: 85, color: COLORS[1] },
    { level: 'Líder Digital', count: 32, color: COLORS[0] },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsPie>
        <Pie
          data={maturityData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ level, percent }) => `${level}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="count"
        >
          {maturityData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </RechartsPie>
    </ResponsiveContainer>
  );
}

function TechStackComparison() {
  const techData = [
    { tech: 'ERP', TOTVS: 85, Mercado: 45 },
    { tech: 'CRM', TOTVS: 72, Mercado: 60 },
    { tech: 'BI', TOTVS: 68, Mercado: 50 },
    { tech: 'HCM', TOTVS: 78, Mercado: 40 },
    { tech: 'WMS', TOTVS: 82, Mercado: 35 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={techData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="tech" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="TOTVS" fill={COLORS[0]} name="Fit TOTVS" />
        <Bar dataKey="Mercado" fill={COLORS[2]} name="Concorrência" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function SDRActivityTimeline() {
  const activityData = [
    { month: 'Jan', emails: 180, calls: 95, whatsapp: 120, propostas: 25 },
    { month: 'Fev', emails: 220, calls: 110, whatsapp: 145, propostas: 32 },
    { month: 'Mar', emails: 280, calls: 135, whatsapp: 180, propostas: 42 },
    { month: 'Abr', emails: 320, calls: 150, whatsapp: 210, propostas: 55 },
    { month: 'Mai', emails: 380, calls: 175, whatsapp: 245, propostas: 68 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={activityData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="emails" stackId="1" stroke={COLORS[0]} fill={COLORS[0]} name="Emails" />
        <Area type="monotone" dataKey="calls" stackId="1" stroke={COLORS[1]} fill={COLORS[1]} name="Ligações" />
        <Area type="monotone" dataKey="whatsapp" stackId="1" stroke={COLORS[2]} fill={COLORS[2]} name="WhatsApp" />
        <Area type="monotone" dataKey="propostas" stackId="1" stroke={COLORS[3]} fill={COLORS[3]} name="Propostas" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function SectorBenchmark() {
  const sectorData = [
    { sector: 'Manufatura', score: 78, empresas: 45 },
    { sector: 'Varejo', score: 65, empresas: 82 },
    { sector: 'Serviços', score: 72, empresas: 63 },
    { sector: 'Tecnologia', score: 88, empresas: 28 },
    { sector: 'Saúde', score: 70, empresas: 35 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={sectorData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="sector" />
        <YAxis yAxisId="left" orientation="left" stroke={COLORS[0]} />
        <YAxis yAxisId="right" orientation="right" stroke={COLORS[1]} />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="score" fill={COLORS[0]} name="Score Médio" />
        <Bar yAxisId="right" dataKey="empresas" fill={COLORS[1]} name="Nº Empresas" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [companiesRes, decisorsRes, maturityRes, signalsRes, conversationsRes] = await Promise.all([
        supabase.from('companies').select('id, digital_maturity_score', { count: 'exact' }),
        supabase.from('decision_makers').select('id', { count: 'exact' }),
        supabase.from('digital_maturity').select('overall_score'),
        supabase.from('buying_signals').select('id', { count: 'exact' }),
        supabase.from('conversations').select('id, status', { count: 'exact' }),
      ]);

      const avgScore = maturityRes.data?.length 
        ? maturityRes.data.reduce((acc, m) => acc + (m.overall_score || 0), 0) / maturityRes.data.length
        : 0;

      const activeConversations = conversationsRes.data?.filter(c => c.status === 'open').length || 0;

      return {
        companies: companiesRes.count || 0,
        decisors: decisorsRes.count || 0,
        avgScore: avgScore.toFixed(1),
        signals: signalsRes.count || 0,
        conversations: conversationsRes.count || 0,
        activeConversations,
        conversionRate: companiesRes.count ? ((activeConversations / companiesRes.count) * 100).toFixed(1) : '0.0'
      };
    }
  });

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Centro de Comando Executivo</h1>
        <p className="text-muted-foreground">Inteligência 360° para tomada de decisão estratégica</p>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Total</CardTitle>
            <Target className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-10 w-24" /> : (
              <>
                <div className="text-3xl font-bold text-primary">{stats?.companies || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Empresas em prospecção ativa</p>
                <div className="mt-3 flex items-center text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500 font-medium">+12%</span>
                  <span className="text-muted-foreground ml-1">vs. mês anterior</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-2/10 to-chart-2/5 border-chart-2/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Decisores Mapeados</CardTitle>
            <Users className="h-5 w-5 text-chart-2" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-10 w-24" /> : (
              <>
                <div className="text-3xl font-bold text-chart-2">{stats?.decisors || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Contatos C-Level identificados</p>
                <div className="mt-3 text-xs text-muted-foreground">
                  {stats?.decisors || 0} emails verificados
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-3/10 to-chart-3/5 border-chart-3/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Zap className="h-5 w-5 text-chart-3" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-10 w-24" /> : (
              <>
                <div className="text-3xl font-bold text-chart-3">{stats?.conversionRate || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">Lead → Oportunidade ativa</p>
                <div className="mt-3 flex items-center text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500 font-medium">+5.2%</span>
                  <span className="text-muted-foreground ml-1">últimos 30 dias</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-4/10 to-chart-4/5 border-chart-4/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sinais de Compra</CardTitle>
            <Award className="h-5 w-5 text-chart-4" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-10 w-24" /> : (
              <>
                <div className="text-3xl font-bold text-chart-4">{stats?.signals || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Alertas de intenção detectados</p>
                <div className="mt-3 text-xs text-muted-foreground">
                  {Math.round((stats?.signals || 0) / Math.max(stats?.companies || 1, 1) * 10) / 10} sinais/empresa
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pipeline" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pipeline">Pipeline & Conversão</TabsTrigger>
          <TabsTrigger value="intelligence">Inteligência 360°</TabsTrigger>
          <TabsTrigger value="maturity">Maturidade Digital</TabsTrigger>
          <TabsTrigger value="sdr">Performance SDR</TabsTrigger>
          <TabsTrigger value="benchmark">Benchmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Funil de Vendas
                </CardTitle>
                <CardDescription>Do lead qualificado ao fechamento</CardDescription>
              </CardHeader>
              <CardContent>
                <SalesFunnelChart />
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa Qualificação:</span>
                    <span className="font-semibold">62.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa Fechamento:</span>
                    <span className="font-semibold text-green-600">6.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ticket Médio:</span>
                    <span className="font-semibold">R$ 245.000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Oportunidades por Estágio
                </CardTitle>
                <CardDescription>Distribuição atual do pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Prospecção (120 empresas)</span>
                      <span className="font-semibold">R$ 18.5M</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '42%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Qualificação (65 empresas)</span>
                      <span className="font-semibold">R$ 12.8M</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-chart-2" style={{ width: '29%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Proposta (28 empresas)</span>
                      <span className="font-semibold">R$ 9.2M</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-chart-3" style={{ width: '21%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Negociação (15 empresas)</span>
                      <span className="font-semibold">R$ 3.6M</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-chart-4" style={{ width: '8%' }}></div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Pipeline Total:</span>
                    <span className="text-2xl font-bold text-primary">R$ 44.1M</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Cobertura Inteligência 360°
                </CardTitle>
                <CardDescription>Nossa vantagem competitiva vs. mercado</CardDescription>
              </CardHeader>
              <CardContent>
                <Intelligence360Radar />
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 bg-primary/5 rounded-lg">
                    <div className="text-2xl font-bold text-primary">92%</div>
                    <div className="text-xs text-muted-foreground">Cobertura Média</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">65%</div>
                    <div className="text-xs text-muted-foreground">Benchmark Mercado</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Gap Analysis TOTVS
                </CardTitle>
                <CardDescription>Oportunidades por stack tecnológico</CardDescription>
              </CardHeader>
              <CardContent>
                <TechStackComparison />
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 bg-primary/5 rounded">
                    <span className="font-medium">ERP: Maior Fit</span>
                    <span className="text-primary font-semibold">85% match</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span>WMS: Alta Oportunidade</span>
                    <span className="font-semibold">82% fit</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span>HCM: Crescimento</span>
                    <span className="font-semibold">78% fit</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maturity" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Distribuição de Maturidade
                </CardTitle>
                <CardDescription>Classificação das empresas prospectadas</CardDescription>
              </CardHeader>
              <CardContent>
                <MaturityDistribution />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Dimensões de Maturidade
                </CardTitle>
                <CardDescription>Score médio por dimensão avaliada</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Infraestrutura', score: 7.8, trend: '+0.5' },
                    { name: 'Sistemas', score: 6.9, trend: '+0.3' },
                    { name: 'Processos', score: 7.2, trend: '+0.8' },
                    { name: 'Segurança', score: 6.5, trend: '-0.2' },
                    { name: 'Inovação', score: 5.8, trend: '+1.2' },
                  ].map((dim) => (
                    <div key={dim.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{dim.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{dim.score}</span>
                          <span className={`text-xs ${dim.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                            {dim.trend}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-chart-2" 
                          style={{ width: `${dim.score * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Score Médio Geral</div>
                  <div className="text-3xl font-bold text-primary">{stats?.avgScore || '0.0'}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sdr" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Emails Enviados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">1,380</div>
                <p className="text-xs text-muted-foreground mt-1">Taxa abertura: 42%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-chart-2" />
                  Ligações Realizadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">665</div>
                <p className="text-xs text-muted-foreground mt-1">Taxa conexão: 28%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-chart-3" />
                  WhatsApp Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">900</div>
                <p className="text-xs text-muted-foreground mt-1">Taxa resposta: 65%</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evolução de Atividades SDR</CardTitle>
              <CardDescription>Volume de outreach nos últimos 5 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <SDRActivityTimeline />
              <div className="mt-6 grid grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">68</div>
                  <div className="text-xs text-muted-foreground mt-1">Propostas Maio</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">23%</div>
                  <div className="text-xs text-muted-foreground mt-1">Taxa Resposta</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">R$ 8.2M</div>
                  <div className="text-xs text-muted-foreground mt-1">Pipeline Gerado</div>
                </div>
                <div className="p-3 bg-chart-4/10 rounded-lg">
                  <div className="text-2xl font-bold text-chart-4">18</div>
                  <div className="text-xs text-muted-foreground mt-1">Deals Fechados</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmark" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise Setorial Comparativa</CardTitle>
              <CardDescription>Maturidade digital e volume por setor</CardDescription>
            </CardHeader>
            <CardContent>
              <SectorBenchmark />
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">Melhor Setor</div>
                  <div className="font-bold">Tecnologia</div>
                  <div className="text-2xl font-bold text-primary mt-1">88</div>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">Maior Volume</div>
                  <div className="font-bold">Varejo</div>
                  <div className="text-2xl font-bold mt-1">82 empresas</div>
                </div>
                <div className="p-4 bg-chart-3/10 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">Oportunidade</div>
                  <div className="font-bold">Manufatura</div>
                  <div className="text-2xl font-bold text-chart-3 mt-1">+35% fit</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top 5 Tecnologias Detectadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { tech: 'SAP ERP', count: 45, trend: 'stable' },
                    { tech: 'Oracle Cloud', count: 38, trend: 'up' },
                    { tech: 'Microsoft Dynamics', count: 32, trend: 'up' },
                    { tech: 'Salesforce', count: 28, trend: 'down' },
                    { tech: 'Sistemas Legados', count: 85, trend: 'down' },
                  ].map((item) => (
                    <div key={item.tech} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm font-medium">{item.tech}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{item.count}</span>
                        {item.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                        {item.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Principais Sinais de Compra</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { signal: 'Expansão de operações', count: 28, priority: 'high' },
                    { signal: 'Vagas tech abertas', count: 42, priority: 'high' },
                    { signal: 'Notícias de crescimento', count: 35, priority: 'medium' },
                    { signal: 'Investimento recebido', count: 18, priority: 'high' },
                    { signal: 'Mudança de liderança', count: 22, priority: 'medium' },
                  ].map((item) => (
                    <div key={item.signal} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          item.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                        <span className="text-sm font-medium">{item.signal}</span>
                      </div>
                      <span className="font-bold">{item.count}</span>
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
