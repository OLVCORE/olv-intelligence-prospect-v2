import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, AlertCircle, CheckCircle2, Target } from "lucide-react";
import { useCalculateWinProbability, WinProbabilityResult } from "@/hooks/useWinProbability";

interface WinProbabilityCardProps {
  companyId: string;
  companyName: string;
}

export function WinProbabilityCard({ companyId, companyName }: WinProbabilityCardProps) {
  const [dealValue, setDealValue] = useState<string>("");
  const [daysInPipeline, setDaysInPipeline] = useState<string>("");
  const [result, setResult] = useState<WinProbabilityResult | null>(null);

  const calculateMutation = useCalculateWinProbability();

  const handleCalculate = () => {
    calculateMutation.mutate(
      {
        companyId,
        dealValue: dealValue ? parseFloat(dealValue) : undefined,
        daysInPipeline: daysInPipeline ? parseInt(daysInPipeline) : undefined,
      },
      {
        onSuccess: (data) => setResult(data),
      }
    );
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-success';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return 'text-success';
    if (probability >= 40) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <CardTitle>Win Probability AI Engine</CardTitle>
        </div>
        <CardDescription>
          Calcule a probabilidade de ganhar este deal com IA avançada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="deal-value">Valor do Deal (R$)</Label>
            <Input
              id="deal-value"
              type="number"
              placeholder="100000"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="days-pipeline">Dias no Pipeline</Label>
            <Input
              id="days-pipeline"
              type="number"
              placeholder="30"
              value={daysInPipeline}
              onChange={(e) => setDaysInPipeline(e.target.value)}
            />
          </div>
        </div>

        <Button 
          onClick={handleCalculate} 
          disabled={calculateMutation.isPending}
          className="w-full"
          size="lg"
        >
          {calculateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Calculando com IA...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />
              Calcular Probabilidade
            </>
          )}
        </Button>

        {/* Results Display */}
        {result && (
          <div className="space-y-4 pt-4 border-t">
            {/* Probability Score */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">Probabilidade de Ganho</span>
                <Badge className={getConfidenceColor(result.confidence)}>
                  {result.confidence.toUpperCase()}
                </Badge>
              </div>
              <div className={`text-6xl font-bold ${getProbabilityColor(result.final_probability)}`}>
                {result.final_probability}%
              </div>
              <Progress value={result.final_probability} className="h-3" />
            </div>

            {/* AI Insights */}
            {result.insights && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1">Insights Estratégicos</p>
                    <p className="text-sm text-muted-foreground">{result.insights}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Context Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Risco TOTVS</p>
                <Badge variant={result.context_summary.totvs_risk === 'high' ? 'destructive' : 'secondary'}>
                  {result.context_summary.totvs_risk.toUpperCase()}
                </Badge>
              </div>
              <div className="bg-card border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Nível de Intenção</p>
                <Badge variant={result.context_summary.intent_level === 'hot' ? 'default' : 'secondary'}>
                  {result.context_summary.intent_level.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Key Factors */}
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Fatores Críticos
              </p>
              <ul className="space-y-2">
                {result.key_factors.map((factor, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground bg-muted/50 rounded px-3 py-2">
                    {factor}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Recomendações
              </p>
              <ul className="space-y-2">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm bg-success/10 border border-success/20 rounded px-3 py-2">
                    ✓ {rec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Metadata */}
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              Calculado em {new Date(result.calculated_at).toLocaleString('pt-BR')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
