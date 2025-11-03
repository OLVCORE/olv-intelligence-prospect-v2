import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Target, TrendingUp } from 'lucide-react';

interface ExecutiveSummaryReportProps {
  data: any;
}

export default function ExecutiveSummaryReport({ data }: ExecutiveSummaryReportProps) {
  const score = data?.icpScore || data?.totalScore || 0;
  const temperatura = data?.temperatura || data?.leadClassification || 'cold';
  const isClienteTOTVS = data?.status === 'cliente_totvs';
  
  // Calcular recomendação
  const getRecomendacao = () => {
    if (isClienteTOTVS) return { text: 'Cross-Selling', icon: Target, color: 'text-blue-600' };
    if (score >= 75) return { text: 'Prospectar Agora', icon: CheckCircle, color: 'text-green-600' };
    if (score >= 50) return { text: 'Nutrir Lead', icon: Clock, color: 'text-yellow-600' };
    return { text: 'Descartar', icon: AlertTriangle, color: 'text-red-600' };
  };
  
  const recomendacao = getRecomendacao();
  const RecomendacaoIcon = recomendacao.icon;
  
  // Timeline sugerida
  const getTimeline = () => {
    if (isClienteTOTVS) return 'Imediato - Oportunidade de Cross-Sell';
    if (score >= 75) return 'Abordar em 7 dias';
    if (score >= 50) return 'Acompanhar 30 dias';
    return 'Long-term (90+ dias)';
  };
  
  return (
    <div className="space-y-6">
      {/* Header com Score Geral */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Executive Summary</h2>
            <p className="text-muted-foreground">Visão geral estratégica da análise</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold mb-2">{score}</div>
            <Badge variant={score >= 75 ? 'default' : score >= 50 ? 'secondary' : 'outline'}>
              {temperatura === 'hot' && '🔥 Hot Lead'}
              {temperatura === 'warm' && '🟡 Warm Lead'}
              {temperatura === 'cold' && '🔵 Cold Lead'}
            </Badge>
          </div>
        </div>
        
        {/* Recomendação */}
        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
          <RecomendacaoIcon className={`h-6 w-6 ${recomendacao.color}`} />
          <div>
            <div className="font-semibold">{recomendacao.text}</div>
            <div className="text-sm text-muted-foreground">{getTimeline()}</div>
          </div>
        </div>
      </Card>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Cliente TOTVS?</div>
          <div className="text-2xl font-bold">
            {isClienteTOTVS ? (
              <span className="text-green-600">✅ Sim</span>
            ) : (
              <span className="text-blue-600">❌ Não</span>
            )}
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Concorrentes Ativos</div>
          <div className="text-2xl font-bold">{data?.competitors?.length || 0}</div>
          {data?.competitors?.slice(0, 3).map((c: any, i: number) => (
            <div key={i} className="text-xs text-muted-foreground">{c.name}</div>
          ))}
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Empresas Similares</div>
          <div className="text-2xl font-bold">{data?.similarCompanies?.length || 0}</div>
          <div className="text-xs text-muted-foreground">Prospects qualificados</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Produtos Recomendados</div>
          <div className="text-2xl font-bold">{data?.productGaps?.length || 0}</div>
          {data?.productGaps?.slice(0, 2).map((p: any, i: number) => (
            <div key={i} className="text-xs text-muted-foreground">{p.name}</div>
          ))}
        </Card>
      </div>
      
      {/* Estatísticas de Evidências */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Distribuição de Evidências</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">{data?.quintupleMatches || 0}</div>
            <div className="text-sm text-muted-foreground">Quintuple (5pts)</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{data?.quadrupleMatches || 0}</div>
            <div className="text-sm text-muted-foreground">Quadruple (4pts)</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{data?.tripleMatches || 0}</div>
            <div className="text-sm text-muted-foreground">Triple (3pts)</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-3xl font-bold text-yellow-600">{data?.doubleMatches || 0}</div>
            <div className="text-sm text-muted-foreground">Double (2pts)</div>
          </div>
        </div>
      </Card>
      
      {/* Insights Rápidos */}
      {data?.insights && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Insights Estratégicos
          </h3>
          <ul className="space-y-2">
            {data.insights.slice(0, 4).map((insight: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary">→</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
