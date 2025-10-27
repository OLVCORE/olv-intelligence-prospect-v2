import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, Inbox, CheckSquare, Zap, BarChart3,
  Phone, Mail, MessageSquare, Users, TrendingUp, AlertCircle, Clock, Bell
} from 'lucide-react';
import { EnhancedKanbanBoard } from '@/components/sdr/EnhancedKanbanBoard';
import { WorkspaceInboxMini } from '@/components/sdr/WorkspaceInboxMini';
import { WorkspaceTasksMini } from '@/components/sdr/WorkspaceTasksMini';
import { WorkspaceSequencesMini } from '@/components/sdr/WorkspaceSequencesMini';
import { AutomationPanel } from '@/components/sdr/AutomationPanel';
import { ExecutiveDashboard } from '@/components/sdr/ExecutiveDashboard';
import { ForecastPanel } from '@/components/sdr/ForecastPanel';
import { useDeals } from '@/hooks/useDeals';
import { usePipelineStages } from '@/hooks/usePipelineStages';
import { useSDRAutomations } from '@/hooks/useSDRAutomations';
import { Link } from 'react-router-dom';
import { AICopilotPanel } from '@/components/copilot/AICopilotPanel';

export default function SDRWorkspacePage() {
  const [activeTab, setActiveTab] = useState('pipeline');
  const { data: deals } = useDeals({ status: 'open' });
  const { data: stages } = usePipelineStages();
  const { data: automations, isLoading: automationsLoading } = useSDRAutomations();

  // Stats
  const stats = {
    totalDeals: deals?.length || 0,
    totalValue: deals?.reduce((sum, d) => sum + d.value, 0) || 0,
    avgProbability: deals?.length 
      ? deals.reduce((sum, d) => sum + d.probability, 0) / deals.length 
      : 0,
    hotDeals: deals?.filter(d => d.priority === 'urgent' || d.priority === 'high').length || 0,
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
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Deals Ativos</p>
                <p className="text-2xl font-bold">{stats.totalDeals}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
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
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prob. Média</p>
                <p className="text-2xl font-bold">{stats.avgProbability.toFixed(0)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prioridade Alta</p>
                <p className="text-2xl font-bold">{stats.hotDeals}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-600" />
            </div>
          </Card>
        </div>

        {/* Main Workspace Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-7 max-w-5xl">
            <TabsTrigger value="pipeline" className="gap-2">
              <Activity className="h-4 w-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="forecast" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Forecast
            </TabsTrigger>
            <TabsTrigger value="automations" className="gap-2">
              <Zap className="h-4 w-4" />
              Automações
            </TabsTrigger>
            <TabsTrigger value="inbox" className="gap-2">
              <Inbox className="h-4 w-4" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <CheckSquare className="h-4 w-4" />
              Tarefas
            </TabsTrigger>
            <TabsTrigger value="sequences" className="gap-2">
              <Zap className="h-4 w-4" />
              Sequências
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="flex-1 mt-4">
            <EnhancedKanbanBoard />
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 mt-4">
            <ExecutiveDashboard />
          </TabsContent>

          <TabsContent value="forecast" className="flex-1 mt-4">
            <ForecastPanel />
          </TabsContent>

          <TabsContent value="automations" className="flex-1 mt-4">
            <AutomationPanel />
          </TabsContent>

          <TabsContent value="inbox" className="flex-1 mt-4">
            <WorkspaceInboxMini />
          </TabsContent>

          <TabsContent value="tasks" className="flex-1 mt-4">
            <WorkspaceTasksMini />
          </TabsContent>

          <TabsContent value="sequences" className="flex-1 mt-4">
            <WorkspaceSequencesMini />
          </TabsContent>
        </Tabs>

        {/* AI Copilot Sidebar */}
        <AICopilotPanel />
      </div>
    </AppLayout>
  );
}
