import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, AlertCircle, Zap, ExternalLink, Eye, EyeOff, Copy, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { useUserRole } from "@/hooks/useUserRole";
import { useState } from "react";
import { toast } from "sonner";

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
    envVarName?: string;
    apiKey?: string;
  }>;
  summary: {
    online: number;
    total: number;
    percentage: number;
  };
}

export function SystemHealthPanel() {
  const { isAdmin, isLoading: isLoadingRole } = useUserRole();
  const [revealDialogOpen, setRevealDialogOpen] = useState(false);
  const [selectedApi, setSelectedApi] = useState<typeof apis[0] | null>(null);
  const [password, setPassword] = useState('');
  const [revealedKey, setRevealedKey] = useState('');
  const [isRevealing, setIsRevealing] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  
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

  const handleRevealKey = async () => {
    if (!password || !selectedApi?.envVarName) return;

    setIsRevealing(true);
    try {
      const { data, error } = await supabase.functions.invoke('reveal-api-key', {
        body: {
          envVarName: selectedApi.envVarName,
          password: password,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setRevealedKey(data.apiKey);
      toast.success('Chave revelada com sucesso');
    } catch (error: any) {
      console.error('Error revealing key:', error);
      toast.error('Erro ao revelar chave: ' + error.message);
    } finally {
      setIsRevealing(false);
    }
  };

  const handleCopyKey = async (key: string, apiName: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(apiName);
      toast.success('Chave copiada!');
      setTimeout(() => setCopiedKey(''), 2000);
    } catch (error) {
      toast.error('Erro ao copiar chave');
    }
  };

  const handleOpenRevealDialog = (api: typeof apis[0]) => {
    setSelectedApi(api);
    setPassword('');
    setRevealedKey('');
    setRevealDialogOpen(true);
  };

  const handleCloseRevealDialog = () => {
    setRevealDialogOpen(false);
    setPassword('');
    setRevealedKey('');
    setSelectedApi(null);
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
                        {api.apiKey && (
                          <div className="flex items-center gap-2 mt-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {api.apiKey}
                            </code>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRevealDialog(api);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
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
    <>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Status das APIs e Integrações
            <Badge variant="outline" className="text-xs">Painel Admin</Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-1 hover:bg-primary/10 rounded transition-colors ml-auto">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Monitor de saúde e status de todas as APIs e integrações do sistema. Visualize custos estimados, uptime e configure chaves de acesso de forma segura.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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

      {/* Dialog para revelar chave de API */}
      <AlertDialog open={revealDialogOpen} onOpenChange={handleCloseRevealDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🔐 Revelar Chave de API</AlertDialogTitle>
            <AlertDialogDescription>
              {!revealedKey ? (
                <>
                  Para revelar a chave completa de <strong>{selectedApi?.name}</strong>, 
                  confirme sua senha de administrador:
                </>
              ) : (
                <>
                  Chave completa de <strong>{selectedApi?.name}</strong>:
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {!revealedKey ? (
            <div className="space-y-4 py-4">
              <Input
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isRevealing) {
                    handleRevealKey();
                  }
                }}
                autoFocus
              />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-muted px-3 py-2 rounded font-mono break-all">
                  {revealedKey}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleCopyKey(revealedKey, selectedApi?.name || '')}
                >
                  {copiedKey === selectedApi?.name ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ Mantenha esta chave segura. Não compartilhe em lugares públicos.
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseRevealDialog}>
              {revealedKey ? 'Fechar' : 'Cancelar'}
            </AlertDialogCancel>
            {!revealedKey && (
              <AlertDialogAction onClick={handleRevealKey} disabled={!password || isRevealing}>
                {isRevealing ? 'Validando...' : 'Revelar Chave'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
