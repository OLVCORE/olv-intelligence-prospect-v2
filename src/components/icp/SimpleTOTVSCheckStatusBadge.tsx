import { Badge } from "@/components/ui/badge";
import { Loader2, Target, Clock, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useLatestSimpleTOTVSCheck } from "@/hooks/useSimpleTOTVSCheck";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SimpleTOTVSCheckStatusBadgeProps {
  companyId: string;
  onViewReport?: () => void;
}

export function SimpleTOTVSCheckStatusBadge({ 
  companyId, 
  onViewReport 
}: SimpleTOTVSCheckStatusBadgeProps) {
  const { data: check, isLoading } = useLatestSimpleTOTVSCheck(companyId);

  if (isLoading) {
    return (
      <Badge variant="outline" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
        <Loader2 className="h-3 w-3 animate-spin" />
        Verificando...
      </Badge>
    );
  }

  if (!check) {
    return (
      <Badge variant="outline" className="gap-1 bg-red-500/10 text-red-600 border-red-500/20">
        <XCircle className="h-3 w-3" />
        Não verificado
      </Badge>
    );
  }

  // Check se foi verificado recentemente (últimas 24h)
  const checkDate = new Date(check.checked_at);
  const now = new Date();
  const hoursDiff = (now.getTime() - checkDate.getTime()) / (1000 * 60 * 60);
  const isRecent = hoursDiff < 24;

  const getStatusInfo = () => {
    if (check.status === 'go') {
      return {
        icon: <CheckCircle className="h-3 w-3" />,
        label: 'GO',
        variant: 'default' as const,
        className: isRecent 
          ? 'bg-green-500/10 text-green-600 border-green-500/20'
          : 'bg-green-500/5 text-green-500 border-green-500/10',
      };
    }

    if (check.status === 'no-go') {
      return {
        icon: <XCircle className="h-3 w-3" />,
        label: 'NO-GO',
        variant: 'destructive' as const,
        className: isRecent
          ? 'bg-red-500/10 text-red-600 border-red-500/20'
          : 'bg-red-500/5 text-red-500 border-red-500/10',
      };
    }

    return {
      icon: <AlertTriangle className="h-3 w-3" />,
      label: 'REVISAR',
      variant: 'secondary' as const,
      className: isRecent
        ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
        : 'bg-yellow-500/5 text-yellow-500 border-yellow-500/10',
    };
  };

  const info = getStatusInfo();
  
  const tooltipContent = (
    <div className="space-y-2 text-xs">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4" />
        <span className="font-semibold">Simple TOTVS Check</span>
      </div>
      <div className="space-y-1">
        <p>Status: <span className="font-semibold">{info.label}</span></p>
        <p>Confiança: <span className="font-semibold capitalize">{check.confidence}</span></p>
        <p>Evidências: <span className="font-semibold">{check.total_evidences}</span></p>
        <p className="text-muted-foreground">
          Verificado {formatDistanceToNow(checkDate, { addSuffix: true, locale: ptBR })}
        </p>
        {onViewReport && (
          <p className="text-primary mt-2">Clique para ver relatório completo</p>
        )}
      </div>
      {!isRecent && (
        <p className="text-yellow-600 text-xs flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Verificação antiga - considere atualizar
        </p>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onViewReport}
            className="inline-flex"
            disabled={!onViewReport}
          >
            <Badge 
              variant={info.variant} 
              className={`gap-1 ${info.className} ${onViewReport ? 'cursor-pointer hover:opacity-80' : ''}`}
            >
              {info.icon}
              {info.label}
            </Badge>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-64">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
