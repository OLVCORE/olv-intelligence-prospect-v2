import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, DollarSign, Calendar, AlertCircle, ArrowLeft, Download, Save, Eye, FileSpreadsheet } from 'lucide-react';
import { CashFlowChart } from './charts/CashFlowChart';
import { BenefitsBreakdown } from './charts/BenefitsBreakdown';
import { TOTVSProductSelector, type TOTVSProduct } from './TOTVSProductSelector';
import { CurrentCostsSelector, type CurrentCostItem } from './CurrentCostsSelector';
import { TOTVSCostsSelector, type TOTVSCostItem } from './TOTVSCostsSelector';
import { ExportButton } from '@/components/export/ExportButton';
import { ScrollToTopButton } from '@/components/common/ScrollToTopButton';
import { UnsavedChangesWarning } from '@/components/common/UnsavedChangesWarning';
import { useModuleDraft } from '@/hooks/useModuleDraft';
import { useCrossModuleData } from '@/hooks/useCrossModuleData';
import type { QuoteProduct } from '@/hooks/useQuotes';


interface ROICalculatorProps {
  companyId: string;
  accountStrategyId?: string;
  initialData?: Partial<ROIInputs>;
  onUnsavedChangesMount?: (hasChanges: () => boolean, save: () => Promise<void>) => void;
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

export function InteractiveROICalculator({ companyId, accountStrategyId, initialData, onUnsavedChangesMount }: ROICalculatorProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCalculating, setIsCalculating] = useState(false);
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [showPreview, setShowPreview] = useState(false);

  // Estado completo para draft
  const [localState, setLocalState] = useState({
    selectedProducts: [] as TOTVSProduct[],
    currentCosts: [] as CurrentCostItem[],
    totvsCosts: [] as TOTVSCostItem[],
    inputs: {
      currentCosts: {
        software: initialData?.currentCosts?.software || 0,
        personnel: initialData?.currentCosts?.personnel || 0,
        maintenance: initialData?.currentCosts?.maintenance || 0,
        outsourcing: initialData?.currentCosts?.outsourcing || 0,
      },
      proposedInvestment: {
        licenses: initialData?.proposedInvestment?.licenses || 0,
        implementation: initialData?.proposedInvestment?.implementation || 0,
        training: initialData?.proposedInvestment?.training || 0,
        firstYearMaintenance: initialData?.proposedInvestment?.firstYearMaintenance || 0,
      },
      expectedBenefits: {
        timeReductionPercent: initialData?.expectedBenefits?.timeReductionPercent || 0,
        errorReductionPercent: initialData?.expectedBenefits?.errorReductionPercent || 0,
        revenueIncreasePercent: initialData?.expectedBenefits?.revenueIncreasePercent || 0,
        employeesAffected: initialData?.expectedBenefits?.employeesAffected || 0,
        avgSalary: initialData?.expectedBenefits?.avgSalary || 0,
      },
      projectYears: 3 as 1 | 3 | 5,
      discountRate: 10,
    } as ROIInputs,
    results: null as ROIOutput | null,
  });

  const { selectedProducts, currentCosts, totvsCosts, inputs, results } = localState;

  // Hook para salvamento progressivo
  const {
    data: draftData,
    hasUnsavedChanges,
    isSaving,
    save,
    updateData,
  } = useModuleDraft(localState, {
    module: 'roi',
    companyId,
    accountStrategyId,
    title: `ROI - ${companyId || accountStrategyId}`,
    autoSaveInterval: 10000, // 10s
  });

// Carregar produtos do CPQ para sincronização
const { data: cpqData } = useCrossModuleData<{ selectedProducts: QuoteProduct[]; priceOverrides: Record<string, number> }>({
  sourceModule: 'cpq',
  companyId,
  accountStrategyId,
});

// Assinatura estável dos dados do CPQ para evitar loops
const cpqSignature = JSON.stringify({
  selected: (cpqData?.selectedProducts || [])
    .map(p => ({ sku: p.sku, qty: p.quantity, price: p.base_price }))
    .sort((a, b) => a.sku.localeCompare(b.sku)),
  overrides: cpqData?.priceOverrides || {},
});

