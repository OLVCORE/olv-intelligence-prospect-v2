import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle2, XCircle, AlertTriangle, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useSimpleTOTVSCheck, useLatestSimpleTOTVSCheck, type Evidence } from "@/hooks/useSimpleTOTVSCheck";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  vagas: 'bg-blue-50 border-blue-200',
  noticias: 'bg-purple-50 border-purple-200',
  docs_oficiais: 'bg-green-50 border-green-200'
};

export function SimpleTOTVSCheckCard({ companyId, companyName, cnpj, domain }: SimpleTOTVSCheckCardProps) {
  const { data: latestCheck, isLoading: isLoadingLatest } = useLatestSimpleTOTVSCheck(companyId);
  const checkMutation = useSimpleTOTVSCheck();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const handleCheck = () => {
    checkMutation.mutate({
      companyId,
      companyName,
      cnpj,
      domain
    });
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
      high: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-amber-100 text-amber-800 border-amber-300',
      low: 'bg-gray-100 text-gray-800 border-gray-300'
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
            {evidences.map((evidence, idx) => (
              <div key={idx} className="bg-white rounded p-3 border">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm line-clamp-2">{evidence.title}</h4>
                  <a
                    href={evidence.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 flex-shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3 mb-2">
                  {evidence.snippet}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    🔍 {evidence.source}
                  </span>
                  <div className="flex gap-1">
                    {evidence.totvs_products.map((product, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
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
            latestCheck.status === 'no-go' ? 'border-red-200 bg-red-50' :
            latestCheck.status === 'go' ? 'border-green-200 bg-green-50' :
            'border-amber-200 bg-amber-50'
          }>
            <AlertDescription className="font-medium">
              {latestCheck.reasoning}
            </AlertDescription>
          </Alert>

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
