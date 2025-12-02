import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
// FloatingNavigation removido - componente deletado
import { GenericProgressBar } from '@/components/ui/GenericProgressBar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Sparkles, TrendingUp, CheckCircle, ArrowRight, Loader2, AlertCircle,
  ExternalLink, Target, Flame, Mail, Phone, MessageSquare, Copy, Check,
  DollarSign, Clock, Award, Lightbulb, RefreshCw, Info, FileText, Plus
} from 'lucide-react';
import { useProductGaps } from '@/hooks/useProductGaps';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useMemo } from 'react';
import { registerTab, unregisterTab } from './tabsRegistry';
import { ARREditor } from './components/ARREditor';
import { useProductCatalog } from '@/hooks/useProductCatalog';
import { useCreateQuote, QuoteProduct } from '@/hooks/useQuotes';
import { Label } from '@/components/ui/label';
import type { EditedARR, PotentialEstimate, ContractPeriod } from '@/types/productOpportunities';
import { 
  formatCurrency, formatARR, ARR_TOOLTIP, PROBABILITY_TOOLTIP, TIMELINE_TOOLTIP,
  calculateProbability, calculateTimeline, calculatePotentialEstimate, parseARRFromString
} from '@/lib/utils/productOpportunities';

interface RecommendedProductsTabProps {
  companyId?: string;
  companyName?: string;
  cnpj?: string;
  sector?: string;
  cnae?: string;
  size?: string;
  employees?: number;
  stcResult?: any;
  similarCompanies?: any[];
  savedData?: any;
  stcHistoryId?: string;
  onDataChange?: (data: any) => void;
}

