import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, AlertTriangle, Target } from "lucide-react";

export interface PredictionInsight {
  type: "opportunity" | "risk" | "trend";
  title: string;
  description: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  actionLabel?: string;
  onAction?: () => void;
}

export function AIPredictionBanner({ insights }: { insights?: PredictionInsight[] }) {
  const defaultInsights: PredictionInsight[] = [
    {
      type: "opportunity",
      title: "Expansão Regional Detectada",
      description: "12 empresas em São Paulo mostram sinais de crescimento acelerado. Potencial de R$ 2.3M em novos contratos.",
      confidence: 92,
      impact: "high",
      actionLabel: "Ver Empresas",
    },
    {
      type: "risk",
      title: "Alerta de Churn",
      description: "3 empresas com redução de 40% na atividade digital nos últimos 30 dias.",
      confidence: 87,
      impact: "medium",
      actionLabel: "Revisar",
    },
    {
      type: "trend",
      title: "Tendência: Cloud Migration",
      description: "45% das empresas no pipeline estão migrando para soluções cloud. Oportunidade para TOTVS Cloud.",
      confidence: 78,
      impact: "high",
      actionLabel: "Analisar",
    },
  ];

  const data = insights || defaultInsights;

  const getIcon = (type: string) => {
    switch (type) {
      case "opportunity": return TrendingUp;
      case "risk": return AlertTriangle;
      case "trend": return Target;
      default: return Sparkles;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "opportunity": return "from-green-500/20 to-emerald-500/5";
      case "risk": return "from-red-500/20 to-orange-500/5";
      case "trend": return "from-blue-500/20 to-cyan-500/5";
      default: return "from-primary/20 to-accent-cyan/5";
    }
  };

  const getBadgeColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-green-500/10 text-green-700 border-green-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case "low": return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <Card className="bg-card/70 backdrop-blur-md border-border/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent-cyan/5 to-primary/5" />
      <CardContent className="p-6 relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent-cyan/20">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Insights de IA</h3>
            <p className="text-sm text-muted-foreground">Análise preditiva em tempo real</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {data.map((insight, i) => {
            const Icon = getIcon(insight.type);
            return (
              <div
                key={i}
                className={`rounded-xl p-5 bg-gradient-to-br ${getColor(insight.type)} border border-border/50 hover:shadow-lg transition-all duration-300 animate-fade-in`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getBadgeColor(insight.impact)}>
                      {insight.impact === "high" ? "Alto" : insight.impact === "medium" ? "Médio" : "Baixo"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{insight.confidence}%</span>
                  </div>
                </div>
                <h4 className="font-semibold mb-2 text-sm">{insight.title}</h4>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{insight.description}</p>
                {insight.actionLabel && (
                  <Button variant="ghost" size="sm" className="w-full text-xs" onClick={insight.onAction}>
                    {insight.actionLabel}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default AIPredictionBanner;
