import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Flame, TrendingUp, Activity, Zap } from "lucide-react";

interface LeadScoreBadgeProps {
  score: number;
  showIcon?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LeadScoreBadge({ 
  score, 
  showIcon = true, 
  showLabel = true,
  size = "md",
  className = ""
}: LeadScoreBadgeProps) {
  
  const getScoreConfig = (score: number) => {
    if (score >= 75) {
      return {
        variant: "destructive" as const,
        icon: Flame,
        label: "Hot Lead",
        color: "text-red-600 dark:text-red-400",
        description: "Alta prioridade - contato urgente recomendado"
      };
    } else if (score >= 50) {
      return {
        variant: "default" as const,
        icon: TrendingUp,
        label: "Qualificado",
        color: "text-orange-600 dark:text-orange-400",
        description: "Lead qualificado - considerar abordagem"
      };
    } else if (score >= 25) {
      return {
        variant: "secondary" as const,
        icon: Activity,
        label: "Em Desenvolvimento",
        color: "text-blue-600 dark:text-blue-400",
        description: "Potencial moderado - continuar nutrição"
      };
    } else {
      return {
        variant: "outline" as const,
        icon: Zap,
        label: "Novo",
        color: "text-gray-600 dark:text-gray-400",
        description: "Score baixo - enriquecer dados"
      };
    }
  };

  const config = getScoreConfig(score);
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={config.variant}
            className={`${sizeClasses[size]} ${className} cursor-help flex items-center gap-1.5`}
          >
            {showIcon && <Icon size={iconSizes[size]} className={config.color} />}
            <span className="font-semibold">{score}</span>
            {showLabel && size !== "sm" && (
              <span className="hidden sm:inline">/ 100</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold flex items-center gap-2">
              <Icon size={16} className={config.color} />
              {config.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {config.description}
            </p>
            <div className="pt-2 text-xs border-t mt-2">
              <p className="font-medium mb-1">Composição do Score:</p>
              <ul className="space-y-0.5 text-muted-foreground">
                <li>• Maturidade Digital (25%)</li>
                <li>• Sinais de Intenção (30%)</li>
                <li>• Fit com TOTVS (20%)</li>
                <li>• Engajamento (15%)</li>
                <li>• Tamanho/Receita (10%)</li>
              </ul>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
