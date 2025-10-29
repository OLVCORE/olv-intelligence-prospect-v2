import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CreditsDashboard } from "@/components/companies/CreditsDashboard";
import { CreditUsageHistory } from "@/components/companies/CreditUsageHistory";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, History, Info, Settings2 } from "lucide-react";

export function ApolloCreditPanel() {
  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["apollo-credits-days"],
    queryFn: async () => {
      const { data } = await supabase.from("apollo_credit_config").select("plan_type, trial_ends_at").single();
      return data as { plan_type: string; trial_ends_at: string } | null;
    },
    staleTime: 60_000,
  });

  const { data: fullConfig, refetch: refetchConfig } = useQuery({
    queryKey: ["apollo-credits-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("apollo_credit_config").select("id, total_credits, alert_threshold, block_threshold").single();
      if (error) throw error;
      return data as { id: string; total_credits: number; alert_threshold: number; block_threshold: number };
    },
  });

  const badge = useMemo(() => {
    if (!config || config.plan_type !== "trial" || !config.trial_ends_at) return null;
    const daysLeft = Math.max(0, Math.ceil((new Date(config.trial_ends_at).getTime() - Date.now()) / (1000*60*60*24)));
    return (
      <Badge className="ml-2" variant="secondary">
        <Clock className="h-3.5 w-3.5 mr-1" /> Trial - {daysLeft} dias restantes
      </Badge>
    );
  }, [config]);

  return (
    <Card className="bg-card/70 backdrop-blur-md border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          Créditos Apollo {badge}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 hover:bg-primary/10 rounded transition-colors ml-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Dashboard de créditos Apollo.io em tempo real. Monitore uso diário, créditos restantes e histórico completo de consumo para otimizar enriquecimento de dados.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} aria-label="Ver histórico completo">
          <History className="h-4 w-4 mr-2" /> Ver Histórico Completo
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <CreditsDashboard />
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Uso de Créditos</DialogTitle>
          </DialogHeader>
          <CreditUsageHistory />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default ApolloCreditPanel;
