import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Target, TrendingUp, Lightbulb, Package, AlertTriangle, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Analysis360TabProps {
  companyId: string;
  companyName: string;
  stcResult?: {
    status: string;
    score?: number;
  };
  similarCompanies?: any;
}

interface ScoreBreakdownItem {
  points: number;
  max: number;
  description: string;
  factors?: string[];
  gaps?: any[];
  signals?: any[];
  employees?: number;
  state?: string;
}

interface RecommendedProduct {
  product: string;
  fit_score: number;
  value: string;
  reason: string;
  roi_months: number;
  benefits: string[];
}

interface Analysis360Data {
  opportunity_score: number;
  score_breakdown: Record<string, ScoreBreakdownItem>;
  timing: string;
  recommended_products: RecommendedProduct[];
  insights: string[];
  generated_at: string;
}

export function Analysis360Tab({ 
  companyId, 
  companyName,
  stcResult,
  similarCompanies
}: Analysis360TabProps) {
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['360-analysis', companyId],
    queryFn: async () => {
      // Se já é cliente TOTVS (NO-GO), insights de upsell/cross-sell
      if (stcResult?.status === 'no-go') {
        const insights: string[] = [];
        
        insights.push('❌ CLIENTE EXISTENTE - Não é oportunidade de NOVO contrato.');
        insights.push('');
        insights.push('💰 ESTRATÉGIA DE UPSELL/CROSS-SELL:');

        if (similarCompanies?.statistics?.using_totvs > 0) {
          const clientsWithTotvs = (similarCompanies.similar_companies || [])
            .filter((c: any) => c.uses_totvs)
            .slice(0, 3);

          if (clientsWithTotvs.length > 0) {
            insights.push('');
            insights.push('🎯 BENCHMARKING - Analise o que OUTROS CLIENTES TOTVS do mesmo setor estão usando:');
            clientsWithTotvs.forEach((client: any) => {
              insights.push(`   • ${client.name} (${client.employees || '?'} funcionários)`);
            });
            insights.push('');
            insights.push('📞 AÇÃO: Contatar gerente de contas e comparar produtos:');
            insights.push('   • Se concorrentes têm Fluig e cliente não → CROSS-SELL');
            insights.push('   • Se concorrentes têm módulos adicionais → UPSELL');
            insights.push('   • Se concorrentes migraram para cloud → UPGRADE');
          }
        }

        insights.push('');
        insights.push('💡 PRODUTOS PARA EXPLORAR:');
        insights.push('   • TOTVS Fluig (automação de processos)');
        insights.push('   • TOTVS Techfin (gestão financeira avançada)');
        insights.push('   • TOTVS Carol (IA e analytics)');
        insights.push('   • Migração para TOTVS Cloud');
        insights.push('');
        insights.push('🔥 PITCH: "Seus concorrentes estão expandindo o uso de TOTVS. Vamos garantir que você não fique para trás?"');
        insights.push('');
        insights.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        insights.push('📞 PRÓXIMO PASSO: Contatar gerente de contas para explorar upsell/cross-sell');

        const zeroData: Analysis360Data = {
          opportunity_score: 0,
          score_breakdown: {
            stc_status: {
              points: 0,
              max: 100,
              description: '❌ Empresa JÁ É CLIENTE TOTVS - Não é oportunidade de nova venda',
            },
          },
          timing: 'not_applicable',
          recommended_products: [],
          insights,
          generated_at: new Date().toISOString(),
        };
        return zeroData;
      }

      // Calcular score localmente (não usar edge function)
      let opportunityScore = 0;
      const scoreBreakdown: Record<string, ScoreBreakdownItem> = {};
      let timing = 'medium_term';

      // 1. STATUS STC (0-30 pts)
      if (stcResult?.status === 'go') {
        opportunityScore += 30;
        scoreBreakdown['stc_status'] = {
          points: 30,
          max: 30,
          description: '✅ NÃO é cliente TOTVS - Oportunidade confirmada'
        };
      } else if (stcResult?.status === 'revisar') {
        opportunityScore += 15;
        scoreBreakdown['stc_status'] = {
          points: 15,
          max: 30,
          description: '⚠️ Status inconclusivo - Requer validação manual'
        };
      } else {
        opportunityScore += 5;
        scoreBreakdown['stc_status'] = {
          points: 5,
          max: 30,
          description: '⚠️ Verificação TOTVS não realizada'
        };
      }

      // 2. CONTEXTO DE MERCADO (0-30 pts) - baseado em penetração TOTVS
      const marketPenetration = similarCompanies?.statistics?.percentage_totvs || 0;
      let marketPoints = 0;

      if (marketPenetration >= 50) {
        marketPoints = 30; // Mercado maduro = alta urgência
      } else if (marketPenetration >= 30) {
        marketPoints = 20; // Penetração moderada
      } else if (marketPenetration >= 10) {
        marketPoints = 10; // Mercado em expansão
      } else {
        marketPoints = 5; // Oceano azul
      }

      opportunityScore += marketPoints;
      scoreBreakdown['market_context'] = {
        points: marketPoints,
        max: 30,
        description: `${marketPenetration.toFixed(0)}% dos concorrentes usam TOTVS`,
        factors: [
          `Total de similares: ${similarCompanies?.statistics?.total || 0}`,
          `Clientes TOTVS: ${similarCompanies?.statistics?.using_totvs || 0}`
        ]
      };

      // 3. TAMANHO DA EMPRESA (0-20 pts)
      opportunityScore += 15;
      scoreBreakdown['company_size'] = {
        points: 15,
        max: 20,
        description: 'Porte médio - fit com soluções TOTVS'
      };

      // 4. ENGAGEMENT (0-20 pts)
      opportunityScore += 10;
      scoreBreakdown['engagement'] = {
        points: 10,
        max: 20,
        description: 'Engajamento em análise - requer prospecção ativa'
      };

      // DEFINIR TIMING
      if (opportunityScore >= 70) {
        timing = 'immediate';
      } else if (opportunityScore >= 50) {
        timing = 'short_term';
      } else if (opportunityScore >= 30) {
        timing = 'medium_term';
      } else {
        timing = 'long_term';
      }

      // INSIGHTS COM VISÃO DE HUNTER
      const finalInsights: string[] = [];

      if (opportunityScore >= 70) {
        finalInsights.push('🔥 LEAD ULTRA-QUENTE! PRIORIDADE MÁXIMA!');
        finalInsights.push('⚡ AÇÃO: Ligar AGORA e agendar reunião presencial');
        finalInsights.push('💰 Usar URGÊNCIA e mostrar PROVA SOCIAL dos concorrentes');
      } else if (opportunityScore >= 50) {
        finalInsights.push('🔥 LEAD QUENTE! Alta probabilidade de conversão.');
        finalInsights.push('🎯 PLANO: Contato inicial em 7 dias via Email + LinkedIn + Telefone');
        finalInsights.push('💡 Enviar case de sucesso de empresa similar');
      } else if (opportunityScore >= 30) {
        finalInsights.push('⚠️ LEAD MORNO. Requer nurturing estratégico.');
        finalInsights.push('📅 ESTRATÉGIA: Adicionar em sequência de email marketing (30-60 dias)');
        finalInsights.push('📊 Monitorar sinais de intenção de compra');
      } else {
        finalInsights.push('❄️ LEAD FRIO. Nurturing de longo prazo.');
        finalInsights.push('📆 ESTRATÉGIA: Manter em newsletter e reavaliar trimestralmente');
      }

      // CONTEXTO DE MERCADO
      if (similarCompanies?.statistics) {
        const { percentage_totvs, using_totvs } = similarCompanies.statistics;

        finalInsights.push('');
        finalInsights.push('📊 CONTEXTO DE MERCADO:');

        if (percentage_totvs >= 50) {
          finalInsights.push(`   • ${percentage_totvs.toFixed(0)}% dos concorrentes JÁ USAM TOTVS`);
          finalInsights.push(`   • ARGUMENTO: "Você está perdendo competitividade"`);
        } else if (percentage_totvs >= 30) {
          finalInsights.push(`   • ${percentage_totvs.toFixed(0)}% do mercado já migrou para TOTVS`);
          finalInsights.push(`   • ARGUMENTO: "Seja parte da transformação digital do setor"`);
        } else {
          finalInsights.push(`   • Apenas ${percentage_totvs.toFixed(0)}% do mercado usa TOTVS`);
          finalInsights.push(`   • ARGUMENTO: "Ganhe vantagem competitiva sendo early adopter"`);
        }

        if (using_totvs > 0) {
          finalInsights.push('');
          finalInsights.push('🎯 PROVA SOCIAL DISPONÍVEL:');
          finalInsights.push(`   • ${using_totvs} concorrentes diretos já são clientes`);
        }
      }

      // CALL-TO-ACTION FINAL
      finalInsights.push('');
      finalInsights.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      if (opportunityScore >= 50) {
        finalInsights.push('📞 PRÓXIMO PASSO: LIGAR AGORA e agendar reunião');
      } else if (opportunityScore >= 30) {
        finalInsights.push('📧 PRÓXIMO PASSO: Iniciar sequência de nurturing');
      } else {
        finalInsights.push('📊 PRÓXIMO PASSO: Monitorar e reavaliar trimestralmente');
      }

      console.log('[360] Análise concluída:', { opportunityScore, timing });

      return {
        opportunity_score: opportunityScore,
        score_breakdown: scoreBreakdown,
        timing,
        recommended_products: [],
        insights: finalInsights,
        generated_at: new Date().toISOString()
      } as Analysis360Data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Atualizando...',
      description: 'Gerando nova análise 360°.',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Gerando análise 360°...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <div className="text-center">
              <p className="font-semibold text-lg">Erro ao carregar análise</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { opportunity_score, score_breakdown, timing, recommended_products, insights } = data;

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-100 border-green-200';
    if (score >= 50) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return '🔥 HOT LEAD';
    if (score >= 50) return '⚠️ WARM LEAD';
    return '❄️ COLD LEAD';
  };

  const getTimingLabel = (timing: string) => {
    const labels: Record<string, { label: string; icon: string; color: string }> = {
      immediate: { label: 'Imediato', icon: '⚡', color: 'destructive' },
      short_term: { label: '1-3 meses', icon: '🎯', color: 'default' },
      medium_term: { label: '3-6 meses', icon: '📅', color: 'secondary' },
      long_term: { label: '6-12 meses', icon: '📆', color: 'outline' },
      not_applicable: { label: 'N/A', icon: '🚫', color: 'outline' },
    };
    return labels[timing] || labels.long_term;
  };

  const timingInfo = getTimingLabel(timing);

  return (
    <div className="space-y-6">
      {/* Score Principal */}
      <Card className={getScoreBgColor(opportunity_score)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Score de Oportunidade
            </div>
            <Badge variant={timingInfo.color as any}>
              <Clock className="h-3 w-3 mr-1" />
              {timingInfo.icon} {timingInfo.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <div className={`text-6xl font-bold ${getScoreColor(opportunity_score)}`}>
              {opportunity_score}
            </div>
            <p className="text-lg font-semibold mt-2">{getScoreLabel(opportunity_score)}</p>
            <Progress value={opportunity_score} className="mt-4 h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Breakdown do Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Detalhamento do Score
          </CardTitle>
          <CardDescription>
            Análise dos 8 critérios de oportunidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(score_breakdown).map(([key, item]) => (
              <div key={key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm capitalize">
                    {key.replace(/_/g, ' ')}
                  </h4>
                  <Badge variant="outline">
                    {item.points}/{item.max} pts
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                <Progress 
                  value={(item.points / item.max) * 100} 
                  className="h-2"
                />
                
                {/* Fatores Adicionais */}
                {item.factors && item.factors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {item.factors.map((factor, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground">
                        {factor}
                      </p>
                    ))}
                  </div>
                )}

                {/* Gaps Tecnológicos */}
                {item.gaps && item.gaps.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {item.gaps.map((gap: any, idx: number) => (
                      <div key={idx} className="bg-muted p-2 rounded text-xs">
                        <p className="font-semibold">{gap.gap}</p>
                        <p className="text-muted-foreground">{gap.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sinais de Intenção */}
                {item.signals && item.signals.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.signals.map((signal: any, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {signal.type === 'strong' ? '🔥' : '💡'} {signal.signal}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Produtos Recomendados */}
      {recommended_products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos Recomendados
            </CardTitle>
            <CardDescription>
              Soluções TOTVS com maior fit para esta empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommended_products.map((product, idx) => (
                <div key={idx} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-base">{product.product}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{product.reason}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="default" className="mb-1">
                        Fit: {product.fit_score}%
                      </Badge>
                      <p className="text-sm font-semibold text-primary">{product.value}</p>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    {product.benefits.map((benefit, bidx) => (
                      <div key={bidx} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="text-green-600">✓</span>
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Badge variant="outline" className="text-xs">
                    ROI: {product.roi_months} meses
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Estratégicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Insights Estratégicos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.map((insight, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/10"
              >
                <span className="text-xl flex-shrink-0">{insight.charAt(0)}</span>
                <p className="text-sm flex-1">{insight.slice(2)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t">
            <Button onClick={handleRefresh} variant="outline" className="w-full">
              Atualizar Análise 360°
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
