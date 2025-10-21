import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Building2, Loader2, Users, BarChart, Globe, Instagram, Linkedin, MapPin, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrazilianAddressAutocomplete } from "@/hooks/useGooglePlacesAutocomplete";
import LocationMap from "@/components/map/LocationMap";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Estados brasileiros
const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

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
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [bairro, setBairro] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [estado, setEstado] = useState("");
  const [pais, setPais] = useState("Brasil");
  
  // Autocomplete states para endereços
  const [showMunicipioSuggestions, setShowMunicipioSuggestions] = useState(false);
  const [showBairroSuggestions, setShowBairroSuggestions] = useState(false);
  const [showLogradouroSuggestions, setShowLogradouroSuggestions] = useState(false);
  
  // CEP formatting
  const handleCepChange = (value: string) => {
    const formatted = value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
    setCep(formatted);
  };
  
  // Google Places Autocomplete
  const { predictions: municipioPredictions } = useBrazilianAddressAutocomplete(municipio, 'locality');
  const { predictions: bairroPredictions } = useBrazilianAddressAutocomplete(bairro, 'sublocality');
  const { predictions: logradouroPredictions } = useBrazilianAddressAutocomplete(logradouro, 'route');

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
    // Verificar se pelo menos um campo foi preenchido
    const hasSearchQuery = searchQuery.trim().length > 0;
    const hasRefinement = website || instagram || linkedin || produto || marca || linkProduto || 
                          cep || logradouro || bairro || municipio || estado;
    
    if (!hasSearchQuery && !hasRefinement) {
      toast({
        title: "Preencha ao menos um campo",
        description: "Digite um CNPJ/nome da empresa OU preencha campos de refinamento para buscar",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setResult(null);
    setShowSuggestions(false);

    try {
      const searchBody: any = {};
      
      // Adicionar CNPJ ou nome apenas se preenchido
      if (searchQuery.trim()) {
        searchBody[searchType] = searchQuery;
      }

      // Adicionar campos de refinamento - Presença Digital
      if (website) searchBody.website = website;
      if (instagram) searchBody.instagram = instagram;
      if (linkedin) searchBody.linkedin = linkedin;
      
      // Adicionar campos de refinamento - Produtos
      if (produto) searchBody.produto = produto;
      if (marca) searchBody.marca = marca;
      if (linkProduto) searchBody.linkProduto = linkProduto;
      
      // Adicionar campos de refinamento - Localização
      if (cep) searchBody.cep = cep;
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

      <div className="grid gap-6" style={{ gridTemplateColumns: 'minmax(0, 1fr) 500px' }}>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Busca de Empresas
            </CardTitle>
            <CardDescription>
              Digite CNPJ/nome da empresa OU use os campos de refinamento abaixo
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
                    CNPJ é opcional - você pode buscar apenas com campos de refinamento abaixo
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
                    Nome é opcional - você pode buscar apenas com campos de refinamento abaixo
                  </p>
                </div>
                
                {/* Campos de refinamento em duas colunas */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold">Campos de Refinamento</Label>
                    <p className="text-xs text-muted-foreground">
                      Preencha qualquer combinação de campos para uma busca mais específica
                    </p>
                  </div>
                  
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
                    <Label className="text-xs font-semibold text-primary flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      Localização
                    </Label>
                    
                    {/* Linha 1: CEP, Estado, País */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="cep" className="text-xs">
                          CEP
                        </Label>
                        <Input
                          id="cep"
                          placeholder="00000-000"
                          value={cep}
                          onChange={(e) => {
                            const formatted = e.target.value
                              .replace(/\D/g, '')
                              .replace(/^(\d{5})(\d)/, '$1-$2')
                              .slice(0, 9);
                            setCep(formatted);
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          disabled={isSearching}
                          maxLength={9}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="estado" className="text-xs">
                          Estado
                        </Label>
                        <Select value={estado} onValueChange={setEstado} disabled={isSearching}>
                          <SelectTrigger id="estado" className="bg-background">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-50 max-h-[300px]">
                            {ESTADOS_BRASIL.map((uf) => (
                              <SelectItem key={uf} value={uf}>
                                {uf}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                    
                    {/* Linha 2: Município (autocomplete) */}
                    <div className="space-y-2">
                      <Label htmlFor="municipio" className="text-xs">
                        Município
                      </Label>
                      <Popover open={showMunicipioSuggestions && municipioPredictions.length > 0} onOpenChange={setShowMunicipioSuggestions}>
                        <PopoverTrigger asChild>
                          <Input
                            id="municipio"
                            placeholder="Digite para buscar (ex: São Paulo)"
                            value={municipio}
                            onChange={(e) => {
                              setMunicipio(e.target.value);
                              setShowMunicipioSuggestions(true);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            onFocus={() => municipio.length >= 3 && setShowMunicipioSuggestions(true)}
                            disabled={isSearching}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 bg-popover z-50" align="start">
                          <Command>
                            <CommandList>
                              <CommandEmpty>Nenhum município encontrado</CommandEmpty>
                              <CommandGroup>
                                {municipioPredictions.map((pred) => (
                                  <CommandItem
                                    key={pred.place_id}
                                    onSelect={() => {
                                      setMunicipio(pred.structured_formatting.main_text);
                                      setShowMunicipioSuggestions(false);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium truncate">{pred.structured_formatting.main_text}</div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        {pred.structured_formatting.secondary_text}
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {/* Linha 3: Bairro e Logradouro (ambos com autocomplete) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="bairro" className="text-xs">
                          Bairro
                        </Label>
                        <Popover open={showBairroSuggestions && bairroPredictions.length > 0} onOpenChange={setShowBairroSuggestions}>
                          <PopoverTrigger asChild>
                            <Input
                              id="bairro"
                              placeholder="Digite para buscar"
                              value={bairro}
                              onChange={(e) => {
                                setBairro(e.target.value);
                                setShowBairroSuggestions(true);
                              }}
                              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                              onFocus={() => bairro.length >= 3 && setShowBairroSuggestions(true)}
                              disabled={isSearching}
                            />
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0 bg-popover z-50" align="start">
                            <Command>
                              <CommandList>
                                <CommandEmpty>Nenhum bairro encontrado</CommandEmpty>
                                <CommandGroup>
                                  {bairroPredictions.map((pred) => (
                                    <CommandItem
                                      key={pred.place_id}
                                      onSelect={() => {
                                        setBairro(pred.structured_formatting.main_text);
                                        setShowBairroSuggestions(false);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{pred.structured_formatting.main_text}</div>
                                        <div className="text-xs text-muted-foreground truncate">
                                          {pred.structured_formatting.secondary_text}
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="logradouro" className="text-xs">
                          Logradouro
                        </Label>
                        <Popover open={showLogradouroSuggestions && logradouroPredictions.length > 0} onOpenChange={setShowLogradouroSuggestions}>
                          <PopoverTrigger asChild>
                            <Input
                              id="logradouro"
                              placeholder="Rua, Av, etc"
                              value={logradouro}
                              onChange={(e) => {
                                setLogradouro(e.target.value);
                                setShowLogradouroSuggestions(true);
                              }}
                              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                              onFocus={() => logradouro.length >= 3 && setShowLogradouroSuggestions(true)}
                              disabled={isSearching}
                            />
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0 bg-popover z-50" align="start">
                            <Command>
                              <CommandList>
                                <CommandEmpty>Nenhum logradouro encontrado</CommandEmpty>
                                <CommandGroup>
                                  {logradouroPredictions.map((pred) => (
                                    <CommandItem
                                      key={pred.place_id}
                                      onSelect={() => {
                                        setLogradouro(pred.structured_formatting.main_text);
                                        setShowLogradouroSuggestions(false);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{pred.structured_formatting.main_text}</div>
                                        <div className="text-xs text-muted-foreground truncate">
                                          {pred.structured_formatting.secondary_text}
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
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

        {/* Mapa Interativo */}
        <div className="h-[800px]">
          <LocationMap
            address={logradouro}
            municipio={municipio}
            estado={estado}
            pais={pais}
            cep={cep}
          />
        </div>
      </div>

      {/* Card de Resultados (full width) */}
      {result && (
        <Card className="mt-6">
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
  );
}
