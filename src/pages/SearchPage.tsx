import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Building2, Loader2, Users, BarChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function SearchPage() {
  const [searchType, setSearchType] = useState<"cnpj" | "query">("cnpj");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Campo vazio",
        description: "Digite um CNPJ ou nome da empresa para buscar",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('search-companies', {
        body: {
          [searchType]: searchQuery,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error('Erro ao buscar empresa');
      }

              setResult(data);
              toast({
                title: "Empresa encontrada!",
                description: `${data.company.name} foi cadastrada com sucesso`,
              });
              
              // Redirecionar para página de detalhes
              setTimeout(() => {
                window.location.href = `/company/${data.company.id}`;
              }, 1500);
            } catch (error: any) {
      toast({
        title: "Erro na busca",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Buscar Empresas</h1>
        <p className="text-muted-foreground">
          Busque empresas por CNPJ ou website e obtenha dados reais da Receita Federal e outras fontes
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Busca de Empresas
            </CardTitle>
            <CardDescription>
              Digite o CNPJ ou website da empresa para iniciar a prospecção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={searchType} onValueChange={(v) => setSearchType(v as "cnpj" | "query")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cnpj">CNPJ</TabsTrigger>
                <TabsTrigger value="query">Nome da Empresa</TabsTrigger>
              </TabsList>

              <TabsContent value="cnpj" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isSearching}
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite o CNPJ com ou sem formatação
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="query" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="query">Nome da Empresa</Label>
                  <Input
                    id="query"
                    placeholder="Ex: Magazine Luiza"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isSearching}
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite o nome da empresa
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full mt-4"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar Empresa
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {result.company.name}
              </CardTitle>
              <CardDescription>Dados da empresa e análise completa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">CNPJ</Label>
                  <p className="text-sm font-medium">{result.company.cnpj || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Website</Label>
                  <p className="text-sm font-medium">{result.company.website || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Setor</Label>
                  <p className="text-sm font-medium">{result.company.industry || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Funcionários</Label>
                  <p className="text-sm font-medium">{result.company.employees || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Decisores Encontrados</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">{result.stats.decisors}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Maturidade Digital</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {result.company.digital_maturity_score ? result.company.digital_maturity_score.toFixed(1) : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Dados salvos com sucesso:</p>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    ✅ Dados da empresa cadastrados
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    ✅ {result.stats.decisors} decisores identificados
                  </li>
                  {result.stats.hasMaturity && (
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                      ✅ Análise de maturidade digital concluída
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
