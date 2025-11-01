import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle2, XCircle, AlertTriangle, ExternalLink, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { useSimpleTOTVSCheck, useLatestSimpleTOTVSCheck, type Evidence } from "@/hooks/useSimpleTOTVSCheck";
import { useEffect, useState } from "react";
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

// Catálogo COMPLETO de produtos TOTVS (sincronizado com o edge function e catálogo da plataforma)
const TOTVS_PRODUCTS = [
  // Marca e termos gerais
  'TOTVS', 'Microsiga',
  
  // ERPs principais
  'Protheus', 'Datasul', 'RM', 'Logix', 'Winthor', 'Backoffice',
  
  // Plataformas e Cloud
  'Fluig', 'Carol', 'Carol AI', 'TOTVS Cloud',
  
  // Financeiro e Crédito
  'Techfin', 'TOTVS Techfin', 'TOTVS Pay',
  
  // CRM e Vendas
  'TOTVS CRM', 'SFA', 'Sales Force',
  
  // RH
  'TOTVS RH', 'Folha de Pagamento', 'Ponto Eletrônico',
  
  // Analytics e BI
  'TOTVS BI', 'Advanced Analytics', 'Data Platform',
  
  // Outros produtos
  'TOTVS iPaaS', 'TOTVS Atende', 'RD Station', 'Assinatura Eletrônica',
  
  // Módulos e funcionalidades específicas
  'Auditoria de Folha', 'Supervisão de Compras', 'Supervisão Financeira',
  'Gestão Industrial', 'Financeiro', 'Compras e Suprimentos', 'Vendas',
  'Estoque e Logística', 'Fiscal', 'BPM', 'ECM', 'Workflow',
  'Portal Corporativo', 'Dashboards Executivos', 'KPIs e Indicadores',
  'Gateway de Pagamentos', 'Conciliação Bancária', 'Recrutamento e Seleção',
  'Treinamento e Desenvolvimento', 'Avaliação de Desempenho', 'Gestão de Benefícios',
  'Roteirização', 'Pedidos Mobile', 'Catálogo de Produtos',
  'Email Marketing', 'Landing Pages', 'Marketing Automation'
];

