import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Plus, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FoundCompetitor {
  name: string;
  domain: string;
  description: string;
  source_url: string;
}

export function AutoSearchCompetitors() {
  const [searching, setSearching] = useState(false);
  const [productCategory, setProductCategory] = useState("ERP");
  const [keywords, setKeywords] = useState("");
  const [results, setResults] = useState<FoundCompetitor[]>([]);
  const [adding, setAdding] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!productCategory) {
      toast.error("Informe a categoria do produto");
      return;
    }

    setSearching(true);
    setResults([]);

    try {
      console.log('[Auto Search] Buscando concorrentes:', { productCategory, keywords });

      const { data, error } = await supabase.functions.invoke('search-competitors', {
        body: { productCategory, keywords }
      });

      if (error) throw error;

      if (data.success && data.competitors) {
        setResults(data.competitors);
        toast.success(`${data.competitors.length} concorrentes encontrados!`);
      } else {
        toast.warning('Nenhum concorrente encontrado');
      }

    } catch (error: any) {
      console.error('[Auto Search] Erro:', error);
      toast.error(`Erro na busca: ${error.message}`);
    } finally {
      setSearching(false);
    }
  };

  const handleAddCompetitor = async (competitor: FoundCompetitor) => {
    const key = competitor.domain;
    setAdding(prev => new Set(prev).add(key));

    try {
      const { error } = await supabase
        .from('competitors')
        .insert({
          name: competitor.name,
          category: productCategory,
          description: competitor.description,
          website: competitor.source_url,
          website_url: competitor.source_url,
          market_position: 'Emerging',
          active: true,
          strengths: [],
          weaknesses: [],
          totvs_advantages: []
        });

      if (error) throw error;

      toast.success(`${competitor.name} adicionado aos concorrentes!`);
      setResults(prev => prev.filter(c => c.domain !== key));

    } catch (error: any) {
      console.error('[Auto Search] Erro ao adicionar:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setAdding(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Busca Automática de Concorrentes
        </CardTitle>
        <CardDescription>
          Busque concorrentes automaticamente na web baseado em categoria e palavras-chave
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria do Produto</Label>
            <Input
              id="category"
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
              placeholder="Ex: ERP, CRM, BI"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Palavras-chave (opcional)</Label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Ex: cloud, enterprise"
            />
          </div>
        </div>

        <Button onClick={handleSearch} disabled={searching} className="w-full">
          {searching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Buscar Concorrentes
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-sm">Concorrentes Encontrados:</h4>
            {results.map((competitor) => (
              <Card key={competitor.domain} className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <h5 className="font-semibold">{competitor.name}</h5>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {competitor.description}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant="outline" className="text-xs">
                          {competitor.domain}
                        </Badge>
                        <a
                          href={competitor.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          Ver site <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddCompetitor(competitor)}
                      disabled={adding.has(competitor.domain)}
                    >
                      {adding.has(competitor.domain) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="mr-1 h-3 w-3" />
                          Adicionar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
