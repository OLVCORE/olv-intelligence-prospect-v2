import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Building2, Loader2, Users, BarChart, Globe, Instagram, Linkedin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function SearchPage() {
  const [searchType, setSearchType] = useState<"cnpj" | "query">("cnpj");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  
  // Autocomplete states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Campos de refinamento - Presença Digital
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  
  // Campos de refinamento - Produtos/Segmentação
  const [produto, setProduto] = useState("");
  const [marca, setMarca] = useState("");
  const [linkProduto, setLinkProduto] = useState("");
  
  // Campos de refinamento - Localização
  const [logradouro, setLogradouro] = useState("");
  const [bairro, setBairro] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [estado, setEstado] = useState("");
  const [pais, setPais] = useState("Brasil");

  // Fetch autocomplete suggestions from Google
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      setLoadingSuggestions(true);
      const { data, error } = await supabase.functions.invoke('google-search', {
        body: { 
          query: `${query} empresa brasil`,
          options: { num: 5 }
        }
      });

      if (error) throw error;
      
      if (data?.items) {
        setSuggestions(data.items.map((item: any) => ({
          title: item.title,
          snippet: item.snippet,
          link: item.link,
          displayLink: item.displayLink
        })));
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Debounced search for autocomplete
  useEffect(() => {
    if (searchType === 'query' && searchQuery) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 500);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchType]);

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
    setShowSuggestions(false);

    try {
      const searchBody: any = {
        [searchType]: searchQuery,
      };

      // Adicionar campos de refinamento - Presença Digital
      if (website) searchBody.website = website;
      if (instagram) searchBody.instagram = instagram;
      if (linkedin) searchBody.linkedin = linkedin;
      
      // Adicionar campos de refinamento - Produtos
      if (produto) searchBody.produto = produto;
      if (marca) searchBody.marca = marca;
      if (linkProduto) searchBody.linkProduto = linkProduto;
      
      // Adicionar campos de refinamento - Localização
      if (logradouro) searchBody.logradouro = logradouro;
      if (bairro) searchBody.bairro = bairro;
      if (municipio) searchBody.municipio = municipio;
      if (estado) searchBody.estado = estado;
      if (pais && pais !== "Brasil") searchBody.pais = pais;

      const { data, error } = await supabase.functions.invoke('search-companies', {
        body: searchBody,
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
          Busque empresas por CNPJ ou nome e obtenha dados reais da web e fontes públicas
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
              Digite o CNPJ ou nome da empresa para iniciar a prospecção
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    disabled={isSearching}
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite o CNPJ com ou sem formatação (Enter para buscar)
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="query" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="query">Nome da Empresa</Label>
                  <Popover open={showSuggestions && suggestions.length > 0} onOpenChange={setShowSuggestions}>
                    <PopoverTrigger asChild>
                      <div className="relative">
                        <Input
                          id="query"
                          placeholder="Digite o nome da empresa (ex: TOTVS, Ambev)"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowSuggestions(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSearch();
                            }
                          }}
                          onFocus={() => searchQuery.length >= 3 && setShowSuggestions(true)}
                          disabled={isSearching}
                        />
                        {loadingSuggestions && (
                          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-0" align="start">
                      <Command>
                        <CommandList>
                          <CommandEmpty>Nenhuma sugestão encontrada</CommandEmpty>
                          <CommandGroup heading="Empresas encontradas na web">
                            {suggestions.map((suggestion, idx) => (
                              <CommandItem
                                key={idx}
                                onSelect={() => {
                                  const companyName = suggestion.title.split(' - ')[0].split('|')[0].trim();
                                  setSearchQuery(companyName);
                                  setShowSuggestions(false);
                                  if (suggestion.link && suggestion.link.includes('http')) {
                                    setWebsite(suggestion.link);
                                  }
                                }}
                                className="cursor-pointer"
                              >
                                <Building2 className="mr-2 h-4 w-4 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{suggestion.title}</div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {suggestion.displayLink}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Digite pelo menos 3 caracteres para ver sugestões (Enter para buscar)
                  </p>
                </div>
                
                {/* Campos de refinamento em duas colunas */}
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-sm font-semibold">Campos de Refinamento (Opcional)</Label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Coluna 1: Presença Digital */}
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-primary">Presença Digital</Label>
                      
                      <div className="space-y-2">
                        <Label htmlFor="website" className="text-xs flex items-center gap-2">
                          <Globe className="h-3 w-3" />
                          Website
                        </Label>
                        <Input
                          id="website"
                          placeholder="https://exemplo.com.br"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          disabled={isSearching}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="instagram" className="text-xs flex items-center gap-2">
                          <Instagram className="h-3 w-3" />
                          Instagram
                        </Label>
                        <Input
                          id="instagram"
                          placeholder="@olvinternacional ou instagram.com/..."
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          disabled={isSearching}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="linkedin" className="text-xs flex items-center gap-2">
                          <Linkedin className="h-3 w-3" />
                          LinkedIn
                        </Label>
                        <Input
                          id="linkedin"
                          placeholder="linkedin.com/company/empresa"
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          disabled={isSearching}
                        />
                      </div>
                    </div>

                    {/* Coluna 2: Produtos e Localização */}
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-primary">Produtos & Segmentação</Label>
                      
                      <div className="space-y-2">
                        <Label htmlFor="produto" className="text-xs">
                          Produto / Categoria
                        </Label>
                        <Input
                          id="produto"
                          placeholder="ERP, CRM, Software, etc"
                          value={produto}
                          onChange={(e) => setProduto(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          disabled={isSearching}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="marca" className="text-xs">
                          Marca
                        </Label>
                        <Input
                          id="marca"
                          placeholder="Nome da marca"
                          value={marca}
                          onChange={(e) => setMarca(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          disabled={isSearching}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="linkProduto" className="text-xs">
                          Link do Produto/Marketplace
                        </Label>
                        <Input
                          id="linkProduto"
                          placeholder="mercadolivre.com.br/..., alibaba.com/..."
                          value={linkProduto}
                          onChange={(e) => setLinkProduto(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          disabled={isSearching}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Seção de Localização (largura total) */}
                  <div className="space-y-3 pt-3 border-t">
                    <Label className="text-xs font-semibold text-primary">Localização</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="municipio" className="text-xs">
                          Município
                        </Label>
                        <Input
                          id="municipio"
                          placeholder="São Paulo"
                          value={municipio}
                          onChange={(e) => setMunicipio(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          disabled={isSearching}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="estado" className="text-xs">
                          Estado
                        </Label>
                        <Input
                          id="estado"
                          placeholder="SP"
                          value={estado}
                          onChange={(e) => setEstado(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          disabled={isSearching}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="pais" className="text-xs">
                          País
                        </Label>
                        <Input
                          id="pais"
                          placeholder="Brasil"
                          value={pais}
                          onChange={(e) => setPais(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          disabled={isSearching}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="bairro" className="text-xs">
                          Bairro
                        </Label>
                        <Input
                          id="bairro"
                          placeholder="Nome do bairro"
                          value={bairro}
                          onChange={(e) => setBairro(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          disabled={isSearching}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="logradouro" className="text-xs">
                          Logradouro
                        </Label>
                        <Input
                          id="logradouro"
                          placeholder="Rua, Av, etc"
                          value={logradouro}
                          onChange={(e) => setLogradouro(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          disabled={isSearching}
                        />
                      </div>
                    </div>
                  </div>
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
