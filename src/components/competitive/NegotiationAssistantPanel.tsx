import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Brain, MessageSquare, DollarSign, Swords, Target, AlertTriangle } from "lucide-react";
import { useNegotiationAssistant, NegotiationScenario, NegotiationAssistantResult } from "@/hooks/useNegotiationAssistant";

interface NegotiationAssistantPanelProps {
  companyId: string;
  companyName: string;
}

const scenarioConfig = {
  objection_handling: {
    label: 'Objeções',
    icon: MessageSquare,
    placeholder: 'Ex: Cliente diz que já usa SAP e está satisfeito...',
    color: 'text-blue-500',
  },
  pricing_negotiation: {
    label: 'Negociação',
    icon: DollarSign,
    placeholder: 'Ex: Cliente pediu 40% de desconto...',
    color: 'text-green-500',
  },
  competitive_positioning: {
    label: 'Competição',
    icon: Swords,
    placeholder: 'Ex: Prospect comparando com Oracle...',
    color: 'text-red-500',
  },
  closing: {
    label: 'Fechamento',
    icon: Target,
    placeholder: 'Ex: Cliente pronto para decidir, mas hesitando...',
    color: 'text-purple-500',
  },
};

export function NegotiationAssistantPanel({ companyId, companyName }: NegotiationAssistantPanelProps) {
  const [scenario, setScenario] = useState<NegotiationScenario>('objection_handling');
  const [contextInput, setContextInput] = useState("");
  const [result, setResult] = useState<NegotiationAssistantResult | null>(null);

  const assistantMutation = useNegotiationAssistant();

  const handleGetAdvice = () => {
    if (!contextInput.trim()) return;
    
    assistantMutation.mutate(
      { companyId, scenario, contextInput },
      {
        onSuccess: (data) => setResult(data),
      }
    );
  };

  const currentConfig = scenarioConfig[scenario];
  const Icon = currentConfig.icon;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <CardTitle>AI Negotiation Assistant</CardTitle>
        </div>
        <CardDescription>
          Assistente em tempo real para negociações - baseado em dados reais da empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scenario Selection */}
        <Tabs value={scenario} onValueChange={(v) => setScenario(v as NegotiationScenario)}>
          <TabsList className="grid grid-cols-4 w-full">
            {Object.entries(scenarioConfig).map(([key, config]) => {
              const ScenarioIcon = config.icon;
              return (
                <TabsTrigger key={key} value={key} className="gap-2">
                  <ScenarioIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{config.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Input Area */}
        <div className="space-y-2">
          <Label htmlFor="context-input" className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${currentConfig.color}`} />
            Descreva a situação:
          </Label>
          <Textarea
            id="context-input"
            placeholder={currentConfig.placeholder}
            value={contextInput}
            onChange={(e) => setContextInput(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <Button
          onClick={handleGetAdvice}
          disabled={!contextInput.trim() || assistantMutation.isPending}
          className="w-full"
          size="lg"
        >
          {assistantMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando com IA...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Obter Recomendações Táticas
            </>
          )}
        </Button>

        {/* Results */}
        {result && (
          <div className="space-y-4 pt-4 border-t">
            {/* Context Indicators */}
            <div className="flex items-center gap-2 flex-wrap">
              {result.battle_card_available && (
                <Badge variant="outline" className="gap-1">
                  <Swords className="w-3 h-3" />
                  Battle Card Ativo
                </Badge>
              )}
              {result.intent_signals_count > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Target className="w-3 h-3" />
                  {result.intent_signals_count} Sinais de Intenção
                </Badge>
              )}
            </div>

            {/* Primary Response */}
            <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-4">
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Icon className={`w-4 h-4 ${currentConfig.color}`} />
                Resposta Recomendada
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {result.advice.primary_response}
              </p>
            </div>

            {/* Alternative Approaches */}
            {result.advice.alternative_approaches?.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Abordagens Alternativas</p>
                <div className="space-y-2">
                  {result.advice.alternative_approaches.map((approach, idx) => (
                    <div key={idx} className="bg-muted/50 rounded-lg p-3 text-sm">
                      <span className="font-medium">Alternativa {idx + 1}:</span> {approach}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Proof Points */}
            {result.advice.proof_points?.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Proof Points para Usar</p>
                <div className="space-y-2">
                  {result.advice.proof_points.map((point, idx) => (
                    <div key={idx} className="bg-success/10 border border-success/20 rounded-lg p-3">
                      <p className="text-sm font-medium">{point.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{point.result}</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {point.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {result.advice.warnings?.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  Atenção
                </p>
                <ul className="space-y-1">
                  {result.advice.warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      ⚠️ {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Best Actions */}
            {result.advice.next_best_actions?.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Próximos Passos Imediatos</p>
                <div className="space-y-2">
                  {result.advice.next_best_actions.map((action, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <Badge className="shrink-0">{idx + 1}</Badge>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              Gerado em {new Date(result.generated_at).toLocaleString('pt-BR')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
