import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle, Play, ExternalLink, Loader2, Briefcase, Search, Globe, Users, ChevronDown, Copy } from "lucide-react";
import { useTOTVSDetectionV2, useLatestTOTVSDetection } from "@/hooks/useTOTVSDetectionV2";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TOTVSDetectionCardV2Props {
  company?: {
    id: string;
    name: string;
    domain?: string;
  } | null;
}

export function TOTVSDetectionCardV2({ company }: TOTVSDetectionCardV2Props) {
  const { mutate: detectTOTVS, isPending } = useTOTVSDetectionV2();
  const { data: latestDetection, isLoading } = useLatestTOTVSDetection(company?.id);
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

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-destructive";
    if (score >= 30) return "text-yellow-600";
    return "text-green-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return "Alta probabilidade";
    if (score >= 30) return "Possível uso";
    return "Não detectado";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 70) return <Badge variant="destructive">⛔ USA TOTVS</Badge>;
    if (score >= 30) return <Badge variant="outline" className="border-yellow-600 text-yellow-600">⚠️ Verificar</Badge>;
    return <Badge variant="outline" className="border-green-600 text-green-600">✅ Qualificado</Badge>;
  };

  const handleDetect = () => {
    if (!company) return;
    detectTOTVS({
      companyId: company.id,
      companyName: company.name,
      companyDomain: company.domain,
    });
  };

  const sourceIcons: Record<string, any> = {
    'linkedin_jobs': { icon: Briefcase, color: 'text-blue-500', label: '💼 LinkedIn Jobs' },
    'financial_docs': { icon: Search, color: 'text-green-600', label: '📊 Docs Financeiros' },
    'google_news': { icon: Search, color: 'text-orange-500', label: '📰 Google News' },
    'reclame_aqui': { icon: AlertCircle, color: 'text-red-500', label: '⚠️ Reclame Aqui' },
    'website': { icon: Globe, color: 'text-purple-500', label: '🌐 Website' }
  };

  const score = latestDetection?.score ?? 0;
  const evidences = (latestDetection?.evidences as any[]) ?? [];
  const platformsScanned = (latestDetection?.platforms_scanned as string[]) ?? [];
  const disqualificationReason = latestDetection?.disqualification_reason as string;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Detecção de Uso de TOTVS
              {latestDetection?.status === 'disqualified' && <XCircle className="h-5 w-5 text-destructive" />}
            </CardTitle>
            <CardDescription>
              Sistema multi-fonte conectado ao Google Custom Search API
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isPending && (
              <Badge variant="outline" className="animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Consultando APIs...
              </Badge>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={handleDetect}
                      disabled={isPending || !company}
                      size="sm"
                      variant={!latestDetection ? "default" : "outline"}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {isPending ? 'Buscando em 5 fontes' : !latestDetection ? '🚀 Iniciar' : '🔄 Atualizar'}
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
                  <strong className="text-blue-600">LinkedIn Jobs (30 pts)</strong>
                  <p className="text-muted-foreground mt-0.5">
                    Busca vagas via <strong>Google Custom Search</strong> com query: TOTVS/Protheus + nome da empresa
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Search className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-green-600">Documentos Financeiros (25 pts)</strong>
                  <p className="text-muted-foreground mt-0.5">
                    Busca <strong>PDFs de balanços, DREs</strong> mencionando TOTVS + empresa
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Search className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-orange-600">Google News (20 pts)</strong>
                  <p className="text-muted-foreground mt-0.5">
                    Procura notícias: "usa TOTVS", "cliente TOTVS", "implementou Protheus"
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-red-600">Reclame Aqui (15 pts)</strong>
                  <p className="text-muted-foreground mt-0.5">
                    Busca reclamações sobre TOTVS em <strong>reclameaqui.com.br</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Globe className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-purple-600">Website (10 pts)</strong>
                  <p className="text-muted-foreground mt-0.5">
                    Busca no site da empresa por menções a TOTVS/Protheus
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <strong className="text-primary">✅ API Ativa:</strong>
                <ul className="mt-1 space-y-0.5 ml-4 text-muted-foreground">
                  <li>• Google Custom Search API</li>
                  <li>• Validação de menção da empresa em cada resultado</li>
                  <li>• Tokenização e normalização de nomes</li>
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
              Selecione uma empresa para executar a detecção de uso TOTVS
            </AlertDescription>
          </Alert>
        ) : latestDetection ? (
          <>
            {/* Score Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Score de Confiança</span>
                {getScoreBadge(score)}
              </div>
              <div className="flex items-center gap-4">
                <Progress value={score} className="flex-1" />
                <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                  {score}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {getScoreLabel(score)}
              </p>
            </div>

            {/* Zero Score Alert */}
            {score === 0 && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>✅ Nenhuma evidência de uso de TOTVS encontrada!</strong>
                  <p className="text-xs mt-1">
                    As 5 fontes foram consultadas via Google Custom Search API e não encontraram menções validadas. 
                    <strong> Lead qualificado para prospecção! 🎯</strong>
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Disqualification Alert */}
            {latestDetection.status === 'disqualified' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>⛔ Lead Desqualificado Automaticamente</strong>
                  <p className="text-xs mt-1">
                    Score ≥ 70 indica alta probabilidade de já usar TOTVS.
                  </p>
                  {disqualificationReason && (
                    <p className="text-xs mt-2 font-medium">
                      Razão: {disqualificationReason}
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Platforms Scanned */}
            {platformsScanned.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Plataformas Consultadas ({platformsScanned.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {platformsScanned.map((platform: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Detection Evidences */}
            {evidences.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Evidências Encontradas ({evidences.length})
                </h4>
                <div className="space-y-2">
                  {evidences.map((evidence: any, idx: number) => {
                    const sourceConfig = sourceIcons[evidence.source];
                    const IconComponent = sourceConfig?.icon || Search;
                    
                    return (
                      <div key={idx} className="bg-muted/50 rounded-lg p-3 space-y-2 border border-border">
                        <div className="flex items-start gap-3">
                          <IconComponent className={`h-4 w-4 ${sourceConfig?.color || 'text-muted-foreground'} shrink-0 mt-0.5`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{sourceConfig?.label || evidence.source}</span>
                                {evidence.platform && evidence.platform !== evidence.source && (
                                  <Badge variant="outline" className="text-xs">
                                    {evidence.platform}
                                  </Badge>
                                )}
                              </div>
                              <Badge variant="destructive" className="text-xs">
                                +{evidence.score} pts
                              </Badge>
                            </div>
                            <p className="text-sm font-semibold text-primary mb-1">{evidence.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed bg-background/50 p-2 rounded mb-2">
                              {evidence.snippet}
                            </p>
                            {evidence.totvs_products_mentioned && evidence.totvs_products_mentioned.length > 0 && (
                              <div className="mb-2 flex flex-wrap gap-1">
                                {evidence.totvs_products_mentioned.map((product: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {product}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground italic mb-2">
                              {evidence.reason}
                            </p>
                            {evidence.url ? (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <a
                                    href={evidence.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => handleLinkClick(evidence.url, e)}
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
                                      await navigator.clipboard.writeText(evidence.url);
                                      toast.success('Link copiado!');
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Detectado: {formatDistanceToNow(new Date(evidence.timestamp), { 
                                    addSuffix: true,
                                    locale: ptBR,
                                  })}
                                </p>
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded flex items-center gap-2">
                                <AlertCircle className="h-3 w-3" />
                                Evidência detectada via busca no website
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : score === 0 ? (
              <div className="text-center py-4 px-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-800">✅ Nenhuma fonte detectou uso de TOTVS</p>
                <p className="text-xs text-green-700 mt-1">
                  5 fontes consultadas via Google Custom Search API
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
              <p className="font-medium mb-2">Clique em "Iniciar" para buscar evidências em tempo real</p>
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
