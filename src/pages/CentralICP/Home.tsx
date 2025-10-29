import { useNavigate } from 'react-router-dom';
import { Search, FileText, Zap, BarChart3, Shield, TrendingUp, Target, Activity, Settings, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function CentralICPHome() {
  const navigate = useNavigate();

  // Buscar estatísticas gerais
  const { data: stats } = useQuery({
    queryKey: ['icp-stats'],
    queryFn: async () => {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('id');
      
      if (error) throw error;

      const total = companies?.length || 0;
      // TODO: Implementar contagem de qualificadas/desqualificadas quando colunas existirem
      const qualified = 0;
      const disqualified = 0;
      const discovered = 0; // TODO: Buscar da tabela suggested_companies

      return { total, qualified, disqualified, discovered };
    },
  });

  const modules = [
    {
      icon: Search,
      title: 'Descoberta de Empresas',
      description: 'Encontre novas empresas no seu ICP ideal através de busca ativa',
      path: '/company-discovery',
      color: 'bg-blue-500',
      status: 'Ativo'
    },
    {
      icon: FileText,
      title: 'Análise Individual',
      description: 'Qualifique empresas uma por vez com análise detalhada',
      path: '/central-icp/individual',
      color: 'bg-green-500',
      status: 'Ativo'
    },
    {
      icon: Zap,
      title: 'Análise em Massa',
      description: 'Processe centenas de empresas automaticamente',
      path: '/central-icp/batch',
      color: 'bg-purple-500',
      status: 'Ativo'
    },
    {
      icon: BarChart3,
      title: 'Dashboard de Resultados',
      description: 'Visualize empresas qualificadas e desqualificadas',
      path: '/central-icp/dashboard',
      color: 'bg-orange-500',
      status: 'Ativo'
    },
    {
      icon: Shield,
      title: 'Auditoria e Compliance',
      description: 'Logs de validação e checkpoints de qualidade',
      path: '/central-icp/audit',
      color: 'bg-red-500',
      status: 'Planejado'
    },
    {
      icon: Zap,
      title: 'Sales Intelligence Feed',
      description: 'Sinais de compra em tempo real e displacement radar',
      path: '/sales-intelligence/feed',
      color: 'bg-yellow-500',
      status: 'Ativo'
    },
    {
      icon: Building2,
      title: 'Empresas Monitoradas',
      description: 'Acompanhe empresas detectadas e seus movimentos',
      path: '/sales-intelligence/companies',
      color: 'bg-blue-500',
      status: 'Novo'
    },
    {
      icon: Settings,
      title: 'Configurar Monitoramento Automático',
      description: 'Defina filtros geográficos, setores e frequência 24/7',
      path: '/sales-intelligence/config',
      color: 'bg-yellow-600',
      status: 'Ativo'
    },
    {
      icon: TrendingUp,
      title: 'Inteligência Competitiva',
      description: 'Battle Cards, Win-Loss Analysis e Monitoramento',
      path: '/competitive-intelligence',
      color: 'bg-indigo-500',
      status: 'Ativo'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Target className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-4xl font-bold">Central ICP</h1>
            <p className="text-lg text-muted-foreground">
              Inteligência estratégica para qualificação de leads
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Empresas Analisadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total no sistema</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              Qualificadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.qualified || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.total ? ((stats.qualified / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-600" />
              Desqualificadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats?.disqualified || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Já usam TOTVS</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Search className="h-4 w-4 text-purple-600" />
              Descobertas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats?.discovered || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Módulos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Card
              key={module.path}
              onClick={() => navigate(module.path)}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 group"
            >
              <CardHeader>
                <div className={`${module.color} w-14 h-14 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <module.icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {module.title}
                </CardTitle>
                <CardDescription className="text-sm min-h-[40px]">
                  {module.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    module.status === 'Ativo' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : module.status === 'Em Desenvolvimento'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {module.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Comece sua jornada de qualificação ICP</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Descobrir Novas Empresas</p>
                <p className="text-xs text-muted-foreground">Busque empresas similares ao seu ICP</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/company-discovery')}
              className="text-sm text-primary hover:underline"
            >
              Iniciar →
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Qualificar Lead Individual</p>
                <p className="text-xs text-muted-foreground">Análise detalhada de uma empresa</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/competitive-intelligence')}
              className="text-sm text-primary hover:underline"
            >
              Iniciar →
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer opacity-50">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Análise em Massa</p>
                <p className="text-xs text-muted-foreground">Processe múltiplas empresas de uma vez</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">Em breve</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
