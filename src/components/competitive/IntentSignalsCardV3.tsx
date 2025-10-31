import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RefreshCw, ExternalLink, ChevronDown, ChevronUp, TrendingUp, Flame, Thermometer, Snowflake, CheckCircle2, AlertTriangle } from "lucide-react";
import { useDetectIntentSignalsV3, useLatestIntentSignalsV3, CompanyMatch } from "@/hooks/useIntentSignalsV3";
import { CompanyMatchSelectorDialog } from "./CompanyMatchSelectorDialog";
import { toast } from "sonner";
import { useState } from "react";

interface IntentSignalsCardV3Props {
  company?: {
    id: string;
    name: string;
    cnpj?: string;
    domain?: string;
    region?: string;
    sector?: string;
    niche?: string;
  };
}

export function IntentSignalsCardV3({ company }: IntentSignalsCardV3Props) {
  const detectMutation = useDetectIntentSignalsV3();
  const { data: latestDetection } = useLatestIntentSignalsV3(company?.id);
  const [showMethodology, setShowMethodology] = useState(false);
  const [showSignals, setShowSignals] = useState(true);
  const [showMatchSelector, setShowMatchSelector] = useState(false);
  const [companyMatches, setCompanyMatches] = useState<CompanyMatch[]>([]);
  const [originalCompanyName, setOriginalCompanyName] = useState("");
  const [showOpenWeb, setShowOpenWeb] = useState(true);
  
  const OPEN_WEB_SOURCES = new Set([
    'CVM RAD','B3 BVMF','Serasa Experian','ADVFN Brasil','Investidor10','Banco Central','Jusbrasil','IstoÉ Dinheiro','Alta Administração','Public Now','B3 Site Empresas','Reclame Aqui','TMA Brasil'
  ]);


  const handleDetect = () => {
    if (!company) {
      toast.error("Selecione uma empresa primeiro");
      return;
    }

    detectMutation.mutate({
      companyId: company.id,
      companyName: company.name,
      cnpj: company.cnpj,
      domain: company.domain,
      region: company.region,
      sector: company.sector,
      niche: company.niche
    }, {
      onSuccess: (data) => {
        if (data.multiple_matches && data.matches) {
          setCompanyMatches(data.matches);
          setOriginalCompanyName(data.original_company_name || company.name);
          setShowMatchSelector(true);
        }
      }
    });
  };

  const handleSelectMatch = (match: CompanyMatch) => {
    if (!company) return;
    
    setShowMatchSelector(false);
    
    // Re-executar análise com o nome selecionado
    detectMutation.mutate({
      companyId: company.id,
      companyName: company.name,
      cnpj: company.cnpj,
      domain: company.domain,
      region: company.region,
      sector: company.sector,
      niche: company.niche,
      selected_company_name: match.name
    });
  };

  const handleLinkClick = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copiado para área de transferência");
  };

  const getTemperatureColor = (temp: string) => {
    if (temp === 'hot') return "text-orange-600";
    if (temp === 'warm') return "text-yellow-600";
    return "text-blue-600";
  };

  const getTemperatureIcon = (temp: string) => {
    if (temp === 'hot') return <Flame className="h-5 w-5" />;
    if (temp === 'warm') return <Thermometer className="h-5 w-5" />;
    return <Snowflake className="h-5 w-5" />;
  };

  const getTemperatureLabel = (temp: string) => {
    if (temp === 'hot') return "🔥 HOT LEAD";
    if (temp === 'warm') return "🌡️ WARM LEAD";
    return "❄️ COLD LEAD";
  };

  const methodology = latestDetection?.methodology as any;
  const signals = latestDetection?.signals as any[] || [];

  return (
    <>
      <CompanyMatchSelectorDialog
        open={showMatchSelector}
        onOpenChange={setShowMatchSelector}
        originalCompanyName={originalCompanyName}
        matches={companyMatches}
        onSelectMatch={handleSelectMatch}
        isProcessing={detectMutation.isPending}
      />
      
      <Card>
        <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sinais de Intenção v3.0
            </CardTitle>
            <CardDescription>
              Análise com metodologia transparente
            </CardDescription>
          </div>
          <Button
            onClick={handleDetect}
            disabled={detectMutation.isPending || !company}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${detectMutation.isPending ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!company && (
          <Alert>
            <AlertDescription>
              Selecione uma empresa para começar a análise
            </AlertDescription>
          </Alert>
        )}

        {latestDetection && (
          <>
            {/* Temperatura e Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Score de Intenção</span>
                <Badge 
                  variant={latestDetection.temperature === 'hot' ? 'destructive' : 
                          latestDetection.temperature === 'warm' ? 'default' : 'secondary'}
                  className="gap-1"
                >
                  {getTemperatureIcon(latestDetection.temperature)}
                  {getTemperatureLabel(latestDetection.temperature)}
                </Badge>
              </div>
              <Progress value={latestDetection.score || 0} className="h-3" />
              <div className="flex items-center justify-between text-sm">
                <span className={getTemperatureColor(latestDetection.temperature)}>
                  {latestDetection.score || 0}/100 pontos
                </span>
                <span className="text-muted-foreground">
                  {latestDetection.confidence === 'high' ? 'Alta confiança' : 
                   latestDetection.confidence === 'medium' ? 'Média confiança' : 
                   'Baixa confiança'}
                </span>
              </div>
            </div>

            {/* Status Alert */}
            {latestDetection.temperature === 'hot' && (
              <Alert className="border-orange-200 bg-orange-50">
                <Flame className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>HOT LEAD:</strong> Empresa apresenta sinais fortes de intenção de compra. Momento ideal para abordagem!
                </AlertDescription>
              </Alert>
            )}

            {latestDetection.temperature === 'warm' && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <Thermometer className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>WARM LEAD:</strong> Empresa apresenta alguns sinais de intenção. Considere nutrição antes da abordagem.
                </AlertDescription>
              </Alert>
            )}

            {latestDetection.temperature === 'cold' && (
              <Alert className="border-blue-200 bg-blue-50">
                <Snowflake className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>COLD LEAD:</strong> Poucos sinais detectados. Requer trabalho de geração de demanda.
                </AlertDescription>
              </Alert>
            )}

            {/* Metodologia Detalhada */}
            {methodology && (
              <Collapsible open={showMethodology} onOpenChange={setShowMethodology}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      📊 Metodologia de Cálculo
                    </span>
                    {showMethodology ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4 border rounded-lg p-4 bg-muted/30">
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Fórmula:</strong> {methodology.calculation_formula}
                    </div>
                    <div className="text-sm">
                      <strong>Limiares:</strong>
                      <ul className="list-disc list-inside ml-2 text-muted-foreground">
                        <li>❄️ Cold: &lt;{methodology.threshold_applied?.cold_if_below} pontos</li>
                        <li>🌡️ Warm: {methodology.threshold_applied?.warm_if_between?.[0]}-{methodology.threshold_applied?.warm_if_between?.[1]} pontos</li>
                        <li>🔥 Hot: ≥{methodology.threshold_applied?.hot_if_above} pontos</li>
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Fontes consultadas:</strong> {methodology.total_sources_checked}
                    </div>
                    <div>
                      <strong>Com sinais:</strong> {methodology.sources_with_results?.length || 0}
                    </div>
                  </div>

                  {/* Detalhamento por fonte */}
                  <div className="space-y-3">
                    <strong className="text-sm">Detalhamento por Fonte:</strong>
                    {methodology.score_breakdown?.map((item: any, idx: number) => (
                      <div 
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          item.points_awarded > 0 ? 'bg-green-50 border-green-200' : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium flex items-center gap-2">
                            {item.points_awarded > 0 ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            )}
                            {item.source}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant={item.points_awarded > 0 ? "default" : "outline"}>
                              {item.points_awarded}/{item.max_points} pts
                            </Badge>
                            {item.search_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(item.search_url, '_blank')}
                                className="h-6 px-2"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.reason}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between font-medium">
                      <span>TOTAL:</span>
                      <span className={getTemperatureColor(latestDetection.temperature)}>
                        {latestDetection.score || 0}/100 pontos
                      </span>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Open Web - nova gaveta */}
            {methodology && methodology.score_breakdown && (
              <Collapsible open={showOpenWeb} onOpenChange={setShowOpenWeb}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between mt-4">
                    <span className="flex items-center gap-2">🌐 Open Web</span>
                    {showOpenWeb ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-4 border rounded-lg p-4 bg-muted/30">
                  {methodology.score_breakdown
                    .filter((item: any) => OPEN_WEB_SOURCES.has(item.source))
                    .map((item: any, idx: number) => (
                      <div key={`ow-${idx}`} className={`p-3 rounded-lg border ${item.points_awarded > 0 ? 'bg-green-50 border-green-200' : 'bg-muted/50'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium flex items-center gap-2">
                            {item.points_awarded > 0 ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            )}
                            {item.source}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant={item.points_awarded > 0 ? 'default' : 'outline'}>
                              {item.points_awarded}/{item.max_points} pts
                            </Badge>
                            {item.search_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(item.search_url, '_blank')}
                                className="h-6 px-2"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.reason}</p>
                      </div>
                    ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Sinais Detectados */}
            {signals.length > 0 && (
              <Collapsible open={showSignals} onOpenChange={setShowSignals}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      📡 Sinais Detectados ({signals.length})
                    </span>
                    {showSignals ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-4">
                {signals.map((signal, idx) => {
                    const isNegative = signal.score < 0;
                    const scoreDisplay = isNegative ? signal.score : `+${signal.score}`;
                    
                    return (
                      <div 
                        key={idx} 
                        className={`border rounded-lg p-4 space-y-2 ${
                          isNegative 
                            ? 'bg-red-50 border-red-300' 
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant={isNegative ? "destructive" : "default"}
                                className="font-semibold"
                              >
                                {scoreDisplay} pts
                              </Badge>
                              <span className={`text-sm font-medium capitalize ${isNegative ? 'text-red-700' : ''}`}>
                                {signal.type.replace('_', ' ')}
                              </span>
                              {signal.confidence && (
                                <Badge variant="outline" className="text-xs">
                                  {signal.confidence === 'high' ? 'Alta' : 
                                   signal.confidence === 'medium' ? 'Média' : 'Baixa'} confiança
                                </Badge>
                              )}
                            </div>
                            <h4 className={`font-medium text-sm ${isNegative ? 'text-red-900' : ''}`}>
                              {signal.title}
                            </h4>
                          </div>
                        </div>
                        
                        <p className={`text-sm ${isNegative ? 'text-red-700' : 'text-muted-foreground'}`}>
                          {signal.description}
                        </p>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(signal.timestamp).toLocaleString('pt-BR')}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(signal.url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Abrir link
                          </Button>
                        </div>

                        <div className={`text-xs italic border-t pt-2 ${
                          isNegative ? 'text-red-800 font-semibold' : 'text-muted-foreground'
                        }`}>
                          <strong>Razão:</strong> {signal.reason}
                        </div>
                      </div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}

            {signals.length === 0 && (
              <Alert>
                <AlertDescription>
                  Nenhum sinal de intenção detectado para esta empresa.
                </AlertDescription>
              </Alert>
            )}

            {/* Última verificação */}
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              Última verificação: {new Date(latestDetection.checked_at).toLocaleString('pt-BR')}
            </div>
        </>
        )}
      </CardContent>
    </Card>
    </>
  );
}
