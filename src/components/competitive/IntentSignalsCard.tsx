import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Briefcase, Newspaper, Users, Search, ExternalLink, Play } from "lucide-react";
import { useIntentSignals, useDetectIntentSignals, useCalculateIntentScore } from "@/hooks/useIntentSignals";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface IntentSignalsCardProps {
  company: {
    id: string;
    name: string;
    domain?: string;
    cnpj?: string;
  };
}

export function IntentSignalsCard({ company }: IntentSignalsCardProps) {
  const { data: signals = [], isLoading } = useIntentSignals(company.id);
  const { data: intentScore = 0 } = useCalculateIntentScore(company.id);
  const { mutate: detectSignals, isPending } = useDetectIntentSignals();

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'job_posting':
        return <Briefcase className="h-4 w-4" />;
      case 'news':
        return <Newspaper className="h-4 w-4" />;
      case 'growth':
        return <TrendingUp className="h-4 w-4" />;
      case 'linkedin_activity':
        return <Users className="h-4 w-4" />;
      case 'search_activity':
        return <Search className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getSignalLabel = (type: string) => {
    switch (type) {
      case 'job_posting':
        return 'Vaga Aberta';
      case 'news':
        return 'Notícia';
      case 'growth':
        return 'Crescimento';
      case 'linkedin_activity':
        return 'LinkedIn';
      case 'search_activity':
        return 'Pesquisa';
      default:
        return type;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-muted-foreground";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 70) return <Badge variant="default" className="bg-green-600">🔥 HOT LEAD</Badge>;
    if (score >= 40) return <Badge variant="outline" className="border-yellow-600 text-yellow-600">🌡️ Warm</Badge>;
    return <Badge variant="outline">❄️ Cold</Badge>;
  };

  const handleDetect = () => {
    detectSignals({
      companyId: company.id,
      companyName: company.name,
      companyDomain: company.domain,
      cnpj: company.cnpj,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Sinais de Intenção de Compra
              {intentScore >= 70 && <span className="text-green-600">🔥</span>}
            </CardTitle>
            <CardDescription>
              Detecta sinais que indicam momento ideal para prospecção
            </CardDescription>
          </div>
          <Button
            onClick={handleDetect}
            disabled={isPending || isLoading}
            size="sm"
            variant={signals.length === 0 ? "default" : "outline"}
          >
            <Play className="h-4 w-4 mr-2" />
            {isPending ? 'Detectando...' : signals.length === 0 ? 'Iniciar Detecção' : 'Atualizar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Intent Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Intent Score</span>
            {getScoreBadge(intentScore)}
          </div>
          <div className="flex items-center gap-4">
            <Progress value={intentScore} className="flex-1" />
            <span className={`text-2xl font-bold ${getScoreColor(intentScore)}`}>
              {intentScore}
            </span>
          </div>
          {intentScore >= 70 && (
            <p className="text-sm text-green-600 font-medium">
              ⚡ Momento IDEAL para contato! Esta empresa está ativamente buscando soluções.
            </p>
          )}
        </div>

        {/* Signals List */}
        {signals.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              Sinais Detectados ({signals.length})
            </h4>
            <div className="space-y-2">
              {signals.map((signal) => (
                <div key={signal.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getSignalIcon(signal.signal_type)}
                      <span className="text-sm font-medium">{getSignalLabel(signal.signal_type)}</span>
                      <Badge variant="outline" className="text-xs">
                        {signal.confidence_score} pts
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(signal.detected_at), { 
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{signal.signal_title}</p>
                  <p className="text-xs text-muted-foreground">{signal.signal_description}</p>
                  {signal.signal_url && (
                    <a
                      href={signal.signal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Ver fonte <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : !isLoading && (
          <div className="text-center py-8 space-y-2">
            <Search className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Nenhum sinal detectado ainda. Clique em "Iniciar Detecção" para buscar.
            </p>
          </div>
        )}

        {/* Signal Types Explanation */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <h4 className="text-sm font-medium">Tipos de Sinais (Score Ponderado)</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• <strong>💼 Vagas Abertas (30 pts):</strong> TI, ERP, Analista Sistemas</li>
            <li>• <strong>📰 Notícias (25 pts):</strong> Expansão, IPO, Transformação Digital</li>
            <li>• <strong>📊 Crescimento (10 pts):</strong> Receita &gt;20%, Contratações &gt;50</li>
            <li>• <strong>👥 LinkedIn (15 pts):</strong> Posts sobre modernização, investimento</li>
            <li>• <strong>🔍 Pesquisas (20 pts):</strong> "ERP", "Software Gestão", "Alternativas SAP"</li>
            <li className="pt-1 border-t mt-2">
              <strong>Score ≥ 70:</strong> HOT LEAD 🔥 (momento ideal!)
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
