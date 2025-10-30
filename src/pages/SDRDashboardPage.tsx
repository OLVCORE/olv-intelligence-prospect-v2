/**
 * @deprecated Este arquivo foi deprecado em 2025-10-30.
 * 
 * IMPORTANTE: Este componente foi integrado ao Sales Workspace (SDRWorkspacePage.tsx)
 * na aba "Executivo" através do componente ExecutiveView.
 * 
 * Funcionalidades migradas:
 * - Alertas prioritários
 * - Feed de atividades recentes (últimas 5, expansível com calendário)
 * - KPIs executivos minimalistas
 * 
 * Redirecionamento: /sdr/dashboard agora redireciona automaticamente para /sdr/workspace
 * 
 * Este arquivo será removido em versões futuras.
 */

import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, Users, MessageSquare, CheckCircle2, 
  Clock, Target, Zap, AlertCircle, Calendar, BarChart3, Building2, ExternalLink, BookOpen
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSDRMetrics } from '@/hooks/useSDRMetrics';
import { useSDRActivities } from '@/hooks/useSDRActivities';
import { useNavigate, Link } from 'react-router-dom';

export default function SDRDashboardPage() {
  const navigate = useNavigate();
  const { metrics, loading } = useSDRMetrics();
  const { activities } = useSDRActivities(15);

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    subtitle,
    onClick 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    trend?: string; 
    subtitle?: string;
    onClick?: () => void;
  }) => (
    <Card 
      className={onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : ""}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {trend && (
          <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );

  const taskCompletionRate = metrics.tasksToday > 0 
    ? Math.round((metrics.completedTasks / metrics.tasksToday) * 100) 
    : 0;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">SDR Cockpit</h1>
            <p className="text-muted-foreground">Visão completa da operação comercial</p>
          </div>
          <div className="flex gap-2">
            <Link to="/documentation">
              <Button 
                variant="outline" 
                className="gap-2 animate-pulse border-primary/50 hover:border-primary"
              >
                <BookOpen className="h-4 w-4" />
                Manual do SDR
              </Button>
            </Link>
            <Badge variant="outline" className="text-sm">
              <Clock className="h-3 w-3 mr-1" />
              Atualizado agora
            </Badge>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Contatos Ativos"
            value={metrics.totalContacts}
            icon={Users}
            onClick={() => navigate('/sdr/inbox')}
          />
          <MetricCard
            title="Conversas Abertas"
            value={metrics.activeConversations}
            icon={MessageSquare}
            subtitle="Requerem atenção"
            onClick={() => navigate('/sdr/inbox')}
          />
          <MetricCard
            title="Taxa de Resposta"
            value={`${metrics.responseRate}%`}
            icon={Target}
            onClick={() => navigate('/sdr/analytics')}
          />
          <MetricCard
            title="Tempo Médio Resposta"
            value={`${metrics.avgResponseTime}min`}
            icon={Clock}
            subtitle="Último 7 dias"
            onClick={() => navigate('/sdr/analytics')}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Tarefas Hoje"
            value={`${metrics.completedTasks}/${metrics.tasksToday}`}
            icon={CheckCircle2}
            subtitle={`${taskCompletionRate}% completo`}
            onClick={() => navigate('/sdr/tasks')}
          />
          <MetricCard
            title="Sequências Ativas"
            value={metrics.sequencesRunning}
            icon={Zap}
            subtitle="Automações rodando"
            onClick={() => navigate('/sdr/sequences')}
          />
          <MetricCard
            title="Taxa Conversão"
            value={`${metrics.conversionRate}%`}
            icon={TrendingUp}
            onClick={() => navigate('/sdr/analytics')}
          />
          <MetricCard
            title="Oportunidades"
            value={metrics.totalOpportunities}
            icon={BarChart3}
            subtitle="Em pipeline"
            onClick={() => navigate('/sdr/pipeline')}
          />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="today" className="space-y-4">
          <TabsList>
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="week">Esta Semana</TabsTrigger>
            <TabsTrigger value="month">Este Mês</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Today's Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Tarefas do Dia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progresso</span>
                        <span className="text-sm text-muted-foreground">
                          {metrics.completedTasks} de {metrics.tasksToday}
                        </span>
                      </div>
                      <Progress value={taskCompletionRate} />
                    </div>
                  {activities.slice(0, 5).map(activity => (
                      <div 
                        key={activity.id} 
                        className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg cursor-pointer"
                        onClick={() => {
                          if (activity.metadata?.company_id) {
                            navigate(`/companies/${activity.metadata.company_id}`);
                          }
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          {activity.metadata?.company_name && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {activity.metadata.company_name}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.timestamp), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </p>
                        </div>
                        {activity.metadata?.company_id && (
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Priority Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Alertas Prioritários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.overdueConversations > 0 && (
                      <div className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="destructive" className="text-xs">SLA Vencido</Badge>
                          <span className="text-sm font-medium">{metrics.overdueConversations} conversas</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Requerem atenção imediata</p>
                      </div>
                    )}
                    {(metrics.activeConversations - metrics.overdueConversations) > 0 && (
                      <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">Follow-up</Badge>
                          <span className="text-sm font-medium">{metrics.activeConversations - metrics.overdueConversations} leads</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Aguardando retorno</p>
                      </div>
                    )}
                    {metrics.qualifiedLeadsToday > 0 && (
                      <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="text-xs">Oportunidades</Badge>
                          <span className="text-sm font-medium">{metrics.qualifiedLeadsToday} novas</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Qualificadas hoje</p>
                      </div>
                    )}
                    {metrics.overdueConversations === 0 && (metrics.activeConversations - metrics.overdueConversations) === 0 && metrics.qualifiedLeadsToday === 0 && (
                      <div className="p-6 text-center text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum alerta no momento</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Atividades Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activities.map(activity => (
                    <div 
                      key={activity.id} 
                      className="flex items-start gap-3 p-2 hover:bg-accent rounded-lg cursor-pointer"
                      onClick={() => {
                        if (activity.metadata?.company_id) {
                          navigate(`/companies/${activity.metadata.company_id}`);
                        }
                      }}
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {activity.type === 'task' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        {activity.type === 'message' && <MessageSquare className="h-4 w-4 text-primary" />}
                        {activity.type === 'sequence' && <Zap className="h-4 w-4 text-primary" />}
                        {activity.type === 'contact' && <Users className="h-4 w-4 text-primary" />}
                        {activity.type === 'company' && <Building2 className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        {activity.metadata?.company_name && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {activity.metadata.company_name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.timestamp), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                      {activity.metadata?.company_id && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
