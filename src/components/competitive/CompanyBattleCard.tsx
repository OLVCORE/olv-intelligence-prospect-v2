import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, Target, AlertTriangle, TrendingUp, Award, 
  MessageSquare, Sparkles, RefreshCw, Loader2, CheckCircle2,
  ExternalLink, Clock
} from "lucide-react";
import { useCompanyBattleCard, useGenerateBattleCard } from "@/hooks/useCompanyBattleCard";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CompanyBattleCardProps {
  companyId: string;
  companyName: string;
}

export function CompanyBattleCard({ companyId, companyName }: CompanyBattleCardProps) {
  const { data: battleCard, isLoading } = useCompanyBattleCard(companyId);
  const { mutate: generate, isPending } = useGenerateBattleCard();

  const handleGenerate = () => {
    generate(companyId);
  };

  const getCompetitorTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'erp': '🏢 ERP Concorrente',
      'legacy': '⚙️ Sistema Legado',
      'spreadsheet': '📊 Planilhas',
      'other': '❓ Outro Sistema'
    };
    return labels[type] || type;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-green-600';
    if (confidence >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!battleCard) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-4">
          <Shield className="h-16 w-16 mx-auto opacity-30" />
          <div className="space-y-2">
            <p className="text-lg font-medium">Battle Card não gerado ainda</p>
            <p className="text-sm text-muted-foreground">
              Gere um Battle Card personalizado usando IA baseado nos dados de qualificação desta empresa
            </p>
          </div>
          <Button onClick={handleGenerate} disabled={isPending} size="lg">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando com IA...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Battle Card Inteligente
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Battle Card: {companyName}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Gerado {formatDistanceToNow(new Date(battleCard.generated_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGenerate} 
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Competidor Detectado</p>
              <Badge variant="outline" className="text-base">
                {getCompetitorTypeLabel(battleCard.competitor_type)}
              </Badge>
              <p className="mt-2 font-semibold text-lg">{battleCard.competitor_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Confiança da Detecção</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all" 
                    style={{ width: `${battleCard.detection_confidence}%` }}
                  />
                </div>
                <span className={`text-2xl font-bold ${getConfidenceColor(battleCard.detection_confidence)}`}>
                  {battleCard.detection_confidence}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estratégia de Vitória */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Estratégia de Vitória Personalizada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{battleCard.win_strategy}</p>
        </CardContent>
      </Card>

      {/* Vantagens TOTVS */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" />
            Por que TOTVS para esta empresa?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {battleCard.totvs_advantages.map((advantage, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{advantage}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Tratamento de Objeções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Tratamento de Objeções
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {battleCard.objection_handling.map((obj, idx) => (
            <div key={idx} className="border-l-4 border-primary pl-4 space-y-2">
              <div>
                <Badge variant="outline" className="mb-1">Objeção</Badge>
                <p className="text-sm font-medium">{obj.objection}</p>
              </div>
              <div>
                <Badge variant="default" className="mb-1">Resposta</Badge>
                <p className="text-sm text-muted-foreground">{obj.response}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Proof Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Proof Points & Evidências
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {battleCard.proof_points.map((point, idx) => (
              <div key={idx} className="p-4 bg-accent/50 rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm">{point.title}</h4>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {point.type === 'case_study' ? '📚 Caso' : 
                     point.type === 'metric' ? '📊 Métrica' : 
                     '💬 Depoimento'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{point.result}</p>
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-xs text-blue-800">
                    <strong>Relevância:</strong> {point.relevance}
                  </AlertDescription>
                </Alert>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Próximos Passos */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <AlertTriangle className="h-5 w-5" />
            Próximos Passos Recomendados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {battleCard.next_steps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <span className="text-sm pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Context Info */}
      {battleCard.context_snapshot && (
        <Alert>
          <AlertDescription className="text-xs">
            <strong>Contexto usado:</strong> TOTVS Score {battleCard.context_snapshot.totvs_detection_score || 0}/100, 
            {battleCard.context_snapshot.intent_signals?.length || 0} sinais de intenção detectados,
            Setor: {battleCard.context_snapshot.sector || 'Não especificado'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
