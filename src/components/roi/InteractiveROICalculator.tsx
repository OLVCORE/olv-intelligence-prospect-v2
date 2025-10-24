import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { CashFlowChart } from './charts/CashFlowChart';
import { BenefitsBreakdown } from './charts/BenefitsBreakdown';

interface ROICalculatorProps {
  companyId: string;
  accountStrategyId?: string;
  initialData?: Partial<ROIInputs>;
}

interface ROIInputs {
  currentCosts: {
    software: number;
    personnel: number;
    maintenance: number;
    outsourcing: number;
  };
  proposedInvestment: {
    licenses: number;
    implementation: number;
    training: number;
    firstYearMaintenance: number;
  };
  expectedBenefits: {
    timeReductionPercent: number;
    errorReductionPercent: number;
    revenueIncreasePercent: number;
    employeesAffected: number;
    avgSalary: number;
  };
  projectYears: 1 | 3 | 5;
  discountRate: number;
}

interface ROIOutput {
  netPresentValue: number;
  returnOnInvestment: number;
  paybackPeriodMonths: number;
  internalRateOfReturn: number;
  yearByYear: Array<{
    year: number;
    costs: number;
    benefits: number;
    netCashFlow: number;
    cumulativeCashFlow: number;
  }>;
  breakdownBenefits: {
    timeSavingsValue: number;
    errorReductionValue: number;
    revenueGrowthValue: number;
    totalAnnualBenefit: number;
  };
  industryBenchmark: {
    averageROI: number;
    averagePayback: number;
    percentileRank: number;
  };
}

