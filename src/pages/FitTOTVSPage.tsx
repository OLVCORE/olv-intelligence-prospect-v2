import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function FitTOTVSPage() {
  const { data: maturityData, isLoading } = useQuery({
    queryKey: ['fit-totvs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('digital_maturity')
        .select(`
          *,
          companies (name, industry, employees, technologies)
        `)
        .order('overall_score', { ascending: false })
        .limit(20);
      return data || [];
    }
  });

  const calculateFit = (maturity: any) => {
    const score = maturity.overall_score || 0;
    const techs = maturity.companies?.technologies || [];
    
    let fitScore = score * 10;
    let recommendations = [];
    let products = [];

    // Análise de fit baseado em score
    if (score < 4) {
      recommendations.push('Protheus + Fluig - Estruturação completa');
      products.push('TOTVS Protheus', 'Fluig');
      fitScore += 10;
    } else if (score < 7) {
      recommendations.push('TOTVS BI + Integração - Expansão gradual');
      products.push('TOTVS BI', 'TOTVS Backoffice');
      fitScore += 15;
    } else {
      recommendations.push('Carol AI + Advanced Analytics');
      products.push('Carol AI', 'TOTVS Advanced Analytics');
      fitScore += 20;
    }

    // Análise de tecnologias
    if (techs.some((t: string) => /SAP|Oracle/i.test(t))) {
      recommendations.push('Migração SAP/Oracle → TOTVS (redução de TCO)');
      fitScore += 15;
    }
    if (techs.some((t: string) => /Power BI|Tableau/i.test(t))) {
      recommendations.push('TOTVS BI nativo integrado ao ERP');
      fitScore += 10;
    }

    return {
      fitScore: Math.min(100, fitScore),
      recommendations,
      products: [...new Set(products)]
    };
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Fit TOTVS</h1>
        <p className="text-muted-foreground">
          Análise de aderência e recomendações de produtos TOTVS
        </p>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <>
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full" />)}
          </>
        ) : maturityData && maturityData.length > 0 ? (
          maturityData.map((maturity: any) => {
            const fit = calculateFit(maturity);
            
            return (
              <Card key={maturity.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        {maturity.companies?.name}
                      </CardTitle>
                      <CardDescription>{maturity.companies?.industry}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">{fit.fitScore}</div>
                      <p className="text-xs text-muted-foreground">Score de Fit</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Nível de Aderência</span>
                      <span className="text-sm text-muted-foreground">{fit.fitScore}%</span>
                    </div>
                    <Progress value={fit.fitScore} className="h-3" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold">Produtos Recomendados</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {fit.products.map((product, idx) => (
                          <Badge key={idx} variant="default">{product}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold">Estratégia</span>
                      </div>
                      <ul className="space-y-2">
                        {fit.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{maturity.overall_score?.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Maturidade</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{maturity.companies?.employees || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">Funcionários</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{maturity.companies?.technologies?.length || 0}</p>
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
                Nenhuma análise de fit disponível. Busque empresas e analise maturidade primeiro.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
