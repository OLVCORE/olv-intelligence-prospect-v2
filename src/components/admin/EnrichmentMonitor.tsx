import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAllEnrichmentStatus } from "@/hooks/useEnrichmentStatus";
import { Activity, CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function EnrichmentMonitor() {
  const { data: statusList, isLoading } = useAllEnrichmentStatus();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  const totalCompanies = statusList?.length || 0;
  const fullyEnriched = statusList?.filter(s => s.isFullyEnriched).length || 0;
  const inProgress = statusList?.filter(s => !s.isFullyEnriched && s.completionPercentage > 0).length || 0;
  const notStarted = statusList?.filter(s => s.completionPercentage === 0).length || 0;

  const overallCompletion = totalCompanies > 0 
    ? Math.round((fullyEnriched / totalCompanies) * 100)
    : 0;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Status de Enriquecimento
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 hover:bg-primary/10 rounded transition-colors">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs whitespace-normal">
                <p className="break-words">Monitor em tempo real do processo de enriquecimento automático de dados das empresas. Inclui informações de Apollo.io, ReceitaWS, tecnologias detectadas e análise de maturidade digital.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Progresso da análise automática de empresas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progresso Geral</span>
            <span className="text-2xl font-bold">{overallCompletion}%</span>
          </div>
          <Progress value={overallCompletion} className="h-3" />
        </div>

        {/* Stats Grid */}
        <TooltipProvider>
          <div className="grid grid-cols-3 gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20 cursor-help">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{fullyEnriched}</p>
                  <p className="text-xs text-muted-foreground">Completas</p>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs whitespace-normal">
                <p className="break-words">Empresas com 100% dos dados enriquecidos incluindo informações financeiras, decisores, tecnologias e análise completa.</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 cursor-help">
                  <Loader2 className="h-6 w-6 text-blue-600 mx-auto mb-2 animate-spin" />
                  <p className="text-2xl font-bold">{inProgress}</p>
                  <p className="text-xs text-muted-foreground">Em Progresso</p>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs whitespace-normal">
                <p className="break-words">Empresas em processo de enriquecimento. Dados sendo coletados de múltiplas fontes e APIs em paralelo.</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 cursor-help">
                  <AlertCircle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{notStarted}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs whitespace-normal">
                <p className="break-words">Empresas aguardando início do processo de enriquecimento. Serão processadas automaticamente na fila.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Recent Activity */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Empresas Recentes</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {statusList?.slice(0, 10).map((status) => (
              <div key={status.companyId} className="flex items-center justify-between p-2 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{status.companyName}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Progress value={status.completionPercentage} className="w-16 h-2" />
                  <Badge 
                    variant={status.isFullyEnriched ? "default" : "secondary"}
                    className="w-12 justify-center"
                  >
                    {status.completionPercentage}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
