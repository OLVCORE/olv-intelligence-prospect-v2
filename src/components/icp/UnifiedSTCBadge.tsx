import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, CheckCircle, XCircle, AlertTriangle, FileQuestion } from 'lucide-react';
import { useLatestSimpleTOTVSCheck } from '@/hooks/useSimpleTOTVSCheck';
import { cn } from '@/lib/utils';

interface UnifiedSTCBadgeProps {
  companyId: string;
  onViewReport?: () => void;
  className?: string;
}

/**
 * 🎯 Badge UNIFICADO para Simple TOTVS Check
 * Garante consistência visual em TODOS os módulos:
 * - Busca Inteligente (CompaniesManagementPage)
 * - Upload em Massa (ICPQuarantine)
 * - Análise Individual (ICPAnalysis)
 * - Análise em Massa (ICPQuarantine batch)
 */
export function UnifiedSTCBadge({ companyId, onViewReport, className }: UnifiedSTCBadgeProps) {
  const { data: check, isLoading } = useLatestSimpleTOTVSCheck(companyId);

  // Loading state
  if (isLoading) {
    return (
      <Badge variant="outline" className={cn("gap-1.5", className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        Verificando...
      </Badge>
    );
  }

  // Não verificado (sem dados V2)
  if (!check) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={cn("gap-1.5", className)}>
              <FileQuestion className="h-3 w-3" />
              Não verificado
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Nenhuma verificação V2 encontrada</p>
            <p className="text-xs text-muted-foreground">Execute "Atualizar Verificação"</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Determinar se a verificação é recente (< 24h)
  const isRecent = check.checked_at 
    ? (new Date().getTime() - new Date(check.checked_at).getTime()) < 86400000 
    : false;

  // Status info mapping
  const getStatusInfo = () => {
    switch (check.status) {
      case 'go':
        return {
          icon: CheckCircle,
          label: 'GO',
          variant: 'default' as const,
          className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
        };
      case 'no-go':
        return {
          icon: XCircle,
          label: 'NO-GO',
          variant: 'destructive' as const,
          className: 'bg-red-500/10 text-red-700 border-red-200 hover:bg-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30'
        };
      case 'revisar':
      default:
        return {
          icon: AlertTriangle,
          label: 'REVISAR',
          variant: 'secondary' as const,
          className: 'bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
        };
    }
  };

  const { icon: Icon, label, className: statusClassName } = getStatusInfo();

  // Mapear confidence para português
  const confidenceLabel = {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa'
  }[check.confidence] || 'N/A';

  const badgeContent = (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1.5 transition-all",
        statusClassName,
        onViewReport && "cursor-pointer hover:scale-105",
        className
      )}
      onClick={onViewReport}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold">{label}</span>
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded",
                check.confidence === 'high' && "bg-green-500/20 text-green-700 dark:text-green-400",
                check.confidence === 'medium' && "bg-amber-500/20 text-amber-700 dark:text-amber-400",
                check.confidence === 'low' && "bg-gray-500/20 text-gray-700 dark:text-gray-400"
              )}>
                Confiança: {confidenceLabel}
              </span>
            </div>
            
            <div className="text-xs text-muted-foreground">
              📊 {check.total_evidences || 0} evidências encontradas
            </div>
            
            {check.reasoning && (
              <p className="text-xs text-muted-foreground italic border-t pt-1.5 mt-1.5">
                {check.reasoning}
              </p>
            )}
            
            {check.checked_at && (
              <p className="text-xs text-muted-foreground border-t pt-1.5 mt-1.5">
                Verificado: {new Date(check.checked_at).toLocaleString('pt-BR')}
                {isRecent && ' ✨'}
              </p>
            )}

            {onViewReport && (
              <p className="text-xs text-primary font-medium border-t pt-1.5 mt-1.5">
                👆 Clique para ver relatório completo
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