  // Sincronizar produtos do CPQ para o ROI automaticamente (MERGE, não sobrescrever)
  useEffect(() => {
    if (!cpqSignature) return;
    if (cpqData?.selectedProducts && cpqData.selectedProducts.length > 0) {
      const convertedProducts: (TOTVSProduct & { fromCPQ?: boolean })[] = cpqData.selectedProducts.map(product => {
        const effectivePrice = cpqData.priceOverrides?.[product.sku] ?? product.base_price;
        const totalLicenseCost = effectivePrice * product.quantity;
        return {
          id: product.sku,
          name: product.name,
          licenseCost: totalLicenseCost,
          implementationCost: Math.round(totalLicenseCost * 0.3),
          maintenanceCost: Math.round(totalLicenseCost * 0.2),
          users: product.quantity,
          fromCPQ: true, // Marca que veio do CPQ
        };
      });

      // MERGE: manter produtos manuais (sem fromCPQ), atualizar/adicionar produtos do CPQ
      const manualProducts = selectedProducts.filter((p: any) => !p.fromCPQ);
      const cpqProductIds = new Set(convertedProducts.map(p => p.id));
      
      // Remove produtos CPQ antigos que não estão mais no CPQ
      const filteredManualProducts = manualProducts.filter(p => !cpqProductIds.has(p.id));
      
      // Merge: produtos manuais + produtos do CPQ (atualizados)
      const mergedProducts = [...filteredManualProducts, ...convertedProducts];

      const currentSignature = selectedProducts.map(p => `${p.id}:${p.licenseCost}:${p.implementationCost}:${p.maintenanceCost}`).sort().join('|');
      const newSignature = mergedProducts.map(p => `${p.id}:${p.licenseCost}:${p.implementationCost}:${p.maintenanceCost}`).sort().join('|');
      
      if (currentSignature !== newSignature) {
        setLocalState(prev => ({
          ...prev,
          selectedProducts: mergedProducts,
        }));
        updateData(prev => ({
          ...prev,
          selectedProducts: mergedProducts,
        }));
        toast({
          title: "📦 Produtos sincronizados do CPQ",
          description: `${convertedProducts.length} produto(s) do CPQ + ${filteredManualProducts.length} manual(is)`,
        });
      }
    }
  }, [cpqSignature]);


  // Notificar o componente pai sobre as funções de verificação e salvamento
  useEffect(() => {
    if (onUnsavedChangesMount) {
      onUnsavedChangesMount(() => hasUnsavedChanges, save);
    }
  }, [hasUnsavedChanges, save, onUnsavedChangesMount]);

  // Sincronizar draftData com localState quando carrega
  useEffect(() => {
    if (draftData && Object.keys(draftData).length > 0) {
      setLocalState(draftData);
    }
  }, [draftData]);

  // Auto-calculate when products or costs change
  useEffect(() => {
    const totalLicenses = selectedProducts.reduce((sum, p) => {
      const base = (p.licenseCost || 0);
      const subs = (p.subModules || []).reduce((s, sm) => s + (sm.licenseCost || 0), 0);
      return sum + base + subs;
    }, 0);
    const totalImplementation = selectedProducts.reduce((sum, p) => {
      const base = (p.implementationCost || 0);
      const subs = (p.subModules || []).reduce((s, sm) => s + (sm.implementationCost || 0), 0);
      return sum + base + subs;
    }, 0);
    const totalMaintenance = selectedProducts.reduce((sum, p) => {
      const base = (p.maintenanceCost || 0);
      const subs = (p.subModules || []).reduce((s, sm) => s + (sm.maintenanceCost || 0), 0);
      return sum + base + subs;
    }, 0);
    
    const totalTotvsCosts = totvsCosts.reduce((sum, c) => sum + (c.cost || 0), 0);

    updateData(prev => ({
      ...prev,
      inputs: {
        ...prev.inputs,
        proposedInvestment: {
          ...prev.inputs.proposedInvestment,
          licenses: totalLicenses,
          implementation: totalImplementation + totalTotvsCosts,
          firstYearMaintenance: totalMaintenance,
        }
      }
    }));
  }, [selectedProducts, totvsCosts, updateData]);

