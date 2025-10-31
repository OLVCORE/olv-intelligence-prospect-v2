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
  Zap,
  Target,
  Activity,
  Shield,
  TrendingDown,
  FileText,
  BarChart3
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
      
      // Verificar se é erro de créditos ou API
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('Créditos') && errorMessage.includes('OpenAI')) {
        toast.error('💳 Créditos da OpenAI Esgotados', {
          description: 'Adicione créditos à sua conta OpenAI para continuar usando a análise 360°.',
          duration: 8000,
        });
      } else if (errorMessage.includes('Chave') && errorMessage.includes('inválida')) {
        toast.error('🔑 Chave OpenAI Inválida', {
          description: 'Verifique a configuração da chave de API da OpenAI.',
          duration: 8000,
        });
      } else if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
        toast.error('⏱️ Limite de Requisições Atingido', {
          description: 'Muitas requisições em pouco tempo. Aguarde alguns instantes e tente novamente.',
          duration: 6000,
        });
      } else {
        toast.error('Erro ao Gerar Análise', {
          description: 'Não foi possível gerar a análise 360°. Tente novamente em instantes.',
        });
      }
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
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <CardTitle className="flex items-center gap-3 text-xl">
          <Target className="h-6 w-6 text-primary" />
          Análise de Qualificação Estratégica 360°
        </CardTitle>
        <CardDescription className="text-sm">
          Inteligência de mercado baseada em múltiplas fontes: detecção competitiva TOTVS, sinais de intenção de compra, análise de vagas, notícias corporativas e dados públicos
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Botão para gerar análise */}
        {!aiAnalysis && !isLoadingAnalysis && (
          <div className="text-center py-12 space-y-6">
            {!canGenerateAnalysis ? (
              <Alert variant="default" className="text-left">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription>
                  <p className="font-semibold mb-3">Pré-requisitos para Análise 360°:</p>
                  <ul className="list-disc list-inside space-y-2 text-sm">
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
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Fontes Verificadas</span>
                  </div>
                  <h3 className="text-2xl font-bold">Análise Estratégica Disponível</h3>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Todas as fontes de inteligência foram consultadas. Inicie a análise 360° para obter uma recomendação executiva fundamentada em dados.
                  </p>
                </div>
                
                <Button
                  onClick={handleGenerateAnalysis}
                  size="lg"
                  className="h-14 px-10 text-base font-semibold bg-gradient-to-r from-primary via-primary to-primary/90 hover:shadow-lg transition-all"
                  disabled={isLoadingAnalysis}
                >
                  <Activity className="h-5 w-5 mr-2" />
                  Gerar Análise de Qualificação 360°
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>

                <p className="text-xs text-muted-foreground">
                  Powered by OLV Internacional - AI Analytics
                </p>
              </>
            )}
          </div>
        )}

        {/* Loading state */}
        {isLoadingAnalysis && (
          <div className="space-y-6 py-12">
            <div className="flex flex-col items-center justify-center gap-5">
              <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary/20" />
              </div>
              <div className="text-center space-y-3">
                <p className="font-semibold text-xl">Processando Análise Estratégica</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Analisando detecção competitiva TOTVS, sinais de intenção de compra, notícias corporativas e dados de mercado
                </p>
              </div>
            </div>
            <div className="space-y-3 max-w-3xl mx-auto">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          </div>
        )}

        {/* Análise gerada */}
        {aiAnalysis && (
          <>
            {/* Recomendação Executiva */}
            <Alert 
              variant={aiAnalysis.decision === 'NO-GO' ? 'destructive' : 'default'}
              className={`border-2 shadow-lg ${
                aiAnalysis.decision === 'NO-GO' 
                  ? 'bg-destructive/10 border-destructive' 
                  : 'bg-primary/10 border-primary'
              }`}
            >
              <div className="flex items-start gap-3">
                {aiAnalysis.decision === 'NO-GO' ? (
                  <div className="p-2 rounded-full bg-destructive/20 shrink-0">
                    <XCircle className="h-6 w-6 text-destructive" />
                  </div>
                ) : (
                  <div className="p-2 rounded-full bg-primary/20 shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                )}
                <AlertDescription className="flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className={`font-bold text-lg ${
                        aiAnalysis.decision === 'NO-GO' ? 'text-destructive' : 'text-primary'
                      }`}>
                        {aiAnalysis.decision === 'GO' ? 'RECOMENDAÇÃO: PROSSEGUIR' : 'RECOMENDAÇÃO: DESQUALIFICAR'}
                      </h3>
                      <Badge 
                        variant={
                          aiAnalysis.confidence === 'high' ? 'default' : 
                          aiAnalysis.confidence === 'medium' ? 'secondary' : 'outline'
                        }
                        className="text-xs font-medium"
                      >
                        Confiança: {aiAnalysis.confidence === 'high' ? 'Alta' : aiAnalysis.confidence === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                      <Badge 
                        variant={
                          aiAnalysis.priority === 'hot' ? 'default' :
                          aiAnalysis.priority === 'warm' ? 'secondary' :
                          aiAnalysis.priority === 'cold' ? 'outline' : 'destructive'
                        }
                        className="text-sm font-bold"
                      >
                        {aiAnalysis.priority === 'hot' && '🔥 Hot Lead'}
                        {aiAnalysis.priority === 'warm' && '🌡️ Warm Lead'}
                        {aiAnalysis.priority === 'cold' && '❄️ Cold Lead'}
                        {aiAnalysis.priority === 'disqualified' && '⛔ Descartado'}
                      </Badge>
                    </div>
                    <div className={`p-4 rounded-lg border bg-card ${
                      aiAnalysis.decision === 'NO-GO' 
                        ? 'border-destructive/30' 
                        : 'border-primary/20'
                    }`}>
                      <p className="text-sm leading-relaxed font-medium text-card-foreground">{aiAnalysis.executive_summary}</p>
                    </div>
                  </div>
                </AlertDescription>
              </div>
            </Alert>

            {/* Tabela Executiva de Scores */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`relative border-2 rounded-lg p-5 overflow-hidden transition-all bg-card ${
                totvsScore > 0 
                  ? 'border-destructive/50 shadow-destructive/10 shadow-lg' 
                  : 'border-green-500/30 shadow-green-500/5 shadow-lg'
              }`}>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-card-foreground">Detecção TOTVS</span>
                    <div className={`p-2 rounded-full ${totvsScore > 0 ? 'bg-destructive/20' : 'bg-green-500/20'}`}>
                      <Shield className={`h-5 w-5 ${totvsScore > 0 ? 'text-destructive' : 'text-green-600'}`} />
                    </div>
                  </div>
                  <div className={`text-4xl font-black ${totvsScore > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {totvsScore}<span className="text-xl text-muted-foreground font-normal">/100</span>
                  </div>
                  <Badge 
                    variant={totvsScore > 0 ? 'destructive' : 'outline'} 
                    className={`mt-3 text-xs font-bold ${totvsScore === 0 ? 'border-green-600 text-green-700 bg-green-500/10' : ''}`}
                  >
                    {totvsScore > 0 ? '⛔ Cliente TOTVS - Bloqueado' : '✅ Sem TOTVS - Liberado'}
                  </Badge>
                  {totvsScore > 0 && (
                    <p className="text-xs text-destructive mt-3 font-semibold leading-tight">
                      Empresa já possui produtos TOTVS embarcados em sua tecnologia. OLV não pode prospectar clientes TOTVS existentes.
                    </p>
                  )}
                </div>
              </div>

              <div className={`relative border-2 rounded-lg p-5 overflow-hidden transition-all bg-card ${
                intentScore >= 70 
                  ? 'border-primary/50 shadow-primary/10 shadow-lg' 
                  : intentScore >= 40
                  ? 'border-yellow-500/30 shadow-yellow-500/5 shadow-lg'
                  : 'border-blue-500/30 shadow-blue-500/5 shadow-lg'
              }`}>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-card-foreground">Intenção de Compra</span>
                    <div className={`p-2 rounded-full ${
                      intentScore >= 70 ? 'bg-primary/20' : 
                      intentScore >= 40 ? 'bg-yellow-500/20' : 'bg-blue-500/20'
                    }`}>
                      <TrendingDown className={`h-5 w-5 rotate-180 ${
                        intentScore >= 70 ? 'text-primary' : 
                        intentScore >= 40 ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                    </div>
                  </div>
                  <div className={`text-4xl font-black ${
                    intentScore >= 70 ? 'text-primary' : 
                    intentScore >= 40 ? 'text-yellow-600' : 'text-blue-600'
                  }`}>
                    {intentScore}<span className="text-xl text-muted-foreground font-normal">/100</span>
                  </div>
                  <Badge variant={
                    intentScore >= 70 ? 'default' : 
                    intentScore >= 40 ? 'secondary' : 
                    'outline'
                  } className="mt-3 text-xs font-bold">
                    {intentScore >= 70 && '🔥 Hot - Ação Imediata'}
                    {intentScore >= 40 && intentScore < 70 && '🌡️ Warm - Nurturing'}
                    {intentScore < 40 && '❄️ Cold - Monitorar'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Análise Profunda Acordeão */}
            <Accordion type="single" collapsible className="w-full border rounded-lg">
              <AccordionItem value="deep-analysis" className="border-none">
                <AccordionTrigger className="text-base font-semibold px-4 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Análise Estratégica Detalhada
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="grid gap-4">
                    <div className="rounded-lg border p-4 bg-muted/30">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-destructive" />
                        Detecção Competitiva TOTVS
                      </h4>
                      <p className="text-sm leading-relaxed text-foreground/90">{aiAnalysis.deep_analysis.totvs_analysis}</p>
                    </div>

                    <div className="rounded-lg border p-4 bg-muted/30">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                        <Activity className="h-4 w-4 text-primary" />
                        Sinais de Intenção de Compra
                      </h4>
                      <p className="text-sm leading-relaxed text-foreground/90">{aiAnalysis.deep_analysis.intent_analysis}</p>
                    </div>

                    <div className="rounded-lg border p-4 bg-muted/30">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        Análise de Oportunidade
                      </h4>
                      <p className="text-sm leading-relaxed text-foreground/90">{aiAnalysis.deep_analysis.opportunity_analysis}</p>
                    </div>

                    <div className="rounded-lg border p-4 bg-muted/30">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        Avaliação de Riscos
                      </h4>
                      <p className="text-sm leading-relaxed text-foreground/90">{aiAnalysis.deep_analysis.risk_analysis}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="action-plan" className="border-none">
                <AccordionTrigger className="text-base font-semibold px-4 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Plano de Ação Tático
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2 space-y-5">
                  <div className="rounded-lg border p-4 bg-muted/30">
                    <h4 className="font-semibold mb-3 text-sm">Ações Imediatas Recomendadas</h4>
                    <ul className="space-y-2">
                      {aiAnalysis.action_plan.immediate_actions.map((action: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-3">
                          <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                            {i + 1}
                          </span>
                          <span className="flex-1 leading-relaxed">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border p-4 bg-muted/30">
                    <h4 className="font-semibold mb-3 text-sm">Argumentos de Venda (Talking Points)</h4>
                    <ul className="space-y-2">
                      {aiAnalysis.action_plan.talking_points.map((point: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-3">
                          <ArrowRight className="flex-shrink-0 h-4 w-4 text-primary mt-0.5" />
                          <span className="flex-1 leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {aiAnalysis.action_plan.objections_to_anticipate?.length > 0 && (
                    <div className="rounded-lg border p-4 bg-muted/30">
                      <h4 className="font-semibold mb-3 text-sm">Objeções Prováveis</h4>
                      <ul className="space-y-2">
                        {aiAnalysis.action_plan.objections_to_anticipate.map((obj: string, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-3">
                            <AlertCircle className="flex-shrink-0 h-4 w-4 text-orange-600 mt-0.5" />
                            <span className="flex-1 leading-relaxed">{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="sources" className="border-none">
                <AccordionTrigger className="text-base font-semibold px-4 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Fontes de Inteligência e Qualidade dos Dados
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2 space-y-5">
                  <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
                    <div className="grid gap-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Evidência Mais Relevante</p>
                        <p className="text-sm leading-relaxed">{aiAnalysis.sources_summary.strongest_evidence}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Limitações Identificadas</p>
                        <p className="text-sm leading-relaxed">{aiAnalysis.sources_summary.weakest_point}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Qualidade dos Dados Coletados</p>
                        <Badge 
                          variant={
                            aiAnalysis.sources_summary.data_quality === 'high' ? 'default' :
                            aiAnalysis.sources_summary.data_quality === 'medium' ? 'secondary' : 'outline'
                          }
                          className="mt-1"
                        >
                          {aiAnalysis.sources_summary.data_quality === 'high' ? 'Alta Confiabilidade' :
                           aiAnalysis.sources_summary.data_quality === 'medium' ? 'Confiabilidade Média' : 'Confiabilidade Baixa'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {rawContext?.totvs_sources && rawContext.totvs_sources.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4 text-destructive" />
                        Fontes de Detecção TOTVS ({rawContext.totvs_sources.length})
                      </h4>
                      <div className="space-y-3">
                        {rawContext.totvs_sources.map((source: any, i: number) => (
                          <div key={i} className="rounded-lg border p-3 bg-background">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">{source.source}</Badge>
                              <Badge className="text-xs">{source.confidence}% confiança</Badge>
                            </div>
                            <p className="text-sm mb-2 leading-relaxed">{source.evidence}</p>
                            {source.url && (
                              <a 
                                href={source.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-xs flex items-center gap-1.5"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Verificar fonte original
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {rawContext?.intent_signals && rawContext.intent_signals.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Sinais de Intenção Detectados ({rawContext.intent_signals.length})
                      </h4>
                      <div className="space-y-3">
                        {rawContext.intent_signals.map((signal: any, i: number) => (
                          <div key={i} className="rounded-lg border p-3 bg-background">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">{signal.signal_type}</Badge>
                              <Badge className="text-xs">{signal.confidence_score}/100</Badge>
                            </div>
                            <p className="text-sm mb-1 leading-relaxed font-medium">{signal.description || 'Sinal detectado sem descrição detalhada'}</p>
                            {signal.source && (
                              <p className="text-xs text-muted-foreground">Fonte: {signal.source}</p>
                            )}
                            {signal.url && (
                              <a 
                                href={signal.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-xs flex items-center gap-1.5 mt-2"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Ver referência
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* CTA Buttons */}
            <div className="flex gap-3 pt-2">
              {!dealCreated && aiAnalysis.decision === 'GO' && (
                <Button
                  onClick={handleAddToPipeline}
                  disabled={isPending}
                  size="lg"
                  className="flex-1 font-semibold"
                  variant={recommendation.buttonVariant}
                >
                  <IconComponent className="h-5 w-5 mr-2" />
                  {recommendation.buttonLabel}
                </Button>
              )}

              <Button
                onClick={handleGenerateAnalysis}
                variant="outline"
                size="lg"
                disabled={isLoadingAnalysis}
                className="font-medium"
              >
                <Activity className="h-4 w-4 mr-2" />
                Regenerar Análise
              </Button>
            </div>

            {dealCreated && (
              <Alert className="border-green-600 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertDescription>
                  Deal criado com sucesso e adicionado ao pipeline de vendas.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t mt-2">
          <div className="flex items-center justify-center text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Powered by OLV Internacional - AI Analytics & Multi-Source Intelligence
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
