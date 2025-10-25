import { BackButton } from "@/components/common/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, CheckCircle2, AlertCircle, Sparkles, Clock, Zap } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useState, useMemo } from "react";
import { CompanySelectDialog } from "@/components/common/CompanySelectDialog";
import { ExplainabilityButton } from "@/components/common/ExplainabilityButton";

export default function FitTOTVSPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectMode, setSelectMode] = useState<'single' | 'multiple'>('single');
  const [isBulkRunning, setIsBulkRunning] = useState(false);

  const { data: companies, isLoading, refetch } = useQuery({
    queryKey: ['fit-totvs-companies'],
    queryFn: async () => {
      const { data } = await supabase
        .from('companies')
        .select(`
          *,
          digital_maturity (*),
          governance_signals (*)
        `)
        .not('digital_maturity_score', 'is', null)
        .order('digital_maturity_score', { ascending: false })
        .limit(20);
      return data || [];
    }
  });

  const companyIds = useMemo(() => (companies?.map((c: any) => c.id) ?? []), [companies]);

  const { data: analyses, isLoading: isAnalysesLoading, refetch: refetchAnalyses } = useQuery({
    queryKey: ['fit-totvs-analyses', companyIds],
    enabled: companyIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('governance_signals')
        .select('*')
        .in('company_id', companyIds)
        .eq('signal_type', 'totvs_fit_analysis')
        .order('detected_at', { ascending: false });
      return data || [];
    }
  });

  const analysisByCompany = useMemo(() => {
    const map = new Map<string, any>();
    analyses?.forEach((rec: any) => {
      if (!map.has(rec.company_id)) map.set(rec.company_id, rec);
    });
    return map;
  }, [analyses]);

  const analyzeMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const { data, error } = await supabase.functions.invoke('analyze-totvs-fit', {
        body: { companyId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "✅ Análise concluída",
        description: "Recomendações TOTVS geradas com IA",
      });
      refetch();
      refetchAnalyses();
    },
    onError: (error: any) => {
      toast({
        title: "Erro na análise",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleConfirm = async (selectedIds: string[]) => {
    if (!selectedIds || selectedIds.length === 0) return;
    if (selectMode === 'single') {
      return new Promise<void>((resolve, reject) => {
        analyzeMutation.mutate(selectedIds[0], {
          onSuccess: () => resolve(),
          onError: (err) => reject(err)
        });
      });
    }
    setIsBulkRunning(true);
    let success = 0;
    let failed = 0;
    for (const id of selectedIds) {
      try {
        const { error } = await supabase.functions.invoke('analyze-totvs-fit', {
          body: { companyId: id }
        });
        if (error) throw error as any;
        success++;
      } catch (e) {
        console.error('Falha ao analisar', id, e);
        failed++;
      }
    }
    toast({
      title: 'Análise em Lote concluída',
      description: `${success} sucesso${success !== 1 ? 's' : ''}${failed ? ` • ${failed} falha${failed !== 1 ? 's' : ''}` : ''}`,
    });
    setIsBulkRunning(false);
    refetch();
    refetchAnalyses();
  };

  const getAIAnalysis = (company: any) => {
    return analysisByCompany.get(company.id)?.raw_data as any;
  };

  return (
    <div className="p-8">
      <BackButton className="mb-4" />
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Fit TOTVS</h1>
            <p className="text-muted-foreground">
              Análise de aderência e recomendações de produtos TOTVS
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setSelectMode('single');
                setDialogOpen(true);
              }}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Análise Individual
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectMode('multiple');
                setDialogOpen(true);
              }}
              className="gap-2"
              disabled={isBulkRunning}
            >
              <Sparkles className="h-4 w-4" />
              {isBulkRunning ? 'Processando...' : 'Análise em Massa'}
            </Button>
          </div>
        </div>
      </div>

      <CompanySelectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={selectMode}
        onConfirm={handleConfirm}
        title={selectMode === 'single' ? 'Selecionar empresa para análise' : 'Selecionar múltiplas empresas'}
        confirmLabel={selectMode === 'single' ? 'Analisar empresa' : 'Analisar selecionadas'}
      />

      <div className="grid gap-6">
        {isLoading ? (
          <>
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full" />)}
          </>
        ) : companies && companies.length > 0 ? (
          companies.map((company: any) => {
            const aiAnalysis = getAIAnalysis(company);
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
                      {aiAnalysis ? (
                        <>
                          <div className="text-3xl font-bold text-primary">{aiAnalysis.fitScore}</div>
                          <p className="text-xs text-muted-foreground">Score IA</p>
                          <Badge variant="default" className="gap-1">
                            <Sparkles className="h-3 w-3" />
                            Analisado
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
                          {isAnalyzing ? 'Analisando...' : 'Analisar com IA'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                  {aiAnalysis ? (
                    <>
                      {/* AI Analysis Results */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold">Nível de Aderência</span>
                          <span className="text-sm text-muted-foreground">{aiAnalysis.fitScore}%</span>
                        </div>
                        <Progress value={aiAnalysis.fitScore} className="h-3" />
                      </div>

                      <Separator />

                      {/* Summary */}
                      {aiAnalysis.summary && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-sm font-medium mb-2">📊 Resumo da Análise</p>
                          <p className="text-sm text-muted-foreground">{aiAnalysis.summary}</p>
                        </div>
                      )}

                      {/* Products */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold">Produtos Recomendados</span>
                        </div>
                        <div className="space-y-4">
                          {aiAnalysis.recommendations?.map((rec: any, idx: number) => (
                            <Card key={idx} className="border-l-4 border-l-primary">
                              <CardContent className="pt-4 space-y-3">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">{rec.category}</Badge>
                                      <Badge variant={rec.priority === 'ALTA' ? 'destructive' : rec.priority === 'MÉDIA' ? 'default' : 'secondary'}>
                                        {rec.priority}
                                      </Badge>
                                    </div>
                                    <h3 className="font-bold text-lg">{rec.product}</h3>
                                    {rec.sku && <p className="text-xs text-muted-foreground">{rec.sku}</p>}
                                  </div>
                                </div>

                                {/* Pain Point (Dor) */}
                                {rec.painPoint && (
                                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs font-semibold text-destructive mb-1">🚨 DOR IDENTIFICADA</p>
                                        <p className="text-sm">{rec.painPoint}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Solution (Remédio) */}
                                {rec.solution && (
                                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs font-semibold text-green-900 dark:text-green-100 mb-1">💊 SOLUÇÃO</p>
                                        <p className="text-sm text-green-900 dark:text-green-100">{rec.solution}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Reason */}
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-medium text-foreground">Por que este produto: </span>
                                  {rec.reason}
                                </div>

                                {/* Impact & Implementation */}
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                  <div className="border rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <TrendingUp className="h-4 w-4 text-primary" />
                                      <span className="text-xs font-semibold">Impacto Esperado</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{rec.impact}</p>
                                  </div>
                                  <div className="border rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Clock className="h-4 w-4 text-blue-600" />
                                      <span className="text-xs font-semibold">Implementação</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{rec.implementation}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* Gaps */}
                      {aiAnalysis.gaps && aiAnalysis.gaps.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-semibold">Gaps Identificados</span>
                          </div>
                          <ul className="space-y-2">
                            {aiAnalysis.gaps.map((gap: string, idx: number) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <span className="text-orange-600">⚠️</span>
                                <span>{gap}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Strategy */}
                      {aiAnalysis.strategy && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold">Estratégia de Implementação</span>
                          </div>
                          <div className="grid md:grid-cols-3 gap-3">
                            <div className="border rounded p-3 space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <Zap className="h-3 w-3 text-green-600" />
                                Curto Prazo
                              </div>
                              <ul className="text-xs space-y-1">
                                {aiAnalysis.strategy.shortTerm?.map((item: string, idx: number) => (
                                  <li key={idx} className="text-muted-foreground">• {item}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="border rounded p-3 space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <Clock className="h-3 w-3 text-blue-600" />
                                Médio Prazo
                              </div>
                              <ul className="text-xs space-y-1">
                                {aiAnalysis.strategy.mediumTerm?.map((item: string, idx: number) => (
                                  <li key={idx} className="text-muted-foreground">• {item}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="border rounded p-3 space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <Target className="h-3 w-3 text-purple-600" />
                                Longo Prazo
                              </div>
                              <ul className="text-xs space-y-1">
                                {aiAnalysis.strategy.longTerm?.map((item: string, idx: number) => (
                                  <li key={idx} className="text-muted-foreground">• {item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TCO Benefit */}
                      {aiAnalysis.tcoBenefit && (
                        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">
                            💰 {aiAnalysis.tcoBenefit}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Basic Info when not analyzed yet */
                    <div className="space-y-4">
                      <div className="text-center py-8">
                        <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-4">
                          Clique em "Analisar com IA" para gerar recomendações personalizadas
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

      {/* Botão de Explicação */}
      <div className="mt-8 flex justify-center">
        <ExplainabilityButton
          title="Critérios da Análise de Fit TOTVS"
          description="Entenda como identificamos a compatibilidade e momento ideal para produtos TOTVS"
          analysisType="Product-Market Fit"
          dataSources={[
            {
              name: "Dados da Empresa",
              description: "Setor, porte (funcionários), localização, revenue, tech stack atual"
            },
            {
              name: "Maturidade Digital",
              description: "Scores de infraestrutura, processos, sistemas e inovação"
            },
            {
              name: "Sinais de Compra",
              description: "Expansão, contratações, investimentos, notícias de crescimento"
            },
            {
              name: "Base de Clientes TOTVS",
              description: "Benchmarking com empresas similares que já são clientes"
            }
          ]}
          criteria={[
            {
              name: "Fit Score (0-100)",
              weight: "35%",
              description: "Compatibilidade geral: quanto mais próximo de 100, maior a chance de conversão. Considera setor, porte, maturidade e necessidades identificadas."
            },
            {
              name: "Timing Score (0-100)",
              weight: "35%",
              description: "Momento ideal para abordagem: score alto indica janela de oportunidade (expansão, mudanças, dores urgentes)."
            },
            {
              name: "Recomendação de Produtos",
              weight: "30%",
              description: "IA analisa gaps e sugere produtos TOTVS específicos com justificativa de por que fazem sentido."
            }
          ]}
          methodology="A IA (Gemini 2.5 Flash) cruza dados da empresa com padrões de clientes TOTVS bem-sucedidos. Fit Score = similaridade com ICP ideal. Timing Score = presença de sinais de compra (hiring, growth, pain points). Produtos são recomendados baseado em gaps entre estado atual e best practices do setor."
          interpretation="Fit > 80 + Timing > 70 = CONTA QUENTE (abordar imediatamente). Fit > 60 = BOM FIT (incluir em cadência). Timing > 70 = MOMENTO IDEAL (priorizar contato). Fit < 40 = BAIXA PRIORIDADE (nutrir para futuro)."
        />
      </div>
    </div>
  );
}
