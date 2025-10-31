import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RefreshCw, ExternalLink, ChevronDown, ChevronUp, BarChart3, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useTOTVSDetectionV5, useLatestTOTVSDetectionV5 } from "@/hooks/useTOTVSDetectionV5";
import { toast } from "sonner";
import { useState } from "react";

interface TOTVSDetectionCardV3Props {
  company?: {
    id: string;
    name: string;
    cnpj?: string;
    domain?: string;
    state?: string;
    city?: string;
    sector_code?: string;
    niche_code?: string;
  };
}

export function TOTVSDetectionCardV3({ company }: TOTVSDetectionCardV3Props) {
  const detectMutation = useTOTVSDetectionV5();
  const { data: latestDetection } = useLatestTOTVSDetectionV5(company?.id);
  const [showMethodology, setShowMethodology] = useState(false);
  const [showEvidences, setShowEvidences] = useState(true);

  const handleDetect = () => {
    if (!company) {
      toast.error("Selecione uma empresa primeiro");
      return;
    }

    if (!company.state) {
      toast.error("Estado é obrigatório para análise v5.0");
      return;
    }

    // Campo niche_code é opcional - não mais obrigatório

    detectMutation.mutate({
      companyId: company.id,
      companyName: company.name,
      cnpj: company.cnpj,
      domain: company.domain,
      state: company.state,
      city: company.city,
      sectorCode: company.sector_code,
      nicheCode: company.niche_code, // Opcional
    });
  };

  const handleLinkClick = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copiado para área de transferência");
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-destructive";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return "ALTO RISCO";
    if (score >= 40) return "MÉDIO RISCO";
    return "BAIXO RISCO";
  };

  const methodology = latestDetection?.methodology as any;
  const evidences = latestDetection?.evidences as any[] || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Detecção de Uso de TOTVS v5.0
            </CardTitle>
            <CardDescription>
              Análise cirúrgica por nicho com governança completa
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
            {/* Score de Confiança */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Score de Confiança</span>
                <Badge variant={latestDetection.status === 'disqualified' ? 'destructive' : 'default'}>
                  {getScoreLabel(latestDetection.score || 0)}
                </Badge>
              </div>
              <Progress value={latestDetection.score || 0} className="h-3" />
              <div className="flex items-center justify-between text-sm">
                <span className={getScoreColor(latestDetection.score || 0)}>
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
            {latestDetection.status === 'disqualified' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>DESQUALIFICADO:</strong> {latestDetection.disqualification_reason || 'Empresa já usa TOTVS'}
                </AlertDescription>
              </Alert>
            )}

            {latestDetection.status === 'qualified' && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>QUALIFICADO:</strong> Nenhum uso de TOTVS detectado. Lead válido para prospecção.
                </AlertDescription>
              </Alert>
            )}

            {/* Metodologia Detalhada */}
            {methodology && (
              <Collapsible open={showMethodology} onOpenChange={setShowMethodology}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
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
                      <strong>Limite:</strong> ≥{methodology.threshold_applied?.disqualified_if_above} pontos = DESQUALIFICAR
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Fontes consultadas:</strong> {methodology.total_sources_checked}
                    </div>
                    <div>
                      <strong>Com resultados:</strong> {methodology.sources_with_results?.length || 0}
                    </div>
                  </div>

                  {methodology.sources_with_results && methodology.sources_with_results.length > 0 && (
                    <div className="text-sm">
                      <strong>Fontes com dados:</strong>{' '}
                      <span className="text-muted-foreground">
                        {methodology.sources_with_results.join(', ')}
                      </span>
                    </div>
                  )}

                  {methodology.sources_without_results && methodology.sources_without_results.length > 0 && (
                    <div className="text-sm">
                      <strong>Fontes sem dados:</strong>{' '}
                      <span className="text-muted-foreground">
                        {methodology.sources_without_results.join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Detalhamento por fonte */}
                  <div className="space-y-3">
                    <strong className="text-sm">Detalhamento por Fonte:</strong>
                    {methodology.score_breakdown?.map((item: any, idx: number) => (
                      <div 
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          item.points_awarded > 0 ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium flex items-center gap-2">
                            {item.points_awarded > 0 ? (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            )}
                            {item.source}
                          </span>
                          <Badge variant={item.points_awarded > 0 ? "destructive" : "outline"}>
                            {item.points_awarded}/{item.max_points} pts
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.reason}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between font-medium">
                      <span>TOTAL:</span>
                      <span className={getScoreColor(latestDetection.score || 0)}>
                        {latestDetection.score || 0}/100 pontos
                      </span>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Evidências Encontradas */}
            {evidences.length > 0 && (
              <Collapsible open={showEvidences} onOpenChange={setShowEvidences}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      🔍 Evidências Encontradas ({evidences.length})
                    </span>
                    {showEvidences ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-4">
                  {evidences.map((evidence, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-2 bg-destructive/5 border-destructive/20">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="destructive">+{evidence.score} pts</Badge>
                            <span className="text-sm font-medium">{evidence.platform}</span>
                            {evidence.confidence && (
                              <Badge variant="outline" className="text-xs">
                                {evidence.confidence === 'high' ? 'Alta' : 
                                 evidence.confidence === 'medium' ? 'Média' : 'Baixa'} confiança
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium text-sm">{evidence.title}</h4>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{evidence.snippet}</p>
                      
                      {evidence.totvs_products_mentioned && evidence.totvs_products_mentioned.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-muted-foreground">Produtos TOTVS:</span>
                          {evidence.totvs_products_mentioned.map((product: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {product}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(evidence.timestamp).toLocaleString('pt-BR')}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLinkClick(evidence.url)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Copiar link
                        </Button>
                      </div>

                      <div className="text-xs text-muted-foreground italic border-t pt-2">
                        <strong>Razão:</strong> {evidence.reason}
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Plataformas Escaneadas */}
            {latestDetection.platforms_scanned && latestDetection.platforms_scanned.length > 0 && (
              <div className="text-sm text-muted-foreground">
                <strong>Plataformas escaneadas:</strong>{' '}
                {latestDetection.platforms_scanned.join(', ')}
              </div>
            )}

            {/* Última verificação */}
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              Última verificação: {new Date(latestDetection.checked_at).toLocaleString('pt-BR')}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
