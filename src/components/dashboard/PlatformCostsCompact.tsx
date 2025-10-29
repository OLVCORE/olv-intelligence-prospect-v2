import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, DollarSign } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const PLATFORM_COSTS = [
  { name: 'Apollo', cost: 80, description: 'Enriquecimento de dados B2B', status: 'active' },
  { name: 'Lovable', cost: 25, description: 'Plataforma low-code com IA', status: 'active' },
  { name: 'Cursor', cost: 20, description: 'Editor com IA integrada', status: 'active' },
  { name: 'Vercel', cost: 25, description: 'Hospedagem e deploy global', status: 'active' },
  { name: 'Supabase', cost: 20, description: 'Backend-as-a-Service', status: 'active' },
  { name: 'Adapta', cost: 50, description: 'Automação de processos', status: 'active' },
  { name: 'ChatGPT', cost: 20, description: 'API OpenAI', status: 'active' },
  { name: 'OpenAI Keys', cost: 25, description: 'Chaves API adicionais', status: 'active' },
  { name: 'Hostinger', cost: 15, description: 'Hospedagem de websites', status: 'active' },
  { name: 'GitHub', cost: 25, description: 'Controle de versão e CI/CD', status: 'active' },
];

const FUTURE_PLATFORMS = [
  { name: 'Salesforce', cost: 150, description: 'CRM enterprise completo', timeline: 'Médio prazo (3-6 meses)' },
  { name: 'HubSpot Enterprise', cost: 320, description: 'Marketing automation avançado', timeline: 'Médio prazo (6-9 meses)' },
  { name: 'AWS Enterprise', cost: 500, description: 'Infraestrutura cloud escalável', timeline: 'Longo prazo (9-12 meses)' },
  { name: 'Snowflake', cost: 200, description: 'Data warehouse e analytics', timeline: 'Longo prazo (12+ meses)' },
  { name: 'Segment CDP', cost: 120, description: 'Customer data platform', timeline: 'Médio prazo (6 meses)' },
  { name: 'Amplitude', cost: 100, description: 'Product analytics avançado', timeline: 'Médio prazo (6 meses)' },
  { name: 'Intercom', cost: 99, description: 'Customer engagement platform', timeline: 'Curto prazo (3 meses)' },
  { name: 'DataDog', cost: 150, description: 'Monitoring e observability', timeline: 'Médio prazo (6 meses)' },
  { name: 'PagerDuty', cost: 60, description: 'Incident management', timeline: 'Médio prazo (6 meses)' },
  { name: 'Confluent (Kafka)', cost: 300, description: 'Real-time data streaming', timeline: 'Longo prazo (12+ meses)' },
];

const TOTAL_COST = PLATFORM_COSTS.reduce((sum, p) => sum + p.cost, 0);
const FUTURE_COST = FUTURE_PLATFORMS.reduce((sum, p) => sum + p.cost, 0);

export function PlatformCostsCompact() {
  const [isOpen, setIsOpen] = useState(false);
  const [showFuture, setShowFuture] = useState(false);

  return (
    <div className="space-y-4">
      {/* Plataformas Atuais */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-base">Custos de Plataformas Atuais</CardTitle>
                  <p className="text-sm text-muted-foreground">{PLATFORM_COSTS.length} plataformas ativas</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">US$ {TOTAL_COST}</p>
                  <p className="text-xs text-muted-foreground">mensal</p>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
                            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-green-500 to-emerald-500 group-hover:from-emerald-500 group-hover:to-green-500 transition-all" />
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

      {/* Plataformas Futuras Recomendadas */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm border-dashed">
        <Collapsible open={showFuture} onOpenChange={setShowFuture}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <DollarSign className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-base">Plataformas Recomendadas (Futuro)</CardTitle>
                  <p className="text-sm text-muted-foreground">Expansão para escala enterprise</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xl font-bold text-amber-500">US$ {FUTURE_COST}</p>
                  <p className="text-xs text-muted-foreground">projeção mensal</p>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    {showFuture ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-1">
                <TooltipProvider>
                  {FUTURE_PLATFORMS.map((platform, i) => (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-help group">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-amber-500 to-orange-500 group-hover:from-orange-500 group-hover:to-amber-500 transition-all" />
                            <div className="flex-1">
                              <span className="text-sm font-medium block">{platform.name}</span>
                              <span className="text-xs text-muted-foreground">{platform.timeline}</span>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-amber-500">US$ {platform.cost}</span>
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
                <p className="text-xs text-amber-500/80 italic">
                  💡 Investimentos estratégicos para escalar de PME para enterprise
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}

export default PlatformCostsCompact;
