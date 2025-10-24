import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, Building2, Loader2, Users, BarChart, Globe, Instagram, Linkedin, MapPin, CheckCircle2, Package, Sparkles, Upload, X, FileText, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrazilianAddressAutocomplete } from "@/hooks/useGooglePlacesAutocomplete";
import LocationMap from "@/components/map/LocationMap";
import { BulkUploadDialog } from "@/components/companies/BulkUploadDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Estados brasileiros
const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Busca múltipla
  const [multipleResults, setMultipleResults] = useState<any[]>([]);
  const [showMultipleResults, setShowMultipleResults] = useState(false);
  
  const { toast } = useToast();
  
  // Detecção automática de tipo de busca
  const detectSearchType = (query: string): "cnpj" | "query" => {
    const cleanQuery = query.replace(/\D/g, '');
    return cleanQuery.length === 14 ? "cnpj" : "query";
  };
  
  // Validação de CNPJ
  const isValidCNPJ = (query: string): boolean => {
    const cleanQuery = query.replace(/\D/g, '');
    return cleanQuery.length === 14;
  };
  
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
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [estado, setEstado] = useState("");
  const [pais, setPais] = useState("Brasil");
  
  // Autocomplete states para endereços
  const [showMunicipioSuggestions, setShowMunicipioSuggestions] = useState(false);
  const [showBairroSuggestions, setShowBairroSuggestions] = useState(false);
  const [showLogradouroSuggestions, setShowLogradouroSuggestions] = useState(false);
  
  // CEP autopreenchimento via ViaCEP
  const fetchAddressFromCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        // Tentar busca por região
        const regionCep = cleanCep.substring(0, 5) + '000';
        
        try {
          const regionResponse = await fetch(`https://viacep.com.br/ws/${regionCep}/json/`);
          const regionData = await regionResponse.json();
          
          if (!regionData.erro) {
            if (regionData.localidade) setMunicipio(regionData.localidade);
            if (regionData.uf) setEstado(regionData.uf);
            if (regionData.bairro) setBairro(regionData.bairro);
            if (regionData.logradouro) setLogradouro(regionData.logradouro);
            
            toast({
              title: "Região identificada",
              description: `${regionData.localidade} - ${regionData.uf}. Preencha o logradouro e número manualmente.`,
            });
            return;
          }
        } catch (regionError) {
          console.error('Erro ao buscar região:', regionError);
        }
        
        toast({
          title: "CEP não catalogado",
          description: "Preencha os campos manualmente. O mapa usará o CEP para localização.",
          variant: "default",
        });
        return;
      }
      
      if (data.logradouro) setLogradouro(data.logradouro);
      if (data.bairro) setBairro(data.bairro);
      if (data.localidade) setMunicipio(data.localidade);
      if (data.uf) setEstado(data.uf);

      toast({
        title: "Endereço encontrado!",
        description: `${data.logradouro || 'Logradouro não informado'}, ${data.localidade}/${data.uf}`,
      });
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({
        title: "Erro na consulta de CEP",
        description: "Preencha os campos manualmente.",
        variant: "default",
      });
    }
  };

  const handleCepChange = (value: string) => {
    const formatted = value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
    setCep(formatted);
    
    if (formatted.replace(/\D/g, '').length === 8) {
      fetchAddressFromCep(formatted);
    }
  };
  
  // Google Places Autocomplete
  const { predictions: municipioPredictions } = useBrazilianAddressAutocomplete(municipio, 'locality');
  const { predictions: bairroPredictions } = useBrazilianAddressAutocomplete(bairro, 'sublocality');
  const { predictions: logradouroPredictions } = useBrazilianAddressAutocomplete(logradouro, 'route');

  // Fetch autocomplete suggestions
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
    const searchType = detectSearchType(searchQuery);
    
    if (searchType === 'query' && searchQuery && searchQuery.length >= 3) {
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
  }, [searchQuery]);

  // Contar campos de refinamento preenchidos
  const countFilledFields = () => {
    let count = 0;
    if (website) count++;
    if (instagram) count++;
    if (linkedin) count++;
    if (produto) count++;
    if (marca) count++;
    if (linkProduto) count++;
    if (cep) count++;
    if (logradouro) count++;
    if (numero) count++;
    if (bairro) count++;
    if (municipio) count++;
    if (estado) count++;
    return count;
  };

  const handleSearch = async () => {
    // Verificar se pelo menos um campo foi preenchido
    const hasSearchQuery = searchQuery.trim().length > 0;
    const hasRefinement = website || instagram || linkedin || produto || marca || linkProduto || 
                          cep || logradouro || numero || bairro || municipio || estado;
    
    if (!hasSearchQuery && !hasRefinement) {
      toast({
        title: "Preencha ao menos um campo",
        description: "Digite um CNPJ/nome da empresa OU preencha campos de refinamento",
        variant: "destructive",
      });
      return;
    }

    const searchType = detectSearchType(searchQuery);
    const isCnpjSearch = searchType === 'cnpj' && isValidCNPJ(searchQuery);
    
    // Se busca por NOME sem CNPJ -> busca múltipla
    if (searchType === 'query' && hasSearchQuery && !isCnpjSearch) {
      await handleMultipleSearch();
      return;
    }

    // Busca única (com CNPJ ou refinamentos)
    setIsSearching(true);
    setPreviewData(null);
    setResult(null);
    setShowSuggestions(false);
    setMultipleResults([]);
    setShowMultipleResults(false);

    try {
      const searchBody: any = {};
      
      if (searchQuery.trim()) {
        searchBody[searchType] = searchQuery;
      }

      // Adicionar campos de refinamento
      if (website) searchBody.website = website;
      if (instagram) searchBody.instagram = instagram;
      if (linkedin) searchBody.linkedin = linkedin;
      if (produto) searchBody.produto = produto;
      if (marca) searchBody.marca = marca;
      if (linkProduto) searchBody.linkProduto = linkProduto;
      if (cep) searchBody.cep = cep;
      if (logradouro) searchBody.logradouro = logradouro;
      if (numero) searchBody.numero = numero;
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

      setPreviewData(data);
      setShowPreview(true);
      
      toast({
        title: "Empresa encontrada!",
        description: `Revise os dados de ${data.company.name} antes de confirmar`,
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

  const handleMultipleSearch = async () => {
    setIsSearching(true);
    setMultipleResults([]);
    setShowMultipleResults(false);
    setShowSuggestions(false);

    try {
      const { data, error } = await supabase.functions.invoke('search-companies-multiple', {
        body: { 
          query: searchQuery,
          limit: 30
        }
      });

      if (error) throw error;

      if (!data.success || !data.companies || data.companies.length === 0) {
        toast({
          title: "Nenhuma empresa encontrada",
          description: "Tente refinar sua busca",
          variant: "destructive",
        });
        return;
      }

      setMultipleResults(data.companies);
      setShowMultipleResults(true);
      
      toast({
        title: `${data.total} empresas encontradas`,
        description: "Selecione a empresa desejada",
      });
    } catch (error: any) {
      toast({
        title: "Erro na busca múltipla",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCompany = async (company: any) => {
    setShowMultipleResults(false);
    
    if (company.cnpj) {
      setSearchQuery(company.cnpj);
      if (company.website) setWebsite(company.website);
      if (company.linkedin_url) setLinkedin(company.linkedin_url);
      
      setTimeout(() => handleSearch(), 100);
    } else {
      setSearchQuery(company.name);
      if (company.website) setWebsite(company.website);
      if (company.linkedin_url) setLinkedin(company.linkedin_url);
      
      toast({
        title: "CNPJ não encontrado",
        description: "Preencha o CNPJ manualmente ou clique em Buscar",
      });
    }
  };

  const confirmSave = async () => {
    if (!previewData) return;
    
    try {
      setIsSaving(true);
      
      // 1. Salvar preview no histórico (mesmo que não confirme)
      await supabase.from('company_previews').insert({
        query: searchQuery,
        cnpj: previewData.company.cnpj,
        name: previewData.company.name,
        website: previewData.company.website,
        domain: previewData.company.domain,
        snapshot: previewData
      });
      
      // 2. Salvar empresa no funil de vendas
      const { data, error } = await supabase.functions.invoke('save-company', {
        body: {
          company: previewData.company,
          decision_makers: previewData.decision_makers,
          digital_maturity: previewData.digital_maturity
        }
      });

      if (error) throw error;

      setResult(data);
      setShowPreview(false);
      
      toast({
        title: "Empresa salva no funil!",
        description: `${previewData.company.name} foi cadastrada com sucesso e está no pipeline de vendas`,
      });
      
      // Navegar para a página de detalhes da empresa
      setTimeout(() => {
        navigate(`/company/${data.company.id}`);
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const cancelPreview = async () => {
    if (!previewData) return;
    
    try {
      // Salvar preview no histórico mesmo ao cancelar (para memória de buscas)
      await supabase.from('company_previews').insert({
        query: searchQuery,
        cnpj: previewData.company.cnpj,
        name: previewData.company.name,
        website: previewData.company.website,
        domain: previewData.company.domain,
        snapshot: previewData
      });
      
      toast({
        title: "Busca registrada",
        description: "A empresa não foi salva no funil, mas a busca foi registrada no histórico",
      });
    } catch (error) {
      console.error('Error saving preview:', error);
    }
    
    setShowPreview(false);
    setPreviewData(null);
  };

  const clearAllFields = () => {
    setSearchQuery("");
    setWebsite("");
    setInstagram("");
    setLinkedin("");
    setProduto("");
    setMarca("");
    setLinkProduto("");
    setCep("");
    setLogradouro("");
    setNumero("");
    setBairro("");
    setMunicipio("");
    setEstado("");
    setPais("Brasil");
    setSuggestions([]);
    toast({
      title: "Campos limpos",
      description: "Todos os campos foram limpos",
    });
  };

  const filledCount = countFilledFields();

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            Busca Inteligente de Empresas
          </h1>
          <p className="text-muted-foreground">
            Sistema unificado de busca com detecção automática e enriquecimento 360°
          </p>
        </div>
        <BulkUploadDialog />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna principal - Busca */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Busca Unificada
                {isValidCNPJ(searchQuery) && (
                  <Badge variant="default" className="ml-2">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    CNPJ Válido
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Digite CNPJ ou nome da empresa - detecção automática
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Campo principal unificado */}
              <div className="space-y-2">
                <Label htmlFor="search">CNPJ ou Nome da Empresa</Label>
                <Popover open={showSuggestions && suggestions.length > 0} onOpenChange={setShowSuggestions}>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Input
                        id="search"
                        placeholder="00.000.000/0000-00 ou Nome da Empresa"
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
                          if (e.key === 'Escape') {
                            setSearchQuery("");
                          }
                        }}
                        onFocus={() => searchQuery.length >= 3 && setShowSuggestions(true)}
                        disabled={isSearching}
                        className="pr-10"
                      />
                      {loadingSuggestions && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {searchQuery && !loadingSuggestions && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-8 w-8 p-0"
                          onClick={() => setSearchQuery("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
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
                  {detectSearchType(searchQuery) === 'cnpj' ? 
                    "CNPJ detectado - busca detalhada será realizada" : 
                    "Nome detectado - busca múltipla será realizada"}
                </p>
              </div>

              {/* Accordion de refinamentos */}
              <Accordion type="multiple" className="w-full">
                {/* Presença Digital */}
                <AccordionItem value="digital">
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Presença Digital</span>
                      {(website || instagram || linkedin) && (
                        <Badge variant="secondary" className="ml-2">
                          {[website, instagram, linkedin].filter(Boolean).length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-4">
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
                        placeholder="@empresa ou instagram.com/empresa"
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
                  </AccordionContent>
                </AccordionItem>

                {/* Produtos & Segmentação */}
                <AccordionItem value="products">
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span>Produtos & Segmentação</span>
                      {(produto || marca || linkProduto) && (
                        <Badge variant="secondary" className="ml-2">
                          {[produto, marca, linkProduto].filter(Boolean).length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-4">
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
                  </AccordionContent>
                </AccordionItem>

                {/* Localização */}
                <AccordionItem value="location">
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Localização</span>
                      {(cep || logradouro || numero || bairro || municipio || estado) && (
                        <Badge variant="secondary" className="ml-2">
                          {[cep, logradouro, numero, bairro, municipio, estado].filter(Boolean).length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-4">
                    {/* CEP, Estado, País */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="cep" className="text-xs">CEP</Label>
                        <Input
                          id="cep"
                          placeholder="00000-000"
                          value={cep}
                          onChange={(e) => handleCepChange(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          disabled={isSearching}
                          maxLength={9}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="estado" className="text-xs">Estado</Label>
                        <Select value={estado} onValueChange={setEstado} disabled={isSearching}>
                          <SelectTrigger id="estado">
                            <SelectValue placeholder="UF" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {ESTADOS_BRASIL.map((uf) => (
                              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="pais" className="text-xs">País</Label>
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
                    
                    {/* Município */}
                    <div className="space-y-2">
                      <Label htmlFor="municipio" className="text-xs">Município</Label>
                      <Popover open={showMunicipioSuggestions && municipioPredictions.length > 0} onOpenChange={setShowMunicipioSuggestions}>
                        <PopoverTrigger asChild>
                          <Input
                            id="municipio"
                            placeholder="Digite para buscar"
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
                        <PopoverContent className="w-full p-0" align="start">
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
                                    <MapPin className="mr-2 h-4 w-4" />
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
                    
                    {/* Bairro e Logradouro */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="bairro" className="text-xs">Bairro</Label>
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
                          <PopoverContent className="w-full p-0" align="start">
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
                                      <MapPin className="mr-2 h-4 w-4" />
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
                        <Label htmlFor="logradouro" className="text-xs">Logradouro</Label>
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
                          <PopoverContent className="w-full p-0" align="start">
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
                                      <MapPin className="mr-2 h-4 w-4" />
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
                    
                    {/* Número */}
                    <div className="space-y-2">
                      <Label htmlFor="numero" className="text-xs">Número</Label>
                      <Input
                        id="numero"
                        placeholder="1578"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        disabled={isSearching}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Botões de ação */}
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching}
                  className="flex-1"
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
                
                {(searchQuery || filledCount > 0) && (
                  <Button 
                    variant="outline" 
                    onClick={clearAllFields}
                    disabled={isSearching}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Limpar
                  </Button>
                )}
              </div>

              {/* Indicador de campos preenchidos */}
              {filledCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {filledCount} campo{filledCount > 1 ? 's' : ''} de refinamento preenchido{filledCount > 1 ? 's' : ''}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna lateral - Mapa e Info */}
        <div className="space-y-6">
          {/* Preview do Mapa */}
          {(cep || municipio || estado) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Preview de Localização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] rounded-lg overflow-hidden">
                  <LocationMap
                    address={`${logradouro || ''} ${numero || ''}, ${bairro || ''}, ${municipio || ''} - ${estado || ''}, ${cep || ''}, ${pais || 'Brasil'}`.trim()}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sistema Inteligente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Detecção Automática</p>
                  <p className="text-xs text-muted-foreground">CNPJ ou Nome identificado automaticamente</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Enriquecimento 360°</p>
                  <p className="text-xs text-muted-foreground">Dados de múltiplas fontes em tempo real</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Geocoding Automático</p>
                  <p className="text-xs text-muted-foreground">Localização precisa com CEP</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Upload em Massa</p>
                  <p className="text-xs text-muted-foreground">CSV com até 500 empresas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de resultados múltiplos */}
      <Dialog open={showMultipleResults} onOpenChange={setShowMultipleResults}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Empresas Encontradas ({multipleResults.length})
            </DialogTitle>
            <DialogDescription>
              Selecione a empresa desejada para continuar
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {multipleResults.map((company, idx) => (
              <Card 
                key={idx} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleSelectCompany(company)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{company.name}</h3>
                      {company.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {company.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {company.website && (
                          <Badge variant="outline" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            {company.website}
                          </Badge>
                        )}
                        {company.linkedin_url && (
                          <Badge variant="outline" className="text-xs">
                            <Linkedin className="h-3 w-3 mr-1" />
                            LinkedIn
                          </Badge>
                        )}
                        {company.industry && (
                          <Badge variant="secondary" className="text-xs">
                            {company.industry}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Selecionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de preview completo */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              Preview Completo dos Dados
              {previewData?.company.raw_data?.receita?.situacao && (
                <Badge variant={previewData.company.raw_data.receita.situacao === 'ATIVA' ? 'default' : 'destructive'} className="ml-2">
                  {previewData.company.raw_data.receita.situacao === 'ATIVA' ? '✓ CNPJ ATIVO' : 'CNPJ INATIVO'}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Revise as informações completas antes de confirmar o cadastro no funil de vendas
            </DialogDescription>
          </DialogHeader>
          
          {previewData && (
            <div className="space-y-6">
              {/* Header com dados principais */}
              <Card className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{previewData.company.name}</CardTitle>
                      {previewData.company.raw_data?.receita?.fantasia && previewData.company.raw_data.receita.fantasia !== previewData.company.name && (
                        <p className="text-sm text-muted-foreground">Nome Fantasia: {previewData.company.raw_data.receita.fantasia}</p>
                      )}
                    </div>
                    {/* Segmento IA Detectado */}
                    {previewData.segment && (
                      <div className="text-right space-y-1">
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {previewData.segment.setor}
                        </Badge>
                        <p className="text-xs text-muted-foreground">{previewData.segment.vertical}</p>
                        <p className="text-xs text-muted-foreground">Confiança: {previewData.segment.confianca}%</p>
                      </div>
                    )}
                  </div>
                  <CardDescription className="space-y-1 pt-2">
                    {previewData.company.cnpj && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">CNPJ:</span>
                        <span className="text-sm font-mono font-semibold">{previewData.company.cnpj}</span>
                      </div>
                    )}
                    {previewData.company.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        <a href={previewData.company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                          {previewData.company.website}
                        </a>
                      </div>
                    )}
                    {previewData.company.linkedin_url && (
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-3 w-3" />
                        <a href={previewData.company.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                          LinkedIn
                        </a>
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Grid com 3 colunas */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Coluna 1 - Dados Cadastrais Receita */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4" />
                        Dados Cadastrais
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {previewData.company.raw_data?.receita?.porte && (
                        <div>
                          <span className="text-muted-foreground">Porte:</span>
                          <p className="font-medium">{previewData.company.raw_data.receita.porte}</p>
                        </div>
                      )}
                      {previewData.company.raw_data?.receita?.tipo && (
                        <div>
                          <span className="text-muted-foreground">Tipo:</span>
                          <p className="font-medium">{previewData.company.raw_data.receita.tipo}</p>
                        </div>
                      )}
                      {previewData.company.raw_data?.receita?.abertura && (
                        <div>
                          <span className="text-muted-foreground">Abertura:</span>
                          <p className="font-medium">{previewData.company.raw_data.receita.abertura}</p>
                        </div>
                      )}
                      {previewData.company.raw_data?.receita?.natureza_juridica && (
                        <div>
                          <span className="text-muted-foreground">Natureza Jurídica:</span>
                          <p className="font-medium text-[10px]">{previewData.company.raw_data.receita.natureza_juridica}</p>
                        </div>
                      )}
                      {previewData.company.raw_data?.receita?.capital_social && (
                        <div>
                          <span className="text-muted-foreground">Capital Social:</span>
                          <p className="font-medium text-green-600">
                            R$ {parseFloat(previewData.company.raw_data.receita.capital_social).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Situação Cadastral */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Situação Cadastral</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {previewData.company.raw_data?.receita?.situacao && (
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={previewData.company.raw_data.receita.situacao === 'ATIVA' ? 'default' : 'destructive'} className="ml-2">
                            {previewData.company.raw_data.receita.situacao}
                          </Badge>
                        </div>
                      )}
                      {previewData.company.raw_data?.receita?.data_situacao && (
                        <div>
                          <span className="text-muted-foreground">Data:</span>
                          <p className="font-medium">{previewData.company.raw_data.receita.data_situacao}</p>
                        </div>
                      )}
                      {previewData.company.raw_data?.receita?.motivo_situacao && (
                        <div>
                          <span className="text-muted-foreground">Motivo:</span>
                          <p className="font-medium text-[10px]">{previewData.company.raw_data.receita.motivo_situacao}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Regimes Especiais */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Regimes Especiais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {previewData.company.raw_data?.receita?.simples && (
                        <div>
                          <span className="text-muted-foreground">Simples Nacional:</span>
                          <Badge variant={previewData.company.raw_data.receita.simples.optante ? 'default' : 'secondary'} className="ml-2 text-[10px]">
                            {previewData.company.raw_data.receita.simples.optante ? 'Optante' : 'Não Optante'}
                          </Badge>
                          {previewData.company.raw_data.receita.simples.data_opcao && (
                            <p className="text-[10px] text-muted-foreground mt-1">Desde: {previewData.company.raw_data.receita.simples.data_opcao}</p>
                          )}
                        </div>
                      )}
                      {previewData.company.raw_data?.receita?.simei && (
                        <div>
                          <span className="text-muted-foreground">MEI (Simei):</span>
                          <Badge variant={previewData.company.raw_data.receita.simei.optante ? 'default' : 'secondary'} className="ml-2 text-[10px]">
                            {previewData.company.raw_data.receita.simei.optante ? 'Optante' : 'Não Optante'}
                          </Badge>
                        </div>
                      )}
                      {previewData.company.raw_data?.receita?.efr && (
                        <div>
                          <span className="text-muted-foreground">EFR:</span>
                          <p className="font-medium">{previewData.company.raw_data.receita.efr}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Coluna 2 - Localização e Contato */}
                <div className="space-y-4">
                  {/* Localização + Mapa */}
                  {previewData.company.location && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4" />
                          Localização
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-xs space-y-1">
                          {previewData.company.raw_data?.receita?.logradouro && (
                            <p>{previewData.company.raw_data.receita.logradouro}, {previewData.company.raw_data.receita.numero || 'S/N'}</p>
                          )}
                          {previewData.company.raw_data?.receita?.complemento && (
                            <p className="text-muted-foreground">{previewData.company.raw_data.receita.complemento}</p>
                          )}
                          {previewData.company.raw_data?.receita?.bairro && <p>{previewData.company.raw_data.receita.bairro}</p>}
                          <p className="font-semibold">
                            {previewData.company.raw_data?.receita?.municipio || previewData.company.location.city}/
                            {previewData.company.raw_data?.receita?.uf || previewData.company.location.state}
                          </p>
                          {previewData.company.raw_data?.receita?.cep && (
                            <p className="text-muted-foreground">CEP: {previewData.company.raw_data.receita.cep}</p>
                          )}
                        </div>
                        
                        {/* Mapa */}
                        {(previewData.company.location.cep || previewData.company.location.city) && (
                          <div className="h-[180px] rounded-lg overflow-hidden">
                            <LocationMap
                              address={previewData.company.raw_data?.receita?.logradouro}
                              municipio={previewData.company.location.city}
                              estado={previewData.company.location.state}
                              cep={previewData.company.location.cep}
                              pais={previewData.company.location.country}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Contato */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Contato</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {previewData.company.raw_data?.receita?.email && (
                        <div>
                          <span className="text-muted-foreground">Email:</span>
                          <p className="font-mono text-[10px]">{previewData.company.raw_data.receita.email}</p>
                        </div>
                      )}
                      {previewData.company.raw_data?.receita?.telefone && (
                        <div>
                          <span className="text-muted-foreground">Telefone:</span>
                          <p className="font-medium">{previewData.company.raw_data.receita.telefone}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* QSA - Quadro de Sócios */}
                  {previewData.company.raw_data?.receita?.qsa && previewData.company.raw_data.receita.qsa.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Quadro de Sócios e Administradores</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-[240px] overflow-y-auto">
                          {previewData.company.raw_data.receita.qsa.map((socio: any, idx: number) => (
                            <div key={idx} className="p-2 rounded border bg-muted/30">
                              <p className="font-medium text-xs">{socio.nome}</p>
                              <Badge variant="outline" className="text-[10px] mt-1">{socio.qual}</Badge>
                              {socio.pais_origem && socio.pais_origem !== 'BRASIL' && (
                                <p className="text-[10px] text-muted-foreground mt-1">País: {socio.pais_origem}</p>
                              )}
                              {socio.nome_rep_legal && (
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  Rep. Legal: {socio.nome_rep_legal} ({socio.qual_rep_legal})
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Coluna 3 - Atividades e Scores */}
                <div className="space-y-4">
                  {/* Atividade Principal */}
                  {previewData.company.raw_data?.receita?.atividade_principal && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Briefcase className="h-4 w-4" />
                          Atividade Principal
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {previewData.company.raw_data.receita.atividade_principal.map((ativ: any, idx: number) => (
                            <div key={idx} className="text-xs">
                              <Badge variant="outline" className="text-[10px] mb-1">{ativ.code}</Badge>
                              <p className="text-[10px] leading-relaxed">{ativ.text}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Atividades Secundárias */}
                  {previewData.company.raw_data?.receita?.atividades_secundarias && previewData.company.raw_data.receita.atividades_secundarias.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                          Atividades Secundárias ({previewData.company.raw_data.receita.atividades_secundarias.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1 max-h-[180px] overflow-y-auto text-[10px]">
                          {previewData.company.raw_data.receita.atividades_secundarias.slice(0, 5).map((ativ: any, idx: number) => (
                            <div key={idx} className="pb-1 border-b last:border-0">
                              <Badge variant="secondary" className="text-[9px]">{ativ.code}</Badge>
                              <p className="mt-0.5 leading-tight">{ativ.text}</p>
                            </div>
                          ))}
                          {previewData.company.raw_data.receita.atividades_secundarias.length > 5 && (
                            <p className="text-muted-foreground text-center py-1">
                              +{previewData.company.raw_data.receita.atividades_secundarias.length - 5} atividades adicionais
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Maturidade Digital */}
                  {previewData.digital_maturity && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <BarChart className="h-4 w-4" />
                          Maturidade Digital
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">Score Geral</span>
                          <Badge variant="default">
                            {previewData.digital_maturity.overall?.toFixed(1) || previewData.digital_maturity.score}/10
                          </Badge>
                        </div>
                        
                        {previewData.digital_maturity.infrastructure && (
                          <div className="space-y-1.5 text-[10px]">
                            <div className="flex justify-between">
                              <span>Infraestrutura</span>
                              <span className="font-medium">{previewData.digital_maturity.infrastructure}/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Sistemas</span>
                              <span className="font-medium">{previewData.digital_maturity.systems}/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Processos</span>
                              <span className="font-medium">{previewData.digital_maturity.processes}/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Segurança</span>
                              <span className="font-medium">{previewData.digital_maturity.security}/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Inovação</span>
                              <span className="font-medium">{previewData.digital_maturity.innovation}/10</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Decisores */}
                  {previewData.decision_makers && previewData.decision_makers.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4" />
                          Decisores ({previewData.decision_makers.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                          {previewData.decision_makers.slice(0, 4).map((dm: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 p-2 rounded bg-muted/30 border">
                              <Users className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-[10px] truncate">{dm.name}</p>
                                <p className="text-[9px] text-muted-foreground truncate">{dm.title}</p>
                              </div>
                            </div>
                          ))}
                          {previewData.decision_makers.length > 4 && (
                            <p className="text-[10px] text-muted-foreground text-center py-1">
                              +{previewData.decision_makers.length - 4} decisores
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={confirmSave} disabled={isSaving} className="flex-1">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando no Funil de Vendas...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirmar e Salvar no Funil
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={cancelPreview} disabled={isSaving}>
                  Cancelar
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                💡 Esta busca será registrada no histórico mesmo que você não salve a empresa no funil de vendas
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
