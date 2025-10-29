import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, CreditCard, DollarSign, ShieldCheck } from "lucide-react";

export function FinancialOverview() {
  // Fetch Apollo credits just to display a compact value
  const { data: config } = useQuery({
    queryKey: ["apollo-credits-compact"],
    queryFn: async () => {
      const { data } = await supabase.from("apollo_credit_config").select("*").single();
      return data;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    document.title = "Dashboard Financeiro e APIs | Radar Inteligente";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Dashboard Financeiro com Créditos Apollo e Gerenciamento de APIs em tempo real");
  }, []);

  const used = config?.used_credits ?? 21;
  const total = config?.total_credits ?? 1000;
  const available = total - used;

  return (
    <Card className="bg-card/70 backdrop-blur-md border-border/50 elevation-2 border-glow">
      <CardContent className="p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card/50 to-transparent p-5 hover:shadow-md transition-all hover-scale">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
              <span className="font-medium">APIs Ativas</span>
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold tracking-tight mb-3">
              13<span className="text-xl text-muted-foreground">/20</span>
            </p>
            <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20">Saudável</Badge>
          </div>
          <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card/50 to-transparent p-5 hover:shadow-md transition-all hover-scale">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
              <span className="font-medium">Custo Mensal</span>
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold tracking-tight mb-1">R$ 1.2K</p>
            <p className="text-sm text-muted-foreground mb-2">+ US$ 350</p>
            <Badge variant="outline">Estimado</Badge>
          </div>
          <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card/50 to-transparent p-5 hover:shadow-md transition-all hover-scale">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
              <span className="font-medium">Créditos Apollo</span>
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold tracking-tight mb-3">
              {available}<span className="text-xl text-muted-foreground">/{total}</span>
            </p>
            <Badge className="bg-primary/10 text-primary border-primary/20">Trial Ativo</Badge>
          </div>
          <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card/50 to-transparent p-5 hover:shadow-md transition-all hover-scale">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
              <span className="font-medium">Alertas Críticos</span>
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold tracking-tight mb-3">2</p>
            <Badge variant="destructive" className="pulse-glow">Atenção</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FinancialOverview;
