import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Target, Calendar, Save, Eye, ArrowLeft } from "lucide-react";
import { useValueTracking, useCreateValueTracking, ValueTracking } from "@/hooks/useValueTracking";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ExportButton } from "@/components/export/ExportButton";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ScrollToTopButton } from "@/components/common/ScrollToTopButton";

interface ValueRealizationDashboardProps {
  companyId: string;
  accountStrategyId: string;
  promisedROI?: number;
  promisedPayback?: number;
  promisedSavings?: number;
}

export function ValueRealizationDashboard({
  companyId,
  accountStrategyId,
  promisedROI = 0,
  promisedPayback = 12,
  promisedSavings = 0,
}: ValueRealizationDashboardProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: trackings, isLoading } = useValueTracking(accountStrategyId);
  const createTracking = useCreateValueTracking();
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const activeTracking = trackings?.[0];

  const handleSaveData = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(`value_tracking_${companyId}`, JSON.stringify({
        trackings,
        savedAt: new Date().toISOString(),
      }));
      toast({
        title: "✅ Tracking de valor salvo",
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

  const handleStartTracking = async () => {
    await createTracking.mutateAsync({
      company_id: companyId,
      account_strategy_id: accountStrategyId,
      promised_roi: promisedROI,
      promised_payback_months: promisedPayback,
      promised_annual_savings: promisedSavings,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateVariance = (promised: number, realized: number) => {
    if (promised === 0) return 0;
    return ((realized - promised) / promised) * 100;
  };

  const getHealthColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (variance < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Target className="h-4 w-4 text-muted-foreground" />;
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!activeTracking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Value Realization Tracking</CardTitle>
          <CardDescription>
            Acompanhe o valor prometido vs valor entregue ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-accent/50 rounded-lg">
                <p className="text-sm text-muted-foreground">ROI Prometido</p>
                <p className="text-2xl font-bold">{promisedROI}%</p>
              </div>
              <div className="p-4 bg-accent/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Payback Esperado</p>
                <p className="text-2xl font-bold">{promisedPayback} meses</p>
              </div>
              <div className="p-4 bg-accent/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Economia Anual</p>
                <p className="text-2xl font-bold">{formatCurrency(promisedSavings)}</p>
              </div>
            </div>
            <Button onClick={handleStartTracking} disabled={createTracking.isPending}>
              <Target className="mr-2 h-4 w-4" />
              {createTracking.isPending ? 'Iniciando...' : 'Iniciar Tracking de Valor'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const roiVariance = calculateVariance(activeTracking.promised_roi, activeTracking.realized_roi);
  const savingsVariance = calculateVariance(activeTracking.promised_annual_savings, activeTracking.realized_annual_savings);

  return (
    <div className="space-y-6">
      {/* Header com Health Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Value Realization Tracking</CardTitle>
              <CardDescription>
                Iniciado em {new Date(activeTracking.baseline_date).toLocaleDateString('pt-BR')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Health Score</p>
                <p className={`text-3xl font-bold ${getHealthColor(activeTracking.health_score)}`}>
                  {(activeTracking.health_score * 100).toFixed(0)}%
                </p>
                <Badge variant={activeTracking.health_score >= 0.8 ? 'default' : 'destructive'}>
                  {activeTracking.tracking_status}
                </Badge>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button variant="default" size="sm" onClick={handleSaveData} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <ExportButton
                  data={activeTracking}
                  filename={`value_tracking_${companyId}`}
                  variant="outline"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* ROI */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Prometido</span>
                <span className="text-sm font-semibold">{activeTracking.promised_roi}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Realizado</span>
                <span className="text-sm font-semibold">{activeTracking.realized_roi}%</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                {getVarianceIcon(roiVariance)}
                <span className={`text-sm font-bold ${roiVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {roiVariance > 0 ? '+' : ''}{roiVariance.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payback */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Esperado</span>
                <span className="text-sm font-semibold">{activeTracking.promised_payback_months} meses</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Real</span>
                <span className="text-sm font-semibold">
                  {activeTracking.realized_payback_months || '—'} meses
                </span>
              </div>
              <Separator />
              {activeTracking.realized_payback_months && (
                <div className="flex items-center justify-between">
                  {activeTracking.realized_payback_months <= activeTracking.promised_payback_months ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm font-bold">
                    {activeTracking.realized_payback_months <= activeTracking.promised_payback_months ? 'No prazo' : 'Atrasado'}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Economia Anual */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Economia Anual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Prometido</span>
                <span className="text-sm font-semibold">
                  {formatCurrency(activeTracking.promised_annual_savings)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Realizado</span>
                <span className="text-sm font-semibold">
                  {formatCurrency(activeTracking.realized_annual_savings)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                {getVarianceIcon(savingsVariance)}
                <span className={`text-sm font-bold ${savingsVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {savingsVariance > 0 ? '+' : ''}{savingsVariance.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Eficiência */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ganho de Eficiência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Meta</span>
                <span className="text-sm font-semibold">{activeTracking.promised_efficiency_gain}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Atual</span>
                <span className="text-sm font-semibold">{activeTracking.realized_efficiency_gain}%</span>
              </div>
              <Separator />
              <Progress 
                value={(activeTracking.realized_efficiency_gain / activeTracking.promised_efficiency_gain) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Risco */}
      {activeTracking.risk_flags && activeTracking.risk_flags.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="h-5 w-5" />
              Alertas de Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeTracking.risk_flags.map((flag: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-yellow-500/10 rounded">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{flag.message || flag}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Próxima Revisão */}
      {activeTracking.next_review_date && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Próxima Revisão</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activeTracking.next_review_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <Badge variant="outline">{activeTracking.review_frequency}</Badge>
            </div>
          </CardContent>
        </Card>
      )}
      <ScrollToTopButton />
    </div>
  );
}
