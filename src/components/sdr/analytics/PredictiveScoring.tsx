import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PredictiveScore {
  dealId: string;
  dealTitle: string;
  currentStage: string;
  winProbability: number;
  predictedCloseDate: string;
  riskFactors: string[];
  recommendations: string[];
}

export function PredictiveScoring() {
  const { data: deals, isLoading: dealsLoading } = useDeals({ status: 'open' });
  const [predictions, setPredictions] = useState<PredictiveScore[]>([]);
  const [loading, setLoading] = useState(false);

  const calculatePredictions = async () => {
    if (!deals || deals.length === 0) return;
    
    setLoading(true);
    try {
      // Usar Lovable AI para análise preditiva
      const { data, error } = await supabase.functions.invoke('ai-predict-deals', {
        body: { 
          deals: deals.slice(0, 10).map(d => ({
            id: d.id,
            title: d.title,
            stage: d.stage,
            value: d.value,
            probability: d.probability,
            created_at: d.created_at,
            expected_close_date: d.expected_close_date,
            company_name: d.companies?.name
          }))
        }
      });

      if (error) throw error;
      setPredictions(data.predictions || []);
      toast.success('Análise preditiva concluída!');
    } catch (error) {
      console.error('Erro ao calcular predições:', error);
      toast.error('Erro ao calcular predições');
      
      // Fallback: cálculo simples local
      const simplePredictions = deals.slice(0, 10).map(deal => {
        const daysInPipeline = Math.floor(
          (new Date().getTime() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        let winProbability = deal.probability;
        const riskFactors: string[] = [];
        const recommendations: string[] = [];

        // Ajustar probabilidade baseado em tempo
        if (daysInPipeline > 60) {
          winProbability -= 15;
          riskFactors.push('Deal muito antigo (>60 dias)');
          recommendations.push('Acelerar contato com decisor');
        } else if (daysInPipeline > 30) {
          winProbability -= 5;
          riskFactors.push('Deal estagnado');
        }

        // Ajustar por valor
        if (deal.value > 100000) {
          recommendations.push('Deal de alto valor - requer atenção executiva');
        }

        // Ajustar por estágio
        if (deal.stage === 'discovery') {
          recommendations.push('Qualificar necessidades e orçamento');
        } else if (deal.stage === 'proposal') {
          recommendations.push('Enviar proposta personalizada');
        }

        return {
          dealId: deal.id,
          dealTitle: deal.title,
          currentStage: deal.stage,
          winProbability: Math.max(0, Math.min(100, winProbability)),
          predictedCloseDate: deal.expected_close_date || 'Não definida',
          riskFactors,
          recommendations
        };
      });

      setPredictions(simplePredictions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculatePredictions();
  }, [deals?.length]);

  const sortedPredictions = [...predictions].sort((a, b) => b.winProbability - a.winProbability);

  if (dealsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Predictive Scoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Predictive Scoring
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={calculatePredictions}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Recalcular</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedPredictions.map((pred) => (
            <div 
              key={pred.dealId} 
              className="p-4 border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{pred.dealTitle}</h4>
                  <p className="text-sm text-muted-foreground">Estágio: {pred.currentStage}</p>
                </div>
                <Badge 
                  variant={pred.winProbability >= 70 ? 'default' : pred.winProbability >= 40 ? 'secondary' : 'destructive'}
                  className="flex items-center gap-1"
                >
                  <TrendingUp className="h-3 w-3" />
                  {pred.winProbability.toFixed(0)}% chance
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      pred.winProbability >= 70 ? 'bg-green-500' :
                      pred.winProbability >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${pred.winProbability}%` }}
                  />
                </div>
              </div>

              {/* Risk Factors */}
              {pred.riskFactors.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-orange-600 flex items-center gap-1 mb-1">
                    <AlertCircle className="h-3 w-3" />
                    Fatores de Risco:
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                    {pred.riskFactors.map((risk, i) => (
                      <li key={i}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {pred.recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-blue-600 mb-1">Recomendações:</p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                    {pred.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          {predictions.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma predição disponível</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
