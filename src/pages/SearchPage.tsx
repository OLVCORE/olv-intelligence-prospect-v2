import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/common/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, Building2, Loader2, Users, BarChart, Globe, Instagram, Linkedin, MapPin, CheckCircle2, Package, Sparkles, Upload, Download, X, FileText, Briefcase, DollarSign, Scale, Save, Plus, AlertTriangle, XCircle, CheckCircle, Clock, Target } from "lucide-react";
import apolloIcon from '@/assets/logos/apollo-icon.ico';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrazilianAddressAutocomplete } from "@/hooks/useGooglePlacesAutocomplete";
import LocationMap from "@/components/map/LocationMap";
import { BulkUploadDialog } from "@/components/companies/BulkUploadDialog";
import { ApolloImportDialog } from "@/components/companies/ApolloImportDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GoogleSheetsSyncConfig } from "@/components/companies/GoogleSheetsSyncConfig";

// Estados brasileiros
const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [cnpjError, setCnpjError] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [multipleResults, setMultipleResults] = useState<any[]>([]);
  const [showMultipleResults, setShowMultipleResults] = useState(false);
  const [isApolloImportOpen, setIsApolloImportOpen] = useState(false);
  
  const [contacts, setContacts] = useState<Array<{name:string; title:string; phone?:string; whatsapp?:string; email?:string}>>([]);
  const [newContact, setNewContact] = useState<{name:string; title:string; phone?:string; whatsapp?:string; email?:string}>({name:"", title:"", phone:"", whatsapp:"", email:""});
  
  const { toast } = useToast();

  const downloadTemplateCSV = () => {
    const BOM = '\uFEFF';
    const headers = [
      'CNPJ', 'Nome da Empresa', 'Nome Fantasia', 'Razão Social', 'Website', 'Domínio',
      'Instagram', 'LinkedIn', 'Facebook', 'Twitter', 'YouTube',
      'Setor', 'Porte', 'Natureza Jurídica', 'Funcionários', 'Faturamento Estimado',
      'Capital Social', 'Data de Abertura', 'Situação Cadastral', 'Data Situação',
      'Motivo Situação', 'Situação Especial', 'Data Situação Especial',
      'CEP', 'Logradouro', 'Número', 'Complemento', 'Bairro', 
      'Município', 'UF', 'País', 'Latitude', 'Longitude',
      'Telefone', 'Email', 'Email Verificado',
      'CNAE Principal Código', 'CNAE Principal Descrição',
      'CNAEs Secundários Quantidade', 'CNAEs Secundários',
      'Quadro Societário Quantidade', 'Sócios',
      'Score Maturidade Digital', 'Score Fit TOTVS', 'Score Análise',
      'Tech Stack', 'ERP Atual', 'CRM Atual',
      'Produto Principal', 'Marca', 'Link Produto/Marketplace', 'Categoria',
      'Decisores Quantidade', 'Decisor 1 Nome', 'Decisor 1 Cargo', 'Decisor 1 Email', 
      'Decisor 1 Telefone', 'Decisor 1 LinkedIn',
      'Decisor 2 Nome', 'Decisor 2 Cargo', 'Decisor 2 Email', 
      'Decisor 2 Telefone', 'Decisor 2 LinkedIn',
      'Decisor 3 Nome', 'Decisor 3 Cargo', 'Decisor 3 Email', 
      'Decisor 3 Telefone', 'Decisor 3 LinkedIn',
      'Enriquecido Receita', 'Enriquecido 360', 'Enriquecido Apollo', 'Enriquecido Phantom',
      'Data Criação', 'Data Última Atualização', 'Data Último Enriquecimento',
      'Status Enriquecimento', 'Fonte Enriquecimento',
      'Observações', 'Tags', 'Prioridade',
      'Último Contato', 'Próximo Contato', 'Status Pipeline',
      'Valor Oportunidade', 'Probabilidade Fechamento', 'Data Fechamento Esperada'
    ];
    
    const exampleRow = [
      '00.000.000/0000-00', 'Empresa Exemplo LTDA', 'Nome Fantasia Exemplo', 'Empresa Exemplo LTDA', 
      'https://exemplo.com.br', 'exemplo.com.br',
      '@exemploempresa', 'linkedin.com/company/exemplo', 'facebook.com/exemplo', 'twitter.com/exemplo', 'youtube.com/exemplo',
      'Tecnologia', 'MÉDIA', 'Sociedade Limitada', '50', 'R$ 5M - R$ 10M',
      '100000.00', '01/01/2010', 'ATIVA', '01/01/2010',
      '', '', '',
      '01310-100', 'Avenida Paulista', '1578', 'Sala 10', 'Bela Vista',
      'São Paulo', 'SP', 'Brasil', '-23.561684', '-46.655981',
      '(11) 3000-0000', 'contato@exemplo.com.br', 'Sim',
      '6201-5/00', 'Desenvolvimento de programas de computador sob encomenda',
      '3', '6202-3/00 - Desenvolvimento web; 6209-1/00 - Suporte técnico',
      '2', 'João Silva (Administrador); Maria Santos (Sócia)',
      '75.5', '85', '90',
      'ERP Proprietário, CRM Salesforce', 'SAP', 'Salesforce',
      'Software ERP', 'Marca Exemplo', 'mercadolivre.com.br/produto', 'Software',
      '2', 'João Silva', 'CEO', 'joao.silva@exemplo.com.br', 
      '(11) 99999-0000', 'linkedin.com/in/joaosilva',
      'Maria Santos', 'CTO', 'maria.santos@exemplo.com.br',
      '(11) 99999-0001', 'linkedin.com/in/mariasantos',
      '', '', '', '', '',
      'Sim', 'Sim', 'Não', 'Não',
      '01/01/2024', '15/10/2024', '15/10/2024',
      'Completo', 'Receita Federal + Enriquecimento 360',
      'Cliente potencial de alto valor', 'ERP, Cloud, Enterprise', 'Alta',
      '10/10/2024', '20/10/2024', 'Qualificação',
      'R$ 500.000', '75%', '31/12/2024'
    ];
    
    const csvContent = headers.join(',') + '\n' + 
                      exampleRow.map(cell => `"${cell}"`).join(',') + '\n' +
                      '53.113.791/0001-22,TOTVS SA,TOTVS,TOTVS S.A.,https://www.totvs.com,totvs.com,@totvs,linkedin.com/company/totvs,,,,Software ERP,GRANDE,Sociedade Anônima,10000,R$ 1B+,,,ATIVA,,,,,04711-904,Avenida Braz Leme,1000,,Brooklin,São Paulo,SP,Brasil,,,,,,,,,0,,,,,80,,,,,,,,,0,,,,,,,,,,,,Sim,Sim,,,,,,,,,,,,,,,';
    
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template-importacao-empresas.csv';
    link.click();
    
    toast({
      title: "Sucesso",
      description: "Planilha exemplo baixada com sucesso!",
    });
  };
  
  // Detecção automática de tipo de busca
  const detectSearchType = (query: string): "cnpj" | "query" => {
    const cleanQuery = query.replace(/\D/g, '');
    return cleanQuery.length === 14 ? "cnpj" : "query";
  };
  
  // Validação de CNPJ em tempo real
  const validateCNPJInput = (value: string): string => {
    if (!value.trim()) return "";
    
    const cleanValue = value.replace(/\D/g, '');
    
    // Verifica se tem letras ou caracteres especiais (exceto . / -)
    if (/[a-zA-Z,;:!@#$%^&*()_+=[\]{}|\\<>?~`]/.test(value)) {
      return "❌ CNPJ não pode conter letras ou caracteres especiais";
    }
    
    // Verifica se tem espaços, vírgulas, etc
    if (/[\s,;:]/.test(value)) {
      return "❌ CNPJ não pode conter espaços ou vírgulas";
    }
    
    // Verifica quantidade de dígitos
    if (cleanValue.length > 0 && cleanValue.length < 14) {
      return `⚠️ CNPJ incompleto (${cleanValue.length}/14 dígitos)`;
    }
    
    if (cleanValue.length > 14) {
      return "❌ CNPJ deve ter exatamente 14 dígitos";
    }
    
    return "";
  };
  
  const isValidCNPJ = (query: string): boolean => {
    const cleanQuery = query.replace(/\D/g, '');
    return cleanQuery.length === 14;
  };
  
  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    
    // Valida apenas se parece ser CNPJ (tem números)
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length > 0) {
      const error = validateCNPJInput(value);
      setCnpjError(error);
    } else {
      setCnpjError("");
    }
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

  // Prefill ao editar empresa existente
  const params = new URLSearchParams(window.location.search);
  const prefillCompanyId = params.get('companyId');
  useEffect(() => {
    const loadCompany = async () => {
      if (!prefillCompanyId) return;
      // Carrega empresa
      const { data: companyData, error: companyErr } = await supabase
        .from('companies')
        .select('*')
        .eq('id', prefillCompanyId)
        .maybeSingle();
      if (companyErr) return;

      // Carrega presença digital separadamente (não há relação FK)
      const { data: presence } = await supabase
        .from('digital_presence')
        .select('*')
        .eq('company_id', prefillCompanyId)
        .maybeSingle();

      // Carrega decisores separadamente (evita join 400)
      const { data: decisors } = await supabase
        .from('decision_makers')
        .select('*')
        .eq('company_id', prefillCompanyId);

      if (companyData) {
        setSearchQuery(companyData.cnpj || companyData.name || "");
        setWebsite(companyData.website || "");
        setLinkedin(companyData.linkedin_url || "");
        
        // Instagram do digital_presence ou do raw_data
        const instagramUrl = (presence as any)?.instagram_data?.url 
          || (presence as any)?.instagram_url
          || (companyData.raw_data as any)?.instagram_url 
          || "";
        setInstagram(instagramUrl);
        
        if (companyData.location && typeof companyData.location === 'object' && !Array.isArray(companyData.location)) {
          const loc = companyData.location as Record<string, any>;
          setCep((loc.cep as string) || "");
          setEstado((loc.state as string) || "");
          setPais((loc.country as string) || "Brasil");
          setMunicipio((loc.city as string) || "");
          setBairro((loc.neighborhood as string) || "");
          setLogradouro((loc.street as string) || "");
          setNumero((loc.number as string) || "");
        }
        
        // Contatos existentes (buscados separadamente)
        const decisores = (decisors as any[]) || [];
        if (decisores.length > 0) {
          setContacts(decisores.map((dm: any) => ({
            name: dm.name || '',
            title: dm.title || '',
            phone: dm.phone || '',
            whatsapp: dm.whatsapp || '',
            email: dm.email || ''
          })));
        }
      }
    };
    loadCompany();
  }, [prefillCompanyId]);

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
    // Bloquear busca se houver erro de validação de CNPJ
    if (cnpjError) {
      toast({
        title: "CNPJ inválido",
        description: cnpjError,
        variant: "destructive",
      });
      return;
    }
    
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
      
      // Exibir alerta de status do CNPJ imediatamente
      if (data.cnpj_status) {
        if (data.cnpj_status === 'inexistente') {
          toast({
            title: "❌ CNPJ Inexistente",
            description: data.cnpj_status_message || "CNPJ não encontrado na Receita Federal",
            variant: "destructive",
          });
        } else if (data.cnpj_status === 'inativo') {
          toast({
            title: "⚠️ CNPJ Inativo",
            description: data.cnpj_status_message || "Empresa inativa/suspensa/baixada na Receita Federal",
            variant: "destructive",
          });
        } else if (data.cnpj_status === 'ativo') {
          toast({
            title: "✅ CNPJ Válido e Ativo",
            description: data.cnpj_status_message || "Empresa encontrada e ativa na Receita Federal",
          });
        }
      } else {
        toast({
          title: "Empresa encontrada!",
          description: `Revise os dados de ${data.company.name} antes de confirmar`,
        });
      }
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
      <BackButton className="mb-4" />
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="default"
            onClick={downloadTemplateCSV}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Baixar Planilha Exemplo
          </Button>
          <BulkUploadDialog />
          <Button
            variant="secondary"
            size="default"
            onClick={() => setIsApolloImportOpen(true)}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold shadow-lg"
          >
            <div className="h-4 w-4 mr-2 flex items-center justify-center">
              <img src={apolloIcon} alt="Apollo" className="h-4 w-4 object-contain" />
            </div>
            Importar do Apollo
          </Button>
        </div>
      </div>

      {/* Dialog Apollo Import */}
      <ApolloImportDialog 
        open={isApolloImportOpen}
        onOpenChange={setIsApolloImportOpen}
      />

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
                          handleSearchQueryChange(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !cnpjError) {
                            e.preventDefault();
                            handleSearch();
                          }
                          if (e.key === 'Escape') {
                            setSearchQuery("");
                            setCnpjError("");
                          }
                        }}
                        onFocus={() => searchQuery.length >= 3 && setShowSuggestions(true)}
                        disabled={isSearching}
                        className={`pr-10 ${cnpjError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                      {loadingSuggestions && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {searchQuery && !loadingSuggestions && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-8 w-8 p-0"
                          onClick={() => {
                            setSearchQuery("");
                            setCnpjError("");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </PopoverTrigger>
                  {cnpjError && (
                    <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {cnpjError}
                    </p>
                  )}
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

                {/* Contatos */}
                <AccordionItem value="contacts">
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Contatos</span>
                      {contacts.length > 0 && (
                        <Badge variant="secondary" className="ml-2">{contacts.length}</Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-4">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Nome</Label>
                        <Input value={newContact.name} onChange={(e)=>setNewContact({...newContact, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Cargo</Label>
                        <Input value={newContact.title} onChange={(e)=>setNewContact({...newContact, title: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Telefone</Label>
                        <Input value={newContact.phone} onChange={(e)=>setNewContact({...newContact, phone: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">WhatsApp</Label>
                        <Input value={newContact.whatsapp} onChange={(e)=>setNewContact({...newContact, whatsapp: e.target.value})} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs">Email</Label>
                        <Input value={newContact.email} onChange={(e)=>setNewContact({...newContact, email: e.target.value})} />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!newContact.name || !newContact.title) { 
                            toast({ title: 'Preencha nome e cargo do contato', variant: 'destructive' });
                            return; 
                          }
                          setContacts([...contacts, newContact]);
                          setNewContact({ name:'', title:'', phone:'', whatsapp:'', email:'' });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />Adicionar contato
                      </Button>
                    </div>
                    {contacts.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs">Contatos adicionados</Label>
                        <div className="flex flex-wrap gap-2">
                          {contacts.map((c, idx) => (
                            <Badge key={idx} variant="outline" className="gap-2">
                              {c.name} • {c.title}
                              <button className="ml-2 text-xs" onClick={() => setContacts(contacts.filter((_,i)=>i!==idx))}>remover</button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
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
                <Button 
                  variant="secondary"
                  onClick={async () => {
                    setIsSaving(true);
                    try {
                      const companyPayload: any = {
                        id: prefillCompanyId || undefined,
                        name: searchQuery || undefined,
                        cnpj: isValidCNPJ(searchQuery) ? searchQuery : undefined,
                        website: website || undefined,
                        linkedin_url: linkedin || undefined,
                        raw_data: {
                          social_media: {
                            instagram: instagram || undefined
                          }
                        },
                        location: {
                          cep, state: estado, country: pais, city: municipio, neighborhood: bairro, street: logradouro, number: numero
                        }
                      };
                      const decisionMakers = contacts.map(c => ({
                        name: c.name,
                        title: c.title,
                        email: c.email,
                        phone: c.phone,
                        whatsapp: c.whatsapp,
                        raw_data: { source: 'manual' }
                      }));
                      const { data, error } = await supabase.functions.invoke('save-company', {
                        body: { company: companyPayload, decision_makers: decisionMakers }
                      });
                      if (error) throw error;
                      toast({ title: 'Dados salvos!', description: 'Empresa e contatos registrados com sucesso. Agora execute "Análise 360°" para reprocessar os dados.' });
                      
                      // Force 360° analysis after save
                      try {
                        await supabase.functions.invoke('enrich-company-360', {
                          body: { company_id: data.company.id }
                        });
                        toast({ title: '🔄 Reprocessando análise 360°', description: 'Os dados atualizados serão analisados em breve.' });
                      } catch (enrichError) {
                        console.error('Error triggering 360 analysis:', enrichError);
                      }
                      
                      navigate(`/company/${data.company.id}`);
                    } catch (e: any) {
                      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar
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
              {/* Badge de Status do CNPJ */}
              {previewData?.cnpj_status === 'ativo' && (
                <Badge className="ml-2 bg-green-500 hover:bg-green-600 text-white border-green-600 gap-1">
                  <CheckCircle className="h-3 w-3" />
                  CNPJ ATIVO
                </Badge>
              )}
              {previewData?.cnpj_status === 'inativo' && (
                <Badge className="ml-2 bg-orange-500 hover:bg-orange-600 text-white border-orange-600 gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  CNPJ INATIVO
                </Badge>
              )}
              {previewData?.cnpj_status === 'inexistente' && (
                <Badge variant="destructive" className="ml-2 gap-1">
                  <XCircle className="h-3 w-3" />
                  CNPJ INEXISTENTE
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Revise as informações completas antes de confirmar o cadastro no funil de vendas
              {previewData?.cnpj_status_message && (
                <span className="block mt-2 font-medium">
                  {previewData.cnpj_status_message}
                </span>
              )}
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
                          <Badge 
                            className={`ml-2 ${
                              previewData.company.raw_data.receita.situacao === 'ATIVA' 
                                ? 'bg-green-500 hover:bg-green-600 text-white border-green-600' 
                                : previewData.company.raw_data.receita.situacao === 'ALERTA'
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600'
                                : 'bg-red-500 hover:bg-red-600 text-white border-red-600'
                            }`}
                          >
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

                  {/* Score Financeiro */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4" />
                        Score Financeiro
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Classificação</span>
                        <Badge 
                          variant="default"
                          className={`${
                            previewData.company.raw_data?.financial?.risk_classification === 'A' ? 'bg-green-600' :
                            previewData.company.raw_data?.financial?.risk_classification === 'B' ? 'bg-blue-600' :
                            previewData.company.raw_data?.financial?.risk_classification === 'C' ? 'bg-yellow-600' :
                            previewData.company.raw_data?.financial?.risk_classification === 'D' ? 'bg-orange-600' :
                            'bg-red-600'
                          }`}
                        >
                          {previewData.company.raw_data?.financial?.risk_classification || 'N/A'}
                        </Badge>
                      </div>
                      <div className="space-y-1.5 text-[10px]">
                        <div className="flex justify-between">
                          <span>Score de Crédito</span>
                          <span className="font-bold text-green-600">
                            {previewData.company.raw_data?.financial?.credit_score || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Risco Preditivo</span>
                          <span className="font-medium">
                            {previewData.company.raw_data?.financial?.predictive_risk_score || 'N/A'}/100
                          </span>
                        </div>
                        {previewData.company.raw_data?.financial?.payment_history && (
                          <div className="flex justify-between">
                            <span>Histórico de Pagamentos</span>
                            <Badge variant="outline" className="text-[9px]">
                              {previewData.company.raw_data.financial.payment_history.on_time || 0} no prazo
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Score Jurídico */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Scale className="h-4 w-4" />
                        Score Jurídico
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Nível de Risco</span>
                        <Badge 
                          className={`${
                            previewData.company.raw_data?.legal?.risk_level === 'baixo' ? 'bg-green-500 text-white' :
                            previewData.company.raw_data?.legal?.risk_level === 'medio' ? 'bg-yellow-500 text-white' :
                            previewData.company.raw_data?.legal?.risk_level === 'alto' ? 'bg-orange-500 text-white' :
                            'bg-red-500 text-white'
                          }`}
                        >
                          {previewData.company.raw_data?.legal?.risk_level?.toUpperCase() || 'N/A'}
                        </Badge>
                      </div>
                      <div className="space-y-1.5 text-[10px]">
                        <div className="flex justify-between">
                          <span>Processos Ativos</span>
                          <span className="font-bold text-red-600">
                            {previewData.company.raw_data?.legal?.active_processes || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total de Processos</span>
                          <span className="font-medium">
                            {previewData.company.raw_data?.legal?.total_processes || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Saúde Jurídica</span>
                          <span className="font-bold text-green-600">
                            {previewData.company.raw_data?.legal?.legal_health_score || 0}/100
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

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
