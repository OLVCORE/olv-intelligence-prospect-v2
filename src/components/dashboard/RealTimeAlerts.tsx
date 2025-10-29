import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    <Card className="bg-card/70 backdrop-blur-md border-border/50">
      <CardHeader>
        <CardTitle>Alertas em Tempo Real</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((a, i) => (
            <li key={i} className="flex items-start gap-3 p-3 rounded-xl border bg-card animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <span className={cn("px-2 py-1 rounded-full text-xs mt-0.5", badgeByType[a.type])}>
                {a.type === 'critical' ? 'Crítico' : a.type === 'warning' ? 'Aviso' : 'OK'}
              </span>
              <div className="flex-1">
                <p className={cn("text-sm", a.type === 'critical' ? 'pulse' : '')}>{a.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(a.timestamp).toLocaleString('pt-BR')}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default RealTimeAlerts;
