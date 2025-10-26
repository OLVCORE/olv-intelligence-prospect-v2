import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Sparkles, 
  Phone, 
  Calendar, 
  Eye, 
  Ban, 
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  XCircle,
  ExternalLink,
  Loader2,
  Zap
} from "lucide-react";
import { useCreateDeal } from "@/hooks/useDeals";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface QualificationRecommendationProps {
  company: {
    id: string;
    name: string;
    totvs_detection_score?: number;
    totvs_last_checked_at?: string;
  };
  intentScore: number;
  hasIntentCheck: boolean;
}

export function QualificationRecommendation({ 
  company, 
  intentScore,
  hasIntentCheck 
}: QualificationRecommendationProps) {
  const { mutate: createDeal, isPending } = useCreateDeal();
  const [dealCreated, setDealCreated] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [rawContext, setRawContext] = useState<any>(null);
  
  const totvsScore = company.totvs_detection_score || 0;

  // Verificar se as duas fases foram concluídas
  const canGenerateAnalysis = company.totvs_last_checked_at && hasIntentCheck;

  // Função para disparar análise IA 360°
  const handleGenerateAnalysis = async () => {
    setIsLoadingAnalysis(true);
    setAiAnalysis(null);
    setRawContext(null);
    
    try {
      console.log('[AI 360°] Starting analysis for:', company.name);
      
      const { data, error } = await supabase.functions.invoke('ai-qualification-analysis', {
        body: {
          company_id: company.id,
          company_name: company.name,
          totvs_score: totvsScore,
          intent_score: intentScore,
        }
      });

      if (error) {
        console.error('[AI 360°] Function error:', error);
        throw error;
      }
      
      if (data?.analysis) {
        setAiAnalysis(data.analysis);
        setRawContext(data.raw_context);
        console.log('[AI 360°] Analysis complete:', data.analysis);
        toast.success('Análise 360° gerada com sucesso!');
      } else {
        throw new Error('Resposta inválida da função');
      }
    } catch (error) {
      console.error('[AI 360°] Error:', error);
      toast.error('Não foi possível gerar análise', {
        description: error instanceof Error ? error.message : 'Tente novamente em instantes'
      });
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Lógica de recomendação
  const getRecommendation = () => {
    // 1. TOTVS >= 70: Desqualificar
    if (totvsScore >= 70) {
      return {
        action: "disqualify",
        title: "⛔ NÃO PROSSEGUIR - Empresa Desqualificada",
        description: "Alta probabilidade de já usar TOTVS. Recomendamos não investir tempo neste lead.",
        color: "destructive",
        icon: Ban,
        priority: "low" as const,
        stage: "disqualified",
        buttonLabel: "Marcar como Desqualificado",
        buttonVariant: "destructive" as const,
        steps: [
          "Não fazer contato comercial",
          "Mover para lista de empresas TOTVS",
          "Considerar apenas se empresa demonstrar insatisfação"
        ]
      };
    }

    // 2. TOTVS < 70 + Intent >= 70: HOT LEAD!
    if (totvsScore < 70 && intentScore >= 70) {
      return {
        action: "contact_now",
        title: "🔥 CONTATO IMEDIATO - HOT LEAD!",
        description: "Momento perfeito para prospecção! Empresa qualificada e com alta intenção de compra.",
        color: "success",
        icon: Phone,
        priority: "urgent" as const,
        stage: "qualification",
        buttonLabel: "Adicionar ao Pipeline (Urgente)",
        buttonVariant: "default" as const,
        steps: [
          "Ligar HOJE ou nas próximas 24h",
          "Mencionar sinais detectados (expansão, vagas, investimento)",
          "Preparar case de ROI personalizado",
          "Agendar demo executiva em até 3 dias"
        ]
      };
    }

    // 3. TOTVS < 70 + Intent 40-69: Qualificado
    if (totvsScore < 70 && intentScore >= 40) {
      return {
        action: "schedule",
        title: "✅ QUALIFICADO - Agendar Contato",
        description: "Lead qualificado com sinais moderados. Recomendamos abordagem estruturada.",
        color: "primary",
        icon: Calendar,
        priority: "high" as const,
        stage: "prospecting",
        buttonLabel: "Adicionar ao Pipeline",
        buttonVariant: "default" as const,
        steps: [
          "Agendar ligação em até 5 dias úteis",
          "Pesquisar mais sobre a empresa antes do contato",
          "Preparar pitch com foco nas dores identificadas",
          "Enviar material introdutório por email"
        ]
      };
    }

    // 4. TOTVS < 70 + Intent < 40: Monitorar
    return {
      action: "monitor",
      title: "👀 MONITORAR - Aguardar Mais Sinais",
      description: "Lead válido mas sem urgência. Recomendamos nurturing e monitoramento contínuo.",
      color: "secondary",
      icon: Eye,
      priority: "medium" as const,
      stage: "lead",
      buttonLabel: "Adicionar à Lista de Nurturing",
      buttonVariant: "outline" as const,
      steps: [
        "Adicionar à campanha de nurturing automatizada",
        "Monitorar sinais mensalmente (re-rodar detecção)",
        "Compartilhar conteúdo educativo",
        "Aguardar momento mais favorável"
      ]
    };
  };

  const recommendation = getRecommendation();

  const handleAddToPipeline = () => {
    const dealTitle = `[${recommendation.action === 'contact_now' ? 'HOT 🔥' : 'Qualificado'}] ${company.name}`;
    const dealDescription = `Lead qualificado via IA:\n- Score TOTVS: ${totvsScore}/100\n- Score Intenção: ${intentScore}/100\n- Recomendação: ${recommendation.title}\n\nPróximos passos:\n${recommendation.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;

    createDeal({
      title: dealTitle,
      description: dealDescription,
      company_id: company.id,
      stage: recommendation.stage,
      priority: recommendation.priority,
      value: 0, // Será definido pelo vendedor
    }, {
      onSuccess: () => {
        setDealCreated(true);
        toast.success('Deal criado com sucesso!', {
          description: `${company.name} foi adicionado ao pipeline com prioridade ${recommendation.priority}`,
        });
      }
    });
  };

  const IconComponent = recommendation.icon;

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Análise de Qualificação 360° com IA
        </CardTitle>
        <CardDescription>
          Análise profunda baseada em múltiplas fontes: detecção TOTVS, sinais de intenção, notícias, vagas e dados públicos
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Botão CHAMATIVO para gerar análise */}
        {!aiAnalysis && !isLoadingAnalysis && (
          <div className="text-center py-8 space-y-6">
            {!canGenerateAnalysis ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Complete as etapas obrigatórias primeiro:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {!company.totvs_last_checked_at && (
                      <li>Execute a <strong>Detecção de Uso de TOTVS</strong></li>
                    )}
                    {!hasIntentCheck && (
                      <li>Execute a <strong>Detecção de Sinais de Intenção</strong></li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">🚀 Pronto para Análise Profunda!</h3>
                  <p className="text-muted-foreground">
                    Todas as fontes foram consultadas. Clique abaixo para gerar sua análise 360° com IA.
                  </p>
                </div>
                
                <Button
                  onClick={handleGenerateAnalysis}
                  size="lg"
                  className="h-16 px-8 text-lg font-bold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all"
                  disabled={isLoadingAnalysis}
                >
                  <Zap className="h-6 w-6 mr-2 animate-pulse" />
                  Gerar Qualificação 360° Powered by IA
                  <Sparkles className="h-5 w-5 ml-2" />
                </Button>

                <p className="text-xs text-muted-foreground">
                  ✅ Análise gerada por IA com base em múltiplas fontes de dados
                </p>
              </>
            )}
          </div>
        )}

        {/* Loading state */}
        {isLoadingAnalysis && (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <p className="font-semibold text-lg">Gerando Análise 360°...</p>
                <p className="text-sm text-muted-foreground">
                  Analisando fontes TOTVS, sinais de intenção, notícias e dados públicos
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        )}

        {/* Análise gerada */}
        {aiAnalysis && (
          <>
            {/* Recomendação IA */}
            <Alert 
              variant={aiAnalysis.decision === 'NO-GO' ? 'destructive' : 'default'}
              className="border-2"
            >
              {aiAnalysis.decision === 'NO-GO' ? (
                <XCircle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              <AlertDescription className="ml-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-lg">
                      {aiAnalysis.decision === 'GO' ? '✅ GO - Prosseguir' : '⛔ NO-GO - Desqualificar'}
                    </p>
                    <Badge variant={
                      aiAnalysis.confidence === 'high' ? 'default' : 
                      aiAnalysis.confidence === 'medium' ? 'secondary' : 'outline'
                    }>
                      Confiança: {aiAnalysis.confidence === 'high' ? 'Alta' : aiAnalysis.confidence === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                    <Badge variant={
                      aiAnalysis.priority === 'hot' ? 'destructive' :
                      aiAnalysis.priority === 'warm' ? 'default' :
                      aiAnalysis.priority === 'cold' ? 'secondary' : 'outline'
                    }>
                      {aiAnalysis.priority === 'hot' ? '🔥 Quente' :
                       aiAnalysis.priority === 'warm' ? '🌤️ Morno' :
                       aiAnalysis.priority === 'cold' ? '❄️ Frio' : '🚫 Desqualificado'}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{aiAnalysis.executive_summary}</p>
                </div>
              </AlertDescription>
            </Alert>

            {/* Scores Visual */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">TOTVS Detection</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{totvsScore}</span>
                  <Badge variant={totvsScore >= 70 ? "destructive" : totvsScore >= 30 ? "outline" : "secondary"}>
                    {totvsScore >= 70 ? "Alto" : totvsScore >= 30 ? "Médio" : "Baixo"}
                  </Badge>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">Intent Score</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{intentScore}</span>
                  <Badge variant={intentScore >= 70 ? "default" : intentScore >= 40 ? "secondary" : "outline"}>
                    {intentScore >= 70 ? "Hot" : intentScore >= 40 ? "Warm" : "Cold"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Análise Profunda Acordeão */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="deep-analysis">
                <AccordionTrigger className="text-base font-semibold">
                  📊 Análise Profunda 360°
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid gap-4">
                    <div className="rounded-lg border p-4 bg-muted/50">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">🎯 Análise TOTVS</h4>
                      <p className="text-sm">{aiAnalysis.deep_analysis.totvs_analysis}</p>
                    </div>

                    <div className="rounded-lg border p-4 bg-muted/50">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">💡 Análise de Intenção</h4>
                      <p className="text-sm">{aiAnalysis.deep_analysis.intent_analysis}</p>
                    </div>

                    <div className="rounded-lg border p-4 bg-muted/50">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">🚀 Análise de Oportunidade</h4>
                      <p className="text-sm">{aiAnalysis.deep_analysis.opportunity_analysis}</p>
                    </div>

                    <div className="rounded-lg border p-4 bg-muted/50">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">⚠️ Análise de Riscos</h4>
                      <p className="text-sm">{aiAnalysis.deep_analysis.risk_analysis}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="action-plan">
                <AccordionTrigger className="text-base font-semibold">
                  🎬 Plano de Ação
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-semibold mb-2">Ações Imediatas</h4>
                    <ul className="space-y-1 ml-4">
                      {aiAnalysis.action_plan.immediate_actions.map((action: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-primary font-bold">{i + 1}.</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Talking Points</h4>
                    <ul className="space-y-1 ml-4">
                      {aiAnalysis.action_plan.talking_points.map((point: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {aiAnalysis.action_plan.objections_to_anticipate?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Objeções a Antecipar</h4>
                      <ul className="space-y-1 ml-4">
                        {aiAnalysis.action_plan.objections_to_anticipate.map((obj: string, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="sources">
                <AccordionTrigger className="text-base font-semibold">
                  🔍 Fontes e Dados Brutos
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
                    <p className="text-sm"><strong>Evidência mais forte:</strong> {aiAnalysis.sources_summary.strongest_evidence}</p>
                    <p className="text-sm"><strong>Ponto mais fraco:</strong> {aiAnalysis.sources_summary.weakest_point}</p>
                    <p className="text-sm">
                      <strong>Qualidade dos dados:</strong>{' '}
                      <Badge variant={
                        aiAnalysis.sources_summary.data_quality === 'high' ? 'default' :
                        aiAnalysis.sources_summary.data_quality === 'medium' ? 'secondary' : 'outline'
                      }>
                        {aiAnalysis.sources_summary.data_quality === 'high' ? 'Alta' :
                         aiAnalysis.sources_summary.data_quality === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    </p>
                  </div>

                  {rawContext?.totvs_sources && rawContext.totvs_sources.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Fontes TOTVS ({rawContext.totvs_sources.length})</h4>
                      <div className="space-y-2">
                        {rawContext.totvs_sources.map((source: any, i: number) => (
                          <div key={i} className="rounded border p-3 bg-background text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline">{source.source}</Badge>
                              <Badge>{source.confidence}%</Badge>
                            </div>
                            <p className="text-sm mb-1">{source.evidence}</p>
                            {source.url && (
                              <a 
                                href={source.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                Ver fonte <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {rawContext?.intent_signals && rawContext.intent_signals.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Sinais de Intenção ({rawContext.intent_signals.length})</h4>
                      <div className="space-y-2">
                        {rawContext.intent_signals.map((signal: any, i: number) => (
                          <div key={i} className="rounded border p-3 bg-background text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline">{signal.signal_type}</Badge>
                              <Badge>{signal.confidence_score}/100</Badge>
                            </div>
                            <p className="text-sm">{signal.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* CTA Button */}
            <div className="flex gap-3">
              {!dealCreated && aiAnalysis.decision === 'GO' && (
                <Button
                  onClick={handleAddToPipeline}
                  disabled={isPending}
                  size="lg"
                  className="flex-1"
                  variant={recommendation.buttonVariant}
                >
                  <IconComponent className="h-5 w-5 mr-2" />
                  {recommendation.buttonLabel}
                  {recommendation.action === 'contact_now' && <span className="ml-2">🔥</span>}
                </Button>
              )}

              <Button
                onClick={handleGenerateAnalysis}
                variant="outline"
                size="lg"
                disabled={isLoadingAnalysis}
              >
                <Zap className="h-4 w-4 mr-2" />
                Gerar Nova Análise
              </Button>
            </div>

            {dealCreated && (
              <Alert className="border-green-600 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertDescription>
                  ✅ Deal criado com sucesso! Acesse o pipeline para dar continuidade.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Metadata */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Análise gerada por IA com base em múltiplas fontes de dados
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
