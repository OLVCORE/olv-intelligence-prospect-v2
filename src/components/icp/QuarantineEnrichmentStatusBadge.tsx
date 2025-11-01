import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QuarantineEnrichmentStatusBadgeProps {
  rawAnalysis: any;
  showProgress?: boolean;
}

export function QuarantineEnrichmentStatusBadge({ 
  rawAnalysis, 
  showProgress = false 
}: QuarantineEnrichmentStatusBadgeProps) {
  // Verificar quais enriquecimentos existem
  const hasReceitaFederal = !!rawAnalysis?.receita_federal;
  const hasApollo = !!rawAnalysis?.apollo;
  const hasEnrichment360 = !!rawAnalysis?.enrichment_360;
  
  // Calcular porcentagem de completude
  const totalChecks = 3;
  const completedChecks = [hasReceitaFederal, hasApollo, hasEnrichment360].filter(Boolean).length;
  const completionPercentage = Math.round((completedChecks / totalChecks) * 100);
  
  const isFullyEnriched = completionPercentage === 100;
  const hasAnyEnrichment = completionPercentage > 0;

  const getStatusInfo = () => {
    // >= 70%: verde limão sólido
    if (completionPercentage >= 70) {
      return {
        icon: <CheckCircle2 className="h-3 w-3" />,
        label: `${completionPercentage}%`,
        variant: "success" as const,
        className: "",
      };
    }
    
    // 50-65%: amarelo
    if (completionPercentage >= 50 && completionPercentage < 70) {
      return {
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        label: `${completionPercentage}%`,
        variant: "warning" as const,
        className: "",
      };
    }

    // < 30%: vermelho
    if (completionPercentage < 30) {
      return {
        icon: <XCircle className="h-3 w-3" />,
        label: `${completionPercentage}%`,
        variant: "destructive" as const,
        className: "",
      };
    }

    // 30-49%: laranja (fallback)
    return {
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      label: `${completionPercentage}%`,
      variant: "outline" as const,
      className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    };
  };

  const info = getStatusInfo();

  const tooltipContent = (
    <div className="space-y-2 text-xs">
      <p className="font-semibold">Status de Enriquecimento</p>
      <div className="space-y-1">
        <p className={hasReceitaFederal ? "text-green-600" : "text-muted-foreground"}>
          {hasReceitaFederal ? "✓" : "○"} Receita Federal
        </p>
        <p className={hasApollo ? "text-green-600" : "text-muted-foreground"}>
          {hasApollo ? "✓" : "○"} Apollo
        </p>
        <p className={hasEnrichment360 ? "text-green-600" : "text-muted-foreground"}>
          {hasEnrichment360 ? "✓" : "○"} Enriquecimento 360°
        </p>
      </div>
      <div className="pt-2 border-t">
        <p className="text-muted-foreground">
          {completedChecks} de {totalChecks} enriquecimentos completos
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
              <Progress value={completionPercentage} className="h-1 w-20" />
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
