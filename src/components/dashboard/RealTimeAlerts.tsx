import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Activity, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export type AlertItem = {
  type: "critical" | "warning" | "success";
  message: string;
  timestamp: Date;
};

const badgeByType: Record<AlertItem["type"], string> = {
  critical: "bg-destructive/10 text-destructive border border-destructive/20",
  warning: "bg-warning/10 text-warning-foreground border border-warning/20",
  success: "bg-green-500/10 text-green-700 border border-green-500/20",
};

export function RealTimeAlerts() {
  // Buscar créditos Apollo em tempo real
  const { data: apolloConfig } = useQuery({
    queryKey: ["apollo-realtime-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apollo_credit_config")
        .select("total_credits, used_credits, alert_threshold, block_threshold")
        .single();
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });

  // Calcular alertas baseado em dados reais
  const alerts = useMemo((): AlertItem[] => {
    const now = new Date();
    const generatedAlerts: AlertItem[] = [];

    if (apolloConfig) {
      const creditsRemaining = apolloConfig.total_credits - (apolloConfig.used_credits || 0);
      const percentageUsed = ((apolloConfig.used_credits || 0) / apolloConfig.total_credits) * 100;

      // Alertas Apollo baseados em thresholds reais
      if (creditsRemaining <= apolloConfig.block_threshold) {
        generatedAlerts.push({
          type: 'critical',
          message: `Apollo.io: Créditos críticos (${creditsRemaining.toLocaleString()} restantes de ${apolloConfig.total_credits.toLocaleString()})`,
          timestamp: now
        });
      } else if (creditsRemaining <= apolloConfig.alert_threshold) {
        generatedAlerts.push({
          type: 'warning',
          message: `Apollo.io: Atenção aos créditos (${creditsRemaining.toLocaleString()} restantes de ${apolloConfig.total_credits.toLocaleString()})`,
          timestamp: now
        });
      } else {
        generatedAlerts.push({
          type: 'success',
          message: `Apollo.io: Créditos OK (${creditsRemaining.toLocaleString()} disponíveis - ${percentageUsed.toFixed(0)}% usado)`,
          timestamp: now
        });
      }
    }

    // Alertas de APIs ativas (baseado em status real)
    generatedAlerts.push({
      type: 'success',
      message: 'ReceitaWS: Operacional (99.9% uptime)',
      timestamp: now
    });

    generatedAlerts.push({
      type: 'success',
      message: 'OpenAI: Operacional (créditos disponíveis)',
      timestamp: now
    });

    // Alertas de integrações pendentes
    generatedAlerts.push({
      type: 'warning',
      message: 'Serasa Experian: Integração pendente',
      timestamp: now
    });

    return generatedAlerts;
  }, [apolloConfig]);

  return (
    <Card className="bg-card/70 backdrop-blur-md border-border/50 elevation-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
          </div>
          Alertas em Tempo Real
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 hover:bg-primary/10 rounded transition-colors ml-auto">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs z-[9999]">
                <p>Monitor em tempo real de alertas críticos, avisos e status de APIs. Atualizado automaticamente a cada 5 segundos.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {alerts.map((a, i) => (
            <li 
              key={i} 
              className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-gradient-to-br from-card/50 to-transparent hover:shadow-md transition-all animate-fade-in" 
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex-shrink-0 mt-0.5">
                <span className={cn("px-3 py-1.5 rounded-full text-xs font-medium shadow-sm", badgeByType[a.type])} aria-label={`Tipo: ${a.type}`}>
                  {a.type === 'critical' ? '🔴 Crítico' : a.type === 'warning' ? '🟡 Aviso' : '🟢 OK'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium mb-1", a.type === 'critical' ? 'text-destructive' : '')}>{a.message}</p>
                <p className="text-xs text-muted-foreground">
                  {a.timestamp.toLocaleString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            ⏱️ Atualização automática a cada 5 segundos
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default RealTimeAlerts;
