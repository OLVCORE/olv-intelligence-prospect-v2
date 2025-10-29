import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
      tooltip: "Acesse a base completa de empresas para explorar prospects e identificar novas oportunidades de negócio."
    },
    {
      icon: UserPlus,
      label: "Adicionar Lead",
      description: "Cadastrar novo prospect",
      badge: null,
      onClick: () => navigate("/companies"),
      tooltip: "Adicione manualmente um novo lead ou prospect ao sistema para iniciar o processo de qualificação."
    },
    {
      icon: FileText,
      label: "Relatórios",
      description: "Gerar análises",
      badge: "3 novos",
      onClick: () => {},
      tooltip: "Gere relatórios customizados com análises detalhadas de performance, conversões e métricas de vendas."
    },
    {
      icon: BarChart3,
      label: "Analytics",
      description: "Ver métricas detalhadas",
      badge: null,
      onClick: () => navigate("/sdr/pipeline"),
      tooltip: "Visualize métricas avançadas e KPIs do pipeline de vendas com gráficos interativos e análises em tempo real."
    },
    {
      icon: Zap,
      label: "Enrichment",
      description: "Atualizar dados",
      badge: "12 pendentes",
      onClick: () => {},
      tooltip: "Enriqueça dados de empresas automaticamente com informações de múltiplas fontes incluindo Apollo, ReceitaWS e mais."
    },
    {
      icon: Settings,
      label: "Configurações",
      description: "Ajustar preferências",
      badge: null,
      onClick: () => {},
      tooltip: "Configure preferências do sistema, integrações de APIs, alertas personalizados e parâmetros de automação."
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
        <TooltipProvider>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {actions.map((action, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <Button
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
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{action.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

export default QuickActionsPanel;
