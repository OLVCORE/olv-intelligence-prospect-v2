import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface MaturityReportProps {
  companyId: string;
}

export function MaturityReport({ companyId }: MaturityReportProps) {
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company-maturity', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*, digital_maturity(*)')
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const maturity = company?.digital_maturity?.[0];

  if (companyLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!maturity) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Dados de maturidade não disponíveis para esta empresa
          </p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 7) return "text-green-600";
    if (score >= 5) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 7) return "Avançado";
    if (score >= 5) return "Intermediário";
    return "Iniciante";
  };

  const dimensions = [
    { key: 'infrastructure_score', label: 'Infraestrutura', icon: '🏗️' },
    { key: 'systems_score', label: 'Sistemas', icon: '💻' },
    { key: 'processes_score', label: 'Processos', icon: '⚙️' },
    { key: 'security_score', label: 'Segurança', icon: '🔒' },
    { key: 'innovation_score', label: 'Inovação', icon: '💡' }
  ];

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Pontuação Geral de Maturidade Digital
          </CardTitle>
          <CardDescription>
            Análise baseada em {dimensions.length} dimensões-chave
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className={`text-6xl font-bold ${getScoreColor(maturity.overall_score || 0)}`}>
                {maturity.overall_score?.toFixed(1)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">de 10.0</p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-lg px-4 py-2">
                {getScoreLabel(maturity.overall_score || 0)}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Nível de maturidade
              </p>
            </div>
          </div>
          <Progress value={(maturity.overall_score || 0) * 10} className="h-3" />
        </CardContent>
      </Card>

      {/* Dimensions Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Análise por Dimensão</CardTitle>
          <CardDescription>
            Desempenho detalhado em cada área avaliada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {dimensions.map((dim) => {
            const score = maturity[dim.key as keyof typeof maturity] as number || 0;
            return (
              <div key={dim.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{dim.icon}</span>
                    <span className="font-medium">{dim.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                      {score.toFixed(1)}
                    </span>
                    <Badge variant="outline">{getScoreLabel(score)}</Badge>
                  </div>
                </div>
                <Progress value={score * 10} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Insights and Recommendations */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Pontos Fortes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dimensions
              .filter(dim => (maturity[dim.key as keyof typeof maturity] as number || 0) >= 7)
              .map(dim => (
                <div key={dim.key} className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <div>
                    <p className="font-medium">{dim.label}</p>
                    <p className="text-sm text-muted-foreground">
                      Nível avançado identificado
                    </p>
                  </div>
                </div>
              ))}
            {dimensions.filter(dim => (maturity[dim.key as keyof typeof maturity] as number || 0) >= 7).length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum ponto forte identificado. Oportunidade de evolução em todas as áreas.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Áreas de Melhoria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dimensions
              .filter(dim => (maturity[dim.key as keyof typeof maturity] as number || 0) < 5)
              .map(dim => (
                <div key={dim.key} className="flex items-start gap-2">
                  <span className="text-orange-600">⚠️</span>
                  <div>
                    <p className="font-medium">{dim.label}</p>
                    <p className="text-sm text-muted-foreground">
                      Requer atenção e investimento prioritário
                    </p>
                  </div>
                </div>
              ))}
            {dimensions.filter(dim => (maturity[dim.key as keyof typeof maturity] as number || 0) < 5).length === 0 && (
              <p className="text-sm text-muted-foreground">
                Sem áreas críticas identificadas. Continue evoluindo gradualmente.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analysis Metadata */}
      {maturity.analysis_data && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Data da Análise:</span>
                <p className="font-medium">
                  {new Date(maturity.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Última Atualização:</span>
                <p className="font-medium">
                  {new Date(maturity.updated_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
