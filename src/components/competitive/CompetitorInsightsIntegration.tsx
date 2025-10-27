import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Globe, Target, TrendingUp, ExternalLink, 
  CheckCircle2, AlertTriangle, Sparkles 
} from "lucide-react";

interface CompetitorInsight {
  name: string;
  mentions: number;
  portals: string[];
  relevance_score: number;
  comparison_links: Array<{
    portal: string;
    title: string;
    url: string;
    snippet: string;
  }>;
}

interface CompetitorInsightsIntegrationProps {
  competitors: CompetitorInsight[];
  totalPortals: number;
  portalsSearched: number;
  totalComparisons: number;
  productSearched?: string;
}

export function CompetitorInsightsIntegration({
  competitors,
  totalPortals,
  portalsSearched,
  totalComparisons,
  productSearched
}: CompetitorInsightsIntegrationProps) {
  
  const topCompetitor = competitors[0];
  
  return (
    <div className="space-y-4">
      {/* Header com métricas */}
      <Card className="border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Inteligência Competitiva Enriquecida
              </CardTitle>
              <CardDescription>
                Dados reais coletados de {portalsSearched}/{totalPortals} portais de comparação
              </CardDescription>
            </div>
            <Badge variant="default" className="text-base px-4 py-2">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {competitors.length} Concorrentes
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-accent rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Globe className="h-4 w-4" />
                Portais Pesquisados
              </div>
              <p className="text-2xl font-bold">{portalsSearched}/{totalPortals}</p>
            </div>
            <div className="p-4 bg-accent rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Target className="h-4 w-4" />
                Comparações Encontradas
              </div>
              <p className="text-2xl font-bold">{totalComparisons}</p>
            </div>
            <div className="p-4 bg-accent rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                Produto Pesquisado
              </div>
              <p className="text-sm font-semibold mt-1">{productSearched || 'ERP'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Concorrente Principal */}
      {topCompetitor && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Target className="h-5 w-5" />
              Concorrente Mais Provável: {topCompetitor.name}
            </CardTitle>
            <CardDescription>
              Detectado em {topCompetitor.portals.length} portais com {topCompetitor.mentions} menções
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Score de Relevância</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${Math.min(100, topCompetitor.relevance_score)}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold">{topCompetitor.relevance_score}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Portais com Menções</p>
                <div className="flex flex-wrap gap-1">
                  {topCompetitor.portals.slice(0, 5).map((portal, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {portal}
                    </Badge>
                  ))}
                  {topCompetitor.portals.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{topCompetitor.portals.length - 5}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm">
                <strong className="text-blue-900">💡 Como usar no Battle Card:</strong>
                <ul className="mt-2 space-y-1 text-blue-800">
                  <li>• Estratégia focada em vencer especificamente <strong>{topCompetitor.name}</strong></li>
                  <li>• Objeções baseadas nas comparações reais encontradas</li>
                  <li>• Proof points extraídos dos portais (G2, Capterra, etc.)</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Links de comparação */}
            {topCompetitor.comparison_links.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Top 3 Links de Comparação:</p>
                {topCompetitor.comparison_links.slice(0, 3).map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <ExternalLink className="h-4 w-4 text-primary shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{link.portal}</Badge>
                          <p className="text-sm font-medium truncate">{link.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{link.snippet}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de outros concorrentes */}
      {competitors.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outros {competitors.length - 1} Concorrentes Detectados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {competitors.slice(1, 6).map((comp, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{comp.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {comp.mentions} menções em {comp.portals.length} portais
                    </p>
                  </div>
                  <Badge variant="secondary">
                    Score: {comp.relevance_score}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Como isso melhora ICP */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-sm space-y-2">
          <p><strong>📊 Impacto na Qualificação ICP:</strong></p>
          <ul className="space-y-1 mt-2 text-xs">
            <li>✅ <strong>Fit Score mais preciso:</strong> Considera stack tecnológico real do lead</li>
            <li>✅ <strong>Priorização inteligente:</strong> Leads usando concorrentes fracos = HOT</li>
            <li>✅ <strong>Argumentação personalizada:</strong> Abordagem específica por concorrente</li>
            <li>✅ <strong>ROI calculado:</strong> Comparação direta de custos vs concorrente atual</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
