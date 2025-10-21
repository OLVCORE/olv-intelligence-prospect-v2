import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExplainableMetric, METRIC_PRESETS } from '@/components/intelligence/ExplainableMetric';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Trophy, 
  Target,
  BarChart3,
  Building2,
  HelpCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function EnhancedBenchmarkPage() {
  // Fetch companies with digital maturity
  const { data: companies, isLoading } = useQuery({
    queryKey: ['benchmark-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          digital_maturity (
            overall_score,
            infrastructure_score,
            systems_score,
            processes_score,
            security_score,
            innovation_score
          )
        `)
        .not('digital_maturity', 'is', null);

      if (error) throw error;
      return data;
    },
  });

  // Group by sector (industry)
  const sectorBenchmark = companies?.reduce((acc: any, company: any) => {
    const sector = company.industry || 'Outros';
    if (!acc[sector]) {
      acc[sector] = {
        sector,
        companies: [],
        avg_overall: 0,
        avg_infrastructure: 0,
        avg_systems: 0,
        avg_processes: 0,
        count: 0,
      };
    }
    
    acc[sector].companies.push(company);
    acc[sector].count++;
    
    if (company.digital_maturity) {
      acc[sector].avg_overall += company.digital_maturity.overall_score || 0;
      acc[sector].avg_infrastructure += company.digital_maturity.infrastructure_score || 0;
      acc[sector].avg_systems += company.digital_maturity.systems_score || 0;
      acc[sector].avg_processes += company.digital_maturity.processes_score || 0;
    }
    
    return acc;
  }, {});

  // Calculate averages
  const sectorData = Object.values(sectorBenchmark || {}).map((sector: any) => ({
    ...sector,
    avg_overall: Math.round(sector.avg_overall / sector.count),
    avg_infrastructure: Math.round(sector.avg_infrastructure / sector.count),
    avg_systems: Math.round(sector.avg_systems / sector.count),
    avg_processes: Math.round(sector.avg_processes / sector.count),
  })).sort((a: any, b: any) => b.avg_overall - a.avg_overall);

  // Overall statistics
  const totalCompanies = companies?.length || 0;
  const totalSectors = sectorData.length;
  const generalAvg = sectorData.length > 0
    ? Math.round(sectorData.reduce((sum: number, s: any) => sum + s.avg_overall, 0) / sectorData.length)
    : 0;

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <span className="text-lg font-bold text-gray-400">#2</span>;
    if (index === 2) return <span className="text-lg font-bold text-amber-600">#3</span>;
    return <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>;
  };

  const getTrendIcon = (score: number) => {
    if (score >= generalAvg + 10) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (score <= generalAvg - 10) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid md:grid-cols-3 gap-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Benchmark Setorial</h1>
              <p className="text-muted-foreground">
                Comparativo de maturidade digital entre setores e empresas analisadas
              </p>
            </div>
          </div>
        </div>

        {/* Explanation Card */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              O que é este Benchmark?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>Este benchmark compara empresas por setor (CNAE/Indústria)</strong> com base na maturidade digital.
            </p>
            <div className="space-y-2">
              <p>• <strong>Score Médio</strong>: Média da maturidade digital geral (0-100) de todas as empresas do setor</p>
              <p>• <strong>Infraestrutura</strong>: Média do score de infraestrutura tecnológica do setor</p>
              <p>• <strong>Sistemas</strong>: Média do score de sistemas de gestão (ERP, CRM, etc.) do setor</p>
              <p>• <strong>Empresas</strong>: Quantidade de empresas analisadas neste setor</p>
            </div>
            <p className="pt-2 border-t text-muted-foreground">
              Os dados são calculados em tempo real a partir das empresas que você já analisou.
              Quanto mais empresas analisar, mais preciso ficará o benchmark.
            </p>
          </CardContent>
        </Card>

        {/* Overview Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <ExplainableMetric
            metric={{
              name: 'Empresas Analisadas',
              value: totalCompanies,
              unit: '',
              explanation: 'Total de empresas com análise de maturidade digital completa',
              calculation: 'Soma de todas as empresas no sistema com digital_maturity calculado',
              dataSources: ['Database', 'Análises 360º'],
              interpretation: totalCompanies >= 10
                ? 'Base de dados robusta para comparações significativas'
                : 'Continue analisando mais empresas para melhorar a precisão',
              actionable: totalCompanies < 10
                ? 'Recomendamos analisar pelo menos 10 empresas por setor'
                : undefined,
            }}
            variant="compact"
            showProgress={false}
          />
          
          <ExplainableMetric
            metric={{
              name: 'Setores Mapeados',
              value: totalSectors,
              unit: '',
              explanation: 'Número de setores diferentes que possuem empresas analisadas',
              calculation: 'Contagem única de CNAEs/indústrias nas empresas analisadas',
              dataSources: ['ReceitaWS', 'Company Data'],
              interpretation: 'Diversidade setorial na base de análise',
            }}
            variant="compact"
            showProgress={false}
          />
          
          <ExplainableMetric
            metric={METRIC_PRESETS.digitalMaturityOverall(generalAvg)}
            variant="compact"
          />
        </div>

        {/* Sector Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ranking por Setor</CardTitle>
                <CardDescription>
                  Maturidade digital média de cada setor analisado
                </CardDescription>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Target className="h-5 w-5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Use estes dados para identificar oportunidades: setores com
                      baixa maturidade digital têm maior potencial para transformação.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sectorData.map((sector: any, index: number) => (
                <Card key={sector.sector} className="relative overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12">
                        {getRankIcon(index)}
                      </div>

                      {/* Sector Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{sector.sector}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                <Building2 className="h-3 w-3 mr-1" />
                                {sector.count} {sector.count === 1 ? 'empresa' : 'empresas'}
                              </Badge>
                              {getTrendIcon(sector.avg_overall)}
                            </div>
                          </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-4">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <p className="text-xs text-muted-foreground">Score Médio</p>
                                  <p className="text-2xl font-bold">{sector.avg_overall}</p>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Média geral de maturidade digital das {sector.count} empresas
                                  do setor {sector.sector}. Calculado a partir de 5 dimensões:
                                  Infraestrutura, Sistemas, Processos, Segurança e Inovação.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <p className="text-xs text-muted-foreground">Infraestrutura</p>
                                  <p className="text-2xl font-bold text-blue-600">
                                    {sector.avg_infrastructure}
                                  </p>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Média do score de infraestrutura tecnológica: cloud adoption,
                                  performance de website, mobile readiness, segurança e escalabilidade.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <p className="text-xs text-muted-foreground">Sistemas</p>
                                  <p className="text-2xl font-bold text-green-600">
                                    {sector.avg_systems}
                                  </p>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Média do score de sistemas de gestão: ERP, CRM, automação,
                                  e integração entre sistemas. Empresas com TOTVS tendem a ter
                                  scores mais altos nesta dimensão.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        {/* Comparison with general average */}
                        <div className="pt-3 border-t text-sm">
                          {sector.avg_overall > generalAvg ? (
                            <p className="text-green-600">
                              ✓ {sector.avg_overall - generalAvg} pontos acima da média geral
                            </p>
                          ) : sector.avg_overall < generalAvg ? (
                            <p className="text-orange-600">
                              ↓ {generalAvg - sector.avg_overall} pontos abaixo da média geral
                            </p>
                          ) : (
                            <p className="text-muted-foreground">
                              = Na média geral
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {sectorData.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma empresa analisada ainda.</p>
                  <p className="text-sm mt-2">
                    Use a Análise 360º para começar a mapear empresas e construir seu benchmark.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
