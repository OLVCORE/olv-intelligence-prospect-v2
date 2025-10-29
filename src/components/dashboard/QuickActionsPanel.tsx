import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Search,
  UserPlus,
  FileText,
  BarChart3,
  Zap,
  Settings,
} from "lucide-react";

export function QuickActionsPanel() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Search,
      label: "Buscar Empresas",
      description: "Encontrar novas oportunidades",
      badge: null,
      onClick: () => navigate("/companies"),
    },
    {
      icon: UserPlus,
      label: "Adicionar Lead",
      description: "Cadastrar novo prospect",
      badge: null,
      onClick: () => navigate("/companies"),
    },
    {
      icon: FileText,
      label: "Relatórios",
      description: "Gerar análises",
      badge: "3 novos",
      onClick: () => {},
    },
    {
      icon: BarChart3,
      label: "Analytics",
      description: "Ver métricas detalhadas",
      badge: null,
      onClick: () => navigate("/sdr/pipeline"),
    },
    {
      icon: Zap,
      label: "Enrichment",
      description: "Atualizar dados",
      badge: "12 pendentes",
      onClick: () => {},
    },
    {
      icon: Settings,
      label: "Configurações",
      description: "Ajustar preferências",
      badge: null,
      onClick: () => {},
    },
  ];

  return (
    <Card className="bg-card/70 backdrop-blur-md border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {actions.map((action, i) => (
            <Button
              key={i}
              variant="outline"
              className="h-auto p-4 justify-start hover:bg-primary/5 hover:border-primary/30 transition-all group"
              onClick={action.onClick}
            >
              <div className="flex items-start gap-3 w-full">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <action.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{action.label}</span>
                    {action.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{action.description}</span>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default QuickActionsPanel;