export function SimpleTOTVSCheckCard({ companyId, companyName, cnpj, domain }: SimpleTOTVSCheckCardProps) {
  const { data: latestCheck, isLoading: isLoadingLatest } = useLatestSimpleTOTVSCheck(companyId);
  const checkMutation = useSimpleTOTVSCheck();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [autoCheckAttempted, setAutoCheckAttempted] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'triple'>('all');
  // Resultado a exibir: prioriza o retorno imediato da mutação
  const viewCheck = (checkMutation.data as any) || latestCheck as any;

  const handleCheck = () => {
    // Validar CNPJ se fornecido
    if (cnpj && cnpj.replace(/\D/g, '').length !== 14) {
      toast.error('CNPJ inválido', {
        description: 'O CNPJ deve conter exatamente 14 dígitos'
      });
      return;
    }

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

  const copySearchTerms = async (products: string[]) => {
    try {
      // Filtra apenas produtos específicos (remove "TOTVS" e "Microsiga" genéricos)
      const specificProducts = products.filter(p => 
        !['totvs', 'microsiga'].includes(p.toLowerCase())
      );
      
      const terms = specificProducts.length > 0 ? specificProducts.join(' ') : products.join(' ');
      await navigator.clipboard.writeText(terms);
      toast.success('Termos copiados! Use Ctrl+F (ou Cmd+F) na página para encontrar rapidamente.', {
        duration: 4000
      });
    } catch (err) {
      toast.error('Erro ao copiar termos');
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
    // Filtrar por match_type baseado no filterMode
    let list = evidences || [];
    if (filterMode === 'triple') {
      list = list.filter(ev => ev.match_type === 'triple');
    }

    if (list.length === 0) return null;

    const isExpanded = expandedCategories.has(category);

    return (
      <div className={`border rounded-lg p-4 ${CATEGORY_COLORS[category]}`}>
        <button
          onClick={() => toggleCategory(category)}
          className="w-full flex items-center justify-between text-left font-medium mb-2"
        >
          <span className="flex items-center gap-2">
            {CATEGORY_LABELS[category]}
            <Badge variant="secondary">{list.length}</Badge>
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {isExpanded && (
          <div className="space-y-3 mt-3">
            {list.map((evidence, idx) => {
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => copySearchTerms(evidence.totvs_products)}
                        title="Copiar termos TOTVS para busca rápida com Ctrl+F"
                      >
                        📋 Copiar termos
                      </Button>
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

  // Auto-executar uma única vez quando não há resultado anterior
  useEffect(() => {
    if (!autoCheckAttempted && !isLoadingLatest && !checkMutation.isPending && !latestCheck && companyId && companyName) {
      setAutoCheckAttempted(true);
      handleCheck();
    }
  }, [autoCheckAttempted, isLoadingLatest, checkMutation.isPending, latestCheck, companyId, companyName]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">🎯 Simple TOTVS Check</h3>
          <p className="text-sm text-muted-foreground">Detecção direta em vagas, notícias e documentos</p>
        </div>
        <Button 
          onClick={handleCheck}
          disabled={isLoading}
          variant="default"
          size="sm"
          className="font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              {viewCheck ? 'Atualizar Verificação' : 'Verificar Agora'}
            </>
          )}
        </Button>
      </div>

      {!viewCheck && !isLoading && !autoCheckAttempted && (
        <Alert>
          <AlertDescription>
            Nenhuma verificação realizada ainda. Clique em "Verificar Agora" para iniciar a análise.
          </AlertDescription>
        </Alert>
      )}

      {checkMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              <div>
                <strong>Erro na verificação</strong>
                <p className="text-sm mt-1">
                  {checkMutation.error?.message || 'Não foi possível realizar a verificação. Verifique se o CNPJ está correto e tente novamente.'}
                </p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {viewCheck && (
        <div className="space-y-6">
          {/* Status Principal */}
          <div className="flex items-center justify-between p-6 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              {renderStatusBadge(viewCheck.status)}
              {renderConfidenceBadge(viewCheck.confidence)}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{viewCheck.total_evidences}</div>
              <div className="text-sm text-muted-foreground">
                {viewCheck.total_evidences === 1 ? 'Evidência' : 'Evidências'}
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <Alert className={
            viewCheck.status === 'no-go' 
              ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30' :
            viewCheck.status === 'go' 
              ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30' :
            'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30'
          }>
            <AlertDescription className="font-medium text-foreground">
              {viewCheck.reasoning}
            </AlertDescription>
          </Alert>

          {/* Controle Triple/Double Match */}
          {(() => {
            const allEvidences = [
              ...((viewCheck as any).evidences_by_category?.vagas || []),
              ...((viewCheck as any).evidences_by_category?.noticias || []),
              ...((viewCheck as any).evidences_by_category?.docs_oficiais || [])
            ];
            const tripleCount = allEvidences.filter(ev => ev.match_type === 'triple').length;
            const doubleCount = allEvidences.filter(ev => ev.match_type === 'double').length;
            
            if (tripleCount === 0 && doubleCount === 0) return null;
            
            return (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Filtro de Precisão:</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={filterMode === 'triple' ? 'default' : 'outline'}
                      onClick={() => setFilterMode('triple')}
                      className="text-xs"
                    >
                      🎯 Apenas Triple Match
                    </Button>
                    <Button
                      size="sm"
                      variant={filterMode === 'all' ? 'default' : 'outline'}
                      onClick={() => setFilterMode('all')}
                      className="text-xs"
                    >
                      🔍 Triple + Double Match
                    </Button>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                      {tripleCount}
                    </Badge>
                    Triple (Empresa + TOTVS + Produto)
                  </span>
                  <span className="flex items-center gap-1">
                    <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                      {doubleCount}
                    </Badge>
                    Double (Empresa + TOTVS/Produto)
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Legenda dos highlights e lógica de correlação */}
          <div className="space-y-2">
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
            <Alert className="border-primary/20 bg-primary/5">
              <AlertDescription className="text-xs">
                <span className="font-semibold">Lógica de Correlação:</span> Evidências válidas contêm <span className="font-medium">Empresa + (TOTVS OU Produto/Módulo)</span> - qualquer combinação de 2 elementos é aceita.
              </AlertDescription>
            </Alert>
          </div>

          {/* Evidências por Categoria */}
          {(viewCheck.total_evidences > 0) && (((viewCheck as any).evidences_by_category) || viewCheck.evidences) && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">📂 Evidências por Fonte:</h4>
              
              {(() => {
                // Compatibilidade com diferentes estruturas de dados
                let evidences: {
                  vagas?: Evidence[];
                  noticias?: Evidence[];
                  docs_oficiais?: Evidence[];
                };

                if ((viewCheck as any).evidences_by_category) {
                  // Nova estrutura do edge function
                  evidences = (viewCheck as any).evidences_by_category;
                } else if (viewCheck.evidences) {
                  // Estrutura do banco de dados
                  evidences = viewCheck.evidences as any;
                } else {
                  evidences = { vagas: [], noticias: [], docs_oficiais: [] };
                }
                
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
            Verificado em: {new Date(viewCheck.checked_at).toLocaleString('pt-BR')}
          </div>
        </div>
      )}
    </Card>
  );
}
