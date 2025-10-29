import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Settings2 } from "lucide-react";
import React from "react";

export type APIStatus = "active" | "inactive" | "error";

export interface APICardProps {
  name: string;
  status: APIStatus;
  cost: string;
  uptime?: number;
  logo?: React.ReactNode;
  onConfigure?: () => void;
}

const statusStyles: Record<APIStatus, string> = {
  active: "bg-primary/10 text-primary border border-primary/20",
  inactive: "bg-warning/10 text-warning-foreground border border-warning/20",
  error: "bg-destructive/10 text-destructive border border-destructive/20",
};

export function APICard({ name, status, cost, uptime, logo, onConfigure }: APICardProps) {
  return (
    <Card className="bg-card/70 backdrop-blur-md border-border/50 transition-all duration-300 hover:shadow-lg hover-scale border-glow depth-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
        <div className="flex items-center gap-3">
          <div aria-hidden className="text-2xl" title={name}>{logo ?? "🔗"}</div>
          <CardTitle className="text-base font-semibold">{name}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("status-dot", {
            "status-dot-active": status === "active",
            "status-dot-inactive": status === "inactive",
            "status-dot-error": status === "error",
          })} />
          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusStyles[status])} aria-label={`Status: ${status}`}>
            {status === "active" ? "Ativo" : status === "inactive" ? "Inativo" : "Erro"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Custo mensal</p>
            <p className="font-semibold text-foreground">{cost}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-muted-foreground text-xs">Saúde</p>
            <p className="font-semibold text-foreground">{uptime ? `${uptime}%` : "—"}</p>
          </div>
        </div>
        {uptime !== undefined && uptime > 0 && (
          <div className="mb-4">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-500", {
                  "bg-gradient-to-r from-green-500 to-emerald-500": uptime >= 99,
                  "bg-gradient-to-r from-yellow-500 to-orange-500": uptime >= 95 && uptime < 99,
                  "bg-gradient-to-r from-red-500 to-orange-500": uptime < 95,
                })}
                style={{ width: `${uptime}%` }}
              />
            </div>
          </div>
        )}
        <Button variant="outline" size="sm" className="w-full hover:bg-primary/5 hover:border-primary/30" onClick={onConfigure} aria-label={`Configurar ${name}`}>
          <Settings2 className="h-4 w-4 mr-2" />
          Configurar
        </Button>
      </CardContent>
    </Card>
  );
}

export default APICard;
