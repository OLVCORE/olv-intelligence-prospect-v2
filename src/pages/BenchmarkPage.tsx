import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function BenchmarkPage() {
  const { data: benchmarkData, isLoading } = useQuery({
    queryKey: ['benchmark'],
    queryFn: async () => {
      const { data: companies } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          industry,
          employees,
          digital_maturity (overall_score, infrastructure_score, systems_score)
        `)
        .not('digital_maturity', 'is', null)
        .order('created_at', { ascending: false });

      // Agrupar por setor
      const byIndustry: Record<string, any[]> = {};
      (companies || []).forEach((c: any) => {
        const industry = c.industry || 'Outros';
        if (!byIndustry[industry]) byIndustry[industry] = [];
        byIndustry[industry].push(c);
      });

      // Calcular médias por setor
      const sectors = Object.entries(byIndustry).map(([industry, comps]) => {
        const avgScore = comps.reduce((acc, c) => 
          acc + (c.digital_maturity?.[0]?.overall_score || 0), 0) / comps.length;
        const avgInfra = comps.reduce((acc, c) => 
          acc + (c.digital_maturity?.[0]?.infrastructure_score || 0), 0) / comps.length;
        const avgSystems = comps.reduce((acc, c) => 
          acc + (c.digital_maturity?.[0]?.systems_score || 0), 0) / comps.length;

        return {
          industry,
          count: comps.length,
          avgScore: avgScore.toFixed(1),
          avgInfra: avgInfra.toFixed(1),
          avgSystems: avgSystems.toFixed(1),
          companies: comps
        };
      }).sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore));

      return { sectors, total: companies?.length || 0 };
    }
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Benchmark</h1>
        <p className="text-muted-foreground">
          Comparativo de maturidade digital por setor
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : benchmarkData ? (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Visão Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{benchmarkData.total}</p>
                  <p className="text-sm text-muted-foreground">Empresas Analisadas</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{benchmarkData.sectors.length}</p>
                  <p className="text-sm text-muted-foreground">Setores</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {benchmarkData.sectors.length > 0 
                      ? (benchmarkData.sectors.reduce((acc, s) => acc + parseFloat(s.avgScore), 0) / benchmarkData.sectors.length).toFixed(1)
                      : '0.0'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">Média Geral</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {benchmarkData.sectors.map((sector: any, idx: number) => (
              <Card key={sector.industry}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {idx === 0 && <Award className="h-5 w-5 text-yellow-500" />}
                        {sector.industry}
                      </CardTitle>
                      <CardDescription>{sector.count} empresas analisadas</CardDescription>
                    </div>
                    <Badge variant={idx === 0 ? "default" : "outline"}>
                      {idx === 0 ? '🏆 Líder' : `#${idx + 1}`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">Score Médio</span>
                      </div>
                      <p className="text-2xl font-bold">{sector.avgScore}</p>
                      <div className="h-2 bg-muted rounded-full mt-2">
                        <div 
                          className="h-2 bg-primary rounded-full" 
                          style={{ width: `${parseFloat(sector.avgScore) * 10}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Infraestrutura</span>
                      <p className="text-xl font-bold">{sector.avgInfra}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Sistemas</span>
                      <p className="text-xl font-bold">{sector.avgSystems}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Empresas</span>
                      <p className="text-xl font-bold">{sector.count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Dados insuficientes para benchmark. Analise mais empresas primeiro.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
