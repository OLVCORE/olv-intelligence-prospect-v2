import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface MetricExplanation {
  name: string;
  value: number | string;
  maxValue?: number;
  unit?: string;
  explanation: string;
  calculation: string;
  dataSources: string[];
  interpretation: string;
  actionable?: string;
}

interface ExplainableMetricProps {
  metric: MetricExplanation;
  variant?: 'default' | 'compact' | 'detailed';
  showProgress?: boolean;
}

export function ExplainableMetric({ 
  metric, 
  variant = 'default',
  showProgress = true 
}: ExplainableMetricProps) {
  const numericValue = typeof metric.value === 'number' ? metric.value : parseFloat(metric.value);
  const progress = metric.maxValue ? (numericValue / metric.maxValue) * 100 : numericValue;
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Médio';
    return 'Baixo';
  };

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <span className="text-sm font-medium">{metric.name}</span>
              <span className={`text-lg font-bold ${getScoreColor(numericValue)}`}>
                {metric.value}{metric.unit}
              </span>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-sm">
            <div className="space-y-2">
              <p className="font-semibold">{metric.explanation}</p>
              <div className="text-xs space-y-1">
                <p><strong>Cálculo:</strong> {metric.calculation}</p>
                <p><strong>Fontes:</strong> {metric.dataSources.join(', ')}</p>
                <p><strong>Interpretação:</strong> {metric.interpretation}</p>
                {metric.actionable && (
                  <p className="text-primary"><strong>Ação:</strong> {metric.actionable}</p>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg font-semibold">{metric.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {metric.explanation}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${getScoreColor(numericValue)}`}>
                  {metric.value}{metric.unit}
                </div>
                <Badge variant="outline">{getScoreLabel(numericValue)}</Badge>
              </div>
            </div>

            {showProgress && metric.maxValue && (
              <Progress value={progress} className="h-2" />
            )}

            <div className="space-y-3 pt-4 border-t">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Como é calculado</p>
                <p className="text-sm mt-1">{metric.calculation}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground">Fontes de dados</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {metric.dataSources.map((source, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {source}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground">O que isso significa</p>
                <p className="text-sm mt-1">{metric.interpretation}</p>
              </div>

              {metric.actionable && (
                <div className="bg-primary/5 p-3 rounded-md">
                  <p className="text-sm font-semibold text-primary">O que fazer</p>
                  <p className="text-sm mt-1">{metric.actionable}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="cursor-help hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{metric.name}</h4>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.explanation}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <div className={`text-2xl font-bold ${getScoreColor(numericValue)}`}>
                    {metric.value}{metric.unit}
                  </div>
                  <Badge variant="outline" className="mt-1">
                    {getScoreLabel(numericValue)}
                  </Badge>
                </div>
              </div>
              
              {showProgress && metric.maxValue && (
                <Progress value={progress} className="h-2 mt-4" />
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-md">
          <div className="space-y-2">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Cálculo</p>
              <p className="text-sm">{metric.calculation}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Fontes</p>
              <p className="text-sm">{metric.dataSources.join(', ')}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Interpretação</p>
              <p className="text-sm">{metric.interpretation}</p>
            </div>
            {metric.actionable && (
              <div className="pt-2 border-t">
                <p className="text-xs font-semibold text-primary">Ação recomendada</p>
                <p className="text-sm">{metric.actionable}</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Preset metrics for common use cases
export const METRIC_PRESETS = {
  digitalMaturityOverall: (score: number): MetricExplanation => ({
    name: 'Maturidade Digital Geral',
    value: score,
    maxValue: 100,
    unit: '',
    explanation: 'Avaliação consolidada da maturidade digital da empresa',
    calculation: 'Média ponderada de 5 dimensões: Infraestrutura (25%), Sistemas (25%), Processos (20%), Segurança (15%), Inovação (15%)',
    dataSources: ['Tech Stack Detection', 'Website Analysis', 'Social Media', 'ReceitaWS'],
    interpretation: score >= 80 
      ? 'Empresa altamente digitalizada com infraestrutura moderna e processos otimizados'
      : score >= 60
      ? 'Empresa em bom nível de digitalização, com oportunidades de otimização'
      : score >= 40
      ? 'Empresa em processo de transformação digital com lacunas significativas'
      : 'Empresa com baixa maturidade digital, grande potencial de transformação',
    actionable: score < 60 
      ? 'Recomendamos análise detalhada para identificar prioridades de transformação digital'
      : undefined,
  }),
  
  infrastructureScore: (score: number): MetricExplanation => ({
    name: 'Score de Infraestrutura',
    value: score,
    maxValue: 100,
    unit: '',
    explanation: 'Avalia a infraestrutura tecnológica da empresa',
    calculation: 'Cloud adoption (30%), Website performance (25%), Mobile readiness (20%), Security (15%), Scalability (10%)',
    dataSources: ['Tech Stack Detection', 'Website Analysis', 'SSL Check'],
    interpretation: score >= 80
      ? 'Infraestrutura moderna, escalável e com alta disponibilidade'
      : score >= 60
      ? 'Infraestrutura adequada com pontos de melhoria identificados'
      : 'Infraestrutura com limitações que podem afetar crescimento',
    actionable: score < 60
      ? 'Considere migração para cloud e modernização da infraestrutura'
      : undefined,
  }),
  
  systemsScore: (score: number): MetricExplanation => ({
    name: 'Score de Sistemas',
    value: score,
    maxValue: 100,
    unit: '',
    explanation: 'Avalia os sistemas de gestão utilizados pela empresa',
    calculation: 'ERP adoption (40%), CRM/SFA (25%), Automation tools (20%), Integration (15%)',
    dataSources: ['Tech Stack Detection', 'LinkedIn Posts', 'Job Postings'],
    interpretation: score >= 80
      ? 'Sistemas integrados e modernos cobrindo principais processos'
      : score >= 60
      ? 'Sistemas básicos implementados com oportunidades de integração'
      : 'Sistemas limitados ou desatualizados, processos manuais predominantes',
    actionable: score < 60
      ? 'Avalie soluções ERP modernas como TOTVS para centralizar gestão'
      : undefined,
  }),
  
  timingScore: (score: number): MetricExplanation => ({
    name: 'Score de Timing',
    value: score,
    maxValue: 100,
    unit: '',
    explanation: 'Indica o momento ideal para abordagem de vendas',
    calculation: 'Sinais de crescimento (30%), Mudanças organizacionais (25%), Atividade digital (20%), Sinais de dor (15%), Financeiro (10%)',
    dataSources: ['LinkedIn', 'News API', 'Job Postings', 'Social Media', 'ReceitaWS'],
    interpretation: score >= 80
      ? 'Momento excepcional - empresa em transformação ativa'
      : score >= 60
      ? 'Bom momento - empresa receptiva a novas soluções'
      : score >= 40
      ? 'Momento neutro - requer nurturing antes da abordagem'
      : 'Timing não favorável - recomenda-se monitoramento',
    actionable: score >= 60
      ? 'Abordagem imediata recomendada com foco nos sinais identificados'
      : 'Continue monitorando e construindo relacionamento',
  }),
  
  productFitScore: (score: number, productName: string): MetricExplanation => ({
    name: `Fit Score - ${productName}`,
    value: score,
    maxValue: 100,
    unit: '%',
    explanation: `Compatibilidade da empresa com ${productName}`,
    calculation: 'Necessidades identificadas (40%), Setor/Vertical (25%), Tamanho empresa (20%), Maturidade atual (15%)',
    dataSources: ['Análise de Dores', 'CNAE', 'ReceitaWS', 'Digital Maturity'],
    interpretation: score >= 80
      ? `Fit excepcional para ${productName} - necessidades claras e empresa preparada`
      : score >= 60
      ? `Bom fit para ${productName} - requer customização moderada`
      : score >= 40
      ? `Fit médio - produto pode atender mas requer adaptação significativa`
      : `Fit baixo - produto pode não ser adequado para empresa neste momento`,
    actionable: score >= 60
      ? `Agende demo/consultoria focada em ${productName}`
      : `Considere produtos alternativos ou trabalhe maturidade antes`,
  }),
};
