import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Activity, Info } from "lucide-react";

export type AlertItem = {
  type: "critical" | "warning" | "success";
  message: string;
  timestamp: Date | string;
};

export const ALERTS: AlertItem[] = [
  { type: 'critical', message: 'Apollo.io: Créditos baixos (200 restantes)', timestamp: new Date() },
  { type: 'warning', message: 'Serasa: Integração pendente', timestamp: new Date() },
  { type: 'success', message: 'ReceitaWS: Operacional (99.9% uptime)', timestamp: new Date() },
  { type: 'critical', message: 'OpenAI: Limite de rate próximo (80% usado)', timestamp: new Date() },
];

const badgeByType: Record<AlertItem["type"], string> = {
  critical: "bg-destructive/10 text-destructive border border-destructive/20",
  warning: "bg-warning/10 text-warning-foreground border border-warning/20",
  success: "bg-green-500/10 text-green-700 border border-green-500/20",
};

export function RealTimeAlerts({ items = ALERTS }: { items?: AlertItem[] }) {
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
              <TooltipContent className="max-w-xs">
                <p>Monitor em tempo real de alertas críticos, avisos e status de APIs. Mantenha-se informado sobre eventos importantes que requerem atenção imediata.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((a, i) => (
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
                <p className="text-xs text-muted-foreground">{new Date(a.timestamp).toLocaleString('pt-BR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default RealTimeAlerts;
