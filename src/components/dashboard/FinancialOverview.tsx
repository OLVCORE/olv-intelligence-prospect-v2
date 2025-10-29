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

  return (
    <Card className="bg-card/70 backdrop-blur-md border-border/50">
      <CardContent className="p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>APIs Ativas</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold">13<span className="text-muted-foreground">/20</span></p>
            <Badge variant="secondary" className="mt-3">Saudável</Badge>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Custo Mensal Estimado</span>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold">R$ 1.2K <span className="text-muted-foreground">+ US$ 350</span></p>
            <Badge variant="outline" className="mt-3">Estimate</Badge>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Créditos Apollo</span>
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold">{total - used}<span className="text-muted-foreground">/{total}</span></p>
            <Badge className="mt-3">Trial</Badge>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Alertas Críticos</span>
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold">2</p>
            <Badge variant="destructive" className="mt-3">Atenção</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FinancialOverview;