  // Auto-calculate current costs when they change
  useEffect(() => {
    const softwareCosts = currentCosts
      .filter(c => c.category === 'software')
      .reduce((sum, c) => sum + (c.cost || 0), 0);
    
    const personnelCosts = currentCosts
      .filter(c => c.category === 'personnel')
      .reduce((sum, c) => sum + (c.cost || 0), 0);
    
    const maintenanceCosts = currentCosts
      .filter(c => c.category === 'maintenance')
      .reduce((sum, c) => sum + (c.cost || 0), 0);
    
    const consultingCosts = currentCosts
      .filter(c => c.category === 'consulting')
      .reduce((sum, c) => sum + (c.cost || 0), 0);

    updateData(prev => ({
      ...prev,
      inputs: {
        ...prev.inputs,
        currentCosts: {
          software: softwareCosts * 12, // Annual
          personnel: personnelCosts * 12, // Annual
          maintenance: maintenanceCosts * 12, // Annual
          outsourcing: consultingCosts * 12, // Annual
        }
      }
    }));
  }, [currentCosts, updateData]);

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

      updateData(prev => ({ ...prev, results: data.results }));
      
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
    updateData(prev => ({
      ...prev,
      inputs: {
        ...prev.inputs,
        [category]: {
          ...(prev.inputs[category] as any),
          [field]: value,
        },
      }
    }));
  };

  useEffect(() => {
    // Auto-calculate quando inputs mudam (debounced) - só se houver dados mínimos
    const hasMinimumData = 
      (inputs.currentCosts.software > 0 || inputs.currentCosts.personnel > 0) &&
      (inputs.proposedInvestment.licenses > 0 || inputs.proposedInvestment.implementation > 0);
    
    const timer = setTimeout(() => {
      if (mode === 'simple' && hasMinimumData) {
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

  const handleSaveData = async () => {
    await save();
  };

  const handlePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div className="space-y-6">
      <UnsavedChangesWarning hasUnsavedChanges={hasUnsavedChanges} onSave={save} />
      <ScrollToTopButton />
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Calculadora de ROI Interativa
              </CardTitle>
              <CardDescription>
                Análise completa de retorno sobre investimento com projeções 3-5 anos
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveData}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              {results && (
                <>
                  <ExportButton
                    data={results}
                    filename={`roi_analysis_${companyId}`}
                    variant="outline"
                    size="sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a 
                      href={`data:application/vnd.ms-excel;base64,${btoa(JSON.stringify(results))}`}
                      download={`roi_analysis_${companyId}.xlsx`}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Excel
                    </a>
                  </Button>
                </>
              )}
              <div className="border-l pl-2 flex gap-2">
                {cpqData?.selectedProducts && cpqData.selectedProducts.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <span className="text-xs">🔄</span>
                    Sincronizado com CPQ
                  </Badge>
                )}
                <Badge 
                  variant={mode === 'simple' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setMode('simple')}
                >
                  Simples {mode === 'simple' && '✓'}
                </Badge>
                <Badge
                  variant={mode === 'advanced' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setMode('advanced')}
                >
                  Avançado {mode === 'advanced' && '✓'}
                </Badge>
              </div>
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
          {/* Nota de Sincronização com CPQ */}
          {cpqData?.selectedProducts && cpqData.selectedProducts.length > 0 && (
            <div className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 dark:text-blue-400 text-xl">🔄</div>
                <div className="flex-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Produtos Sincronizados com CPQ
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Os produtos selecionados no módulo CPQ foram importados automaticamente. 
                    Você pode ajustar os valores de implementação e manutenção abaixo.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Seletor de Produtos TOTVS */}
          <TOTVSProductSelector
                selectedProducts={selectedProducts}
                onProductsChange={(products) => {
                  setLocalState(prev => ({ ...prev, selectedProducts: products }));
                  updateData(prev => ({ ...prev, selectedProducts: products }));
                }}
                onSaveProduct={save}
          />

          {/* Custos Atuais - Seletor Detalhado */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Custos Atuais</h3>
            <p className="text-sm text-muted-foreground">
              Quanto você gasta hoje com sistemas e processos
            </p>

              <CurrentCostsSelector
                selectedCosts={currentCosts}
                onCostsChange={(costs) => updateData(prev => ({ ...prev, currentCosts: costs }))}
                onSaveCost={save}
              />
          </div>

          {/* Investimento Proposto TOTVS */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">2. Investimento Proposto</h3>
            <p className="text-sm text-muted-foreground">
              Quanto custará a solução TOTVS
            </p>

              <TOTVSCostsSelector
                selectedCosts={totvsCosts}
                onCostsChange={(costs) => updateData(prev => ({ ...prev, totvsCosts: costs }))}
                onSaveCost={save}
              />

            <Card>
              <CardHeader>
                <CardTitle>Resumo do Investimento</CardTitle>
                <CardDescription>
                  Valores calculados automaticamente dos produtos e serviços selecionados
                  {selectedProducts.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedProducts.length} produto(s)
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Licenças Totais</Label>
                      <p className="text-2xl font-bold">{formatCurrency(inputs.proposedInvestment.licenses)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Implementação Total</Label>
                      <p className="text-2xl font-bold">{formatCurrency(inputs.proposedInvestment.implementation)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Manutenção Anual</Label>
                      <p className="text-2xl font-bold">{formatCurrency(inputs.proposedInvestment.firstYearMaintenance)}</p>
                    </div>
                  </div>
                </div>

                {mode === 'advanced' && (
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
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>3. Benefícios Esperados</CardTitle>
              <CardDescription>Configure os benefícios esperados baseados em dados reais do projeto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Redução de Tempo (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={inputs.expectedBenefits.timeReductionPercent || ''}
                      onChange={(e) => updateInput('expectedBenefits', 'timeReductionPercent', parseFloat(e.target.value) || 0)}
                      className="w-20 text-right"
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                    <span className="text-sm font-mono">{inputs.expectedBenefits.timeReductionPercent}%</span>
                  </div>
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
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={inputs.expectedBenefits.errorReductionPercent || ''}
                      onChange={(e) => updateInput('expectedBenefits', 'errorReductionPercent', parseFloat(e.target.value) || 0)}
                      className="w-20 text-right"
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                    <span className="text-sm font-mono">{inputs.expectedBenefits.errorReductionPercent}%</span>
                  </div>
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
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={inputs.expectedBenefits.revenueIncreasePercent || ''}
                      onChange={(e) => updateInput('expectedBenefits', 'revenueIncreasePercent', parseFloat(e.target.value) || 0)}
                      className="w-20 text-right"
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                    <span className="text-sm font-mono">{inputs.expectedBenefits.revenueIncreasePercent}%</span>
                  </div>
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
          {!results ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Nenhum resultado ainda</h3>
                <p className="text-muted-foreground mb-4">
                  Configure os produtos TOTVS e custos na aba "Inputs" e clique em "Calcular ROI Completo"
                </p>
                <Button onClick={calculateROI} disabled={isCalculating}>
                  {isCalculating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Calculando...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Calcular ROI Agora
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ROI</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${getROIColor(results.returnOnInvestment ?? 0)}`}>
                      {(results.returnOnInvestment ?? 0).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Benchmark: {results.industryBenchmark?.averageROI ?? 0}% (você está no percentil {results.industryBenchmark?.percentileRank ?? 0})
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
                      {results.paybackPeriodMonths ?? 0} meses
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Média da indústria: {results.industryBenchmark?.averagePayback ?? 0} meses
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
                      {formatCurrency(results.netPresentValue ?? 0)}
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
                  {results.breakdownBenefits ? (
                    <BenefitsBreakdown data={results.breakdownBenefits} />
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Sem dados de benefícios</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Projeção Ano a Ano</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(results.yearByYear ?? []).map((year) => (
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
          {!results ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Nenhum resultado para visualizar</h3>
                <p className="text-muted-foreground mb-4">
                  Calcule o ROI primeiro para ver os gráficos
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Cash Flow Acumulado</CardTitle>
                  <CardDescription>Visualização do retorno ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  {results.yearByYear && results.yearByYear.length > 0 ? (
                    <CashFlowChart data={results.yearByYear} />
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Sem dados para visualizar</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
