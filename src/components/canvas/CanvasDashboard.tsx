import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  Zap, 
  Target, 
  CheckCircle2, 
  Users,
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export function CanvasDashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['canvas-dashboard-metrics'],
    queryFn: async () => {
      // Total de canvas ativos
      const { data: canvasData, error: canvasError } = await supabase
        .from('canvas')
        .select('id, status, created_at, updated_at')
        .eq('status', 'active');

      if (canvasError) throw canvasError;

      // Total de blocos
      const { data: blocksData, error: blocksError } = await supabase
        .from('canvas_blocks')
        .select('id, type');

      if (blocksError) throw blocksError;

      // Atividades recentes
      const { data: activityData, error: activityError } = await supabase
        .from('canvas_activity')
        .select('id, action_type, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (activityError) throw activityError;

      // Tasks criadas a partir de decisões
      const { data: tasksData, error: tasksError } = await supabase
        .from('sdr_tasks')
        .select('id, status')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (tasksError) throw tasksError;

      // Calcular métricas
      const totalCanvas = canvasData?.length || 0;
      const totalBlocks = blocksData?.length || 0;
      const avgBlocksPerCanvas = totalCanvas > 0 ? Math.round(totalBlocks / totalCanvas) : 0;

      // Contagem por tipo de bloco
      const blocksByType = blocksData?.reduce((acc, block) => {
        acc[block.type] = (acc[block.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Atividades por tipo
      const activitiesByType = activityData?.reduce((acc, activity) => {
        acc[activity.action_type] = (acc[activity.action_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Canvas atualizados recentemente (últimos 7 dias)
      const recentlyUpdated = canvasData?.filter(c => 
        new Date(c.updated_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      ).length || 0;

      // Taxa de conclusão de tasks
      const completedTasks = tasksData?.filter(t => t.status === 'done').length || 0;
      const totalTasks = tasksData?.length || 0;
      const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        totalCanvas,
        totalBlocks,
        avgBlocksPerCanvas,
        blocksByType,
        activitiesByType,
        recentlyUpdated,
        totalTasks,
        completedTasks,
        taskCompletionRate,
        totalActivities: activityData?.length || 0
      };
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Dashboard Canvas War Room
        </h2>
        <p className="text-muted-foreground">
          Visão executiva unificada de todas as atividades e resultados dos seus Canvas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Canvas Ativos
              <Zap className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics?.totalCanvas || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.recentlyUpdated || 0} atualizados nos últimos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Blocos Criados
              <Target className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics?.totalBlocks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Média de {metrics?.avgBlocksPerCanvas || 0} blocos por canvas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Taxa de Conclusão
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics?.taskCompletionRate || 0}%</div>
            <Progress value={metrics?.taskCompletionRate || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.completedTasks || 0} de {metrics?.totalTasks || 0} tasks concluídas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Atividades Total
              <Activity className="h-4 w-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics?.totalActivities || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ações registradas no período
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Distribuição de Blocos
            </CardTitle>
            <CardDescription>Tipos de blocos mais utilizados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(metrics?.blocksByType || {}).map(([type, count]) => {
              const total = metrics?.totalBlocks || 1;
              const percentage = Math.round((count / total) * 100);
              const icons: Record<string, string> = {
                insight: 'Insight',
                decision: 'Decisão',
                task: 'Tarefa',
                note: 'Nota',
                reference: 'Referência'
              };
              
              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>{icons[type] || '📋'}</span>
                      <span className="capitalize">{type}</span>
                    </span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
            {Object.keys(metrics?.blocksByType || {}).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum bloco criado ainda
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>Ações mais comuns no período</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(metrics?.activitiesByType || {})
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([action, count]) => {
                const labels: Record<string, string> = {
                  block_created: 'Bloco Criado',
                  block_updated: 'Bloco Atualizado',
                  block_deleted: 'Bloco Deletado',
                  decision_promoted: 'Decisão Promovida',
                  version_created: 'Versão Criada',
                  ai_suggestion: 'Sugestão IA'
                };
                
                return (
                  <div key={action} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">{labels[action] || action}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                );
              })}
            {Object.keys(metrics?.activitiesByType || {}).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma atividade registrada ainda
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
