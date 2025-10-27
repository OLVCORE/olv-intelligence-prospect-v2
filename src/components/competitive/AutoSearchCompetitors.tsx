import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCompetitorSearch, DetectedCompetitor } from "@/hooks/useCompetitorSearch";
import { Search, ExternalLink, TrendingUp, Globe } from "lucide-react";
import { useState } from "react";

interface AutoSearchCompetitorsProps {
  companyName: string;
  sector?: string;
  totvsProduct?: string;
}

export function AutoSearchCompetitors({
  companyName,
  sector,
  totvsProduct,
}: AutoSearchCompetitorsProps) {
  const searchMutation = useCompetitorSearch();
  const [searchResult, setSearchResult] = useState<any>(null);

  const handleSearch = async () => {
    const result = await searchMutation.mutateAsync({
      companyName,
      sector,
      productCategory: sector,
      keywords: 'PME SMB Brasil',
      totvsProduct: totvsProduct || 'TOTVS Protheus',
    });
    setSearchResult(result);
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Busca em Portais de Comparação
        </CardTitle>
        <CardDescription>
          Busca automática em G2, Capterra, B2B Stack, Gartner e outros 15+ portais de comparação de tecnologia
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={handleSearch}
            disabled={searchMutation.isPending}
            className="flex-1"
          >
            <Search className="mr-2 h-4 w-4" />
            {searchMutation.isPending ? 'Buscando em Portais...' : 'Buscar Concorrentes'}
          </Button>
        </div>

        {searchResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <Badge variant="outline" className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {searchResult.portals_searched} portais pesquisados
              </Badge>
              <Badge variant="secondary">
                {searchResult.total_comparisons_found} comparações encontradas
              </Badge>
            </div>

            <div className="text-sm font-semibold">
              Top {searchResult.competitors.length} Concorrentes Mencionados:
            </div>

            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {searchResult.competitors.map((competitor: DetectedCompetitor, idx: number) => (
                  <Card key={idx} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">{competitor.name}</h4>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary">
                              {competitor.mentions} menções
                            </Badge>
                            <Badge variant="outline">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Score: {competitor.relevance_score}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Encontrado em: {competitor.portals.join(', ')}
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold">Links de Comparação:</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {competitor.comparison_links.map((link, linkIdx) => (
                            <a
                              key={linkIdx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-2 rounded-md border hover:bg-accent transition-colors"
                            >
                              <div className="flex items-start gap-2">
                                <ExternalLink className="h-3 w-3 mt-1 text-primary flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium truncate">
                                    {link.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {link.snippet}
                                  </div>
                                  <div className="text-xs text-primary mt-1 flex items-center gap-1">
                                    <Globe className="h-3 w-3" />
                                    {link.portal}
                                  </div>
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
