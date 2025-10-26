import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle, Play, ExternalLink, Loader2, Briefcase, Search, Globe, Users, ChevronDown } from "lucide-react";
import { useTOTVSDetection } from "@/hooks/useTOTVSDetection";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface TOTVSDetectionCardProps {
  company: {
    id: string;
    name: string;
    domain?: string;
    totvs_detection_score?: number;
    totvs_detection_sources?: any[];
    totvs_last_checked_at?: string;
    is_disqualified?: boolean;
  };
}

export function TOTVSDetectionCard({ company }: TOTVSDetectionCardProps) {
  const { mutate: detectTOTVS, isPending } = useTOTVSDetection();
  const [showExplanation, setShowExplanation] = useState(false);

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
    detectTOTVS({
      companyId: company.id,
      companyName: company.name,
      companyDomain: company.domain,
    });
  };

  const sourceIcons: Record<string, any> = {
    'linkedin_jobs': { icon: Briefcase, color: 'text-blue-500', label: '💼 LinkedIn Jobs' },
    'google_news': { icon: Search, color: 'text-green-500', label: '📰 Google News' },
    'website_scraping': { icon: Globe, color: 'text-purple-500', label: '🌐 Website' },
    'linkedin_profiles': { icon: Users, color: 'text-orange-500', label: '👤 LinkedIn Profiles' }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Detecção de Uso de TOTVS
              {company.is_disqualified && <XCircle className="h-5 w-5 text-destructive" />}
            </CardTitle>
            <CardDescription>
              Sistema multi-fonte conectado às APIs reais de busca web
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isPending && (
              <Badge variant="outline" className="animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Consultando APIs...
              </Badge>
            )}
            <Button
              onClick={handleDetect}
              disabled={isPending}
              size="sm"
              variant={company.totvs_detection_score === undefined ? "default" : "outline"}
            >
              <Play className="h-4 w-4 mr-2" />
              {isPending ? 'Buscando em 4 fontes' : company.totvs_detection_score === undefined ? '🚀 Iniciar' : '🔄 Atualizar'}
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
                  <strong className="text-blue-600">LinkedIn Jobs (40 pts)</strong>
                  <p className="text-muted-foreground mt-0.5">
                    Busca vagas via <strong>Serper API</strong> com query: "{company.name}" + TOTVS/Protheus
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Search className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-green-600">Google News (30 pts)</strong>
                  <p className="text-muted-foreground mt-0.5">
                    Procura notícias via <strong>Serper News API</strong>: "usa TOTVS", "cliente TOTVS", cases
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Globe className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-purple-600">Website Scraping (20 pts)</strong>
                  <p className="text-muted-foreground mt-0.5">
                    Faz <strong>HTTP request direto</strong> ao site da empresa e varre o HTML buscando "totvs", "protheus"
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-orange-600">LinkedIn Profiles (10 pts)</strong>
                  <p className="text-muted-foreground mt-0.5">
                    Busca via <strong>Serper API</strong> perfis de funcionários com skill/experiência em TOTVS
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <strong className="text-primary">✅ APIs Ativas:</strong>
                <ul className="mt-1 space-y-0.5 ml-4 text-muted-foreground">
                  <li>• Serper API (Google Search/News)</li>
                  <li>• Web Scraping Direto (HTTPS/Fetch)</li>
                  <li>• Supabase Database (armazenamento)</li>
                </ul>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>

      <CardContent className="space-y-4">
        {company.totvs_detection_score !== undefined ? (
          <>
            {/* Criteria Always Visible */}
            <div className="bg-muted/30 rounded-lg p-3 space-y-2 border border-border">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Critérios de Detecção (Score Ponderado)
              </h4>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex items-start gap-2">
                  <Briefcase className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" />
                  <span><strong>💼 LinkedIn Jobs (40 pts):</strong> Vagas mencionando TOTVS, Protheus, RM TOTVS</span>
                </div>
                <div className="flex items-start gap-2">
                  <Search className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                  <span><strong>📰 Google News (30 pts):</strong> Notícias sobre "usa TOTVS", "cliente TOTVS", cases</span>
                </div>
                <div className="flex items-start gap-2">
                  <Globe className="h-3 w-3 text-purple-500 shrink-0 mt-0.5" />
                  <span><strong>🌐 Website (20 pts):</strong> Site da empresa menciona TOTVS como parceiro/sistema</span>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="h-3 w-3 text-orange-500 shrink-0 mt-0.5" />
                  <span><strong>👤 LinkedIn Profiles (10 pts):</strong> Funcionários listam TOTVS como skill</span>
                </div>
                <div className="pt-2 border-t mt-1">
                  <strong className="text-destructive">Score ≥ 70:</strong> Auto-desqualifica (alta confiança de uso)
                </div>
              </div>
            </div>

            {/* Score Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Score de Confiança</span>
                {getScoreBadge(company.totvs_detection_score)}
              </div>
              <div className="flex items-center gap-4">
                <Progress value={company.totvs_detection_score} className="flex-1" />
                <span className={`text-2xl font-bold ${getScoreColor(company.totvs_detection_score)}`}>
                  {company.totvs_detection_score}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {getScoreLabel(company.totvs_detection_score)}
              </p>
            </div>

            {/* Zero Score Alert */}
            {company.totvs_detection_score === 0 && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>✅ Nenhuma evidência de uso de TOTVS encontrada!</strong>
                  <p className="text-xs mt-1">
                    As 4 fontes foram consultadas em tempo real via APIs (LinkedIn Jobs, Google News, Website, LinkedIn Profiles) 
                    e não encontraram menções. <strong>Lead qualificado para prospecção! 🎯</strong>
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Disqualification Alert */}
            {company.is_disqualified && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>⛔ Lead Desqualificado Automaticamente</strong>
                  <p className="text-xs mt-1">
                    Score ≥ 70 indica alta probabilidade de já usar TOTVS. Este lead foi automaticamente
                    removido do pipeline ativo.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Detection Sources */}
            {company.totvs_detection_sources && company.totvs_detection_sources.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Evidências Encontradas nas APIs ({company.totvs_detection_sources.length})
                </h4>
                <div className="space-y-2">
                  {company.totvs_detection_sources.map((source: any, idx: number) => {
                    const sourceConfig = sourceIcons[source.source];
                    const IconComponent = sourceConfig?.icon || Search;
                    
                    return (
                      <div key={idx} className="bg-muted/50 rounded-lg p-3 space-y-2 border border-border">
                        <div className="flex items-start gap-3">
                          <IconComponent className={`h-4 w-4 ${sourceConfig?.color || 'text-muted-foreground'} shrink-0 mt-0.5`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-sm font-medium">{sourceConfig?.label || source.source}</span>
                              <Badge variant="destructive" className="text-xs">
                                +{source.confidence} pts
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed bg-background/50 p-2 rounded mb-2">
                              {source.evidence}
                            </p>
                            {source.url ? (
                              <div className="space-y-1">
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium bg-primary/5 p-2 rounded hover:bg-primary/10 transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  🔗 VER EVIDÊNCIA NA FONTE ORIGINAL
                                </a>
                                <p className="text-xs text-muted-foreground italic">
                                  ⚠️ Nota: LinkedIn pode pedir verificação humana. Sites sem HTTPS podem ser bloqueados pelo navegador.
                                </p>
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded flex items-center gap-2">
                                <AlertCircle className="h-3 w-3" />
                                Evidência detectada via scraping direto do website
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : company.totvs_detection_score === 0 ? (
              <div className="text-center py-4 px-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-800">✅ Nenhuma fonte detectou uso de TOTVS</p>
                <p className="text-xs text-green-700 mt-1">4 fontes consultadas via API em tempo real</p>
              </div>
            ) : null}

            {/* Last Check */}
            {company.totvs_last_checked_at && (
              <p className="text-xs text-muted-foreground">
                Última verificação: {new Date(company.totvs_last_checked_at).toLocaleString('pt-BR')}
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-8 space-y-3">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
            <div>
              <p className="font-medium mb-2">Clique em "Iniciar" para buscar em tempo real:</p>
              <div className="text-xs space-y-2 bg-muted/30 p-4 rounded-lg text-left max-w-md mx-auto">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3 w-3 text-blue-500" />
                  <span>LinkedIn Jobs via Serper API</span>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="h-3 w-3 text-green-500" />
                  <span>Google News via Serper API</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3 text-purple-500" />
                  <span>Website Scraping Direto (HTTPS)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-orange-500" />
                  <span>LinkedIn Profiles via Serper API</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}