import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, Users, MessageSquare, CheckCircle2, 
  Clock, Target, Zap, AlertCircle, Calendar, BarChart3
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardMetrics {
  totalContacts: number;
  activeConversations: number;
  tasksToday: number;
  completedTasks: number;
  responseRate: number;
  avgResponseTime: number;
  conversionRate: number;
  sequencesRunning: number;
}

interface Activity {
  id: string;
  type: 'task' | 'message' | 'sequence' | 'conversion';
  description: string;
  timestamp: string;
  priority?: string;
}

export default function SDRDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalContacts: 0,
    activeConversations: 0,
    tasksToday: 0,
    completedTasks: 0,
    responseRate: 0,
    avgResponseTime: 0,
    conversionRate: 0,
    sequencesRunning: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    
    // Realtime updates
    const channel = supabase
      .channel('sdr-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, loadDashboard)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sdr_tasks' }, loadDashboard)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // Contacts
      const { count: contactsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });

      // Active conversations
      const { count: conversationsCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'pending']);

      // Tasks today
      const today = new Date().toISOString().split('T')[0];
      const { count: tasksTodayCount } = await supabase
        .from('sdr_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('due_date', today);

      const { count: completedTasksCount } = await supabase
        .from('sdr_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('due_date', today)
        .eq('status', 'done');

      // Running sequences
      const { count: sequencesCount } = await supabase
        .from('sdr_sequence_runs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'running');

      // Recent activities
      const { data: recentTasks } = await supabase
        .from('sdr_tasks')
        .select('id, title, created_at, status')
        .order('created_at', { ascending: false })
        .limit(10);

      const activitiesList: Activity[] = (recentTasks || []).map(task => ({
        id: task.id,
        type: 'task',
        description: task.title,
        timestamp: task.created_at,
      }));

      setMetrics({
        totalContacts: contactsCount || 0,
        activeConversations: conversationsCount || 0,
        tasksToday: tasksTodayCount || 0,
        completedTasks: completedTasksCount || 0,
        responseRate: 75, // Mock
        avgResponseTime: 45, // Mock (minutes)
        conversionRate: 12, // Mock
        sequencesRunning: sequencesCount || 0,
      });

      setActivities(activitiesList);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    subtitle 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    trend?: string; 
    subtitle?: string 
  }) => (
    <Card>
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
            trend="+12% vs mês anterior"
          />
          <MetricCard
            title="Conversas Abertas"
            value={metrics.activeConversations}
            icon={MessageSquare}
            subtitle="Requerem atenção"
          />
          <MetricCard
            title="Taxa de Resposta"
            value={`${metrics.responseRate}%`}
            icon={Target}
            trend="+5% vs semana anterior"
          />
          <MetricCard
            title="Tempo Médio Resposta"
            value={`${metrics.avgResponseTime}min`}
            icon={Clock}
            subtitle="Último 7 dias"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Tarefas Hoje"
            value={`${metrics.completedTasks}/${metrics.tasksToday}`}
            icon={CheckCircle2}
            subtitle={`${taskCompletionRate}% completo`}
          />
          <MetricCard
            title="Sequências Ativas"
            value={metrics.sequencesRunning}
            icon={Zap}
            subtitle="Automações rodando"
          />
          <MetricCard
            title="Taxa Conversão"
            value={`${metrics.conversionRate}%`}
            icon={TrendingUp}
            trend="+3% vs mês anterior"
          />
          <MetricCard
            title="Oportunidades"
            value="23"
            icon={BarChart3}
            subtitle="Em pipeline"
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
                      <div key={activity.id} className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.timestamp), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </p>
                        </div>
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
                    <div className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="destructive" className="text-xs">SLA Vencido</Badge>
                        <span className="text-sm font-medium">5 conversas</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Requerem atenção imediata</p>
                    </div>
                    <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">Follow-up</Badge>
                        <span className="text-sm font-medium">12 leads</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Aguardando retorno</p>
                    </div>
                    <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="text-xs">Oportunidades</Badge>
                        <span className="text-sm font-medium">8 novas</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Qualificadas hoje</p>
                    </div>
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
                    <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-accent rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {activity.type === 'task' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        {activity.type === 'message' && <MessageSquare className="h-4 w-4 text-primary" />}
                        {activity.type === 'sequence' && <Zap className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.timestamp), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
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
