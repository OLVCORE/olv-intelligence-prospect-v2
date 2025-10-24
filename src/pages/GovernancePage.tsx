import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Sparkles, Clock, Zap, Shield, Users } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { CompanySelectDialog } from "@/components/common/CompanySelectDialog";
import { ExplainabilityCard } from "@/components/common/ExplainabilityCard";

export default function GovernancePage() {
  const { toast } = useToast();
  const [selectOpen, setSelectOpen] = useState(false);
  const [selectMode, setSelectMode] = useState<'single' | 'multiple'>('single');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: companies, isLoading, refetch } = useQuery({
    queryKey: ['governance-companies'],
    queryFn: async () => {
      const { data } = await supabase
        .from('companies')
        .select(`
          *,
          digital_maturity (*),
          governance_signals (*)
        `)
        .not('digital_maturity_score', 'is', null)
        .order('digital_maturity_score', { ascending: true }) // Menor score = maior potencial
        .limit(20);
      return data || [];
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const { data, error } = await supabase.functions.invoke('analyze-governance-gap', {
        body: { companyId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "✅ Análise concluída",
        description: "Gaps de governança identificados com IA",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erro na análise",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getGovernanceAnalysis = (company: any) => {
    const signal = company.governance_signals?.find(
      (s: any) => s.signal_type === 'governance_gap_analysis'
    );
    return signal?.raw_data as any;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICO': return 'destructive';
      case 'ALTO': return 'default';
      case 'MEDIO': return 'secondary';
      default: return 'outline';
    }
  };

  const getMaturityColor = (level: string) => {
    switch (level) {
      case 'INICIAL': return 'text-red-600';
      case 'ESTRUTURANDO': return 'text-orange-600';
      case 'GERENCIADO': return 'text-yellow-600';
      case 'OTIMIZADO': return 'text-green-600';
      case 'INOVADOR': return 'text-blue-600';
      default: return 'text-muted-foreground';
    }
  };

  const handleConfirmAnalysis = async (companyIds: string[]) => {
    setIsAnalyzing(true);
    let success = 0;
    let failed = 0;

    toast({
      title: "Análise iniciada",
      description: `Processando ${companyIds.length} empresa${companyIds.length === 1 ? '' : 's'}...`,
    });

    for (const id of companyIds) {
      try {
        const { error } = await supabase.functions.invoke('analyze-governance-gap', {
          body: { companyId: id }
        });
        if (error) throw error;
        success++;
      } catch (e) {
        console.error('Falha na análise', id, e);
        failed++;
      }
    }

    toast({
      title: "Análise concluída",
      description: `${success} sucesso${success !== 1 ? 's' : ''}${failed ? ` • ${failed} falha${failed !== 1 ? 's' : ''}` : ''}`,
    });

    setIsAnalyzing(false);
    setSelectOpen(false);
    refetch();
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Governança & Transformação</h1>
          <p className="text-muted-foreground">
            Análise de gaps organizacionais e oportunidades de consultoria estratégica
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectMode('single');
              setSelectOpen(true);
            }}
            disabled={isAnalyzing}
            variant="outline"
          >
            <Target className="h-4 w-4 mr-2" />
            Análise Individual
          </Button>
          <Button
            onClick={() => {
              setSelectMode('multiple');
              setSelectOpen(true);
            }}
            disabled={isAnalyzing}
          >
            <Users className="h-4 w-4 mr-2" />
            Análise em Massa
          </Button>
        </div>
      </div>

      <CompanySelectDialog
        open={selectOpen}
        onOpenChange={setSelectOpen}
        mode={selectMode}
        onConfirm={handleConfirmAnalysis}
        title={selectMode === 'single' ? 'Selecionar Empresa para Análise' : 'Selecionar Empresas para Análise'}
        confirmLabel={selectMode === 'single' ? 'Analisar empresa' : 'Analisar selecionadas'}
      />

      {/* Card Explicativo */}
      <ExplainabilityCard
        title="Critérios da Análise de Governança"
        description="Entenda como identificamos gaps organizacionais e oportunidades de transformação"
        analysisType="Governança & Consultoria"
        dataSources={[
          {
            name: "Maturidade Digital",
            description: "Score de infraestrutura, processos, sistemas, segurança e inovação"
          },
          {
            name: "Presença Digital",
            description: "Análise de website, redes sociais e engajamento online"
          },
          {
            name: "Tech Stack",
            description: "Tecnologias utilizadas e compatibilidade com soluções modernas"
          },
          {
            name: "Dados Cadastrais",
            description: "Porte, setor, localização e perfil organizacional"
          }
        ]}
        criteria={[
          {
            name: "Governance Gap Score (0-100)",
            weight: "40%",
            description: "Quanto maior, mais gaps críticos identificados. Calculado pela distância entre maturidade atual e nível ideal para o porte/setor da empresa."
          },
          {
            name: "Nível de Maturidade Organizacional",
            weight: "30%",
            description: "Classificação em 5 níveis: Inicial (1-2), Estruturando (3-4), Gerenciado (5-6), Otimizado (7-8), Inovador (9-10)."
          },
          {
            name: "Necessidade de Consultoria",
            weight: "30%",
            description: "Empresas com gap > 60 e maturidade < 5 são priorizadas para consultoria estratégica de transformação digital."
          }
        ]}
        methodology="A análise usa IA (Gemini 2.5 Flash) para identificar gaps específicos por categoria (processos, sistemas, governança, inovação). Cada gap recebe uma prioridade (CRÍTICO/ALTO/MÉDIO/BAIXO) baseada no impacto operacional e urgência de resolução."
        interpretation="Gap Score 70-100 = CRÍTICO (necessita transformação urgente). Score 50-69 = ALTO (melhorias prioritárias). Score 30-49 = MÉDIO (otimizações recomendadas). Score 0-29 = BAIXO (empresa bem estruturada)."
      />

      <div className="grid gap-6">
        {isLoading ? (
          <>
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full" />)}
          </>
        ) : companies && companies.length > 0 ? (
          companies.map((company: any) => {
            const analysis = getGovernanceAnalysis(company);
            const maturity = company.digital_maturity?.[0];
            const isAnalyzing = analyzeMutation.isPending;
            
            return (
              <Card key={company.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        {company.name}
                      </CardTitle>
                      <CardDescription className="mt-2 flex items-center gap-4">
                        <span>{company.industry}</span>
                        {company.employees && (
                          <>
                            <span>•</span>
                            <span>{company.employees} funcionários</span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                    <div className="text-right space-y-2">
                      {analysis ? (
                        <>
                          <div className="text-3xl font-bold text-destructive">{analysis.governanceGapScore}</div>
                          <p className="text-xs text-muted-foreground">Gap Score</p>
                          <Badge variant={getPriorityColor(analysis.transformationPriority)} className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {analysis.transformationPriority}
                          </Badge>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => analyzeMutation.mutate(company.id)}
                          disabled={isAnalyzing}
                          className="gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          {isAnalyzing ? 'Analisando...' : 'Analisar Gaps'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                  {analysis ? (
                    <>
                      {/* Gap Score Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold">Gravidade dos Gaps</span>
                          <span className="text-sm text-muted-foreground">{analysis.governanceGapScore}/100</span>
                        </div>
                        <Progress value={analysis.governanceGapScore} className="h-3" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Quanto maior, mais gaps críticos identificados
                        </p>
                      </div>

                      <Separator />

                      {/* Maturity Level & Consulting Need */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-sm font-medium mb-2">🎯 Nível de Maturidade</p>
                          <p className={`text-lg font-bold ${getMaturityColor(analysis.organizationalMaturityLevel)}`}>
                            {analysis.organizationalMaturityLevel}
                          </p>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-sm font-medium mb-2">💼 Necessita Consultoria?</p>
                          <p className={`text-lg font-bold ${analysis.requiresConsulting ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {analysis.requiresConsulting ? 'SIM - Alto Potencial' : 'Não prioritário'}
                          </p>
                        </div>
                      </div>

                      {/* Summary & Pitch */}
                      {analysis.summary && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-sm font-medium mb-2">📊 Resumo da Análise</p>
                          <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                        </div>
                      )}

                      {analysis.consultingPitch && (
                        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                            💡 Pitch de Consultoria
                          </p>
                          <p className="text-sm text-green-800 dark:text-green-200">{analysis.consultingPitch}</p>
                        </div>
                      )}

                      {/* Gaps Identificados */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-semibold">Gaps Críticos Identificados</span>
                        </div>
                        <div className="space-y-3">
                          {analysis.gaps?.map((gap: any, idx: number) => (
                            <div key={idx} className="border rounded-lg p-3 space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <Badge variant="outline" className="mb-2">{gap.category}</Badge>
                                  <p className="font-semibold">{gap.title}</p>
                                </div>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="font-medium text-red-600">⚠️ Problema:</span>
                                  <p className="text-muted-foreground mt-1">{gap.problem}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-orange-600">💥 Impacto:</span>
                                  <p className="text-muted-foreground mt-1">{gap.impact}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-green-600">✅ Solução:</span>
                                  <p className="text-muted-foreground mt-1">{gap.solution}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* TOTVS Recommendations (como ferramentas, não foco) */}
                      {analysis.totvsRecommendations && analysis.totvsRecommendations.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold">Ferramentas Recomendadas (TOTVS)</span>
                          </div>
                          <div className="space-y-2">
                            {analysis.totvsRecommendations.map((rec: any, idx: number) => (
                              <div key={idx} className="border rounded-lg p-3 space-y-1 text-sm">
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold">{rec.product}</p>
                                  <Badge variant="outline">{rec.category}</Badge>
                                </div>
                                <p className="text-muted-foreground">{rec.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Transformation Strategy */}
                      {analysis.transformationStrategy && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold">Roadmap de Transformação</span>
                          </div>
                          <div className="grid md:grid-cols-4 gap-3">
                            {analysis.transformationStrategy.immediate && (
                              <div className="border rounded p-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <Zap className="h-3 w-3 text-red-600" />
                                  Imediato
                                </div>
                                <ul className="text-xs space-y-1">
                                  {analysis.transformationStrategy.immediate.map((item: string, idx: number) => (
                                    <li key={idx} className="text-muted-foreground">• {item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {analysis.transformationStrategy.shortTerm && (
                              <div className="border rounded p-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <Zap className="h-3 w-3 text-orange-600" />
                                  Curto Prazo
                                </div>
                                <ul className="text-xs space-y-1">
                                  {analysis.transformationStrategy.shortTerm.map((item: string, idx: number) => (
                                    <li key={idx} className="text-muted-foreground">• {item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {analysis.transformationStrategy.mediumTerm && (
                              <div className="border rounded p-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <Clock className="h-3 w-3 text-blue-600" />
                                  Médio Prazo
                                </div>
                                <ul className="text-xs space-y-1">
                                  {analysis.transformationStrategy.mediumTerm.map((item: string, idx: number) => (
                                    <li key={idx} className="text-muted-foreground">• {item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {analysis.transformationStrategy.longTerm && (
                              <div className="border rounded p-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <Target className="h-3 w-3 text-purple-600" />
                                  Longo Prazo
                                </div>
                                <ul className="text-xs space-y-1">
                                  {analysis.transformationStrategy.longTerm.map((item: string, idx: number) => (
                                    <li key={idx} className="text-muted-foreground">• {item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Basic Info when not analyzed yet */
                    <div className="space-y-4">
                      <div className="text-center py-8">
                        <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-4">
                          Clique em "Analisar Gaps" para identificar oportunidades de transformação
                        </p>
                        {maturity && (
                          <div className="inline-flex items-center gap-2 text-sm">
                            <span className="font-medium">Score Digital:</span>
                            <Badge variant="outline">{maturity.overall_score?.toFixed(1)}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer Stats */}
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{maturity?.overall_score?.toFixed(1) || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">Maturidade</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{company.employees || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">Funcionários</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{company.technologies?.length || 0}</p>
                        <p className="text-xs text-muted-foreground">Tecnologias</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Nenhuma empresa disponível. Busque empresas primeiro no módulo "Buscar Empresas".
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
