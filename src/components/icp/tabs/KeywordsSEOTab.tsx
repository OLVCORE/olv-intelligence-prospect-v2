import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, ExternalLink, Globe, Target, BarChart3, Loader2 } from 'lucide-react';
import { useSEOKeywords } from '@/hooks/useSEOKeywords';

interface KeywordsSEOTabProps {
  companyName?: string;
  domain?: string;
  savedData?: any;
}

export function KeywordsSEOTab({ companyName, domain, savedData }: KeywordsSEOTabProps) {
  const { data: seoData, isLoading, error } = useSEOKeywords(companyName, !savedData);

  // Usar dados salvos se disponíveis
  const loadedFromHistory = !!savedData;
  const effectiveData = savedData || seoData;

  if (!companyName) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Informações da empresa necessárias para análise de SEO
        </p>
      </Card>
    );
  }

  if (isLoading && !loadedFromHistory) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Analisando keywords e SEO...</span>
        </div>
      </Card>
    );
  }

  if (error && !loadedFromHistory) {
    return (
      <Card className="p-6">
        <p className="text-center text-destructive">
          Erro ao carregar análise de SEO
        </p>
      </Card>
    );
  }

  if (!effectiveData?.organicResults?.length) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Nenhum resultado SEO encontrado
        </p>
      </Card>
    );
  }

  const organicResults = effectiveData.organicResults || [];
  const knowledgeGraph = effectiveData.knowledgeGraph;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
              Keywords & SEO Intelligence
              {loadedFromHistory && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Histórico
                </Badge>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              Análise de palavras-chave e posicionamento de mercado
            </p>
          </div>
        </div>
      </Card>

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase">Resultados</span>
          </div>
          <div className="text-2xl font-bold mb-1">{organicResults.length}</div>
          <Badge variant="outline" className="text-xs">páginas encontradas</Badge>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase">Domínios</span>
          </div>
          <div className="text-2xl font-bold mb-1">
            {new Set(organicResults.map(r => new URL(r.link).hostname)).size}
          </div>
          <Badge variant="outline" className="text-xs">únicos</Badge>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase">Busca</span>
          </div>
          <div className="text-2xl font-bold mb-1 truncate text-sm">
            {companyName}
          </div>
          <Badge variant="outline" className="text-xs">termo pesquisado</Badge>
        </Card>
      </div>

      {/* Resultados orgânicos */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Search className="w-4 h-4" />
          Resultados de Busca Orgânica
        </h4>
        <div className="space-y-3">
          {organicResults.slice(0, 10).map((result, index) => (
            <div key={index} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0">
                <span className="text-sm font-bold text-primary">#{result.position}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <a 
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sm hover:text-primary transition-colors truncate"
                  >
                    {result.title}
                  </a>
                  <ExternalLink className="w-3 h-3 shrink-0 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {result.snippet}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="text-xs">
                    {new URL(result.link).hostname}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Knowledge Graph (se disponível) */}
      {knowledgeGraph && (
        <Card className="p-6 bg-primary/5">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            Knowledge Graph do Google
          </h4>
          <div className="space-y-3">
            {knowledgeGraph.title && (
              <div>
                <span className="text-xs text-muted-foreground">Título:</span>
                <p className="font-medium">{knowledgeGraph.title}</p>
              </div>
            )}
            {knowledgeGraph.type && (
              <div>
                <span className="text-xs text-muted-foreground">Tipo:</span>
                <Badge variant="outline">{knowledgeGraph.type}</Badge>
              </div>
            )}
            {knowledgeGraph.description && (
              <div>
                <span className="text-xs text-muted-foreground">Descrição:</span>
                <p className="text-sm">{knowledgeGraph.description}</p>
              </div>
            )}
            {knowledgeGraph.website && (
              <div>
                <span className="text-xs text-muted-foreground">Website:</span>
                <a 
                  href={knowledgeGraph.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {knowledgeGraph.website}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Insights dinâmicos */}
      <Card className="p-6 bg-primary/5">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Insights Estratégicos
        </h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>
              Encontrados <strong>{organicResults.length} resultados orgânicos</strong> para "{companyName}"
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>
              Empresa aparece em <strong>{new Set(organicResults.map(r => new URL(r.link).hostname)).size} domínios diferentes</strong>
            </span>
          </li>
          {organicResults[0] && (
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Posição #1: <strong>{organicResults[0].title}</strong> ({new URL(organicResults[0].link).hostname})
              </span>
            </li>
          )}
          {knowledgeGraph && (
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                ✅ Empresa possui <strong>Knowledge Graph do Google</strong> (excelente para SEO)
              </span>
            </li>
          )}
        </ul>
      </Card>
    </div>
  );
}