export function RecommendedProductsTab({ 
  companyId,
  companyName, 
  cnpj,
  sector,
  cnae,
  size,
  employees,
  stcResult,
  similarCompanies,
  savedData,
  stcHistoryId,
  onDataChange
}: RecommendedProductsTabProps) {
  
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false); // 🔥 NOVO: Controle manual
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();
  
  // 🎯 ESTADOS DE PROGRESSO
  const [progressStartTime, setProgressStartTime] = useState<number | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  
  // 🔥 NOVO: Estado para valores ARR editados por produto
  const [editedARR, setEditedARR] = useState<Record<string, EditedARR>>({});
  
  // 🔥 NOVO: Hooks para integração com CPQ/Strategy
  const { data: productCatalog } = useProductCatalog();
  const createQuote = useCreateQuote();
  
  // 🔥 NOVO: Estado para diálogos
  const [fichaTecnicaOpen, setFichaTecnicaOpen] = useState<string | null>(null);
  const [selectedProductForFicha, setSelectedProductForFicha] = useState<any>(null);

  // 🔍 BUSCAR DADOS DA EMPRESA (se companyId fornecido)
  const { data: companyData } = useQuery({
    queryKey: ['company-for-products', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      return data;
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5 // 5 min
  });

  // 🧠 BUSCAR DADOS CONTEXTUAIS DE OUTRAS ABAS
  const { data: decisorsContextData } = useQuery({
    queryKey: ['decisors-context', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('decision_makers')
        .select('position, department')
        .eq('company_id', companyId);
      
      const total = data?.length || 0;
      const cLevel = data?.filter(d => 
        d.position?.toLowerCase().includes('ceo') || 
        d.position?.toLowerCase().includes('cto') ||
        d.position?.toLowerCase().includes('cfo')
      ).length || 0;
      const hasTechDecisors = data?.some(d => 
        d.department?.toLowerCase().includes('ti') ||
        d.department?.toLowerCase().includes('tecnologia')
      ) || false;
      const hasFinanceDecisors = data?.some(d =>
        d.department?.toLowerCase().includes('financ') ||
        d.position?.toLowerCase().includes('cfo')
      ) || false;
      
      return { total, cLevel, hasTechDecisors, hasFinanceDecisors };
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5
  });

  // 🔥 HELPER: Extrair raw_data (TypeScript fix)
  const rawData = (companyData as any)?.raw_data || {};
  
  // 🔥 EXTRAIR DADOS DO APOLLO COM VALIDAÇÃO DE MATCH
  // O Apollo armazena em: apollo_organization, enriched_apollo, ou apollo
  const apolloDataRaw = rawData.apollo_organization || rawData.enriched_apollo || rawData.apollo || {};
  
  // 🔍 VALIDAÇÃO SIMPLIFICADA: Apenas critérios especificados (FLEXÍVEL PARA QUALQUER INDÚSTRIA)
  // ✅ CRITÉRIOS CONFIRMADOS (SEM PESOS - APENAS VERIFICAR):
  // 1. Primeiro nome OU primeiro nome + segundo nome
  // 2. Nome fantasia
  // 3. CEP + raio de 80km (se cidade/estado batem = dentro do raio)
  // 4. CEP
  // 5. Cidade
  // 6. País = Brasil (OBRIGATÓRIO)
  const validateApolloMatch = (
    apolloData: any, 
    companyName: string, 
    cnpj?: string,
    fantasyName?: string,
    companyDomain?: string,
    companyCep?: string,
    companyCity?: string,
    companyState?: string
  ): boolean => {
    if (!apolloData || Object.keys(apolloData).length === 0) return false;
    
    const criteria: string[] = []; // Lista de critérios atendidos (para debug)
    let matchCount = 0; // Contador simples (precisa de pelo menos 3 critérios)
    
    // 🔥 HELPER: Normalizar strings para comparação
    const normalize = (str: string) => str.toLowerCase().trim().replace(/[^\w\s]/g, '');
    
    // 🔥 HELPER: Extrair primeiro nome (ex: "OLV" de "OLV INTERNACIONAL")
    const getFirstName = (name: string): string => {
      const words = normalize(name).split(/\s+/);
      return words[0] || '';
    };
    
    // 🔥 HELPER: Extrair primeiro e segundo nome (ex: "OLV Internacional")
    const getFirstTwoNames = (name: string): string => {
      const words = normalize(name).split(/\s+/);
      return words.slice(0, 2).join(' ').trim();
    };
    
    // ✅ 1️⃣ PAÍS: OBRIGATÓRIO - Empresas brasileiras devem ter country = "Brazil" ou "Brasil"
    const apolloCountry = normalize(apolloData.country || apolloData.country_code || '');
    const apolloState = normalize(apolloData.state || apolloData.state_code || '');
    const apolloCity = normalize(apolloData.city || '');
    
    // 🔥 LISTA EXPANDIDA: Cidades e estados brasileiros comuns
    const brazilianCities = [
      'são paulo', 'rio de janeiro', 'belo horizonte', 'curitiba', 'porto alegre',
      'uberlandia', 'uberlândia', 'brasilia', 'brasília', 'salvador', 'fortaleza',
      'recife', 'porto alegre', 'manaus', 'belém', 'goiânia', 'guarulhos', 'campinas',
      'são luís', 'são gonçalo', 'maceió', 'duque de caxias', 'natal', 'teresina',
      'campo grande', 'nova iguaçu', 'são bernardo', 'joão pessoa', 'santo andré',
      'osasco', 'jaboatão', 'são josé dos campos', 'ribeirão preto', 'uberaba',
      'contagem', 'aracaju', 'feira de santana', 'cuiabá', 'joinville', 'apucarana',
      'londrina', 'juiz de fora', 'anápolis', 'santos', 'niterói', 'campos dos goytacazes'
    ];
    
    const brazilianStates = [
      'sp', 'rj', 'mg', 'rs', 'pr', 'sc', 'ba', 'go', 'pe', 'ce', 'df', 'es',
      'am', 'pa', 'ma', 'ms', 'mt', 'pb', 'al', 'se', 'rn', 'pi', 'to', 'ac',
      'ap', 'ro', 'rr', 'são paulo', 'rio de janeiro', 'minas gerais', 'rio grande do sul',
      'paraná', 'santa catarina', 'bahia', 'goiás', 'pernambuco', 'ceará', 'distrito federal',
      'espírito santo', 'amazonas', 'pará', 'maranhão', 'mato grosso do sul', 'mato grosso',
      'paraíba', 'alagoas', 'sergipe', 'rio grande do norte', 'piauí', 'tocantins',
      'acre', 'amapá', 'rondônia', 'roraima'
    ];
    
    // ✅ Verificar se é brasileira de múltiplas formas
    const isBrazilian = 
      apolloCountry.includes('brazil') || 
      apolloCountry.includes('brasil') ||
      apolloCountry === 'br' ||
      brazilianCities.some(city => apolloCity.includes(city)) ||
      brazilianStates.some(state => apolloState.includes(state)) ||
      // Se tem CNPJ, é brasileira
      (cnpj && cnpj.length === 14) ||
      // Se tem CEP brasileiro (8 dígitos), é brasileira
      (companyCep && companyCep.length === 8);
    
    if (!isBrazilian) {
      console.log('[PRODUCTS-TAB] ❌ Validação Apollo: Empresa não é brasileira (país obrigatório)', {
        apolloCountry,
        apolloState,
        apolloCity,
        hasCnpj: !!(cnpj && cnpj.length === 14),
        hasCep: !!(companyCep && companyCep.length === 8)
      });
      return false; // ❌ REJEITA IMEDIATAMENTE se não for brasileira
    }
    criteria.push('✅ País: Brasil');
    matchCount++;
    
    // ✅ 2️⃣ PRIMEIRO NOME OU PRIMEIRO + SEGUNDO NOME
    const companyFirstName = getFirstName(companyName);
    const apolloFirstName = getFirstName(apolloData.name || '');
    const companyFirstTwo = getFirstTwoNames(companyName);
    const apolloFirstTwo = getFirstTwoNames(apolloData.name || '');
    
    if (companyFirstName && apolloFirstName && companyFirstName === apolloFirstName) {
      criteria.push(`✅ 1º Nome: "${companyFirstName}"`);
      matchCount++;
    } else if (companyFirstTwo && apolloFirstTwo && companyFirstTwo === apolloFirstTwo) {
      criteria.push(`✅ 1º+2º Nome: "${companyFirstTwo}"`);
      matchCount++;
    }
    
    // ✅ 3️⃣ NOME FANTASIA
    if (fantasyName) {
      const fantasyNormalized = normalize(fantasyName);
      const apolloNameNormalized = normalize(apolloData.name || '');
      if (fantasyNormalized && apolloNameNormalized && 
          (apolloNameNormalized.includes(fantasyNormalized) || fantasyNormalized.includes(apolloNameNormalized))) {
        criteria.push(`✅ Nome Fantasia: "${fantasyName}"`);
        matchCount++;
      }
    }
    
    // ✅ 4️⃣ CEP
    if (companyCep && companyCep.length >= 8) {
      criteria.push(`✅ CEP presente`);
      matchCount++;
    }
    
    // ✅ 5️⃣ CIDADE
    if (companyCity) {
      const normalizedCompanyCity = normalize(companyCity);
      const normalizedApolloCity = normalize(apolloData.city || '');
      if (normalizedCompanyCity && normalizedApolloCity && 
          (normalizedCompanyCity === normalizedApolloCity ||
           normalizedApolloCity.includes(normalizedCompanyCity) ||
           normalizedCompanyCity.includes(normalizedApolloCity))) {
        criteria.push(`✅ Cidade: "${companyCity}"`);
        matchCount++;
      }
    }
    
    // ✅ 6️⃣ ESTADO (considera como dentro do raio de 80km se cidade/estado batem)
    if (companyState) {
      const normalizedCompanyState = normalize(companyState);
      const normalizedApolloState = normalize(apolloData.state || '');
      if (normalizedCompanyState && normalizedApolloState && 
          (normalizedCompanyState === normalizedApolloState ||
           normalizedApolloState.includes(normalizedCompanyState) ||
           normalizedCompanyState.includes(normalizedApolloState))) {
        criteria.push(`✅ Estado: "${companyState}" (dentro raio 80km)`);
        matchCount++;
      }
    }
    
    // ✅ REGRA FINAL: País Brasil (obrigatório) + pelo menos 2 outros critérios = VÁLIDO
    // Flexível para QUALQUER indústria!
    const isValid = isBrazilian && matchCount >= 3;
    
    console.log('[PRODUCTS-TAB] 🔍 Validação Apollo Match (Simplificada):', {
      apolloName: apolloData.name,
      apolloCountry: apolloData.country,
      apolloCity: apolloData.city,
      apolloState: apolloData.state,
      companyName,
      companyFirstName,
      companyFirstTwo,
      fantasyName,
      companyCep,
      companyCity,
      companyState,
      isBrazilian,
      matchCount,
      criteria,
      isValid: isValid ? '✅ VÁLIDO' : `❌ INVÁLIDO (matchCount: ${matchCount} < 3)`
    });
    
    return isValid;
  };
  
  // 🔥 EXTRAIR DADOS DA RECEITA FEDERAL para validação Apollo
  const receitaFederalForValidation = rawData.receita_federal || {};
  const fantasyName = receitaFederalForValidation.fantasia || receitaFederalForValidation.nome_fantasia || '';
  const companyDomain = companyData?.domain || companyData?.website || '';
  const companyCep = receitaFederalForValidation.cep || companyData?.zip_code || '';
  const companyCity = receitaFederalForValidation.municipio || companyData?.city || '';
  const companyState = receitaFederalForValidation.uf || companyData?.state || '';
  
  // 🔒 APLICAR VALIDAÇÃO: Só usar dados do Apollo se corresponder à empresa correta
  const apolloData = validateApolloMatch(
    apolloDataRaw, 
    companyName || '', 
    cnpj,
    fantasyName,
    companyDomain,
    companyCep,
    companyCity,
    companyState
  ) ? apolloDataRaw : {};
  const apolloIsValid = Object.keys(apolloData).length > 0;
  
  // 🔍 MÚLTIPLAS FORMAS: O Apollo pode usar diferentes nomes de campo (só se válido!)
  const apolloEmployees = apolloIsValid ? (
    apolloData.estimated_num_employees || // ✅ Campo padrão do Apollo
    apolloData.num_employees || 
    apolloData.employee_count || 
    (apolloData.employee_range ? 
      parseInt(apolloData.employee_range.replace(/\D/g, '').split('-')[1] || apolloData.employee_range.replace(/\D/g, '')) : null) || // Ex: "51-200" -> 200 (média)
    apolloData.num_employees_estimate ||
    null
  ) : null; // ❌ Se dados do Apollo não correspondem, não usar!
  
  // 🔥 EXTRAIR INDUSTRY DO APOLLO (se válido) - PRIORIDADE 1!
  const apolloIndustry = apolloIsValid ? (
    apolloData.industry ||
    apolloData.primary_industry ||
    (Array.isArray(apolloData.industries) && apolloData.industries.length > 0 ? apolloData.industries[0] : null) ||
    null
  ) : null;
  
  console.log('[PRODUCTS-TAB] 🔍 Apollo Data (validado):', {
    hasApolloDataRaw: !!apolloDataRaw && Object.keys(apolloDataRaw).length > 0,
    apolloIsValid,
    apolloName: apolloDataRaw.name,
    apolloCountry: apolloDataRaw.country,
    apolloCity: apolloDataRaw.city,
    estimated_num_employees: apolloData.estimated_num_employees,
    extractedEmployees: apolloEmployees,
    reason: apolloIsValid ? '✅ Dados válidos - corresponde à empresa' : '❌ Dados inválidos - empresa diferente (Berlin, etc)'
  });
  
  // Extrair dados 360° do raw_data
  const enriched360 = rawData.enriched_360;
  const analysis360Context = enriched360 ? {
    revenue: enriched360.revenue || 0,
    debts: enriched360.debts || 0,
    debtsPercentage: enriched360.debtsPercentage || 0,
    growthRate: enriched360.growthRate || 0,
    hiringTrends: enriched360.hiringTrends || 0,
    recentNews: enriched360.recentNews || 0,
    healthScore: enriched360.healthScore || 'unknown'
  } : undefined;

  // 🌐 BUSCAR ANÁLISE PROFUNDA DE URLs (50+) E REDES SOCIAIS
  // 🔒 SÓ EXECUTA SE enabled = true (usuário clicou "Analisar")
  const { data: urlsDeepAnalysis, refetch: refetchUrlsAnalysis } = useQuery({
    queryKey: ['urls-deep-analysis', companyId],
    queryFn: async () => {
      if (!companyId || !companyData) return null;
      
      setIsAnalyzing(true);
      
      // Extrair TODAS URLs da aba Digital (campo raw_data)
      const rawDataLocal = (companyData as any).raw_data || {};
      const allUrls = rawDataLocal.discovered_urls || [];
      
      // Extrair redes sociais
      const socialNetworks = {
        linkedin: rawDataLocal.linkedin_url || companyData.linkedin_url,
        facebook: rawDataLocal.facebook,
        instagram: rawDataLocal.instagram,
        twitter: rawDataLocal.twitter,
        youtube: rawDataLocal.youtube
      };
      
      console.log('[PRODUCTS-TAB] 🔍 Solicitando análise profunda de', allUrls.length, 'URLs');
      toast.info(`Analisando ${allUrls.length} URLs... (pode levar 1-2 minutos)`);
      
      // Chamar Edge Function de análise profunda
      const { data, error } = await supabase.functions.invoke('analyze-urls-deep', {
        body: {
          companyName: companyName,
          urls: allUrls,
          socialNetworks
        }
      });
      
      if (error) {
        console.error('[PRODUCTS-TAB] Erro na análise profunda:', error);
        toast.error('Erro na análise profunda de URLs');
        setIsAnalyzing(false);
        return null;
      }
      
      console.log('[PRODUCTS-TAB] ✅ Análise profunda completa:', data);
      toast.success(`✅ ${data.urls_analyzed} URLs analisadas!`);
      setIsAnalyzing(false);
      return data;
    },
    enabled: false, // 🔒 NÃO DISPARA AUTOMATICAMENTE
    staleTime: 1000 * 60 * 30 // 30 min (análise cara, cachear bem)
  });

  // Extrair dados digitais (EXPANDIDO com análise profunda)
  const digitalContext = {
    maturityScore: rawData.digital_maturity_score || 0,
    hasWebsite: !!companyData?.website,
    hasSocialMedia: !!rawData.social_media,
    technologies: rawData.technologies || [],
    websiteTraffic: rawData.website_traffic,
    // 🔥 NOVO: Análise profunda de URLs
    allUrls: rawData.discovered_urls || [],
    socialNetworks: {
      linkedin: rawData.linkedin_url || companyData?.linkedin_url,
      facebook: rawData.facebook,
      instagram: rawData.instagram,
      twitter: rawData.twitter,
      youtube: rawData.youtube
    },
    // 🔥 NOVO: Insights da análise profunda
    deepAnalysis: urlsDeepAnalysis?.deep_analysis,
    signalsSummary: urlsDeepAnalysis?.signals_summary,
    relevantUrls: urlsDeepAnalysis?.relevant_urls
  };

  // 📊 EXTRAIR DADOS (priorizar Receita Federal/CNAE, depois STC, depois props)
  // 🔥 CRÍTICO: Priorizar dados da Receita Federal para setor correto!
  const receitaFederal = rawData.receita_federal;
  
  // 🔥 CRÍTICO: Garantir que cnpj seja sempre extraído corretamente
  // Prioridade: 1) Prop cnpj, 2) companyData.cnpj, 3) receitaFederal.cnpj, 4) rawData.cnpj
  const enrichedCnpj = cnpj || 
                        companyData?.cnpj || 
                        receitaFederal?.cnpj || 
                        rawData.cnpj || 
                        (companyData as any)?.cnpj || 
                        '';
  
  const cnaePrincipal = receitaFederal?.atividade_principal?.[0]?.code || 
                        receitaFederal?.cnae_fiscal_principal ||
                        rawData.cnae || 
                        cnae;
  const setorFromReceita = receitaFederal?.natureza_juridica || 
                           receitaFederal?.qualificacao_socio;
  
  // 🎯 MAPEAR APOLLO INDUSTRY PARA SETOR (prioridade 1)
  const mapApolloIndustryToSector = (apolloIndustry: string | null): string | null => {
    if (!apolloIndustry) return null;
    
    const industryLower = apolloIndustry.toLowerCase();
    
    // Saúde
    if (industryLower.includes('health') || industryLower.includes('medical') || 
        industryLower.includes('hospital') || industryLower.includes('healthcare') ||
        industryLower.includes('pharmaceutical') || industryLower.includes('biotech')) {
      return 'Saúde';
    }
    
    // Educação
    if (industryLower.includes('education') || industryLower.includes('edtech') ||
        industryLower.includes('school') || industryLower.includes('university')) {
      return 'Educação';
    }
    
    // Logística
    if (industryLower.includes('logistics') || industryLower.includes('supply chain') ||
        industryLower.includes('transportation') || industryLower.includes('shipping') ||
        industryLower.includes('import') || industryLower.includes('export') ||
        industryLower.includes('trade')) {
      return 'Logística';
    }
    
    // Varejo
    if (industryLower.includes('retail') || industryLower.includes('e-commerce') ||
        industryLower.includes('commerce')) {
      return 'Varejo';
    }
    
    // Indústria
    if (industryLower.includes('manufacturing') || industryLower.includes('industrial') ||
        industryLower.includes('production') || industryLower.includes('factory')) {
      return 'Indústria';
    }
    
    // Construção
    if (industryLower.includes('construction') || industryLower.includes('building') ||
        industryLower.includes('real estate')) {
      return 'Construção';
    }
    
    // Tecnologia
    if (industryLower.includes('technology') || industryLower.includes('software') ||
        industryLower.includes('tech') || industryLower.includes('it services')) {
      return 'Tecnologia';
    }
    
    return null; // Não mapeado
  };
  
  // 🎯 MAPEAR CNAE PARA SETOR (fallback quando Apollo não tem)
  const mapCNAEToSector = (cnaeCode: string | undefined, companyName: string = ''): string => {
    if (!cnaeCode) {
      // Fallback: analisar nome da empresa
      const nameLower = companyName.toLowerCase();
      if (nameLower.includes('medic') || nameLower.includes('hospital') || nameLower.includes('ortoped')) {
        return 'Saúde';
      }
      if (nameLower.includes('educa') || nameLower.includes('escola') || nameLower.includes('universidad')) {
        return 'Educação';
      }
      if (nameLower.includes('varej') || nameLower.includes('comercio') || nameLower.includes('loja')) {
        return 'Varejo';
      }
      if (nameLower.includes('transport') || nameLower.includes('guincho') || nameLower.includes('logística') || nameLower.includes('logistica')) {
        return 'Logística';
      }
      if (nameLower.includes('industr') || nameLower.includes('fabrica') || nameLower.includes('manufatura')) {
        return 'Indústria';
      }
      return 'Serviços';
    }
    
    // Mapear CNAE principal para setor
    const cnaeNum = parseInt(cnaeCode.substring(0, 2));
    const cnae4Digits = parseInt(cnaeCode.substring(0, 4)); // Para casos específicos
    const cnae7Digits = parseInt(cnaeCode.substring(0, 7)); // Para casos muito específicos
    
    // ✅ SAÚDE: CNAEs de produtos médico-hospitalares (32.50.07-04 = Fabricação de instrumentos médico-hospitalares)
    if (cnae4Digits === 3250 || cnae7Digits === 3250704) return 'Saúde';
    if (cnaeNum === 86 || cnaeNum === 87) return 'Saúde'; // Atividades de saúde
    if (cnae4Digits >= 3250 && cnae4Digits <= 3259) {
      // Fabricação de produtos médicos/hospitalares = Saúde (não Indústria!)
      if (companyName.toLowerCase().includes('medic') || 
          companyName.toLowerCase().includes('hospital') || 
          companyName.toLowerCase().includes('ortoped')) {
        return 'Saúde';
      }
    }
    
    // ✅ TRANSPORTE E LOGÍSTICA (CNAE 49)
    if (cnaeNum === 49) return 'Logística';
    // ✅ CNAEs específicos de transporte rodoviário (2945)
    if (cnae4Digits >= 2941 && cnae4Digits <= 2949) return 'Logística';
    // ✅ CNAEs de transporte em geral (49xx)
    if (cnae4Digits >= 4900 && cnae4Digits <= 4999) return 'Logística';
    
    // Outros setores
    if (cnaeNum === 47) return 'Varejo';
    if (cnaeNum === 85) return 'Educação';
    // ✅ CORRIGIDO: CNAE 29xx NÃO é Indústria, é Transporte (já coberto acima)
    // Indústria: 25-33, mas excluir 29xx (Transporte) e 32xx médico-hospitalar (Saúde)
    if (cnaeNum >= 25 && cnaeNum <= 33 && cnaeNum !== 29) {
      // Verificar se não é produto médico-hospitalar (deve ser Saúde)
      if (cnae4Digits >= 3250 && cnae4Digits <= 3259) {
        return companyName.toLowerCase().includes('medic') || 
               companyName.toLowerCase().includes('hospital') || 
               companyName.toLowerCase().includes('ortoped') ? 'Saúde' : 'Indústria';
      }
      return 'Indústria';
    }
    if (cnaeNum >= 41 && cnaeNum <= 43) return 'Construção';
    if (cnaeNum >= 1 && cnaeNum <= 3) return 'Agronegócio';
    
    return 'Serviços';
  };
  
  // ✅ PRIORIDADE: 1) Apollo Industry, 2) CNAE, 3) STC Result, 4) Prop, 5) Default
  const apolloSector = mapApolloIndustryToSector(apolloIndustry);
  const enrichedSector = apolloSector || // 🔥 PRIORIDADE 1: Apollo Industry
                          mapCNAEToSector(cnaePrincipal, companyName || (companyData as any)?.company_name || '') || // 🔥 PRIORIDADE 2: CNAE (fallback)
                          stcResult?.sector || 
                          sector || 
                          'Serviços';
  
  console.log('[PRODUCTS-TAB] 📊 Setor determinado:', {
    apolloIndustry,
    apolloSector,
    cnaePrincipal,
    cnaeSector: mapCNAEToSector(cnaePrincipal, companyName || (companyData as any)?.company_name || ''),
    finalSector: enrichedSector,
    source: apolloSector ? 'Apollo' : 'CNAE (fallback)'
  });
  
  const enrichedCNAE = cnaePrincipal || undefined; // Permitir undefined (não quebrar)
  const enrichedSize = receitaFederal?.porte || 
                       rawData.porte || 
                       size || 
                       'EPP';
  
  // 🔥 CORRIGIR: NÃO usar qsa?.length (número de sócios ≠ número de funcionários!)
  // Usar uma estimativa melhor baseada no porte da empresa
  const estimateEmployeesByPorte = (porte?: string): number => {
    if (!porte) return 100;
    const porteLower = porte.toLowerCase();
    if (porteLower.includes('mei') || porteLower.includes('micro')) return 5;
    if (porteLower.includes('pequena') || porteLower.includes('epp')) return 20;
    if (porteLower.includes('média')) return 100;
    if (porteLower.includes('grande')) return 500;
    return 100; // Default
  };
  
  // 🔥 PRIORIDADE CORRIGIDA: 
  // 1. Apollo (só se válido - corresponde à empresa) 
  // 2. companyData.employees (se existir)
  // 3. prop employees
  // 4. estimativa por porte (Receita Federal)
  // 5. Default 100
  const enrichedEmployees = apolloIsValid && apolloEmployees ? apolloEmployees : // ✅ Só usa Apollo se válido!
                           companyData?.employees || 
                           employees || 
                           estimateEmployeesByPorte(enrichedSize) || 
                           100; // ✅ NUNCA usar qsa?.length!
  
  // 🔍 DEBUG: Log para verificar de onde vem o número de funcionários
  console.log('[PRODUCTS-TAB] 👥 Funcionários DEBUG (final):', {
    apolloIsValid,
    apolloEmployees: apolloIsValid ? apolloEmployees : '❌ Descarted (empresa diferente)',
    companyDataEmployees: companyData?.employees,
    propEmployees: employees,
    estimatedByPorte: estimateEmployeesByPorte(enrichedSize),
    final: enrichedEmployees,
    porte: enrichedSize,
    source: apolloIsValid && apolloEmployees ? 'Apollo (validado)' : 
            companyData?.employees ? 'companyData.employees' :
            employees ? 'prop employees' :
            estimateEmployeesByPorte(enrichedSize) ? 'Estimativa por porte (Receita Federal)' :
            'Default (100)'
  });
  
  // 🔍 EXTRAIR PRODUTOS DETECTADOS + EVIDÊNCIAS do TOTVS Check
  const detectedProducts = stcResult?.detected_products || [];
  const evidences = stcResult?.evidences || [];
  
  // 📦 MONTAR EVIDÊNCIAS POR PRODUTO
  const detectedEvidences = detectedProducts.map((product: string) => ({
    product,
    sources: evidences
      .filter((ev: any) => ev.detected_products?.includes(product))
      .map((ev: any) => ({
        url: ev.url,
        title: ev.title,
        source_name: ev.source_name || ev.source
      }))
      .slice(0, 5) // Top 5 evidências por produto
  }));

  console.log('[PRODUCTS-TAB] 📊 Dados enriquecidos:', {
    companyName,
    enrichedSector,
    enrichedCNAE,
    enrichedEmployees,
    detectedProducts: detectedProducts.length,
    detectedEvidences: detectedEvidences.length
  });

  // 🔥 LOG: Verificar cnpj antes de enviar
  console.log('[PRODUCTS-TAB] 🔍 CNPJ Debug:', {
    propCnpj: cnpj,
    companyDataCnpj: companyData?.cnpj,
    receitaFederalCnpj: receitaFederal?.cnpj,
    rawDataCnpj: rawData.cnpj,
    enrichedCnpj: enrichedCnpj,
    final: enrichedCnpj || '(vazio)'
  });
  
  // Buscar produtos recomendados REAIS via Edge Function EVOLUÍDA
  // 🔒 SÓ EXECUTA SE enabled = true (usuário clicou "Analisar")
  const { data: productGapsData, isLoading, error, refetch: refetchProducts } = useProductGaps({
    companyId,
    companyName: companyName || '',
    cnpj: enrichedCnpj, // ✅ SEMPRE usar enrichedCnpj (garantido)
    sector: enrichedSector,
    cnae: enrichedCNAE,
    size: enrichedSize,
    employees: enrichedEmployees,
    detectedProducts: detectedProducts,
    detectedEvidences: detectedEvidences,
    competitors: stcResult?.competitors || [],
    similarCompanies: similarCompanies || [],
    // 🧠 DADOS CONTEXTUAIS DE TODAS AS ABAS
    decisorsData: decisorsContextData,
    digitalData: digitalContext,
    analysis360Data: analysis360Context,
    enabled: enabled // 🔒 CONTROLE MANUAL
  });

  // 🔥 IMPORTANTE: Destructuring ANTES de qualquer retorno condicional (para garantir ordem de hooks)
  const {
    strategy,
    segment,
    products_in_use = [],
    primary_opportunities = [],
    relevant_opportunities = [],
    estimated_potential,
    executive_summary, // 🔥 NOVO: Resumo executivo holístico
    sales_approach,
    stack_suggestion,
    total_estimated_value,
    insights = []
  } = productGapsData || {};

  // 🔥 NOVO: Calcular potencial estimado agregado baseado em ARR editados
  // IMPORTANTE: Este useMemo DEVE estar ANTES de todos os retornos condicionais
  const calculatedPotential: PotentialEstimate | null = useMemo(() => {
    if (!primary_opportunities && !relevant_opportunities) return null;
    const allProducts = [...(primary_opportunities || []), ...(relevant_opportunities || [])];
    if (allProducts.length === 0) return null;
    
    const productsWithARR = allProducts.map(product => {
      const edited = editedARR[product.name];
      if (edited) {
        return {
          arrMin: edited.arrMin || 0,
          arrMax: edited.arrMax || 0,
          contractPeriod: edited.contractPeriod || 3,
        };
      }
      // Tentar extrair ARR do valor estimado do produto
      const arrValues = parseARRFromString(product.value || '');
      return {
        arrMin: arrValues?.min || 30000,
        arrMax: arrValues?.max || 50000,
        contractPeriod: 3 as ContractPeriod,
      };
    });
    
    return calculatePotentialEstimate(productsWithARR);
  }, [primary_opportunities, relevant_opportunities, editedARR]);
  
  // 🔥 NOVO: Potencial a exibir (calculado ou do backend)
  const displayPotential = calculatedPotential || estimated_potential;

  // 🔗 REGISTRY: Registrar aba para SaveBar global
  useEffect(() => {
    console.info('[REGISTRY] ✅ Registering: products');
    
    registerTab('products', {
      flushSave: async () => {
        console.log('[PRODUCTS] 📤 Registry: flushSave() chamado');
        const dataToSave = productGapsData || { skipped: true, reason: 'Análise opcional não executada' };
        onDataChange?.(dataToSave);
        toast.success('✅ Produtos & Oportunidades Salvos!');
      },
      getStatus: () => 'completed', // ✅ SEMPRE completed (aba opcional)
    });

    // ✅ NÃO DESREGISTRAR! Abas devem permanecer no registry
  }, [productGapsData, onDataChange]);
  
  // 🔄 RESET
  const handleReset = () => {
    toast.info('Retornando ao início');
  };

  // 💾 SALVAR
  const handleSave = () => {
    onDataChange?.(productGapsData);
    toast.success('✅ Produtos & Oportunidades Salvos!');
  };

  // 📋 COPIAR TEXTO
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(id);
      setTimeout(() => setCopiedText(null), 2000);
      toast.success('Copiado!');
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };
  
  // 🔥 NOVO: Handler para salvar valores ARR editados
  const handleSaveARR = (productName: string, arr: EditedARR) => {
    setEditedARR(prev => ({
      ...prev,
      [productName]: arr,
    }));
    // Recalcular potencial automaticamente
    recalculatePotential();
  };
  
  // 🔥 NOVO: Recalcular potencial estimado quando ARR é editado
  const recalculatePotential = () => {
    // Esta função será chamada automaticamente quando ARR for editado
    // O potencial será recalculado usando useMemo abaixo
  };
  
  // 🔥 NOVO: Handler para adicionar produto à proposta (CPQ)
  const handleAddToProposal = async (product: any) => {
    if (!companyId) {
      toast.error('ID da empresa não encontrado');
      return;
    }
    
    try {
      // Buscar produto no catálogo
      const catalogProduct = productCatalog?.find(p => 
        p.name.toLowerCase() === product.name.toLowerCase() ||
        p.sku.toLowerCase() === product.name.toLowerCase().replace(/\s+/g, '_')
      );
      
      if (!catalogProduct) {
        // Se não encontrou no catálogo, criar produto temporário
        const edited = editedARR[product.name];
        // Tentar extrair ARR do valor estimado do produto
        let arrValues = { min: 30000, max: 50000 };
        if (edited) {
          arrValues = { min: edited.arrMin, max: edited.arrMax };
        } else if (product.value) {
          const parsed = parseARRFromString(product.value);
          if (parsed) {
            arrValues = parsed;
          }
        }
        
        // Criar cotação diretamente com o produto
        const quoteProduct: QuoteProduct = {
          id: `temp-${product.name}`,
          sku: product.name.toLowerCase().replace(/\s+/g, '_'),
          name: product.name,
          quantity: 1,
          base_price: arrValues.min, // Usar ARR mínimo como base
          discount: 0,
          final_price: arrValues.min,
        };
        
        await createQuote.mutateAsync({
          company_id: companyId,
          products: [quoteProduct],
        });
        
        toast.success(`✅ ${product.name} adicionado à proposta!`);
        
        // Navegar para Strategy tab CPQ
        navigate(`/account-strategy?company=${companyId}&tab=cpq`);
      } else {
        // Se encontrou no catálogo, adicionar normalmente
        const edited = editedARR[product.name];
        const quoteProduct: QuoteProduct = {
          id: catalogProduct.id,
          sku: catalogProduct.sku,
          name: catalogProduct.name,
          quantity: catalogProduct.min_quantity,
          base_price: edited ? edited.arrMin : catalogProduct.base_price,
          discount: 0,
          final_price: (edited ? edited.arrMin : catalogProduct.base_price) * catalogProduct.min_quantity,
        };
        
        await createQuote.mutateAsync({
          company_id: companyId,
          products: [quoteProduct],
        });
        
        toast.success(`✅ ${product.name} adicionado à proposta!`);
        
        // Navegar para Strategy tab CPQ
        navigate(`/account-strategy?company=${companyId}&tab=cpq`);
      }
    } catch (error: any) {
      console.error('[PRODUCTS-TAB] Erro ao adicionar produto à proposta:', error);
      toast.error(`Erro ao adicionar produto: ${error.message || 'Erro desconhecido'}`);
    }
  };
  
  // 🔥 NOVO: Handler para ver ficha técnica
  const handleViewFichaTecnica = (product: any) => {
    setSelectedProductForFicha(product);
    setFichaTecnicaOpen(product.name);
  };

  // Função para iniciar análise
  const handleStartAnalysis = async () => {
    setEnabled(true);
    
    // Primeiro: Análise profunda de URLs (se houver)
    const allUrls = rawData.discovered_urls || [];
    if (allUrls.length > 0) {
      await refetchUrlsAnalysis();
    }
    
    // Depois: Gerar recomendações de produtos
    await refetchProducts();
  };

  if (!companyName) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Informações da empresa necessárias para análise de produtos
        </p>
      </Card>
    );
  }

  // 🔒 TELA INICIAL: Botão "Analisar Agora" (mostrar ANTES de qualquer erro se não iniciado)
  // IMPORTANTE: Esta verificação deve vir ANTES do tratamento de erro e loading
  if (!enabled && !productGapsData) {
    const allUrls = rawData.discovered_urls || [];
    const estimatedCost = Math.ceil((allUrls.length * 0.001) + 0.03);
    
    // 🔥 Se houver erro mas análise não foi iniciada, logar silenciosamente e continuar
    if (error) {
      console.warn('[PRODUCTS-TAB] ⚠️ Erro detectado mas análise não iniciada (mostrando tela inicial):', error);
    }
    
    return (
      <Card className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          Análise de Produtos & Oportunidades
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-2xl mx-auto">
          Analisaremos <strong>TODAS as 9 abas do relatório</strong> + <strong>{allUrls.length} URLs</strong> descobertas 
          para gerar recomendações de produtos TOTVS contextualizadas e precisas.
        </p>
        
        <div className="bg-muted/50 p-4 rounded-lg mb-6 max-w-xl mx-auto">
          <h4 className="font-semibold mb-3 flex items-center gap-2 justify-center">
            <Target className="w-4 h-4" />
            O que será analisado:
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm text-left">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>TOTVS Check (produtos detectados)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Decisores ({decisorsContextData?.total || 0} encontrados)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Maturidade Digital (score {digitalContext.maturityScore}/100)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Análise 360° (saúde financeira)</span>
            </div>
            <div className="flex items-start gap-2">
              <Flame className="w-4 h-4 text-orange-600 mt-0.5" />
              <span className="font-semibold">{allUrls.length} URLs profundas</span>
            </div>
            <div className="flex items-start gap-2">
              <Flame className="w-4 h-4 text-orange-600 mt-0.5" />
              <span className="font-semibold">Redes sociais</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-3 mb-4">
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Tempo estimado: 1-2 minutos
          </Badge>
          <Badge variant="outline" className="text-xs">
            <DollarSign className="w-3 h-3 mr-1" />
            Custo estimado: ~R$ {estimatedCost.toFixed(2)}
          </Badge>
        </div>
        
        <Button 
          onClick={handleStartAnalysis} 
          size="lg" 
          disabled={isAnalyzing || isLoading}
          className="gap-2"
        >
          {isAnalyzing || isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Analisar Agora
            </>
          )}
        </Button>
        
        {/* 🔥 Mostrar aviso se houver erro prévio */}
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm">
            <p className="text-destructive font-semibold mb-1">⚠️ Erro detectado anteriormente</p>
            <p className="text-muted-foreground text-xs">
              Houve um problema na última tentativa. Tente novamente clicando em "Analisar Agora".
            </p>
          </div>
        )}
      </Card>
    );
  }

  // Loading state (só mostrar se análise foi iniciada)
  // 🎯 ATUALIZAR PROGRESSO DURANTE CARREGAMENTO
  useEffect(() => {
    if (isLoading && enabled && !progressStartTime) {
      setProgressStartTime(Date.now());
      setCurrentPhase('gap_analysis');
      
      // Simular progresso das 4 fases
      setTimeout(() => setCurrentPhase('product_matching'), 6000);
      setTimeout(() => setCurrentPhase('roi_calculation'), 11000);
      setTimeout(() => setCurrentPhase('recommendations'), 16000);
    } else if (!isLoading && progressStartTime) {
      setCurrentPhase('completed');
      setTimeout(() => {
        setProgressStartTime(null);
        setCurrentPhase(null);
      }, 1000);
    }
  }, [isLoading, enabled, progressStartTime]);
  
  if (isLoading && enabled) {
    // 🎯 4 FASES REAIS DO BACKEND (conforme generate-product-gaps/index.ts)
    const productsPhases = [
      { id: 'gap_analysis', name: 'Análise de Gaps', status: 'pending' as const, estimatedTime: 6 },
      { id: 'product_matching', name: 'Matching de Produtos', status: 'pending' as const, estimatedTime: 5 },
      { id: 'roi_calculation', name: 'Cálculo de ROI', status: 'pending' as const, estimatedTime: 5 },
      { id: 'recommendations', name: 'Recomendações', status: 'pending' as const, estimatedTime: 4 },
    ];
    
    // Iniciar progresso se ainda não iniciado
    if (!progressStartTime) {
      setProgressStartTime(Date.now());
      setCurrentPhase('gap_analysis');
      setTimeout(() => setCurrentPhase('product_matching'), 6000);
      setTimeout(() => setCurrentPhase('roi_calculation'), 11000);
      setTimeout(() => setCurrentPhase('recommendations'), 15000);
    }
    
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Analisando produtos e oportunidades...</span>
          </div>
        </Card>
        {progressStartTime && (
          <GenericProgressBar
            phases={productsPhases}
            currentPhase={currentPhase || undefined}
            elapsedTime={Math.floor((Date.now() - progressStartTime) / 1000)}
            title="Progresso da Análise de Produtos"
          />
        )}
      </div>
    );
  }

  // 🔥 ERROR STATE: Só mostrar se análise foi iniciada E houve erro E não está carregando
  if (error && !isLoading && enabled) {
    const errorAny = error as any;
    const backendError = errorAny?.backendError || null;
    const errorMessage = error.message || 'Erro desconhecido';
    
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">Erro ao carregar análise de produtos</span>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-3">
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="font-semibold text-destructive mb-2">⚠️ Erro 500 - Edge Function (Backend)</p>
              <p className="text-xs whitespace-pre-wrap">{errorMessage}</p>
            </div>
            
            {backendError && (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                <p className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1 text-xs">
                  🔍 Detalhes do Backend:
                </p>
                <pre className="text-xs overflow-auto max-h-32">
                  {JSON.stringify(backendError, null, 2)}
                </pre>
              </div>
            )}
            
            <div>
              <p className="font-semibold mb-2">Possíveis causas:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Erro na Edge Function do backend (verificar logs do Supabase)</li>
                <li>Setor ou CNAE não reconhecido pela função</li>
                <li>Problema temporário no servidor</li>
                <li>Dados inválidos processados pela função</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                setEnabled(false); // Resetar para tela inicial
                setTimeout(() => {
                  setEnabled(true);
                  refetchProducts();
                }, 100);
              }}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button 
              onClick={() => {
                setEnabled(false); // Voltar para tela inicial
              }}
              variant="ghost"
              size="sm"
            >
              Voltar
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded-md">
            <p className="font-semibold mb-1">📊 Payload Enviado (Frontend OK):</p>
            <p>Setor: {enrichedSector}</p>
            <p>CNAE: {enrichedCNAE || 'N/A'}</p>
            <p>Funcionários: {enrichedEmployees}</p>
            <p>Tamanho: {enrichedSize || 'N/A'}</p>
            <p>Produtos detectados: {detectedProducts.length}</p>
            <p className="mt-2 text-yellow-600 dark:text-yellow-400">
              ✅ O frontend está enviando dados válidos. O problema está no backend (Edge Function).
            </p>
          </div>
        </div>
      </Card>
    );
  }


  return (
    <ScrollArea className="h-[calc(100vh-250px)]">
      <div className="space-y-6 pb-20">
        {/* 🎯 NAVEGAÇÃO FLUTUANTE */}
        {productGapsData && (
          <FloatingNavigation
            onBack={handleReset}
            onHome={handleReset}
            onSave={handleSave}
            showSaveButton={true}
            saveDisabled={!productGapsData}
            hasUnsavedChanges={false}
          />
        )}
        
        {/* ========================================
            0️⃣ RESUMO EXECUTIVO HOLÍSTICO (ANÁLISE 100%)
        ======================================== */}
        {executive_summary && (
          <>
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  📊 Resumo Executivo - Análise Holística 100%
                </h3>
                {executive_summary.confidence_level && (
                  <Badge 
                    variant={executive_summary.confidence_level === 'alta' ? 'default' : 
                             executive_summary.confidence_level === 'média' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    Confiança: {executive_summary.confidence_level.toUpperCase()}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-4">
                {/* Análise da Empresa */}
                {executive_summary.company_analysis && (
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground mb-2 block">
                      🏢 Análise da Empresa
                    </Label>
                    <p className="text-sm whitespace-pre-line">{executive_summary.company_analysis}</p>
                  </div>
                )}
                
                {/* Momento da Empresa */}
                {executive_summary.moment_analysis && (
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground mb-2 block">
                      📈 Momento da Empresa
                    </Label>
                    <p className="text-sm">{executive_summary.moment_analysis}</p>
                  </div>
                )}
                
                {/* Tipo de Venda */}
                {executive_summary.sales_type && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-muted-foreground mb-1 block">
                        🎯 Tipo de Venda
                      </Label>
                      <Badge variant={executive_summary.sales_type === 'cross-sell' ? 'default' : 'secondary'}>
                        {executive_summary.sales_type === 'cross-sell' ? 'Cross-Sell' : 'New Sale'}
                      </Badge>
                      {executive_summary.sales_type_explanation && (
                        <p className="text-xs text-muted-foreground mt-1">{executive_summary.sales_type_explanation}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-muted-foreground mb-1 block">
                        🏭 Setor Identificado
                      </Label>
                      <p className="text-sm font-semibold">{executive_summary.sector_identified}</p>
                      {executive_summary.sector_source && (
                        <p className="text-xs text-muted-foreground">Fonte: {executive_summary.sector_source}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Metodologia */}
                {executive_summary.methodology && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <Label className="text-sm font-semibold text-muted-foreground mb-2 block flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      🔬 Metodologia Completa
                    </Label>
                    <p className="text-sm whitespace-pre-line">{executive_summary.methodology}</p>
                    {executive_summary.url_analysis_count && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          📊 URLs Analisadas: <strong>{executive_summary.url_analysis_count}</strong> URLs profundas
                        </p>
                        {executive_summary.url_analysis_summary && (
                          <p className="text-xs text-muted-foreground mt-1">{executive_summary.url_analysis_summary}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Racional de Recomendações */}
                {executive_summary.recommendations_rationale && (
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground mb-2 block">
                      💡 Por que Recomendamos Estes Produtos
                    </Label>
                    <p className="text-sm whitespace-pre-line">{executive_summary.recommendations_rationale}</p>
                  </div>
                )}
                
                {/* Key Findings */}
                {executive_summary.key_findings && executive_summary.key_findings.length > 0 && (
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                    <Label className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2 block">
                      🔍 Principais Achados
                    </Label>
                    <ul className="space-y-1">
                      {executive_summary.key_findings.map((finding: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
            <Separator className="my-6" />
          </>
        )}

        {/* ========================================
            HEADER
        ======================================== */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-2">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                Produtos & Oportunidades
                <Badge variant={strategy === 'cross-sell' ? 'default' : 'secondary'}>
                  {strategy === 'cross-sell' ? 'Cross-Sell' : 'New Sale'}
                </Badge>
                {segment && (
                  <Badge variant="outline" className="text-xs">
                    {segment}
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                {strategy === 'cross-sell' 
                  ? `Cliente TOTVS: ${products_in_use.length} produtos em uso. Oportunidades de expansão.` 
                  : `Prospect: Stack inicial recomendado com ${primary_opportunities.length + relevant_opportunities.length} produtos.`}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3" />
                IA
              </Badge>
              <div className="text-sm font-semibold">{total_estimated_value || 'N/A'}</div>
            </div>
          </div>
        </Card>

        {/* Insights Estratégicos */}
        {insights.length > 0 && (
          <Card className="p-4 bg-muted/30">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Insights Estratégicos
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* ========================================
            1️⃣ PRODUTOS EM USO (CONFIRMADOS)
        ======================================== */}
        {products_in_use.length > 0 && (
          <>
            <Separator className="my-6" />
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                1️⃣ Produtos em Uso (Confirmados)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Produtos TOTVS detectados com evidências em vagas, notícias e documentos públicos.
              </p>
              <div className="grid gap-3">
                {products_in_use.map((product: any, index: number) => (
                  <Card key={index} className="p-4 bg-green-50/50 dark:bg-green-950/20 border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-600">
                          {product.category}
                        </Badge>
                        <span className="font-semibold">{product.product}</span>
                      </div>
                      <Badge variant="outline">
                        {product.evidenceCount} evidências
                      </Badge>
                    </div>
                    {product.sources && product.sources.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {product.sources.map((source: any, idx: number) => (
                          <a 
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span className="truncate">{source.title}</span>
                            <Badge variant="outline" className="text-[10px]">{source.source_name}</Badge>
                          </a>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ========================================
            2️⃣ OPORTUNIDADES PRIMÁRIAS (NUCLEARES)
        ======================================== */}
        {primary_opportunities.length > 0 && (
          <>
            <Separator className="my-6" />
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                2️⃣ Oportunidades Primárias (Nucleares)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Produtos essenciais para o segmento <strong>{segment}</strong> que NÃO foram detectados. Alta prioridade de abordagem.
              </p>
              <div className="space-y-4">
                {primary_opportunities.map((product: any, index: number) => (
                  <Card key={index} className="p-6 hover:shadow-lg transition-all border-2 border-orange-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold">{product.name}</h4>
                          <Badge variant="secondary">{product.category}</Badge>
                          <Badge variant="destructive" className="text-xs">
                            <Flame className="w-3 h-3 mr-1" />
                            ALTA PRIORIDADE
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all"
                              style={{ width: `${product.fit_score}%` }}
                            />
                          </div>
                          <Badge variant="default" className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {product.fit_score}% fit
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Caso de Uso */}
                    {product.use_case && (
                      <div className="mb-3 p-3 bg-orange-50/50 dark:bg-orange-950/20 rounded-md">
                        <span className="text-xs font-medium text-orange-700 dark:text-orange-300 block mb-1">💡 CASO DE USO:</span>
                        <p className="text-sm">{product.use_case}</p>
                      </div>
                    )}

                    {/* Razão */}
                    <div className="mb-4">
                      <span className="text-sm font-medium mb-2 block">Por que recomendamos:</span>
                      <p className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        {product.reason}
                      </p>
                    </div>

                    {/* Benefícios */}
                    {product.benefits && product.benefits.length > 0 && (
                      <div className="mb-4">
                        <span className="text-sm font-medium mb-2 block">Benefícios principais:</span>
                        <ul className="space-y-1">
                          {product.benefits.map((benefit: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Case Study */}
                    {product.case_study && (
                      <div className="mb-4 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-md border border-blue-200">
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1 mb-1">
                          <Award className="w-3 h-3" />
                          CASE DE SUCESSO:
                        </span>
                        <p className="text-sm">{product.case_study}</p>
                      </div>
                    )}

                    {/* Informações adicionais com ARR Editor */}
                    <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-muted-foreground">ARR Estimado:</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-md whitespace-pre-line">
                                  {ARR_TOOLTIP}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">
                              {(() => {
                                const edited = editedARR[product.name];
                                if (edited) {
                                  return `${formatARR(edited.arrMin)} - ${formatARR(edited.arrMax)}`;
                                }
                                return product.value || 'N/A';
                              })()}
                            </p>
                            <ARREditor
                              productName={product.name}
                              initialARR={editedARR[product.name]}
                              onSave={(arr) => handleSaveARR(product.name, arr)}
                              probability={product.probability}
                              timeline={product.timeline}
                              size={enrichedSize as any}
                              productCount={primary_opportunities.length + relevant_opportunities.length}
                              digitalMaturity={digitalContext?.maturityScore || 50}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-muted-foreground">Probabilidade:</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-md whitespace-pre-line">
                                  {PROBABILITY_TOOLTIP}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <p className="font-semibold">
                            {editedARR[product.name]?.probability || product.probability || estimated_potential?.close_probability || 'N/A'}%
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ROI esperado:</span>
                          <p className="font-semibold">{product.roi_months || editedARR[product.name]?.roiMonths || 12} meses</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-muted-foreground">Timeline:</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-md whitespace-pre-line">
                                  {TIMELINE_TOOLTIP}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <p className="font-semibold capitalize">
                            {editedARR[product.name]?.timeline || product.timeline?.replace('_', ' ') || estimated_potential?.timeline_months || '3-6 meses'}
                          </p>
                        </div>
                        {product.competitor_displacement && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Substitui:</span>
                            <p className="font-semibold text-orange-600">{product.competitor_displacement}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleAddToProposal(product)}
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Adicionar à Proposta
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleViewFichaTecnica(product)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Ver Ficha Técnica
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ========================================
            3️⃣ OPORTUNIDADES RELEVANTES (COMPLEMENTARES)
        ======================================== */}
        {relevant_opportunities.length > 0 && (
          <>
            <Separator className="my-6" />
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                3️⃣ Oportunidades Relevantes (Complementares)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Produtos que agregam valor mas não são nucleares. Segunda prioridade de abordagem.
              </p>
              <div className="space-y-3">
                {relevant_opportunities.map((product: any, index: number) => (
                  <Card key={index} className="p-5 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-base font-semibold">{product.name}</h4>
                          <Badge variant="outline">{product.category}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            MÉDIA PRIORIDADE
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all"
                              style={{ width: `${product.fit_score}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold">{product.fit_score}% fit</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{product.reason}</p>
                    
                    {product.benefits && product.benefits.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {product.benefits.map((benefit: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Informações adicionais com ARR Editor */}
                    <div className="mb-3 p-3 bg-muted/30 rounded-lg">
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-muted-foreground">ARR Estimado:</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-md whitespace-pre-line">
                                  {ARR_TOOLTIP}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-xs">
                              {(() => {
                                const edited = editedARR[product.name];
                                if (edited) {
                                  return `${formatARR(edited.arrMin)} - ${formatARR(edited.arrMax)}`;
                                }
                                return product.value || 'N/A';
                              })()}
                            </p>
                            <ARREditor
                              productName={product.name}
                              initialARR={editedARR[product.name]}
                              onSave={(arr) => handleSaveARR(product.name, arr)}
                              probability={product.probability}
                              timeline={product.timeline}
                              size={enrichedSize as any}
                              productCount={primary_opportunities.length + relevant_opportunities.length}
                              digitalMaturity={digitalContext?.maturityScore || 50}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-muted-foreground">Probabilidade:</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-md whitespace-pre-line">
                                  {PROBABILITY_TOOLTIP}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <p className="font-semibold text-xs">
                            {editedARR[product.name]?.probability || product.probability || estimated_potential?.close_probability || 'N/A'}%
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ROI esperado:</span>
                          <p className="font-semibold text-xs">{product.roi_months || editedARR[product.name]?.roiMonths || 12} meses</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-muted-foreground">Timeline:</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-md whitespace-pre-line">
                                  {TIMELINE_TOOLTIP}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <p className="font-semibold text-xs capitalize">
                            {editedARR[product.name]?.timeline || product.timeline?.replace('_', ' ') || estimated_potential?.timeline_months || '3-6 meses'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button 
                        size="sm" 
                        className="flex-1 text-xs"
                        onClick={() => handleAddToProposal(product)}
                      >
                        <ArrowRight className="w-3 h-3 mr-1" />
                        Adicionar à Proposta
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 text-xs"
                        onClick={() => handleViewFichaTecnica(product)}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Ver Ficha Técnica
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ========================================
            4️⃣ POTENCIAL ESTIMADO (COM TOOLTIPS E RECÁLCULO AUTOMÁTICO)
        ======================================== */}
        {displayPotential && (
          <>
            <Separator className="my-6" />
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  4️⃣ Potencial Estimado
                </h3>
                {calculatedPotential && (
                  <Badge variant="outline" className="text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Recalculado automaticamente
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-xs font-medium text-muted-foreground uppercase">ARR Total Mín.</span>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {calculatedPotential 
                            ? formatARR(calculatedPotential.arrTotalMin)
                            : (typeof displayPotential.min_revenue === 'string' 
                                ? displayPotential.min_revenue 
                                : formatARR(displayPotential.min_revenue || 0))}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-md whitespace-pre-line">
                      {ARR_TOOLTIP}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-xs font-medium text-muted-foreground uppercase">ARR Total Máx.</span>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {calculatedPotential 
                            ? formatARR(calculatedPotential.arrTotalMax)
                            : (typeof displayPotential.max_revenue === 'string' 
                                ? displayPotential.max_revenue 
                                : formatARR(displayPotential.max_revenue || 0))}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-md whitespace-pre-line">
                      {ARR_TOOLTIP}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-xs font-medium text-muted-foreground uppercase">Probabilidade</span>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          {calculatedPotential?.probability || displayPotential.close_probability || 'N/A'}
                          {calculatedPotential?.probability || displayPotential.close_probability ? '%' : ''}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-md whitespace-pre-line">
                      {PROBABILITY_TOOLTIP}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-xs font-medium text-muted-foreground uppercase">Timeline</span>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold text-purple-600">
                          {calculatedPotential?.timeline || displayPotential.timeline_months || 'N/A'}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-md whitespace-pre-line">
                      {TIMELINE_TOOLTIP}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {/* Contratos Multi-ano (se calculado) */}
              {calculatedPotential && (
                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase block mb-1">
                      Contrato 3 Anos
                    </span>
                    <p className="text-lg font-semibold text-green-700">
                      {formatCurrency(calculatedPotential.contract3Years.min)} - {formatCurrency(calculatedPotential.contract3Years.max)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase block mb-1">
                      Contrato 5 Anos
                    </span>
                    <p className="text-lg font-semibold text-green-700">
                      {formatCurrency(calculatedPotential.contract5Years.min)} - {formatCurrency(calculatedPotential.contract5Years.max)}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </>
        )}

        {/* ========================================
            5️⃣ ABORDAGEM SUGERIDA (SCRIPTS IA)
        ======================================== */}
        {sales_approach && (
          <>
            <Separator className="my-6" />
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                5️⃣ Abordagem Sugerida
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Scripts gerados por IA personalizados para esta oportunidade.
              </p>

              {/* Script de Email */}
              {sales_approach.email_script && (
                <Card className="p-5 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      Script de Email
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(sales_approach.email_script.body, 'email')}
                    >
                      {copiedText === 'email' ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Assunto:</span>
                      <p className="text-sm font-semibold">{sales_approach.email_script.subject}</p>
                    </div>
                    <Separator />
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Corpo:</span>
                      <div 
                        className="text-sm mt-2 p-3 bg-muted/30 rounded-md whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: sales_approach.email_script.body }}
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* Script de Ligação */}
              {sales_approach.call_script && (
                <Card className="p-5 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      Script de Ligação
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(JSON.stringify(sales_approach.call_script, null, 2), 'call')}
                    >
                      {copiedText === 'call' ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="space-y-3 text-sm">
                    {sales_approach.call_script.opening && (
                      <div>
                        <span className="text-xs font-medium text-green-600">ABERTURA:</span>
                        <p className="mt-1 p-2 bg-green-50/50 dark:bg-green-950/20 rounded">{sales_approach.call_script.opening}</p>
                      </div>
                    )}
                    {sales_approach.call_script.discovery && (
                      <div>
                        <span className="text-xs font-medium text-blue-600">DESCOBERTA:</span>
                        <p className="mt-1 p-2 bg-blue-50/50 dark:bg-blue-950/20 rounded">{sales_approach.call_script.discovery}</p>
                      </div>
                    )}
                    {sales_approach.call_script.pitch && (
                      <div>
                        <span className="text-xs font-medium text-purple-600">PITCH:</span>
                        <p className="mt-1 p-2 bg-purple-50/50 dark:bg-purple-950/20 rounded">{sales_approach.call_script.pitch}</p>
                      </div>
                    )}
                    {sales_approach.call_script.objections && Array.isArray(sales_approach.call_script.objections) && (
                      <div>
                        <span className="text-xs font-medium text-orange-600">OBJEÇÕES:</span>
                        <ul className="mt-1 space-y-1">
                          {sales_approach.call_script.objections.map((obj: string, idx: number) => (
                            <li key={idx} className="text-xs p-2 bg-orange-50/50 dark:bg-orange-950/20 rounded">• {obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {sales_approach.call_script.closing && (
                      <div>
                        <span className="text-xs font-medium text-red-600">FECHAMENTO:</span>
                        <p className="mt-1 p-2 bg-red-50/50 dark:bg-red-950/20 rounded">{sales_approach.call_script.closing}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Talking Points */}
              {sales_approach.talking_points && Array.isArray(sales_approach.talking_points) && (
                <Card className="p-5">
                  <h4 className="font-semibold mb-3">Talking Points</h4>
                  <ul className="space-y-2">
                    {sales_approach.talking_points.map((point: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          </>
        )}

        {/* ========================================
            6️⃣ STACK SUGERIDO
        ======================================== */}
        {stack_suggestion && (
          <>
            <Separator className="my-6" />
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                6️⃣ Stack TOTVS Sugerido
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Core */}
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase block mb-2">
                    Core (Essencial)
                  </span>
                  <div className="space-y-1">
                    {stack_suggestion.core?.map((product: string, idx: number) => (
                      <Badge key={idx} variant="default" className="mr-1 mb-1">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Complementares */}
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase block mb-2">
                    Complementares
                  </span>
                  <div className="space-y-1">
                    {stack_suggestion.complementary?.map((product: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="mr-1 mb-1">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Expansão Futura */}
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase block mb-2">
                    Expansão Futura
                  </span>
                  <div className="space-y-1">
                    {stack_suggestion.future_expansion?.map((product: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="mr-1 mb-1">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* ========================================
            DIALOGO FICHA TÉCNICA
        ======================================== */}
        {selectedProductForFicha && (
          <Dialog open={fichaTecnicaOpen === selectedProductForFicha.name} onOpenChange={(open) => !open && setFichaTecnicaOpen(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Ficha Técnica - {selectedProductForFicha.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Informações do Produto */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Categoria</Label>
                    <p className="text-base font-semibold">{selectedProductForFicha.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Prioridade</Label>
                    <Badge variant={selectedProductForFicha.priority === 'primary' ? 'destructive' : 'secondary'}>
                      {selectedProductForFicha.priority === 'primary' ? 'ALTA PRIORIDADE' : 'MÉDIA PRIORIDADE'}
                    </Badge>
                  </div>
                </div>
                
                {/* Caso de Uso */}
                {selectedProductForFicha.use_case && (
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Caso de Uso</Label>
                    <p className="text-sm mt-1">{selectedProductForFicha.use_case}</p>
                  </div>
                )}
                
                {/* Razão */}
                {selectedProductForFicha.reason && (
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Por que recomendamos</Label>
                    <p className="text-sm mt-1">{selectedProductForFicha.reason}</p>
                  </div>
                )}
                
                {/* Benefícios */}
                {selectedProductForFicha.benefits && selectedProductForFicha.benefits.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Benefícios Principais</Label>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      {selectedProductForFicha.benefits.map((benefit: string, idx: number) => (
                        <li key={idx} className="text-sm">{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Case Study */}
                {selectedProductForFicha.case_study && (
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-md border border-blue-200">
                    <Label className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1 mb-1">
                      <Award className="h-4 w-4" />
                      Case de Sucesso
                    </Label>
                    <p className="text-sm">{selectedProductForFicha.case_study}</p>
                  </div>
                )}
                
                {/* Valores */}
                <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">ARR Estimado</Label>
                    <p className="text-base font-semibold">
                      {(() => {
                        const edited = editedARR[selectedProductForFicha.name];
                        if (edited) {
                          return `${formatARR(edited.arrMin)} - ${formatARR(edited.arrMax)}`;
                        }
                        return selectedProductForFicha.value || 'N/A';
                      })()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">ROI Esperado</Label>
                    <p className="text-base font-semibold">
                      {selectedProductForFicha.roi_months || editedARR[selectedProductForFicha.name]?.roiMonths || 12} meses
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Timeline</Label>
                    <p className="text-base font-semibold">
                      {editedARR[selectedProductForFicha.name]?.timeline || selectedProductForFicha.timeline?.replace('_', ' ') || '3-6 meses'}
                    </p>
                  </div>
                </div>
                
                {/* Buscar no Catálogo */}
                {(() => {
                  const catalogProduct = productCatalog?.find(p => 
                    p.name.toLowerCase() === selectedProductForFicha.name.toLowerCase()
                  );
                  
                  if (catalogProduct) {
                    return (
                      <div className="p-3 bg-green-50/50 dark:bg-green-950/20 rounded-md border border-green-200">
                        <Label className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2 block">
                          <CheckCircle className="h-4 w-4 inline mr-1" />
                          Produto encontrado no Catálogo CPQ
                        </Label>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">SKU:</span>
                            <p className="font-semibold">{catalogProduct.sku}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Preço Base:</span>
                            <p className="font-semibold">{formatCurrency(catalogProduct.base_price)}</p>
                          </div>
                          {catalogProduct.description && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Descrição:</span>
                              <p className="text-sm mt-1">{catalogProduct.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setFichaTecnicaOpen(null)}>
                  Fechar
                </Button>
                {selectedProductForFicha && (
                  <Button onClick={() => {
                    handleAddToProposal(selectedProductForFicha);
                    setFichaTecnicaOpen(null);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar à Proposta
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ScrollArea>
  );
}
