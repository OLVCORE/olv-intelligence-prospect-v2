import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Target, Save, Eye, ArrowLeft, FileSpreadsheet } from "lucide-react";
import { useScenarios, useGenerateScenarios, ScenarioCase } from "@/hooks/useScenarios";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportButton } from "@/components/export/ExportButton";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ScrollToTopButton } from "@/components/common/ScrollToTopButton";

interface ScenarioComparisonProps {
  companyId: string;
  accountStrategyId?: string;
  quoteId?: string;
  baseInvestment: number;
  baseAnnualBenefit: number;
}

export function ScenarioComparison({
  companyId,
  accountStrategyId,
  quoteId,
  baseInvestment,
  baseAnnualBenefit,
}: ScenarioComparisonProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: scenarios, isLoading } = useScenarios(accountStrategyId);
  const generateScenarios = useGenerateScenarios();
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const activeScenario = scenarios?.[0];

  const handleSaveData = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(`scenarios_data_${companyId}`, JSON.stringify({
        scenarios,
        baseInvestment,
        baseAnnualBenefit,
        savedAt: new Date().toISOString(),
      }));
      toast({
        title: "✅ Cenários salvos",
        description: "Seus dados foram salvos com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    await generateScenarios.mutateAsync({
      company_id: companyId,
      account_strategy_id: accountStrategyId,
      quote_id: quoteId,
      base_investment: baseInvestment,
      base_annual_benefit: baseAnnualBenefit,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getScenarioIcon = (type: string) => {
    if (type === 'best') return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (type === 'worst') return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <Minus className="h-5 w-5 text-yellow-600" />;
  };

  const getScenarioColor = (type: string) => {
    if (type === 'best') return 'border-green-500/50 bg-green-500/5';
    if (type === 'worst') return 'border-red-500/50 bg-red-500/5';
    return 'border-yellow-500/50 bg-yellow-500/5';
  };

  const renderScenarioCard = (title: string, type: string, data: ScenarioCase, probability: number) => (
    <Card className={`${getScenarioColor(type)} border-2`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getScenarioIcon(type)}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge variant="outline">{(probability * 100).toFixed(0)}% prob.</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">ROI</p>
            <p className="text-2xl font-bold">{data.roi.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">NPV</p>
            <p className="text-2xl font-bold">{formatCurrency(data.npv)}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Investimento</span>
            <span className="font-medium">{formatCurrency(data.total_investment)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Benefício Anual</span>
            <span className="font-medium">{formatCurrency(data.annual_benefit)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payback</span>
            <span className="font-medium">{data.payback_months} meses</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Acumulado 5 anos</span>
            <span className="font-medium">{formatCurrency(data.cumulative_5y)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!activeScenario) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Cenários</CardTitle>
          <CardDescription>
            Compare diferentes cenários de implementação (Melhor Caso, Esperado, Pior Caso)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerate} disabled={generateScenarios.isPending}>
            <Target className="mr-2 h-4 w-4" />
            {generateScenarios.isPending ? 'Gerando...' : 'Gerar Análise de Cenários'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ScrollToTopButton />
      {/* Header com botões */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Análise de Cenários</CardTitle>
              <CardDescription>
                Compare diferentes cenários de implementação (Melhor Caso, Esperado, Pior Caso)
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              {activeScenario && (
                <>
                  <Button variant="default" size="sm" onClick={handleSaveData} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <ExportButton
                    data={activeScenario}
                    filename={`scenarios_${companyId}`}
                    variant="outline"
                    size="sm"
                  />
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Análise</CardTitle>
          <CardDescription>
            Cenário recomendado: <strong className="capitalize">{activeScenario.recommended_scenario}</strong> (Confiança: {(activeScenario.confidence_level * 100).toFixed(0)}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeScenario.key_insights.map((insight: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparação de Cenários */}
      <div className="grid gap-4 md:grid-cols-3">
        {renderScenarioCard(
          'Melhor Caso',
          'best',
          activeScenario.best_case,
          activeScenario.probability_best
        )}
        {renderScenarioCard(
          'Cenário Esperado',
          'expected',
          activeScenario.expected_case,
          activeScenario.probability_expected
        )}
        {renderScenarioCard(
          'Pior Caso',
          'worst',
          activeScenario.worst_case,
          activeScenario.probability_worst
        )}
      </div>

      {/* Fatores de Risco */}
      {activeScenario.risk_factors.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <CardTitle>Fatores de Risco</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeScenario.risk_factors.map((risk: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{risk.factor}</span>
                    <Badge variant={risk.impact === 'high' ? 'destructive' : 'secondary'}>
                      {risk.impact}
                    </Badge>
                  </div>
                  <Progress value={risk.probability * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground">{risk.mitigation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Premissas */}
      {activeScenario.assumptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Premissas da Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {activeScenario.assumptions.map((assumption: string, idx: number) => (
                <li key={idx} className="text-sm flex items-start">
                  <span className="mr-2">•</span>
                  <span>{assumption}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
