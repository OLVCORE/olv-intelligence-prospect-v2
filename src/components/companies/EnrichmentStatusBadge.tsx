import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useEnrichmentStatus } from "@/hooks/useEnrichmentStatus";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnrichmentStatusBadgeProps {
  companyId: string;
  showProgress?: boolean;
}

export function EnrichmentStatusBadge({ companyId, showProgress = false }: EnrichmentStatusBadgeProps) {
  const { data: status, isLoading } = useEnrichmentStatus(companyId);

  if (isLoading || !status) {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Carregando...
      </Badge>
    );
  }

  const getStatusInfo = () => {
    // >= 70%: verde limão sólido
    if (status.completionPercentage >= 70) {
      return {
        icon: <CheckCircle2 className="h-3 w-3" />,
        label: `${status.completionPercentage}%`,
        variant: "success" as const,
        className: "",
      };
    }
    
    // 50-65%: amarelo
    if (status.completionPercentage >= 50 && status.completionPercentage < 70) {
      return {
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        label: `${status.completionPercentage}%`,
        variant: "warning" as const,
        className: "",
      };
    }

    // < 30%: vermelho
    if (status.completionPercentage < 30) {
      return {
        icon: <AlertCircle className="h-3 w-3" />,
        label: `${status.completionPercentage}%`,
        variant: "destructive" as const,
        className: "",
      };
    }

    // 30-49%: laranja (fallback)
    return {
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      label: `${status.completionPercentage}%`,
      variant: "outline" as const,
      className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    };
  };

  const info = getStatusInfo();

  const tooltipContent = (
    <div className="space-y-2 text-xs">
      <p className="font-semibold">{status.companyName}</p>
      <div className="space-y-1">
        <p className={status.hasReceitaWS ? "text-green-600" : "text-muted-foreground"}>
          {status.hasReceitaWS ? "✓" : "○"} Dados ReceitaWS
        </p>
        <p className={status.hasDecisionMakers ? "text-green-600" : "text-muted-foreground"}>
          {status.hasDecisionMakers ? "✓" : "○"} Decisores
        </p>
        <p className={status.hasDigitalPresence ? "text-green-600" : "text-muted-foreground"}>
          {status.hasDigitalPresence ? "✓" : "○"} Presença Digital
        </p>
        <p className={status.hasMaturityScore ? "text-green-600" : "text-muted-foreground"}>
          {status.hasMaturityScore ? "✓" : "○"} Maturidade Digital
        </p>
        <p className={status.hasLegalData ? "text-green-600" : "text-muted-foreground"}>
          {status.hasLegalData ? "✓" : "○"} Saúde Jurídica
        </p>
        <p className={status.hasInsights ? "text-green-600" : "text-muted-foreground"}>
          {status.hasInsights ? "✓" : "○"} Insights IA
        </p>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex flex-col gap-2">
            <Badge variant={info.variant} className={`gap-1 ${info.className}`}>
              {info.icon}
              {info.label}
            </Badge>
            {showProgress && (
              <Progress value={status.completionPercentage} className="h-1 w-20" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-60">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
