import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, Inbox, CheckSquare, Zap, BarChart3,
  Phone, Mail, MessageSquare, Users, TrendingUp, AlertCircle, Clock, Bell, BookOpen
} from 'lucide-react';
import { EnhancedKanbanBoard } from '@/components/sdr/EnhancedKanbanBoard';
import { WorkspaceInboxMini } from '@/components/sdr/WorkspaceInboxMini';
import { WorkspaceTasksMini } from '@/components/sdr/WorkspaceTasksMini';
import { WorkspaceSequencesMini } from '@/components/sdr/WorkspaceSequencesMini';
import { AutomationPanel } from '@/components/sdr/AutomationPanel';
import { ExecutiveDashboard } from '@/components/sdr/ExecutiveDashboard';
import { ForecastPanel } from '@/components/sdr/ForecastPanel';
import { AdvancedFunnelChart } from '@/components/sdr/analytics/AdvancedFunnelChart';
import { PredictiveScoring } from '@/components/sdr/analytics/PredictiveScoring';
import { RevenueForecasting } from '@/components/sdr/analytics/RevenueForecasting';
import { VisualSequenceBuilder } from '@/components/sdr/sequences/VisualSequenceBuilder';
import { SequenceTemplateLibrary } from '@/components/sdr/sequences/SequenceTemplateLibrary';
import { SmartTasksList } from '@/components/sdr/SmartTasksList';
import { DealHealthScoreCard } from '@/components/sdr/DealHealthScoreCard';
import { ExecutiveView } from '@/components/sdr/ExecutiveView';
import { useCompaniesAtRisk } from '@/hooks/useDealHealthScore';
import { useDeals } from '@/hooks/useDeals';
import { usePipelineStages } from '@/hooks/usePipelineStages';
import { useSDRAutomations } from '@/hooks/useSDRAutomations';
import { Link } from 'react-router-dom';


