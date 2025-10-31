import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle2, XCircle, AlertTriangle, ExternalLink, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { useSimpleTOTVSCheck, useLatestSimpleTOTVSCheck, type Evidence } from "@/hooks/useSimpleTOTVSCheck";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isValidUrl, formatWebsiteUrl } from "@/lib/utils/urlHelpers";
import { toast } from "sonner";

interface SimpleTOTVSCheckCardProps {
  companyId: string;
  companyName: string;
  cnpj?: string;
  domain?: string;
}

const CATEGORY_LABELS = {
  vagas: '💼 Vagas de Emprego',
  noticias: '📰 Notícias',
  docs_oficiais: '📄 Documentos Oficiais'
};

const CATEGORY_COLORS = {
  vagas: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
  noticias: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
  docs_oficiais: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
};

// Produtos TOTVS conhecidos
const TOTVS_PRODUCTS = [
  'PROTHEUS', 'DATASUL', 'RM', 'FLUIG', 'CAROL',
  'TOTVS GESTÃO', 'TOTVS ERP', 'TOTVS RH', 'TOTVS VAREJO',
  'TOTVS TECHFIN', 'TOTVS BUSINESS', 'TOTVS MANUFATURA',
  'WINTHOR', 'LOGIX'
];

export function SimpleTOTVSCheckCard({ companyId, companyName, cnpj, domain }: SimpleTOTVSCheckCardProps) {
  const { data: latestCheck, isLoading: isLoadingLatest } = useLatestSimpleTOTVSCheck(companyId);
  const checkMutation = useSimpleTOTVSCheck();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCheck = () => {
    checkMutation.mutate({
      companyId,
      companyName,
      cnpj,
      domain
    });
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast.success('Link copiado!');
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      toast.error('Erro ao copiar link');
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Função para destacar palavras-chave no texto
  const highlightText = (text: string): JSX.Element => {
    if (!text) return <></>;

    let highlightedText = text;
    const highlights: Array<{ term: string; type: 'totvs' | 'company' | 'product' }> = [];

    // Identificar TOTVS e variações
    const totvsRegex = /\bTOTVS\b/gi;
    const totvsMatches = text.match(totvsRegex);
    if (totvsMatches) {
      totvsMatches.forEach(match => {
        highlights.push({ term: match, type: 'totvs' });
      });
    }

    // Identificar produtos TOTVS
    TOTVS_PRODUCTS.forEach(product => {
      const productRegex = new RegExp(`\\b${product}\\b`, 'gi');
      const matches = text.match(productRegex);
      if (matches) {
        matches.forEach(match => {
          highlights.push({ term: match, type: 'product' });
        });
      }
    });

    // Identificar nome da empresa
    if (companyName) {
      const companyWords = companyName.split(' ').filter(w => w.length > 3);
      companyWords.forEach(word => {
        const companyRegex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = text.match(companyRegex);
        if (matches) {
          matches.forEach(match => {
            highlights.push({ term: match, type: 'company' });
          });
        }
      });
    }

    // Aplicar highlights de forma ordenada
    const sortedHighlights = [...new Set(highlights.map(h => h.term))];
    
    if (sortedHighlights.length === 0) {
      return <span>{text}</span>;
    }

    // Criar regex combinado para split mantendo os termos
    const combinedRegex = new RegExp(
      `(${sortedHighlights.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
      'gi'
    );

    const parts = text.split(combinedRegex);

    return (
      <>
        {parts.map((part, index) => {
          const highlight = highlights.find(
            h => h.term.toLowerCase() === part.toLowerCase()
          );

          if (highlight) {
            const className = 
              highlight.type === 'totvs' ? 'bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-100 font-bold px-1 rounded' :
              highlight.type === 'product' ? 'bg-orange-200 dark:bg-orange-900/50 text-orange-900 dark:text-orange-100 font-semibold px-1 rounded' :
              'bg-blue-200 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 font-medium px-1 rounded';
            
            return <mark key={index} className={className}>{part}</mark>;
          }
          return <span key={index}>{part}</span>;
        })}
      </>
    );
  };

  const renderStatusBadge = (status: string) => {
    if (status === 'go') {
      return (
        <Badge className="bg-green-500 text-white text-lg px-4 py-2">
          <CheckCircle2 className="h-5 w-5 mr-2" />
          ✅ GO
        </Badge>
      );
    } else if (status === 'no-go') {
      return (
        <Badge className="bg-red-500 text-white text-lg px-4 py-2">
          <XCircle className="h-5 w-5 mr-2" />
          ❌ NO-GO
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-amber-500 text-white text-lg px-4 py-2">
          <AlertTriangle className="h-5 w-5 mr-2" />
          ⚠️ REVISAR
        </Badge>
      );
    }
  };

  const renderConfidenceBadge = (confidence: string) => {
    const colors = {
      high: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700',
      medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
      low: 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700'
    };

    return (
      <Badge variant="outline" className={colors[confidence as keyof typeof colors]}>
        Confiança: {confidence === 'high' ? 'Alta' : confidence === 'medium' ? 'Média' : 'Baixa'}
      </Badge>
    );
  };

  const renderEvidencesList = (evidences: Evidence[], category: keyof typeof CATEGORY_LABELS) => {
    if (evidences.length === 0) return null;

    const isExpanded = expandedCategories.has(category);

    return (
      <div className={`border rounded-lg p-4 ${CATEGORY_COLORS[category]}`}>
        <button
          onClick={() => toggleCategory(category)}
          className="w-full flex items-center justify-between text-left font-medium mb-2"
        >
          <span className="flex items-center gap-2">
            {CATEGORY_LABELS[category]}
            <Badge variant="secondary">{evidences.length}</Badge>
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {isExpanded && (
          <div className="space-y-3 mt-3">
            {evidences.map((evidence, idx) => {
              const url = formatWebsiteUrl(evidence.url);
              const isLinkValid = isValidUrl(evidence.url);
              const isCopied = copiedUrl === evidence.url;
              
              return (
                <div key={idx} className="bg-card dark:bg-card/50 rounded p-3 border border-border">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-sm flex-1">
                      {highlightText(evidence.title)}
                    </h4>
                    <div className="flex gap-1 flex-shrink-0">
                      {isLinkValid && url ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyToClipboard(evidence.url)}
                            title="Copiar link"
                          >
                            {isCopied ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 p-1"
                            title="Abrir link"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-muted">
                          Link indisponível
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    {highlightText(evidence.snippet)}
                  </div>

                  {/* Cross-matching visual */}
                  <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                    <span className="text-muted-foreground flex items-center gap-1">
                      🔍 {evidence.source}
                    </span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {evidence.totvs_products.map((product, i) => (
                        <Badge 
                          key={i} 
                          variant="outline" 
                          className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700"
                        >
                          🎯 {product}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* URL completa com aviso */}
                  {isLinkValid && url && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground/70">🔗</span>
                        <span className="flex-1 truncate text-muted-foreground/70" title={url}>
                          {url}
                        </span>
                      </div>
                      {url.includes('.pdf') && (
                        <Alert className="mt-2 py-1.5 px-2">
                          <AlertDescription className="text-xs">
                            ⚠️ Se o PDF não abrir, o documento pode ter sido removido ou requer autenticação
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const isLoading = isLoadingLatest || checkMutation.isPending;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">🎯 Verificação TOTVS Simplificada</h3>
          <p className="text-sm text-muted-foreground">Detecção direta em vagas, notícias e documentos</p>
        </div>
        <Button 
          onClick={handleCheck}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Verificar
            </>
          )}
        </Button>
      </div>

      {!latestCheck && !isLoading && (
        <Alert>
          <AlertDescription>
            Nenhuma verificação realizada ainda. Clique em "Verificar" para iniciar.
          </AlertDescription>
        </Alert>
      )}

      {latestCheck && (
        <div className="space-y-6">
          {/* Status Principal */}
          <div className="flex items-center justify-between p-6 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              {renderStatusBadge(latestCheck.status)}
              {renderConfidenceBadge(latestCheck.confidence)}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{latestCheck.total_evidences}</div>
              <div className="text-sm text-muted-foreground">
                {latestCheck.total_evidences === 1 ? 'Evidência' : 'Evidências'}
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <Alert className={
            latestCheck.status === 'no-go' 
              ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30' :
            latestCheck.status === 'go' 
              ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30' :
            'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30'
          }>
            <AlertDescription className="font-medium text-foreground">
              {latestCheck.reasoning}
            </AlertDescription>
          </Alert>

          {/* Legenda dos highlights */}
          <div className="flex flex-wrap gap-2 text-xs p-3 bg-muted/50 rounded-lg">
            <span className="font-medium text-muted-foreground">Destaques:</span>
            <Badge variant="outline" className="bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-100 border-red-300 dark:border-red-700">
              TOTVS
            </Badge>
            <Badge variant="outline" className="bg-orange-200 dark:bg-orange-900/50 text-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-700">
              Produtos TOTVS
            </Badge>
            <Badge variant="outline" className="bg-blue-200 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700">
              Nome da Empresa
            </Badge>
          </div>

          {/* Evidências por Categoria */}
          {latestCheck.total_evidences > 0 && latestCheck.evidences && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">📂 Evidências por Fonte:</h4>
              
              {(() => {
                const evidences = latestCheck.evidences as unknown as {
                  vagas?: Evidence[];
                  noticias?: Evidence[];
                  docs_oficiais?: Evidence[];
                };
                
                return (
                  <>
                    {renderEvidencesList(evidences.vagas || [], 'vagas')}
                    {renderEvidencesList(evidences.noticias || [], 'noticias')}
                    {renderEvidencesList(evidences.docs_oficiais || [], 'docs_oficiais')}
                  </>
                );
              })()}
            </div>
          )}

          {/* Timestamp */}
          <div className="text-xs text-muted-foreground text-right">
            Verificado em: {new Date(latestCheck.checked_at).toLocaleString('pt-BR')}
          </div>
        </div>
      )}
    </Card>
  );
}
