import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { usePipelineStages } from '@/hooks/usePipelineStages';

export function AdvancedFunnelChart() {
  const { data: deals, isLoading } = useDeals({ status: 'open' });
  const { data: stages } = usePipelineStages();

  // Calcular métricas do funil
  const funnelData = stages?.map((stage, index) => {
    const stageDeals = deals?.filter(d => d.stage === stage.key) || [];
    const stageTotalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
    const previousStageDeals = index > 0 
      ? deals?.filter(d => d.stage === stages[index - 1].key) || []
      : [];
    
    const conversionRate = previousStageDeals.length > 0
      ? (stageDeals.length / previousStageDeals.length) * 100
      : 100;

    return {
      name: stage.name,
      key: stage.key,
      count: stageDeals.length,
      value: stageTotalValue,
      conversionRate: conversionRate.toFixed(1),
      avgDealValue: stageDeals.length > 0 ? stageTotalValue / stageDeals.length : 0,
    };
  }) || [];

  const maxCount = Math.max(...funnelData.map(s => s.count), 1);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Funil de Conversão Avançado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <TrendingUp className="h-8 w-8 animate-pulse text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Funil de Conversão Avançado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {funnelData.map((stage, index) => {
            const widthPercent = (stage.count / maxCount) * 100;
            const isFirstStage = index === 0;
            
            return (
              <div key={stage.key} className="space-y-2">
                {/* Stage Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-lg">{stage.name}</h4>
                    <Badge variant="secondary">{stage.count} deals</Badge>
                    <Badge variant="outline">R$ {(stage.value / 1000).toFixed(0)}k</Badge>
                  </div>
                  {!isFirstStage && (
                    <div className="flex items-center gap-2">
                      {parseFloat(stage.conversionRate) >= 50 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        parseFloat(stage.conversionRate) >= 50 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stage.conversionRate}% conversão
                      </span>
                    </div>
                  )}
                </div>

                {/* Funnel Bar */}
                <div className="relative h-16">
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg transition-all duration-500 flex items-center justify-between px-4 hover:shadow-lg"
                    style={{ width: `${widthPercent}%`, minWidth: '15%' }}
                  >
                    <span className="text-white font-bold text-lg">{stage.count}</span>
                    <span className="text-white text-sm">
                      Ticket Médio: R$ {(stage.avgDealValue / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>

                {/* Arrow connector */}
                {index < funnelData.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ChevronRight className="h-6 w-6 text-gray-400 rotate-90" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {deals?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Total de Deals</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {funnelData.length > 0 
                  ? ((funnelData[funnelData.length - 1].count / (deals?.length || 1)) * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Taxa de Fechamento</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                R$ {((deals?.reduce((sum, d) => sum + d.value, 0) || 0) / 1000).toFixed(0)}k
              </p>
              <p className="text-sm text-muted-foreground">Pipeline Total</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