export default function SDRWorkspacePage() {
  const [activeTab, setActiveTab] = useState('pipeline');
  const { data: deals } = useDeals({ status: 'open' });
  const { data: stages } = usePipelineStages();
  const { data: automations, isLoading: automationsLoading } = useSDRAutomations();
  const { data: companiesAtRisk } = useCompaniesAtRisk();

  // Stats
  const stats = {
    totalDeals: deals?.length || 0,
    totalValue: deals?.reduce((sum, d) => sum + d.value, 0) || 0,
    avgProbability: deals?.length 
      ? deals.reduce((sum, d) => sum + d.probability, 0) / deals.length 
      : 0,
    hotDeals: deals?.filter(d => d.priority === 'urgent' || d.priority === 'high').length || 0,
    atRisk: companiesAtRisk?.length || 0,
  };

  const urgentAutomations = automations?.filter(a => a.priority === 'urgent' || a.priority === 'high') || [];
  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              Sales Workspace
            </h1>
            <p className="text-muted-foreground">Centro de comando de vendas unificado</p>
          </div>
          <div className="flex gap-2 items-center">
            <Link to="/documentation">
              <Button 
                variant="outline" 
                className="gap-2 animate-pulse border-primary/50 hover:border-primary"
              >
                <BookOpen className="h-4 w-4" />
                Manual do SDR
              </Button>
            </Link>
            {urgentAutomations.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <Bell className="h-3 w-3" />
                {urgentAutomations.length} alertas
              </Badge>
            )}
            <Button variant="outline" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
          </div>
        </div>

        {/* Automations Alert Bar */}
        {urgentAutomations.length > 0 && (
          <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <strong>{urgentAutomations.length} ações prioritárias:</strong>
                  <span className="ml-2">{urgentAutomations[0].message}</span>
                </div>
                {urgentAutomations[0].actionUrl && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    asChild
                  >
                    <Link to={urgentAutomations[0].actionUrl}>
                      {urgentAutomations[0].action}
                    </Link>
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Deals Ativos</p>
                <p className="text-2xl font-bold">{stats.totalDeals}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold">
                  R$ {(stats.totalValue / 1000).toFixed(0)}k
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prob. Média</p>
                <p className="text-2xl font-bold">{stats.avgProbability.toFixed(0)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prioridade Alta</p>
                <p className="text-2xl font-bold">{stats.hotDeals}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-4 border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Deals em Risco</p>
                <p className="text-2xl font-bold text-red-600">{stats.atRisk}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Main Workspace Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-11 max-w-full">
            <TabsTrigger value="executive" className="gap-2 bg-gradient-to-r from-primary/10 to-blue-500/10">
              <BarChart3 className="h-4 w-4" />
              Executivo
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-2">
              <Activity className="h-4 w-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-2 border-l-2 border-l-red-500/20">
              <AlertCircle className="h-4 w-4" />
              Health
              {stats.atRisk > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1 text-xs">
                  {stats.atRisk}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="forecast" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Forecast
            </TabsTrigger>
            <TabsTrigger value="funnel" className="gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <TrendingUp className="h-4 w-4" />
              Funil AI
            </TabsTrigger>
            <TabsTrigger value="prediction" className="gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <BarChart3 className="h-4 w-4" />
              Predição
            </TabsTrigger>
            <TabsTrigger value="automations" className="gap-2">
              <Zap className="h-4 w-4" />
              Automações
            </TabsTrigger>
            <TabsTrigger value="inbox" className="gap-2">
              <Inbox className="h-4 w-4" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2 bg-gradient-to-r from-green-500/10 to-blue-500/10">
              <CheckSquare className="h-4 w-4" />
              Smart Tasks
            </TabsTrigger>
            <TabsTrigger value="sequences" className="gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <Mail className="h-4 w-4" />
              Email Sequences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="executive" className="flex-1 mt-4 overflow-auto">
            <ExecutiveView />
          </TabsContent>

          <TabsContent value="pipeline" className="flex-1 mt-4">
            <EnhancedKanbanBoard />
          </TabsContent>

          <TabsContent value="health" className="flex-1 mt-4 overflow-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                    Deal Health Monitor
                  </h2>
                  <p className="text-muted-foreground">
                    Monitore deals em risco e receba recomendações inteligentes
                  </p>
                </div>
              </div>

              {companiesAtRisk && companiesAtRisk.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {companiesAtRisk.map((item: any) => (
                    <DealHealthScoreCard 
                      key={item.company_id} 
                      companyId={item.company_id} 
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <CheckSquare className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">Todos os deals estão saudáveis! 🎉</h3>
                  <p className="text-muted-foreground">
                    Nenhum deal em risco detectado no momento
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 mt-4">
            <ExecutiveDashboard />
          </TabsContent>

          <TabsContent value="forecast" className="flex-1 mt-4">
            <ForecastPanel />
          </TabsContent>

          <TabsContent value="funnel" className="flex-1 mt-4">
            <AdvancedFunnelChart />
          </TabsContent>

          <TabsContent value="prediction" className="flex-1 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PredictiveScoring />
              <RevenueForecasting />
            </div>
          </TabsContent>

          <TabsContent value="automations" className="flex-1 mt-4">
            <AutomationPanel />
          </TabsContent>

          <TabsContent value="inbox" className="flex-1 mt-4">
            <WorkspaceInboxMini />
          </TabsContent>

          <TabsContent value="tasks" className="flex-1 mt-4 overflow-auto">
            <SmartTasksList />
          </TabsContent>

          <TabsContent value="sequences" className="flex-1 mt-4 overflow-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Mail className="h-6 w-6 text-primary" />
                    Email Sequences
                  </h2>
                  <p className="text-muted-foreground">
                    Crie e gerencie sequências de email automáticas
                  </p>
                </div>
                <Button asChild>
                  <Link to="/sdr/sequences">
                    Ver Todas as Sequências
                  </Link>
                </Button>
              </div>

              <Tabs defaultValue="builder" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="builder">Sequence Builder</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                  <TabsTrigger value="active">Ativas</TabsTrigger>
                </TabsList>
                <TabsContent value="builder">
                  <VisualSequenceBuilder />
                </TabsContent>
                <TabsContent value="templates">
                  <SequenceTemplateLibrary />
                </TabsContent>
                <TabsContent value="active">
                  <WorkspaceSequencesMini />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
