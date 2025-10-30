import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, CheckCircle2, TrendingUp, Users, MessageSquare,
  Clock, Target, Building2, ExternalLink, Calendar, ChevronDown, ChevronUp
} from "lucide-react";
import { useSDRMetrics } from "@/hooks/useSDRMetrics";
import { useSDRActivities } from "@/hooks/useSDRActivities";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { addDays } from "date-fns";

export function ExecutiveView() {
  const navigate = useNavigate();
  const { metrics, loading } = useSDRMetrics();
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });
  
  const { activities } = useSDRActivities(showAllActivities ? 50 : 5, dateRange);

  const displayedActivities = showAllActivities ? activities : activities.slice(0, 5);

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    subtitle,
    onClick,
    trend
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    subtitle?: string;
    onClick?: () => void;
    trend?: string;
  }) => (
    <Card 
      className={onClick ? "cursor-pointer hover:shadow-lg transition-all hover:scale-105" : ""}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {trend && (
          <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Executive KPIs */}
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
          title="Taxa Conversão"
          value={`${metrics.conversionRate}%`}
          icon={TrendingUp}
          onClick={() => navigate('/sdr/analytics')}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
                <div className="p-3 border border-orange-200 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="destructive" className="text-xs">SLA Vencido</Badge>
                    <span className="text-sm font-medium">{metrics.overdueConversations} conversas</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Requerem atenção imediata</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2 w-full"
                    onClick={() => navigate('/sdr/inbox')}
                  >
                    Ver Conversas
                  </Button>
                </div>
              )}
              {(metrics.activeConversations - metrics.overdueConversations) > 0 && (
                <div className="p-3 border border-yellow-200 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">Follow-up</Badge>
                    <span className="text-sm font-medium">{metrics.activeConversations - metrics.overdueConversations} leads</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Aguardando retorno</p>
                </div>
              )}
              {metrics.qualifiedLeadsToday > 0 && (
                <div className="p-3 border border-blue-200 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="text-xs">Oportunidades</Badge>
                    <span className="text-sm font-medium">{metrics.qualifiedLeadsToday} novas</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Qualificadas hoje</p>
                </div>
              )}
              {metrics.overdueConversations === 0 && 
               (metrics.activeConversations - metrics.overdueConversations) === 0 && 
               metrics.qualifiedLeadsToday === 0 && (
                <div className="p-6 text-center text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum alerta no momento</p>
                  <p className="text-xs mt-1">Todos os processos estão em dia! 🎉</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Atividades Recentes
              </CardTitle>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Calendar className="h-3 w-3" />
                      Filtrar
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-3 space-y-2">
                      <p className="text-sm font-medium">Selecione o período</p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setDateRange({ from: new Date(), to: new Date() })}
                        >
                          Hoje
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setDateRange({ from: addDays(new Date(), -7), to: new Date() })}
                        >
                          7 dias
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setDateRange({ from: addDays(new Date(), -30), to: new Date() })}
                        >
                          30 dias
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAllActivities(!showAllActivities)}
                  className="gap-1"
                >
                  {showAllActivities ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Mais
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {displayedActivities.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma atividade recente</p>
                </div>
              ) : (
                displayedActivities.map(activity => (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-3 p-2 hover:bg-accent rounded-lg cursor-pointer transition-colors"
                    onClick={() => {
                      if (activity.metadata?.company_id) {
                        navigate(`/companies/${activity.metadata.company_id}`);
                      }
                    }}
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {activity.type === 'task' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      {activity.type === 'message' && <MessageSquare className="h-4 w-4 text-primary" />}
                      {activity.type === 'sequence' && <Clock className="h-4 w-4 text-primary" />}
                      {activity.type === 'contact' && <Users className="h-4 w-4 text-primary" />}
                      {activity.type === 'company' && <Building2 className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.description}</p>
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
                      <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Insights Estratégicos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg">
              <p className="text-sm font-medium mb-1">Velocidade do Pipeline</p>
              <p className="text-2xl font-bold">{metrics.avgResponseTime}min</p>
              <p className="text-xs text-muted-foreground mt-1">Tempo médio de resposta</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg">
              <p className="text-sm font-medium mb-1">Performance de Conversão</p>
              <p className="text-2xl font-bold">{metrics.conversionRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">Leads → Oportunidades</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg">
              <p className="text-sm font-medium mb-1">Engajamento</p>
              <p className="text-2xl font-bold">{metrics.responseRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">Taxa de resposta global</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
