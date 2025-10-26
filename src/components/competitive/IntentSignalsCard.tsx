import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Briefcase, Newspaper, Users, Search, ExternalLink, Play, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { useIntentSignals, useDetectIntentSignals, useCalculateIntentScore } from "@/hooks/useIntentSignals";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

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
  const [showExplanation, setShowExplanation] = useState(false);

  const getSignalIcon = (type: string) => {
    const icons: Record<string, any> = {
      'job_posting': { icon: Briefcase, color: 'text-blue-500' },
      'news': { icon: Newspaper, color: 'text-green-500' },
      'growth': { icon: TrendingUp, color: 'text-purple-500' },
      'linkedin_activity': { icon: Users, color: 'text-orange-500' },
      'search_activity': { icon: Search, color: 'text-pink-500' }
    };
    const config = icons[type] || { icon: Search, color: 'text-muted-foreground' };
    return <config.icon className={`h-4 w-4 ${config.color}`} />;
  };

  const getSignalLabel = (type: string) => {
    const labels: Record<string, string> = {
      'job_posting': '💼 Vaga Aberta',
      'news': '📰 Notícia',
      'growth': '📊 Crescimento',
      'linkedin_activity': '👥 LinkedIn',
      'search_activity': '🔍 Pesquisa'
    };
    return labels[type] || type;
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
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Sinais de Intenção de Compra
              {intentScore >= 70 && <span className="text-green-600">🔥</span>}
            </CardTitle>
            <CardDescription>
              Detecta sinais em tempo real via APIs de busca e análise de dados
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isPending && (
              <Badge variant="outline" className="animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Buscando sinais...
              </Badge>
            )}
            <Button
              onClick={handleDetect}
              disabled={isPending || isLoading}
              size="sm"
              variant={signals.length === 0 ? "default" : "outline"}
            >
              <Play className="h-4 w-4 mr-2" />
              {isPending ? 'Buscando em 5 fontes' : signals.length === 0 ? '🚀 Iniciar' : '🔄 Atualizar'}
            </Button>
          </div>
        </div>

        {/* How it works - Collapsible */}
        <Collapsible open={showExplanation} onOpenChange={setShowExplanation}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between mt-2 text-xs">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-3 w-3" />
                Como funciona a detecção? (APIs conectadas)
              </span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showExplanation ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="bg-muted/50 rounded-lg p-3 space-y-3 text-xs">
              <div className="flex items-start gap-2">
                <Briefcase className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-blue-600">Job Postings (30 pts)</strong>
                  <p className="text-muted-foreground mt-0.5">
                    Busca vagas via <strong>Serper API</strong>: "{company.name}" + Analista ERP, CIO, Diretor TI
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Newspaper className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-green-600">News (25 pts)</strong>
                  <p className="text-muted-foreground mt-0.5">
                    Procura notícias via <strong>Serper News API</strong>: expansão, IPO, transformação digital, investimento
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-purple-600">Growth Indicators (10 pts)</strong>
                  <p className="text-muted-foreground mt-0.5">
                    Lê dados da <strong>tabela Econodata</strong>: crescimento de receita &gt;20%, contratações &gt;50
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-orange-600">LinkedIn Activity (15 pts)</strong>
                  <p className="text-muted-foreground mt-0.5">
                    Busca via <strong>Serper API</strong> em linkedin.com/company: posts sobre modernização, investimento em TI
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Search className="h-4 w-4 text-pink-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-pink-600">Search Activity (20 pts)</strong>
                  <p className="text-muted-foreground mt-0.5">
                    Busca via <strong>Serper API</strong>: "{company.name}" + "software gestão", "ERP", "alternativas SAP"
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <strong className="text-primary">✅ APIs Ativas:</strong>
                <ul className="mt-1 space-y-0.5 ml-4 text-muted-foreground">
                  <li>• Serper API (Google Search/News/LinkedIn)</li>
                  <li>• Supabase Database (Econodata, storage)</li>
                </ul>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Criteria Always Visible */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-2 border border-border">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Critérios de Detecção (Score Ponderado)
          </h4>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex items-start gap-2">
              <Briefcase className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>💼 Vagas Abertas (30 pts):</strong> TI, ERP, Analista Sistemas, CIO, Diretor Tecnologia</span>
            </div>
            <div className="flex items-start gap-2">
              <Newspaper className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
              <span><strong>📰 Notícias (25 pts):</strong> Expansão, IPO, Transformação Digital, Investimento</span>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="h-3 w-3 text-purple-500 shrink-0 mt-0.5" />
              <span><strong>📊 Crescimento (10 pts):</strong> Receita &gt;20%, Contratações &gt;50 funcionários</span>
            </div>
            <div className="flex items-start gap-2">
              <Users className="h-3 w-3 text-orange-500 shrink-0 mt-0.5" />
              <span><strong>👥 LinkedIn (15 pts):</strong> Posts sobre modernização, investimento em TI</span>
            </div>
            <div className="flex items-start gap-2">
              <Search className="h-3 w-3 text-pink-500 shrink-0 mt-0.5" />
              <span><strong>🔍 Pesquisas (20 pts):</strong> "Software Gestão", "ERP", "Alternativas SAP"</span>
            </div>
            <div className="pt-2 border-t mt-1">
              <strong className="text-green-600">Score ≥ 70:</strong> HOT LEAD 🔥 (momento ideal para contato!)
            </div>
          </div>
        </div>

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
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                <strong>⚡ Momento IDEAL para contato!</strong>
                <p className="text-xs mt-1">
                  Esta empresa está ativamente buscando soluções. Os sinais foram detectados em tempo real via APIs.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Signals List */}
        {signals.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Evidências Encontradas nas APIs ({signals.length})
            </h4>
            <div className="space-y-2">
              {signals.map((signal) => (
                <div key={signal.id} className="bg-muted/50 rounded-lg p-3 space-y-2 border border-border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getSignalIcon(signal.signal_type)}
                      <span className="text-sm font-medium">{getSignalLabel(signal.signal_type)}</span>
                      <Badge variant="default" className="text-xs bg-green-600">
                        +{signal.confidence_score} pts
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(signal.detected_at), { 
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-primary">{signal.signal_title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed bg-background/50 p-2 rounded">
                    {signal.signal_description}
                  </p>
                  <div className="flex flex-col gap-2 pt-1 border-t">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        📍 Fonte: {signal.signal_source}
                      </Badge>
                    </div>
                    {signal.signal_url ? (
                      <a
                        href={signal.signal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-medium bg-primary/5 p-2 rounded hover:bg-primary/10 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        🔗 VER EVIDÊNCIA NA FONTE ORIGINAL (clique para verificar)
                      </a>
                    ) : (
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded flex items-center gap-2">
                        <AlertCircle className="h-3 w-3" />
                        Evidência detectada internamente (dados do banco Econodata)
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !isLoading && signals.length === 0 && intentScore === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Search className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
            <div>
              <p className="font-medium mb-2">Clique em "Iniciar" para buscar sinais em tempo real:</p>
              <div className="text-xs space-y-2 bg-muted/30 p-4 rounded-lg text-left max-w-md mx-auto">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3 w-3 text-blue-500" />
                  <span>Vagas abertas via Serper API</span>
                </div>
                <div className="flex items-center gap-2">
                  <Newspaper className="h-3 w-3 text-green-500" />
                  <span>Notícias via Serper News API</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-purple-500" />
                  <span>Crescimento via Econodata DB</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-orange-500" />
                  <span>Atividade LinkedIn via Serper</span>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="h-3 w-3 text-pink-500" />
                  <span>Pesquisas relacionadas via Serper</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}