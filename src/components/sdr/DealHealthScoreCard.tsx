import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { useDealHealthScore, useCalculateDealHealth } from '@/hooks/useDealHealthScore';

interface DealHealthScoreCardProps {
  companyId: string;
}

export function DealHealthScoreCard({ companyId }: DealHealthScoreCardProps) {
  const { data: healthScore, isLoading } = useDealHealthScore(companyId);
  const calculateHealth = useCalculateDealHealth();

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskBadge = (risk: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };

    return (
      <Badge className={colors[risk as keyof typeof colors]}>
        {risk.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (!healthScore) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-semibold mb-2">Deal Health Score não calculado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Calcule o score de saúde para obter insights sobre este deal
            </p>
            <Button
              onClick={() => calculateHealth.mutate(companyId)}
              disabled={calculateHealth.isPending}
            >
              {calculateHealth.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Calcular Health Score
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Deal Health Score
            {getRiskBadge(healthScore.risk_level)}
          </h3>
          <p className="text-sm text-muted-foreground">
            Atualizado há {new Date(healthScore.calculated_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => calculateHealth.mutate(companyId)}
          disabled={calculateHealth.isPending}
        >
          <RefreshCw className={`w-4 h-4 ${calculateHealth.isPending ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Score Principal */}
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <span className="text-4xl font-bold">{healthScore.health_score}</span>
          <span className="text-muted-foreground">/100</span>
        </div>
        <Progress 
          value={healthScore.health_score} 
          className="h-3"
        />
      </div>

      {/* Scores Detalhados */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Atividade</span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={healthScore.activity_score} className="flex-1 h-2" />
            <span className="text-sm font-medium w-8">{healthScore.activity_score}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Velocidade</span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={healthScore.velocity_score} className="flex-1 h-2" />
            <span className="text-sm font-medium w-8">{healthScore.velocity_score}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Stakeholders</span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={healthScore.stakeholder_score} className="flex-1 h-2" />
            <span className="text-sm font-medium w-8">{healthScore.stakeholder_score}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Engajamento</span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={healthScore.engagement_score} className="flex-1 h-2" />
            <span className="text-sm font-medium w-8">{healthScore.engagement_score}</span>
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      {healthScore.risk_factors && healthScore.risk_factors.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Fatores de Risco
          </h4>
          <div className="space-y-2">
            {healthScore.risk_factors.map((factor, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 rounded-lg bg-muted/50"
              >
                <TrendingDown className="w-4 h-4 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm">{factor.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {healthScore.recommendations && healthScore.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" />
            Próximas Ações Recomendadas
          </h4>
          <div className="space-y-2">
            {healthScore.recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"
              >
                <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{rec.description}</p>
                    <Badge variant="outline" className="text-xs">
                      {rec.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