export function InteractiveROICalculator({ companyId, accountStrategyId, initialData }: ROICalculatorProps) {
  const { toast } = useToast();
  const [isCalculating, setIsCalculating] = useState(false);
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  
  const [inputs, setInputs] = useState<ROIInputs>({
    currentCosts: {
      software: initialData?.currentCosts?.software || 50000,
      personnel: initialData?.currentCosts?.personnel || 200000,
      maintenance: initialData?.currentCosts?.maintenance || 30000,
      outsourcing: initialData?.currentCosts?.outsourcing || 100000,
    },
    proposedInvestment: {
      licenses: initialData?.proposedInvestment?.licenses || 150000,
      implementation: initialData?.proposedInvestment?.implementation || 100000,
      training: initialData?.proposedInvestment?.training || 30000,
      firstYearMaintenance: initialData?.proposedInvestment?.firstYearMaintenance || 45000,
    },
    expectedBenefits: {
      timeReductionPercent: initialData?.expectedBenefits?.timeReductionPercent || 30,
      errorReductionPercent: initialData?.expectedBenefits?.errorReductionPercent || 40,
      revenueIncreasePercent: initialData?.expectedBenefits?.revenueIncreasePercent || 15,
      employeesAffected: initialData?.expectedBenefits?.employeesAffected || 50,
      avgSalary: initialData?.expectedBenefits?.avgSalary || 80000,
    },
    projectYears: 3,
    discountRate: 10,
  });

  const [results, setResults] = useState<ROIOutput | null>(null);

  const calculateROI = async () => {
    setIsCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-advanced-roi', {
        body: {
          companyId,
          accountStrategyId,
          inputs,
        },
      });

      if (error) throw error;

      setResults(data.results);
      
      toast({
        title: "✅ ROI Calculado",
        description: `ROI: ${data.results.returnOnInvestment}% | Payback: ${data.results.paybackPeriodMonths} meses`,
      });
    } catch (error: any) {
      console.error('Error calculating ROI:', error);
      toast({
        title: "Erro ao calcular ROI",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const updateInput = (category: keyof ROIInputs, field: string, value: number) => {
    setInputs((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] as any),
        [field]: value,
      },
    }));
  };

  useEffect(() => {
    // Auto-calculate quando inputs mudam (debounced)
    const timer = setTimeout(() => {
      if (mode === 'simple') {
        calculateROI();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [inputs, mode]);

  const getROIColor = (roi: number) => {
    if (roi >= 100) return 'text-green-600 dark:text-green-400';
    if (roi >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Calculadora de ROI Interativa
              </CardTitle>
              <CardDescription>
                Análise completa de retorno sobre investimento com projeções 3-5 anos
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={mode === 'simple' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('simple')}
              >
                Simples
              </Button>
              <Button
                variant={mode === 'advanced' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('advanced')}
              >
                Avançado
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="inputs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inputs">Inputs</TabsTrigger>
          <TabsTrigger value="results" disabled={!results}>Resultados</TabsTrigger>
          <TabsTrigger value="charts" disabled={!results}>Gráficos</TabsTrigger>
        </TabsList>

        {/* Inputs Tab */}
        <TabsContent value="inputs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>1. Custos Atuais</CardTitle>
              <CardDescription>Quanto você gasta hoje com sistemas e processos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Software Atual</Label>
                  <span className="text-sm font-mono">{formatCurrency(inputs.currentCosts.software)}</span>
                </div>
                <Slider
                  value={[inputs.currentCosts.software]}
                  onValueChange={([v]) => updateInput('currentCosts', 'software', v)}
                  min={0}
                  max={500000}
                  step={10000}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Custos de Pessoal (processos manuais)</Label>
                  <span className="text-sm font-mono">{formatCurrency(inputs.currentCosts.personnel)}</span>
                </div>
                <Slider
                  value={[inputs.currentCosts.personnel]}
                  onValueChange={([v]) => updateInput('currentCosts', 'personnel', v)}
                  min={0}
                  max={1000000}
                  step={20000}
                />
              </div>

              {mode === 'advanced' && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Manutenção</Label>
                      <span className="text-sm font-mono">{formatCurrency(inputs.currentCosts.maintenance)}</span>
                    </div>
                    <Slider
                      value={[inputs.currentCosts.maintenance]}
                      onValueChange={([v]) => updateInput('currentCosts', 'maintenance', v)}
                      min={0}
                      max={200000}
                      step={5000}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Outsourcing/Consultoria</Label>
                      <span className="text-sm font-mono">{formatCurrency(inputs.currentCosts.outsourcing)}</span>
                    </div>
                    <Slider
                      value={[inputs.currentCosts.outsourcing]}
                      onValueChange={([v]) => updateInput('currentCosts', 'outsourcing', v)}
                      min={0}
                      max={500000}
                      step={10000}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Investimento Proposto</CardTitle>
              <CardDescription>Quanto custará a solução TOTVS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Licenças</Label>
                  <span className="text-sm font-mono">{formatCurrency(inputs.proposedInvestment.licenses)}</span>
                </div>
                <Slider
                  value={[inputs.proposedInvestment.licenses]}
                  onValueChange={([v]) => updateInput('proposedInvestment', 'licenses', v)}
                  min={0}
                  max={500000}
                  step={10000}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Implementação</Label>
                  <span className="text-sm font-mono">{formatCurrency(inputs.proposedInvestment.implementation)}</span>
                </div>
                <Slider
                  value={[inputs.proposedInvestment.implementation]}
                  onValueChange={([v]) => updateInput('proposedInvestment', 'implementation', v)}
                  min={0}
                  max={300000}
                  step={10000}
                />
              </div>

              {mode === 'advanced' && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Treinamento</Label>
                      <span className="text-sm font-mono">{formatCurrency(inputs.proposedInvestment.training)}</span>
                    </div>
                    <Slider
                      value={[inputs.proposedInvestment.training]}
                      onValueChange={([v]) => updateInput('proposedInvestment', 'training', v)}
                      min={0}
                      max={100000}
                      step={5000}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Manutenção Anual</Label>
                      <span className="text-sm font-mono">{formatCurrency(inputs.proposedInvestment.firstYearMaintenance)}</span>
                    </div>
                    <Slider
                      value={[inputs.proposedInvestment.firstYearMaintenance]}
                      onValueChange={([v]) => updateInput('proposedInvestment', 'firstYearMaintenance', v)}
                      min={0}
                      max={150000}
                      step={5000}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Benefícios Esperados</CardTitle>
              <CardDescription>Impacto previsto na operação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Redução de Tempo (%)</Label>
                  <span className="text-sm font-mono">{inputs.expectedBenefits.timeReductionPercent}%</span>
                </div>
                <Slider
                  value={[inputs.expectedBenefits.timeReductionPercent]}
                  onValueChange={([v]) => updateInput('expectedBenefits', 'timeReductionPercent', v)}
                  min={0}
                  max={80}
                  step={5}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Redução de Erros (%)</Label>
                  <span className="text-sm font-mono">{inputs.expectedBenefits.errorReductionPercent}%</span>
                </div>
                <Slider
                  value={[inputs.expectedBenefits.errorReductionPercent]}
                  onValueChange={([v]) => updateInput('expectedBenefits', 'errorReductionPercent', v)}
                  min={0}
                  max={90}
                  step={5}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Aumento de Receita (%)</Label>
                  <span className="text-sm font-mono">{inputs.expectedBenefits.revenueIncreasePercent}%</span>
                </div>
                <Slider
                  value={[inputs.expectedBenefits.revenueIncreasePercent]}
                  onValueChange={([v]) => updateInput('expectedBenefits', 'revenueIncreasePercent', v)}
                  min={0}
                  max={50}
                  step={5}
                />
              </div>

              {mode === 'advanced' && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Funcionários Impactados</Label>
                      <Input
                        type="number"
                        value={inputs.expectedBenefits.employeesAffected}
                        onChange={(e) => updateInput('expectedBenefits', 'employeesAffected', parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Salário Médio</Label>
                      <Input
                        type="number"
                        value={inputs.expectedBenefits.avgSalary}
                        onChange={(e) => updateInput('expectedBenefits', 'avgSalary', parseInt(e.target.value) || 0)}
                        className="w-32"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button size="lg" onClick={calculateROI} disabled={isCalculating}>
              {isCalculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Calcular ROI Completo
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          {results && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ROI</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${getROIColor(results.returnOnInvestment)}`}>
                      {results.returnOnInvestment.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Benchmark: {results.industryBenchmark.averageROI}% (você está no percentil {results.industryBenchmark.percentileRank})
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payback</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {results.paybackPeriodMonths} meses
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Média da indústria: {results.industryBenchmark.averagePayback} meses
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">NPV (Valor Presente Líquido)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {formatCurrency(results.netPresentValue)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Taxa de desconto: {inputs.discountRate}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Breakdown de Benefícios Anuais</CardTitle>
                </CardHeader>
                <CardContent>
                  <BenefitsBreakdown data={results.breakdownBenefits} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Projeção Ano a Ano</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.yearByYear.map((year) => (
                      <div key={year.year} className="flex items-center justify-between border-b pb-2">
                        <span className="font-semibold">Ano {year.year}</span>
                        <div className="text-right text-sm space-y-1">
                          <div>Custos: {formatCurrency(year.costs)}</div>
                          <div className="text-green-600">Benefícios: {formatCurrency(year.benefits)}</div>
                          <div className={year.netCashFlow >= 0 ? 'text-green-600 font-bold' : 'text-red-600'}>
                            Cash Flow: {formatCurrency(year.netCashFlow)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          {results && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Cash Flow Acumulado</CardTitle>
                  <CardDescription>Visualização do retorno ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <CashFlowChart data={results.yearByYear} />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
