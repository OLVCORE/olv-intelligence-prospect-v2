import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditsDashboard } from "@/components/companies/CreditsDashboard";
import { CreditUsageHistory } from "@/components/companies/CreditUsageHistory";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, History, Info, ChevronDown, ChevronUp, Zap } from "lucide-react";

export function ApolloCreditPanelCollapsible() {
  const [open, setOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["apollo-credits-days"],
    queryFn: async () => {
      const { data } = await supabase.from("apollo_credit_config").select("plan_type, trial_ends_at").single();
      return data as { plan_type: string; trial_ends_at: string } | null;
    },
    staleTime: 60_000,
  });

  const { data: credits } = useQuery({
    queryKey: ["apollo-credits-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apollo_credit_config")
        .select("total_credits, used_credits")
        .single();
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
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

  const creditsRemaining = credits 
    ? credits.total_credits - (credits.used_credits || 0)
    : 0;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center">
                <CardTitle className="text-base">Créditos Apollo</CardTitle>
                {badge}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-1 hover:bg-primary/10 rounded transition-colors ml-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Dashboard de créditos Apollo.io em tempo real. Monitore uso diário, créditos restantes e histórico completo de consumo.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xl font-bold text-primary">{creditsRemaining.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">créditos</p>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <CreditsDashboard />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setOpen(true)} 
                className="w-full"
                aria-label="Ver histórico completo"
              >
                <History className="h-4 w-4 mr-2" /> Ver Histórico Completo
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

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

export default ApolloCreditPanelCollapsible;
