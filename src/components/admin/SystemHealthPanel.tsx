import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, AlertCircle, Zap, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserRole } from "@/hooks/useUserRole";

interface APIHealth {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  lastCheck: string;
}

interface APIHealthResponse {
  apis: Array<{
    name: string;
    status: 'online' | 'offline';
    configured: boolean;
    category: string;
    priority: 'critical' | 'high' | 'medium';
    description: string;
    estimatedCost: string;
    signupUrl: string;
  }>;
  summary: {
    online: number;
    total: number;
    percentage: number;
  };
}

export function SystemHealthPanel() {
  const { isAdmin, isLoading: isLoadingRole } = useUserRole();
  
  const { data: health, isLoading } = useQuery({
    queryKey: ['api-health'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('api-health');
      
      if (error) throw error;
      
      return data as APIHealthResponse;
    },
    refetchInterval: 300000,
    staleTime: 240000,
  });

  // Não mostrar para usuários não-admin
  if (isLoadingRole || isLoading) {
    return null;
  }

  if (!isAdmin) {
    return null;
  }

  const apis = health?.apis || [];
  const summary = health?.summary || { online: 0, total: 0, percentage: 0 };

  // Agrupar por prioridade
  const criticalApis = apis.filter(api => api.priority === 'critical');
  const highApis = apis.filter(api => api.priority === 'high');
  const mediumApis = apis.filter(api => api.priority === 'medium');
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return { label: '🔴 Crítica', variant: 'destructive' as const };
      case 'high': return { label: '🟠 Alta', variant: 'default' as const };
      case 'medium': return { label: '🟡 Média', variant: 'secondary' as const };
      default: return { label: 'Normal', variant: 'outline' as const };
    }
  };

  const renderApiList = (apiList: typeof apis, title: string, priorityLabel: string) => {
    if (apiList.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wide">{title}</h3>
          <Badge variant={getPriorityBadge(apiList[0].priority).variant} className="text-xs">
            {priorityLabel}
          </Badge>
        </div>
        {apiList.map((api, i) => (
          <TooltipProvider key={i}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all cursor-help">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      {api.status === 'online' ? (
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${getPriorityColor(api.priority)}`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{api.name}</span>
                          <Badge
                            variant={api.status === 'online' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {api.status === 'online' ? '✓ Ativo' : '○ Inativo'}
                          </Badge>
                        </div>
                        <a 
                          href={api.signupUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {api.signupUrl.replace('https://', '').split('/')[0]}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-xs font-bold ${getPriorityColor(api.priority)}`}>
                        {api.estimatedCost}
                      </div>
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="font-semibold mb-1">{api.name}</p>
                <p className="text-xs">{api.description}</p>
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className="text-xs font-semibold">Custo estimado:</p>
                  <p className="text-xs text-primary">{api.estimatedCost}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Status das APIs e Integrações
          <Badge variant="outline" className="text-xs">Painel Admin</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Resumo Geral */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div>
              <span className="text-sm font-semibold text-foreground">Sistemas Configurados</span>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.percentage}% das integrações ativas
              </p>
            </div>
            <span className="text-3xl font-bold text-primary">
              {summary.online}/{summary.total}
            </span>
          </div>

          {/* APIs Críticas */}
          {renderApiList(criticalApis, '🔴 APIs Críticas', 'Essenciais para MVP')}
          
          {/* APIs Alta Prioridade */}
          {renderApiList(highApis, '🟠 APIs Alta Prioridade', 'Funcionalidade Completa')}
          
          {/* APIs Média Prioridade */}
          {renderApiList(mediumApis, '🟡 APIs Complementares', 'Pós-MVP')}
        </div>
      </CardContent>
    </Card>
  );
}
