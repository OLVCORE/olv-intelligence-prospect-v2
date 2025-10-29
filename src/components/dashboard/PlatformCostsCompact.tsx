import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, DollarSign } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const PLATFORM_COSTS = [
  { name: 'Apollo', cost: 80, description: 'Enriquecimento de dados B2B' },
  { name: 'Lovable', cost: 25, description: 'Plataforma low-code com IA' },
  { name: 'Cursor', cost: 20, description: 'Editor com IA integrada' },
  { name: 'Vercel', cost: 25, description: 'Hospedagem e deploy global' },
  { name: 'Supabase', cost: 20, description: 'Backend-as-a-Service' },
  { name: 'Adapta', cost: 50, description: 'Automação de processos' },
  { name: 'ChatGPT', cost: 20, description: 'API OpenAI' },
  { name: 'OpenAI Keys', cost: 25, description: 'Chaves API adicionais' },
  { name: 'Hostinger', cost: 15, description: 'Hospedagem de websites' },
  { name: 'GitHub', cost: 25, description: 'Controle de versão e CI/CD' },
];

const TOTAL_COST = PLATFORM_COSTS.reduce((sum, p) => sum + p.cost, 0);

export function PlatformCostsCompact() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <DollarSign className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-base">Custos de Plataformas</CardTitle>
                <p className="text-sm text-muted-foreground">10 plataformas ativas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xl font-bold text-primary">US$ {TOTAL_COST}</p>
                <p className="text-xs text-muted-foreground">mensal</p>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-1">
              <TooltipProvider>
                {PLATFORM_COSTS.map((platform, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-help group">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-accent-cyan group-hover:from-accent-cyan group-hover:to-primary transition-all" />
                          <span className="text-sm font-medium">{platform.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-primary">US$ {platform.cost}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p className="text-xs max-w-[200px]">{platform.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground italic">
                * Valores em US$ convertidos para R$ pela taxa do dia do cartão
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default PlatformCostsCompact;
