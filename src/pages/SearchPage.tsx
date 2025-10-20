import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Building2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SearchPage() {
  const [searchType, setSearchType] = useState<"cnpj" | "website">("cnpj");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Campo vazio",
        description: "Digite um CNPJ ou website para buscar",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setResult(null);

    try {
      const response = await fetch("/api/companies/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [searchType]: searchQuery,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Erro ao buscar empresa");
      }

      setResult(data.data);
      toast({
        title: "Empresa encontrada!",
        description: `${data.data.company.name} foi cadastrada com sucesso`,
      });
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
            <Tabs value={searchType} onValueChange={(v) => setSearchType(v as "cnpj" | "website")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cnpj">CNPJ</TabsTrigger>
                <TabsTrigger value="website">Website</TabsTrigger>
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

              <TabsContent value="website" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://empresa.com.br"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isSearching}
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite o website completo da empresa
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
                Empresa Encontrada
              </CardTitle>
              <CardDescription>Dados cadastrados com sucesso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Razão Social</Label>
                <p className="text-sm font-medium">{result.company.name}</p>
              </div>
              {result.company.tradeName && (
                <div>
                  <Label className="text-xs text-muted-foreground">Nome Fantasia</Label>
                  <p className="text-sm font-medium">{result.company.tradeName}</p>
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">CNPJ</Label>
                <p className="text-sm font-medium">{result.company.cnpj}</p>
              </div>
              {result.company.capital && (
                <div>
                  <Label className="text-xs text-muted-foreground">Capital Social</Label>
                  <p className="text-sm font-medium">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(result.company.capital)}
                  </p>
                </div>
              )}
              {result.company.size && (
                <div>
                  <Label className="text-xs text-muted-foreground">Porte</Label>
                  <p className="text-sm font-medium">{result.company.size}</p>
                </div>
              )}
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Próximos passos:</p>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    Análise de decisores em andamento
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    Detecção de tecnologias iniciada
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    Acesse Intelligence para ver resultados
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
