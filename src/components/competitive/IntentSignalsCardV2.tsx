import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Briefcase, Newspaper, Users, Search, ExternalLink, Play, Loader2, AlertCircle, ChevronDown, Copy } from "lucide-react";
import { useDetectIntentSignalsV2, useLatestIntentSignals } from "@/hooks/useIntentSignalsV2";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface IntentSignalsCardV2Props {
  company?: {
    id: string;
    name: string;
    domain?: string;
  } | null;
}

export function IntentSignalsCardV2({ company }: IntentSignalsCardV2Props) {
  const { mutate: detectSignals, isPending } = useDetectIntentSignalsV2();
  const { data: latestDetection, isLoading } = useLatestIntentSignals(company?.id);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleLinkClick = async (url: string, e: React.MouseEvent) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!', {
        description: 'O link foi copiado. Se não abrir automaticamente, cole no navegador.',
      });
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const getSignalIcon = (type: string) => {
    const icons: Record<string, any> = {
      'job_posting': { icon: Briefcase, color: 'text-blue-500' },
      'news': { icon: Newspaper, color: 'text-green-500' },
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
    if (!company) return;
    detectSignals({
      companyId: company.id,
      companyName: company.name,
      cnpj: (company as any).cnpj,
      region: (company as any).location?.state || (company as any).region,
      sector: (company as any).industry || (company as any).sector,
    });
  };

  const score = latestDetection?.score ?? 0;
  const signals = (latestDetection?.signals as any[]) ?? [];
  const platformsScanned = (latestDetection?.platforms_scanned as string[]) ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Sinais de Intenção de Compra
              {score >= 70 && <span className="text-green-600">🔥</span>}
            </CardTitle>
            <CardDescription>
              Detecta sinais em tempo real via Google Custom Search API
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isPending && (
              <Badge variant="outline" className="animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Buscando sinais...
              </Badge>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={handleDetect}
                      disabled={isPending || isLoading || !company}
                      size="sm"
                      variant={!latestDetection ? "default" : "outline"}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {isPending ? 'Buscando em 4 fontes' : !latestDetection ? '🚀 Iniciar' : '🔄 Atualizar'}
                    </Button>
                  </div>
                </TooltipTrigger>
                {!company && (
                  <TooltipContent>
                    <p>Selecione uma empresa primeiro</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* How it works - Collapsible */}
        <Collapsible open={showExplanation} onOpenChange={setShowExplanation}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between mt-2 text-xs">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-3 w-3" />
                Como funciona a detecção? (Google Custom Search API)
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
                    Busca vagas: CIO, Diretor TI, Gerente TI, Analista ERP (últimos 3 meses)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Newspaper className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-green-600">News (25 pts)</strong>
                  <p className="text-muted-foreground mt-0.5">
                    Procura notícias: expansão, IPO, transformação digital, investimento (últimos 6 meses)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-orange-600">LinkedIn Activity (15 pts)</strong>
                  <p className="text-muted-foreground mt-0.5">
                    Posts sobre modernização, investimento em TI (últimos 3 meses)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Search className="h-4 w-4 text-pink-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-pink-600">Search Activity (20 pts)</strong>
                  <p className="text-muted-foreground mt-0.5">
                    "Software gestão", "ERP", "alternativas SAP" (último mês)
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <strong className="text-primary">✅ API Ativa:</strong>
                <ul className="mt-1 space-y-0.5 ml-4 text-muted-foreground">
                  <li>• Google Custom Search API</li>
                  <li>• Validação de menção da empresa</li>
                  <li>• Filtros por data</li>
                </ul>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>

      <CardContent className="space-y-4">
        {!company ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Selecione uma empresa para detectar sinais de intenção
            </AlertDescription>
          </Alert>
        ) : latestDetection ? (
          <>
            {/* Intent Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Intent Score</span>
                {getScoreBadge(score)}
              </div>
              <div className="flex items-center gap-4">
                <Progress value={score} className="flex-1" />
                <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                  {score}
                </span>
              </div>
              {score >= 70 && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">
                    <strong>⚡ Momento IDEAL para contato!</strong>
                    <p className="text-xs mt-1">
                      Esta empresa está ativamente buscando soluções. Sinais detectados via Google Custom Search API.
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
                  Sinais Detectados ({signals.length})
                </h4>
                
                {/* Platforms Scanned */}
                {platformsScanned.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Plataformas Consultadas ({platformsScanned.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {platformsScanned.map((platform: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  {signals.map((signal: any, idx: number) => (
                    <div key={idx} className="bg-muted/50 rounded-lg p-3 space-y-2 border border-border">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getSignalIcon(signal.type)}
                          <span className="text-sm font-medium">{getSignalLabel(signal.type)}</span>
                          <Badge variant="default" className="text-xs bg-green-600">
                            +{signal.score} pts
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(signal.timestamp), { 
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-primary">{signal.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed bg-background/50 p-2 rounded">
                        {signal.description}
                      </p>
                      <p className="text-xs text-muted-foreground italic">
                        {signal.reason}
                      </p>
                      {signal.url && (
                        <div className="space-y-2 pt-1 border-t">
                          <div className="flex gap-2">
                            <a
                              href={signal.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => handleLinkClick(signal.url, e)}
                              className="flex-1 text-xs text-primary hover:underline flex items-center gap-1 font-medium bg-primary/5 p-2 rounded hover:bg-primary/10 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              🔗 Abrir Link
                            </a>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-auto py-2 px-3"
                              onClick={async () => {
                                await navigator.clipboard.writeText(signal.url);
                                toast.success('Link copiado!');
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : score === 0 ? (
              <div className="text-center py-4 px-3 bg-muted/30 border border-border rounded-lg">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-muted-foreground">Nenhum sinal detectado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  4 fontes consultadas via Google Custom Search API
                </p>
              </div>
            ) : null}

            {/* Last Check */}
            {latestDetection.checked_at && (
              <p className="text-xs text-muted-foreground">
                Última verificação: {formatDistanceToNow(new Date(latestDetection.checked_at), { 
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-8 space-y-3">
            <Search className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
            <div>
              <p className="font-medium mb-2">Clique em "Iniciar" para buscar sinais em tempo real</p>
              <p className="text-xs text-muted-foreground">
                Sistema conectado ao Google Custom Search API
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
