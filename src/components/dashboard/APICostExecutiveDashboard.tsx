import { Card, CardContent } from "@/components/ui/card";
import { Activity, DollarSign, Zap, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TOTAL_APIS = 21; // Total de APIs no sistema
const ACTIVE_APIS = 13; // APIs ativas
const PLATFORM_COST_MONTHLY = 305; // US$ total de plataformas
const API_COST_MONTHLY = 150; // Estimativa de custos de API por uso

export function APICostExecutiveDashboard() {
  const { data: apolloCredits } = useQuery({
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

  const creditsRemaining = apolloCredits 
    ? apolloCredits.total_credits - (apolloCredits.used_credits || 0)
    : 0;
  
  const creditsPercentage = apolloCredits
    ? ((creditsRemaining / apolloCredits.total_credits) * 100).toFixed(0)
    : 0;

  const kpis = [
    {
      label: "APIs Ativas",
      value: `${ACTIVE_APIS}/${TOTAL_APIS}`,
      sublabel: `${((ACTIVE_APIS / TOTAL_APIS) * 100).toFixed(0)}% operacionais`,
      icon: Activity,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20"
    },
    {
      label: "Custo Mensal Total",
      value: `US$ ${PLATFORM_COST_MONTHLY + API_COST_MONTHLY}`,
      sublabel: `Plataformas + APIs`,
      icon: DollarSign,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20"
    },
    {
      label: "Créditos Apollo",
      value: creditsRemaining.toLocaleString(),
      sublabel: `${creditsPercentage}% disponível`,
      icon: Zap,
      color: creditsRemaining < 200 ? "text-red-500" : creditsRemaining < 500 ? "text-yellow-500" : "text-primary",
      bgColor: creditsRemaining < 200 ? "bg-red-500/10" : creditsRemaining < 500 ? "bg-yellow-500/10" : "bg-primary/10",
      borderColor: creditsRemaining < 200 ? "border-red-500/20" : creditsRemaining < 500 ? "border-yellow-500/20" : "border-primary/20"
    },
    {
      label: "Performance Geral",
      value: "99.2%",
      sublabel: "Uptime médio",
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card 
            key={index}
            className={`border ${kpi.borderColor} bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {kpi.label}
                  </p>
                  <p className={`text-2xl font-bold ${kpi.color}`}>
                    {kpi.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {kpi.sublabel}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${kpi.bgColor} ${kpi.borderColor} border`}>
                  <Icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default APICostExecutiveDashboard;
