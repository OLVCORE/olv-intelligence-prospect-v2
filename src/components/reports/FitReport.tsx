import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Target, Sparkles, CheckCircle2, AlertCircle, TrendingUp, Zap, Clock, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FitReportProps {
  companyId: string;
}

export function FitReport({ companyId }: FitReportProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company-fit', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          governance_signals(*)
        `)
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return data;
  },
    staleTime: 300000, // Cache por 5 minutos
  });

  const { data: presence } = useQuery({
    queryKey: ['company-presence', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('digital_presence')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      return data as any;
    },
    staleTime: 300000,
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('analyze-totvs-fit', {
        body: { companyId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "✅ Análise concluída",
        description: "Recomendações TOTVS geradas com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['company-fit', companyId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na análise",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const aiAnalysis = company?.governance_signals?.find(
    (s: any) => s.signal_type === 'governance_gap_analysis' || s.signal_type === 'totvs_fit_analysis'
  )?.raw_data as any;

  if (companyLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!company) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Empresa não encontrada
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!aiAnalysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Análise de Fit TOTVS
          </CardTitle>
          <CardDescription>
            Gere recomendações personalizadas com IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">Análise não realizada</p>
            <p className="text-sm text-muted-foreground mb-6">
              Clique no botão abaixo para gerar uma análise completa de adequação aos produtos TOTVS
            </p>
            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              size="lg"
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {analyzeMutation.isPending ? 'Analisando com IA...' : 'Gerar Análise com IA'}
            </Button>
          </div>

          {presence && (
            <div className="border-t pt-6">
              <p className="text-sm text-muted-foreground mb-2">Informações disponíveis:</p>
              <div className="flex gap-4">
                <Badge variant="outline">
                  Score Digital: {Number((presence as any)?.overall_score || 0).toFixed(1)}
                </Badge>
                <Badge variant="outline">
                  {company.employees} funcionários
                </Badge>
                <Badge variant="outline">
                  {company.technologies?.length || 0} tecnologias
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fit Score Overview */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Score de Adequação TOTVS
              </CardTitle>
              <CardDescription className="mt-2">
                Análise gerada por IA baseada em múltiplos fatores
              </CardDescription>
            </div>
            <Badge variant="default" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Analisado por IA
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-6xl font-bold text-primary">
              {aiAnalysis.fitScore}%
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Nível de adequação</p>
              <Badge variant="outline" className="mt-1">
                {aiAnalysis.fitScore >= 80 ? 'Excelente' : 
                 aiAnalysis.fitScore >= 60 ? 'Bom' : 
                 aiAnalysis.fitScore >= 40 ? 'Médio' : 'Baixo'}
              </Badge>
            </div>
          </div>
          <Progress value={aiAnalysis.fitScore} className="h-3" />
        </CardContent>
      </Card>

      {/* Summary */}
      {aiAnalysis.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo Executivo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{aiAnalysis.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Products Recommendations */}
      {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Produtos Recomendados
            </CardTitle>
            <CardDescription>
              {aiAnalysis.recommendations.length} recomendações baseadas no perfil da empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiAnalysis.recommendations.map((rec: any, idx: number) => (
              <div key={idx} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Badge variant="outline" className="mb-2">{rec.category}</Badge>
                    <h4 className="font-semibold text-lg">{rec.product}</h4>
                  </div>
                  <Badge variant={rec.priority === 'ALTA' ? 'destructive' : 
                                 rec.priority === 'MÉDIA' ? 'default' : 'secondary'}>
                    {rec.priority}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">{rec.reason}</p>
                
                <Separator />
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium mb-1">💼 Impacto Esperado</p>
                    <p className="text-sm text-muted-foreground">{rec.impact}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1">⚙️ Implementação</p>
                    <p className="text-sm text-muted-foreground">{rec.implementation}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Gaps Identified */}
      {aiAnalysis.gaps && aiAnalysis.gaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Gaps Identificados
            </CardTitle>
            <CardDescription>
              Áreas que necessitam atenção especial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {aiAnalysis.gaps.map((gap: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-orange-600 mt-0.5">⚠️</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Implementation Strategy */}
      {aiAnalysis.strategy && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Estratégia de Implementação
            </CardTitle>
            <CardDescription>
              Roadmap sugerido para adoção das soluções TOTVS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-green-600">
                  <Zap className="h-4 w-4" />
                  Curto Prazo (0-3 meses)
                </div>
                <ul className="space-y-2 text-sm">
                  {aiAnalysis.strategy.shortTerm?.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-blue-600">
                  <Clock className="h-4 w-4" />
                  Médio Prazo (3-6 meses)
                </div>
                <ul className="space-y-2 text-sm">
                  {aiAnalysis.strategy.mediumTerm?.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-purple-600">
                  <Target className="h-4 w-4" />
                  Longo Prazo (6-12 meses)
                </div>
                <ul className="space-y-2 text-sm">
                  {aiAnalysis.strategy.longTerm?.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-purple-600">•</span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TCO Benefit */}
      {aiAnalysis.tcoBenefit && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="py-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl text-green-600">
                <DollarSign className="h-6 w-6" />
              </span>
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                  Benefício de TCO Estimado
                </p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  {aiAnalysis.tcoBenefit}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh Analysis */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Análise gerada em {new Date(company.governance_signals?.find(
                (s: any) => s.signal_type === 'governance_gap_analysis' || s.signal_type === 'totvs_fit_analysis'
              )?.created_at || '').toLocaleDateString('pt-BR')}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              className="gap-2"
            >
              <Sparkles className="h-3 w-3" />
              {analyzeMutation.isPending ? 'Atualizando...' : 'Atualizar Análise'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
