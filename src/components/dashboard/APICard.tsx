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
    <Card className="bg-card/70 backdrop-blur-md border-border/50 transition-all duration-200 hover:shadow-lg hover-scale">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
        <div className="flex items-center gap-3">
          <div aria-hidden className="text-xl" title={name}>{logo ?? "🔗"}</div>
          <CardTitle className="text-base font-semibold">{name}</CardTitle>
        </div>
        <span className={cn("px-2 py-1 rounded-full text-xs", statusStyles[status])} aria-label={`Status: ${status}`}>
          {status === "active" ? "Ativo" : status === "inactive" ? "Inativo" : "Erro"}
        </span>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Custo mensal</p>
            <p className="font-medium">{cost}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-muted-foreground">Saúde</p>
            <p className="font-medium">{uptime ? `${uptime}% uptime` : "—"}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={onConfigure} aria-label={`Configurar ${name}`}>
            <Settings2 className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default APICard;
