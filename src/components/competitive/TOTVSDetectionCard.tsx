import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle, Play, ExternalLink } from "lucide-react";
import { useTOTVSDetection } from "@/hooks/useTOTVSDetection";
import { Progress } from "@/components/ui/progress";

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Detecção de Uso de TOTVS
              {company.is_disqualified && <XCircle className="h-5 w-5 text-destructive" />}
            </CardTitle>
            <CardDescription>
              Sistema multi-fonte para detectar se a empresa já usa TOTVS
            </CardDescription>
          </div>
          <Button
            onClick={handleDetect}
            disabled={isPending}
            size="sm"
            variant={company.totvs_detection_score === undefined ? "default" : "outline"}
          >
            <Play className="h-4 w-4 mr-2" />
            {isPending ? 'Detectando...' : company.totvs_detection_score === undefined ? 'Iniciar Detecção' : 'Atualizar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {company.totvs_detection_score !== undefined ? (
          <>
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

            {/* Disqualification Alert */}
            {company.is_disqualified && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive">Lead Desqualificado Automaticamente</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Score ≥ 70 indica alta probabilidade de já usar TOTVS. Este lead foi automaticamente
                      removido do pipeline ativo.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Detection Sources */}
            {company.totvs_detection_sources && company.totvs_detection_sources.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Fontes Detectadas ({company.totvs_detection_sources.length})</h4>
                <div className="space-y-2">
                  {company.totvs_detection_sources.map((source: any, idx: number) => (
                    <div key={idx} className="bg-muted/50 rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {source.source === 'linkedin_jobs' && '💼 LinkedIn Jobs'}
                          {source.source === 'google_news' && '📰 Google News'}
                          {source.source === 'website_scraping' && '🌐 Website'}
                          {source.source === 'linkedin_profiles' && '👤 LinkedIn Profiles'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          +{source.confidence} pts
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{source.evidence}</p>
                      {source.url && (
                        <a
                          href={source.url}
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
            )}

            {/* Last Check */}
            {company.totvs_last_checked_at && (
              <p className="text-xs text-muted-foreground">
                Última verificação: {new Date(company.totvs_last_checked_at).toLocaleString('pt-BR')}
              </p>
            )}

            {/* Scoring Explanation */}
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Como funciona o Score
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>LinkedIn Jobs (40 pts):</strong> Vagas mencionam TOTVS/Protheus</li>
                <li>• <strong>Google News (30 pts):</strong> Notícias sobre uso de TOTVS</li>
                <li>• <strong>Website (20 pts):</strong> Site menciona TOTVS como parceiro</li>
                <li>• <strong>LinkedIn Profiles (10 pts):</strong> Funcionários listam TOTVS como skill</li>
                <li className="pt-1 border-t mt-2">
                  <strong>Score ≥ 70:</strong> Auto-desqualifica (alta confiança)
                </li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center py-8 space-y-2">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Clique em "Iniciar Detecção" para verificar se esta empresa já usa TOTVS
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
