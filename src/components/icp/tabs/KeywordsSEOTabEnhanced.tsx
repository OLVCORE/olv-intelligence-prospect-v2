import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, TrendingUp, ExternalLink, Globe, Target, BarChart3, Loader2, Sparkles, RefreshCw, Save, AlertTriangle, Zap, ChevronDown, Edit, Linkedin, Mail, Phone } from 'lucide-react';
// FloatingNavigation removido - componente deletado
import { useReportAutosave } from './useReportAutosave';
import { TabStatusBadge } from './TabIndicator';
import { registerTab, unregisterTab } from './tabsRegistry';
import { deterministicDiscovery, buildDiscoveryCacheKey, type DiscoveryInputs, type DiscoveryResult } from './discovery/deterministicDiscovery';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { DISABLE_AUTO_DISCOVERY, SAFE_MODE } from '@/lib/flags';
import { useBackendJob } from '@/hooks/useBackendJob';
import { performFullSEOAnalysis } from '@/services/seoAnalysis';
import type { KeywordData, SimilarCompanyBySEO } from '@/services/seoAnalysis';
import { analyzeSimilarCompanies, generateBattleCard } from '@/services/competitiveIntelligence';
import type { CompanyIntelligence } from '@/services/competitiveIntelligence';
import { discoverFullDigitalPresence, type DigitalPresence } from '@/services/websiteDiscovery';
import { generateCompanyIntelligenceReport, type CompanyIntelligenceReport } from '@/services/socialMediaAnalyzer';
import { searchOfficialWebsite, type WebsiteSearchResult } from '@/services/officialWebsiteSearch';

interface KeywordsSEOTabProps {
  companyName?: string;
  domain?: string;
  savedData?: any;
  cnpj?: string;
  stcHistoryId?: string; // ID do registro em stc_verification_history para autosave
  onDataChange?: (data: any) => void;
  onLoading?: (loading: boolean) => void;
  onError?: (error: string) => void;
}

export function KeywordsSEOTabEnhanced({ 
  companyName, 
  domain, 
  savedData,
  cnpj,
  stcHistoryId,
  onDataChange,
  onLoading,
  onError
}: KeywordsSEOTabProps) {
  const { toast } = useToast();
  
  // 🔥 BACKEND JOB: Sistema enterprise de processamento
  const { triggerJob, status: jobStatus, progress, result: jobResult, isProcessing } = useBackendJob(stcHistoryId || null);
  
  // 🔥 CRÍTICO: SEMPRE CARREGAR savedData ao retornar (evita perda de dados)
  const [seoData, setSeoData] = useState<any>(savedData?.seoData || null);
  const [competitiveAnalysis, setCompetitiveAnalysis] = useState<any>(savedData?.competitiveAnalysis || null);
  const [digitalPresence, setDigitalPresence] = useState<DigitalPresence | null>(savedData?.digitalPresence || null);
  const [discoveredDomain, setDiscoveredDomain] = useState<string | null>(savedData?.discoveredDomain || null);
  const [intelligenceReport, setIntelligenceReport] = useState<CompanyIntelligenceReport | null>(savedData?.intelligenceReport || null);
  const [websiteOptions, setWebsiteOptions] = useState<WebsiteSearchResult[]>(savedData?.websiteOptions || []);
  const [isEditingWebsite, setIsEditingWebsite] = useState(false);
  const [editedWebsite, setEditedWebsite] = useState('');
  const [similarCompaniesOptions, setSimilarCompaniesOptions] = useState<any[]>([]);
  const [allWebsiteResults, setAllWebsiteResults] = useState<WebsiteSearchResult[]>([]);

  // 🔥 AUTOSAVE: Hook para persistência automática da aba
  const cacheKey = `${cnpj || ''}|${domain || ''}|${discoveredDomain || ''}|${companyName || ''}`;
  const { 
    tabData, 
    status: autosaveStatus, 
    scheduleSave, 
    flushSave, 
    shouldSkipExpensiveProcessing,
    isLoading: isLoadingAutosave
  } = stcHistoryId 
    ? useReportAutosave({ 
        stcHistoryId, 
        tabKey: 'keywords', 
        cacheKey,
        initialData: savedData 
      })
    : {
        tabData: savedData,
        status: 'draft' as const,
        scheduleSave: async () => {},
        flushSave: async () => {},
        shouldSkipExpensiveProcessing: false,
        isLoading: false
      };

  // 🔥 Reidratar dados salvos ao montar componente
  useEffect(() => {
    if (tabData && Object.keys(tabData).length > 0) {
      console.log('[KEYWORDS] 📦 Reidratando dados salvos...', tabData);
      if (tabData.seoData) setSeoData(tabData.seoData);
      if (tabData.digitalPresence) setDigitalPresence(tabData.digitalPresence);
      if (tabData.intelligenceReport) setIntelligenceReport(tabData.intelligenceReport);
      if (tabData.discoveredDomain) setDiscoveredDomain(tabData.discoveredDomain);
      if (tabData.allWebsiteResults) setAllWebsiteResults(tabData.allWebsiteResults);
      if (tabData.similarCompaniesOptions) setSimilarCompaniesOptions(tabData.similarCompaniesOptions);
      console.log('[KEYWORDS] ✅ Reidratação concluída!');
    }
  }, [tabData]);

  // 🔗 REGISTRY: Registrar aba no registry global para salvar em lote
  useEffect(() => {
    console.info('[REGISTRY] ✅ Registering: keywords', { hasStcHistoryId: !!stcHistoryId });

    registerTab('keywords', {
      flushSave: async () => {
        // Coleta todos os dados atuais
        const currentData = {
          seoData,
          digitalPresence,
          intelligenceReport,
          discoveredDomain,
          allWebsiteResults,
          similarCompaniesOptions,
          competitiveAnalysis,
          websiteOptions,
        };
        
        console.log('[KEYWORDS] 📤 Registry: flushSave() chamado');
        
        // 🔧 SPEC #BOTÕES-UNIF: Salvar mesmo sem stcHistoryId
        if (stcHistoryId) {
          // Com ID de histórico: salvar no Supabase via autosave
          const currentStatus = autosaveStatus === 'completed' ? 'completed' : 'draft';
          console.log('[KEYWORDS] 💾 Salvando via autosave com status:', currentStatus);
          await flushSave(currentData, currentStatus);
        } else {
          // Sem ID de histórico: notificar via onDataChange (parent salva)
          console.log('[KEYWORDS] 💾 Salvando via onDataChange (sem stcHistoryId)');
          onDataChange?.(currentData);
        }
      },
      getStatus: () => autosaveStatus,
    });

    // ✅ NÃO DESREGISTRAR! Abas devem permanecer no registry mesmo quando não visíveis
    // Cleanup removido para manter estado persistente entre trocas de aba
  }, [
    stcHistoryId,
    seoData,
    digitalPresence,
    intelligenceReport,
    discoveredDomain,
    allWebsiteResults,
    similarCompaniesOptions,
    competitiveAnalysis,
    websiteOptions,
    autosaveStatus,
    flushSave,
    onDataChange,
  ]);

  // 🔥 Análise SEO completa
  const seoMutation = useMutation({
    mutationFn: async () => {
      console.info('[KEYWORDS] ▶️ Disparando análise SEO...');
      
      const activeDomain = discoveredDomain || domain;
      if (!activeDomain) throw new Error('Domain não disponível');
      
      const cleanDomain = activeDomain.replace(/^https?:\/\//, '').replace(/^www\./, '');
      return await performFullSEOAnalysis(cleanDomain, companyName || '');
    },
    onMutate: () => {
      onLoading?.(true); // 🟡 Notifica parent: loading
      
      // 🔥 AUTOSAVE: Marca como 'processing'
      if (stcHistoryId) {
        flushSave({
          seoData,
          digitalPresence,
          discoveredDomain,
          intelligenceReport,
          allWebsiteResults,
          similarCompaniesOptions
        }, 'processing');
      }
      
      toast({
        title: '🔍 Analisando SEO...',
        description: 'Extraindo keywords e buscando empresas similares',
      });
    },
    onSuccess: async (data) => {
      setSeoData(data);
      
      // 🔥 ANÁLISE COMPETITIVA DUPLA
      if (data.similarCompanies.length > 0) {
        const analysis = analyzeSimilarCompanies(data.similarCompanies);
        setCompetitiveAnalysis(analysis);
        
        const savedPayload = { 
          seoData: data, 
          competitiveAnalysis: analysis,
          digitalPresence,
          discoveredDomain,
          intelligenceReport,
          websiteOptions,
          allWebsiteResults,
          similarCompaniesOptions
        };
        
        // 🚨 CRÍTICO: Salva TODOS os estados para evitar perda ao trocar abas
        onDataChange?.(savedPayload);
        
        // 🔥 AUTOSAVE: Flush save imediato após sucesso
        if (stcHistoryId) {
          await flushSave(savedPayload, 'completed');
        }
        
        console.info('[KEYWORDS] ✅ Análise SEO concluída e salva');
        
        onLoading?.(false);
        
        toast({
          title: '✅ Análise SEO + Inteligência Competitiva concluída!',
          description: `${data.profile.keywords.length} keywords | ${analysis.summary.vendaTotvsCount} oportunidades venda | ${analysis.summary.parceriaCount} oportunidades parceria`,
        });
      } else {
        const savedPayload = { 
          seoData: data, 
          competitiveAnalysis: null,
          digitalPresence,
          discoveredDomain,
          intelligenceReport,
          websiteOptions,
          allWebsiteResults,
          similarCompaniesOptions
        };
        
        // 🚨 CRÍTICO: Salva TODOS os estados para evitar perda ao trocar abas
        onDataChange?.(savedPayload);
        
        // 🔥 AUTOSAVE: Flush save imediato após sucesso
        if (stcHistoryId) {
          await flushSave(savedPayload, 'completed');
        }
        
        onLoading?.(false);
        
        toast({
          title: '✅ Análise SEO concluída!',
          description: `${data.profile.keywords.length} keywords | ${data.similarCompanies.length} empresas similares`,
        });
      }
    },
    onError: (error) => {
      onError?.((error as Error).message); // 🔴 Notifica parent: erro
      onLoading?.(false);
      
      // 🔥 AUTOSAVE: Marca como 'error'
      if (stcHistoryId) {
        flushSave({
          seoData,
          digitalPresence,
          discoveredDomain,
          intelligenceReport,
          allWebsiteResults,
          similarCompaniesOptions
        }, 'error');
      }
      
      toast({
        title: '❌ Erro na análise SEO',
        description: (error as Error).message,
        variant: 'destructive'
      });
    }
  });

  // 🔥 ANTI-REPROCESSO: Wrapper para seoMutation com verificação de cache
  const handleSEOAnalysis = () => {
    if (shouldSkipExpensiveProcessing && seoData) {
      toast({
        title: '💾 Análise já realizada',
        description: 'Os dados já foram analisados recentemente. Use "Reprocessar" se desejar atualizar.',
        duration: 5000
      });
      return;
    }
    seoMutation.mutate();
  };

  // 🔥 ANTI-REPROCESSO: Wrapper para smartDiscoveryMutation
  const handleSmartDiscovery = () => {
    // 🛡️ HF-STACK-1.A: Discovery manual-only (respeita SAFE MODE + flags)
    if (DISABLE_AUTO_DISCOVERY || SAFE_MODE) {
      console.info('[SAFE] ⏸️ Auto discovery desabilitado (SAFE MODE ou DISABLE_AUTO_DISCOVERY)');
      toast({
        title: '⏸️ Discovery Desabilitado',
        description: 'Auto-discovery está desabilitado em modo seguro. Para ativar, desative SAFE_MODE no .env.local.',
        duration: 5000
      });
      return;
    }
    
    // Construir cache_key determinística
    const discoveryCacheKey = buildDiscoveryCacheKey({
      cnpj: cnpj,
      razaoSocial: companyName,
      country: 'BR',
      state: '',
    });

    // Verificar se já foi processado com mesma cache_key
    if (shouldSkipExpensiveProcessing && discoveredDomain && autosaveStatus === 'completed') {
      toast({
        title: '💾 Descoberta já realizada',
        description: 'O website já foi descoberto para esta empresa. Use "Reprocessar" se desejar atualizar.',
        duration: 5000
      });
      return;
    }

    smartDiscoveryMutation.mutate();
  };

  // 🏢 BUSCA EMPRESAS SIMILARES - TOP 10 (CNAE + NCM + Keywords)
  const similarCompaniesMutation = useMutation({
    mutationFn: async () => {
      if (!companyName) throw new Error('Nome da empresa necessário');
      
      const serperKey = import.meta.env.VITE_SERPER_API_KEY;
      if (!serperKey) throw new Error('SERPER_API_KEY não configurada');
      
      // 🔥 PRIORIDADE: 1º CNAE, 2º NCM, 3º Keywords
      const cnaeCode = cnpj ? await fetchCNAE(cnpj) : null; // TODO: buscar CNAE do CNPJ
      
      // Query inteligente: CNAE (setor) + nome empresa + Brasil + .com.br (corporativo)
      const sector = companyName.split(' ').slice(0, 2).join(' '); // Primeiras 2 palavras
      const query = cnaeCode 
        ? `empresas setor CNAE ${cnaeCode} brasil site:.com.br -vagas -emprego -wikipedia -youtube`
        : `empresas setor "${sector}" brasil site:.com.br -vagas -emprego -wikipedia -youtube`;
      
      console.log('[SIMILAR] 🔍 Query:', query);
      
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num: 10, gl: 'br', hl: 'pt-br' }),
      });
      
      if (!response.ok) throw new Error('Erro ao buscar empresas similares');
      
      const data = await response.json();
      
      // Filtrar APENAS empresas corporativas (não blogs, notícias, etc)
      const results = (data.organic || [])
        .filter((r: any) => {
          const url = r.link.toLowerCase();
          const title = r.title.toLowerCase();
          
          // ❌ REJEITAR backlinks e sites irrelevantes
          const isBacklink = 
            url.includes('vagas') || url.includes('emprego') ||
            url.includes('wikipedia') || url.includes('youtube') ||
            url.includes('linkedin.com/posts') || url.includes('facebook.com/') ||
            url.includes('instagram.com/p/') || url.includes('twitter.com/') ||
            url.includes('glassdoor') || url.includes('indeed') ||
            url.includes('catho') || url.includes('infojobs') ||
            url.includes('blog.') || url.includes('/blog/') ||
            url.includes('noticias') || url.includes('revista') ||
            title.includes('vaga') || title.includes('contrata');
          
          return !isBacklink;
        })
        .slice(0, 10)
        .map((r: any) => ({
          title: r.title,
          url: r.link,
          snippet: r.snippet,
          domain: new URL(r.link).hostname.replace('www.', ''),
        }));
      
      console.log('[SIMILAR] ✅ Filtrado:', results.length, 'empresas corporativas');
      
      return results;
    },
    onMutate: () => {
      onLoading?.(true);
      toast({
        title: '🔍 Buscando Empresas Similares...',
        description: 'Pesquisando no Google empresas do mesmo segmento',
      });
    },
    onSuccess: (results) => {
      setSimilarCompaniesOptions(results);
      onLoading?.(false);
      toast({
        title: '✅ TOP 10 empresas similares encontradas!',
        description: `${results.length} opções. Escolha para adicionar à quarentena.`,
      });
    },
    onError: (error) => {
      onError?.((error as Error).message);
      onLoading?.(false);
      toast({
        title: '❌ Erro ao buscar empresas similares',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  // 🔥 DISCOVERY DETERMINÍSTICO - Razão Social + CNPJ + Redes Sociais
  const smartDiscoveryMutation = useMutation({
    mutationFn: async () => {
      if (!companyName) throw new Error('Nome necessário');
      if (!cnpj) throw new Error('CNPJ necessário');
      
      console.info('[KEYWORDS] ▶️ Disparando discovery determinístico...');
      
      // 🎯 DISCOVERY DETERMINÍSTICO (SPEC #004)
      const discoveryInputs: DiscoveryInputs = {
        cnpj: cnpj,
        razaoSocial: companyName,
        country: 'BR',
        state: '', // TODO: passar UF se disponível
      };
      
      console.log('[KEYWORDS] 🎯 Executando discovery determinístico...', discoveryInputs);
      
      const discoveryResult = await deterministicDiscovery(discoveryInputs);
      
      // 🚀 PARALELO: Discovery 8 Ferramentas (mantém para complementar)
      const digitalPresencePromise = discoverFullDigitalPresence(companyName, cnpj);
      const [presenca] = await Promise.all([digitalPresencePromise]);
      
      return { discoveryResult, presenca };
    },
    onMutate: () => {
      setSimilarCompaniesOptions([]);
      setAllWebsiteResults([]);
      onLoading?.(true);
      
      // 🔥 AUTOSAVE: Marcar como processing
      if (stcHistoryId) {
        flushSave({
          seoData,
          digitalPresence,
          discoveredDomain,
          intelligenceReport,
          allWebsiteResults,
          similarCompaniesOptions,
        }, 'processing');
      }
      
      toast({
        title: '🔍 Descoberta Determinística em andamento...',
        description: 'Razão Social + CNPJ + Redes Sociais...',
      });
    },
    onSuccess: async ({ discoveryResult, presenca }) => {
      console.log('[DISCOVERY] ✅ Resultado:', {
        domain: discoveryResult.discoveredDomain,
        confidence: discoveryResult.confidence,
        socials: Object.keys(discoveryResult.socialProfiles).length,
      });
      
      // Checar se encontrou ALGO útil (domínio OU redes sociais OU presença digital)
      const hasSocialProfiles = Object.values(discoveryResult.socialProfiles).some(arr => arr && arr.length > 0);
      const hasPresenca = presenca && (presenca.website || presenca.linkedin || presenca.instagram || presenca.facebook);
      const foundSomething = discoveryResult.discoveredDomain || hasSocialProfiles || hasPresenca;
      
      // 🔥 AUTO-SELECIONAR domínio descoberto
      if (foundSomething) {
        setDiscoveredDomain(discoveryResult.discoveredDomain);
        
        // Mesclar redes sociais do discovery com presença digital
        const mergedPresence = {
          ...presenca,
          website: discoveryResult.domainUrl,
          linkedin: discoveryResult.socialProfiles.linkedin?.[0] || presenca.linkedin,
          instagram: discoveryResult.socialProfiles.instagram?.[0] || presenca.instagram,
          facebook: discoveryResult.socialProfiles.facebook?.[0] || presenca.facebook,
          twitter: discoveryResult.socialProfiles.twitter?.[0] || presenca.twitter,
          youtube: discoveryResult.socialProfiles.youtube?.[0] || presenca.youtube,
        };
        
        setDigitalPresence(mergedPresence);
        
        // Converter sources para allWebsiteResults
        const websiteResults = discoveryResult.sources.map((source, idx) => ({
          url: source.url,
          title: source.title,
          snippet: '',
          confidence: idx === 0 ? discoveryResult.confidence : Math.max(0, discoveryResult.confidence - (idx * 10)),
          isBacklink: false,
        }));
        
        setAllWebsiteResults(websiteResults);
        
        const savedPayload = {
          seoData,
          digitalPresence: mergedPresence,
          discoveredDomain: discoveryResult.discoveredDomain,
          intelligenceReport,
          allWebsiteResults: websiteResults,
          similarCompaniesOptions,
          discoveryResult, // Salvar resultado bruto do discovery
        };
        
        onDataChange?.(savedPayload);
        
        // 🔥 AUTOSAVE: Flush save imediato
        if (stcHistoryId) {
          await flushSave(savedPayload, 'completed');
          console.info('[KEYWORDS] ✅ Discovery salvo no Supabase');
        } else {
          // Fallback: notificar parent
          onDataChange?.(savedPayload);
          console.info('[KEYWORDS] ✅ Discovery salvo localmente (sem stcHistoryId)');
        }
        
        console.info('[KEYWORDS] ✅ Discovery concluído e salvo');
        
        // Toast adaptativo baseado no que foi encontrado
        const socialsCount = Object.values(discoveryResult.socialProfiles).filter(arr => arr && arr.length > 0).length;
        const toastTitle = discoveryResult.discoveredDomain 
          ? '✅ Website descoberto!' 
          : '✅ Presença digital encontrada!';
        const toastDesc = discoveryResult.discoveredDomain
          ? `${discoveryResult.discoveredDomain} | ${discoveryResult.confidence}% confiança | ${socialsCount} rede(s) social(is)`
          : `${socialsCount} rede(s) social(is) encontrada(s) | ${presenca.website ? 'Website: ' + presenca.website : 'Sem website próprio'}`;
        
        toast({
          title: toastTitle,
          description: toastDesc,
          duration: 5000,
        });
      } else {
        toast({
          title: '⚠️ Nenhum website encontrado',
          description: 'Verifique os dados da empresa e tente novamente.',
          variant: 'destructive',
        });
      }
      
      onLoading?.(false);
    },
    onError: (error) => {
      onError?.((error as Error).message);
      onLoading?.(false);
      
      // 🔥 AUTOSAVE: Marcar como error
      if (stcHistoryId) {
        flushSave({
          seoData,
          digitalPresence,
          discoveredDomain,
          intelligenceReport,
          allWebsiteResults,
          similarCompaniesOptions,
        }, 'error');
      }
      
      toast({
        title: '❌ Erro na descoberta determinística',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  // 🔍 BUSCA OFICIAL - TOP 10 RESULTADOS (LEGACY - mantido para compatibilidade)
  const officialSearchMutation = useMutation({
    mutationFn: async () => {
      if (!companyName) throw new Error('Nome necessário');
      return await searchOfficialWebsite(companyName);
    },
    onMutate: () => {
      setSimilarCompaniesOptions([]);
      onLoading?.(true);
      toast({
        title: '🔍 Buscando TOP 10 websites...',
        description: 'Query: "website oficial [empresa]"',
      });
    },
    onSuccess: (results) => {
      console.log('[KEYWORDS] ✅ Recebeu', results.length, 'opções');
      setWebsiteOptions(results);
      onLoading?.(false);
      toast({
        title: '✅ TOP 10 encontrados!',
        description: `${results.length} opções. Escolha o correto.`,
      });
    },
    onError: (error) => {
      onError?.((error as Error).message);
      onLoading?.(false);
      toast({
        title: '❌ Erro',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  // 🔥 WEBSITE DISCOVERY AUTOMÁTICO - 8 FERRAMENTAS
  const discoveryMutation = useMutation({
    mutationFn: async () => {
      if (!companyName) throw new Error('Nome da empresa necessário');
      return await discoverFullDigitalPresence(companyName, cnpj);
    },
    onMutate: () => {
      // 🧹 LIMPAR tabela de empresas similares
      setSimilarCompaniesOptions([]);
      onLoading?.(true);
      toast({
        title: '🔍 Descobrindo Presença Digital...',
        description: 'Buscando website, redes sociais, emails e contatos',
      });
    },
    onSuccess: (data) => {
      setDigitalPresence(data);
      const newDiscoveredDomain = data.website ? new URL(data.website).hostname.replace('www.', '') : null;
      if (newDiscoveredDomain) {
        setDiscoveredDomain(newDiscoveredDomain);
      }
      onLoading?.(false);
      
      const found = [];
      if (data.website) found.push('Website');
      if (data.linkedin) found.push('LinkedIn');
      if (data.instagram) found.push('Instagram');
      if (data.twitter) found.push('Twitter');
      if (data.facebook) found.push('Facebook');
      if (data.emails.length > 0) found.push(`${data.emails.length} emails`);
      
      toast({
        title: '✅ Presença Digital Descoberta!',
        description: `Encontrado: ${found.join(', ')} | Confiança: ${data.confidence}%`,
      });

      // 🚨 CRÍTICO: Salva TODOS os estados para evitar perda ao trocar abas
      onDataChange?.({ 
        digitalPresence: data,
        discoveredDomain: newDiscoveredDomain,
        seoData,
        competitiveAnalysis,
        intelligenceReport,
        websiteOptions
      });
    },
    onError: (error) => {
      onError?.((error as Error).message);
      onLoading?.(false);
      toast({
        title: '❌ Erro na descoberta',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  // 🧠 ANÁLISE INTELIGENTE COMPLETA - IA lê TUDO!
  const intelligenceMutation = useMutation({
    mutationFn: async () => {
      if (!companyName) throw new Error('Nome da empresa necessário');
      
      // 🔥 ACEITA QUALQUER WEBSITE DISPONÍVEL (digitalPresence, discoveredDomain ou domain)
      const activeWebsite = digitalPresence?.website || 
                            (discoveredDomain ? `https://${discoveredDomain}` : null) ||
                            (domain ? `https://${domain}` : null);
      
      if (!activeWebsite) {
        throw new Error('Website não encontrado. Execute "Buscar Website Oficial" ou "Descoberta Automática" primeiro.');
      }
      
      console.log('[INTELLIGENCE] 🧠 Executando análise IA com website:', activeWebsite);
      
      return await generateCompanyIntelligenceReport(
        companyName,
        activeWebsite,
        digitalPresence?.linkedin,
        digitalPresence?.instagram,
        digitalPresence?.facebook
      );
    },
    onMutate: () => {
      onLoading?.(true);
      toast({
        title: '🧠 IA Analisando Presença Digital...',
        description: 'Lendo conteúdo das redes sociais + verificando compliance Google',
      });
    },
    onSuccess: (data) => {
      setIntelligenceReport(data);
      onLoading?.(false);
      
      toast({
        title: '✅ Análise Inteligente Concluída!',
        description: `Digital Health: ${data.digitalHealthScore}/100 | Google Compliance: ${data.googleCompliance.score}%`,
      });

      // 🚨 CRÍTICO: Salva TODOS os estados para evitar perda ao trocar abas
      onDataChange?.({ 
        digitalPresence, 
        discoveredDomain,
        seoData, 
        competitiveAnalysis,
        intelligenceReport: data,
        websiteOptions
      });
    },
    onError: (error) => {
      onError?.((error as Error).message);
      onLoading?.(false);
      toast({
        title: '❌ Erro na análise inteligente',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  if (!companyName) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Informações da empresa necessárias para análise de SEO
        </p>
      </Card>
    );
  }

  // 🔍 Helper: Buscar CNAE do CNPJ
  const fetchCNAE = async (cnpj: string): Promise<string | null> => {
    try {
      const cleanCNPJ = cnpj.replace(/\D/g, '');
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.cnae_fiscal || null;
    } catch (error) {
      console.warn('[CNAE] ⚠️ Erro ao buscar:', error);
      return null;
    }
  };

  // 🔄 RESET: Voltar ao estado inicial
  const handleReset = () => {
    setDigitalPresence(null);
    setSeoData(null);
    setCompetitiveAnalysis(null);
    setIntelligenceReport(null);
    setDiscoveredDomain(null);
    setWebsiteOptions([]);
    setSimilarCompaniesOptions([]);
    setIsEditingWebsite(false);
  };

  // 💾 SALVAR RELATÓRIO (REALMENTE SALVA!)
  const handleSaveReport = () => {
    const reportData = {
      seoData,
      competitiveAnalysis,
      digitalPresence,
      discoveredDomain,
      intelligenceReport,
      websiteOptions,
      similarCompaniesOptions,
      savedAt: new Date().toISOString(),
    };
    
    onDataChange?.(reportData);
    
    toast({
      title: '✅ Relatório Salvo com Sucesso!',
      description: 'Dados armazenados no histórico',
    });
  };

  const hasData = !!(digitalPresence || seoData || intelligenceReport);
  const hasUnsaved = hasData; // TODO: track real unsaved changes

  return (
    <div className="space-y-4 relative">
      {/* 🎯 NAVEGAÇÃO FLUTUANTE REUTILIZÁVEL */}
      {hasData && (
        <>
          <FloatingNavigation
            onBack={handleReset}
            onHome={handleReset}
            onSave={handleSaveReport}
            showSaveButton={true}
            saveDisabled={!seoData && !digitalPresence && !intelligenceReport}
            hasUnsavedChanges={hasUnsaved}
          />

          {/* 🎯 INDICADOR DE STATUS AUTOSAVE */}
          {stcHistoryId && (
            <div className="flex items-center justify-end mb-2">
              <TabStatusBadge status={autosaveStatus} />
            </div>
          )}
          
          {/* 📝 BOTÃO EDITAR WEBSITE - FICA NA BARRA EXTRA */}
        </>
      )}
      
      {/* Header - CORPORATE THEME */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <Search className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                Keywords & SEO Intelligence
                {savedData && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Histórico
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                Análise de palavras-chave e empresas similares via SEO
              </p>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col gap-2">
            {/* 🔥 BOTÃO DISCOVERY - CORPORATE THEME */}
            {!domain && !discoveredDomain && (
              <Button
                onClick={handleSmartDiscovery}
                disabled={smartDiscoveryMutation.isPending}
                size="lg"
                variant="default"
                className="w-full gap-2 font-semibold"
              >
                {smartDiscoveryMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Descobrindo...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Descobrir Website & Presença Digital
                  </>
                )}
              </Button>
            )}
            
            {/* 🔁 Botão Reverificar - CORPORATE THEME */}
            {(domain || discoveredDomain) && (
              <Button
                onClick={() => {
                  // Limpar domain atual e forçar nova busca
                  setDiscoveredDomain(null);
                  setDigitalPresence(null);
                  setSeoData(null);
                  setIntelligenceReport(null);
                  setAllWebsiteResults([]);
                  // Disparar discovery novamente
                  smartDiscoveryMutation.mutate();
                }}
                disabled={smartDiscoveryMutation.isPending}
                size="sm"
                variant="outline"
                className="w-full gap-2"
              >
                {smartDiscoveryMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reverificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    🔁 Reverificar (Forçar nova busca)
                  </>
                )}
              </Button>
            )}
            
            {/* 🚨 BOTÕES - SEO + INTELLIGENCE */}
            {(domain || discoveredDomain) && (
              <div className="flex flex-col gap-2">
                {!seoData && (
                  <Button
                    onClick={handleSEOAnalysis}
                    disabled={seoMutation.isPending}
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-primary/80 gap-2"
                  >
                    {seoMutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Analisando SEO...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Análise SEO Completa
                      </>
                    )}
                  </Button>
                )}
                
                {!intelligenceReport && (
                  <Button
                    onClick={() => intelligenceMutation.mutate()}
                    disabled={intelligenceMutation.isPending}
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 gap-2 font-bold"
                  >
                    {intelligenceMutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        IA Analisando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 h-5" />
                        🧠 Análise Inteligente Completa (IA)
                      </>
                    )}
                  </Button>
                )}
                
                {intelligenceReport && (
                  <Button
                    onClick={() => intelligenceMutation.mutate()}
                    variant="outline"
                    size="sm"
                    disabled={intelligenceMutation.isPending}
                    className="w-full"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${intelligenceMutation.isPending ? 'animate-spin' : ''}`} />
                    Atualizar Análise IA
                  </Button>
                )}

                {seoData && (
                  <Button
                    onClick={() => seoMutation.mutate()}
                    variant="outline"
                    size="sm"
                    disabled={seoMutation.isPending}
                    className="w-full"
                    title="Forçar reprocessamento (ignora cache)"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${seoMutation.isPending ? 'animate-spin' : ''}`} />
                    Reprocessar Análise SEO
                  </Button>
                )}
                
                {/* 🏢 BUSCAR EMPRESAS SIMILARES */}
                <Button
                  onClick={() => similarCompaniesMutation.mutate()}
                  disabled={similarCompaniesMutation.isPending}
                  size="sm"
                  variant="outline"
                  className="w-full gap-2 border-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900"
                >
                  {similarCompaniesMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4" />
                      🏢 Buscar Empresas Similares (TOP 10)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ✏️ EDITAR WEBSITE - CAMPO EDITÁVEL */}
        {isEditingWebsite && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg">
            <label className="block text-sm font-bold text-yellow-900 dark:text-yellow-100 mb-2">
              ✏️ Editar Website:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={editedWebsite}
                onChange={(e) => setEditedWebsite(e.target.value)}
                placeholder="exemplo.com.br"
                className="flex-1 px-3 py-2 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
              />
              <Button
                onClick={async () => {
                  const cleanDomain = editedWebsite.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
                  if (cleanDomain) {
                    setDiscoveredDomain(cleanDomain);
                    setIsEditingWebsite(false);
                    
                    // 🚨 LIMPAR análises anteriores
                    setSeoData(null);
                    setIntelligenceReport(null);
                    
                    // 🔥 AUTO-DESCOBRIR redes sociais com novo domínio
                    console.log('[EDIT-WEBSITE] 🔄 Re-descobrindo redes sociais com novo domínio:', cleanDomain);
                    
                    try {
                      const presenca = await discoverFullDigitalPresence(companyName || '', cnpj);
                      if (presenca) {
                        setDigitalPresence({
                          ...presenca,
                          website: `https://${cleanDomain}`,
                        });
                        console.log('[EDIT-WEBSITE] ✅ Redes sociais atualizadas:', presenca);
                      }
                    } catch (err) {
                      console.warn('[EDIT-WEBSITE] ⚠️ Erro ao re-descobrir redes:', err);
                    }
                    
                    // 🔥 SALVAR automaticamente
                    const updatedData = {
                      discoveredDomain: cleanDomain,
                      seoData,
                      digitalPresence,
                      intelligenceReport,
                      allWebsiteResults,
                      similarCompaniesOptions,
                    };
                    
                    onDataChange?.(updatedData);
                    
                    if (stcHistoryId) {
                      await flushSave(updatedData, 'completed');
                    }
                    
                    toast({
                      title: '✅ Website atualizado e salvo!',
                      description: `🌐 ${cleanDomain}\n🔄 Redes sociais re-descobertas\n💾 Dados salvos automaticamente`,
                      duration: 5000,
                    });
                  }
                }}
                disabled={!editedWebsite}
                variant="default"
              >
                <Save className="w-4 h-4 mr-2" /> Salvar e Analisar
              </Button>
              <Button
                onClick={() => setIsEditingWebsite(false)}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
            <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-2">
              💡 Após salvar, execute novamente as análises SEO e IA para usar o novo website.
            </p>
          </div>
        )}
        
        {/* 📋 WEBSITE ATUAL EM USO - com botão Editar INLINE */}
        {(discoveredDomain || domain) && !isEditingWebsite && (
          <Card className="mt-4 p-4 bg-card border-border">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  Website em uso para análises:
                </p>
                <p className="text-lg font-bold text-primary">
                  {discoveredDomain || domain}
                </p>
              </div>
              <Button
                onClick={() => {
                  setIsEditingWebsite(true);
                  setEditedWebsite(discoveredDomain || domain || '');
                }}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            </div>
          </Card>
        )}

        {/* 📋 DROPDOWN TOP 20 - ALTERNATIVAS SCROLLÁVEIS */}
        {allWebsiteResults.length > 0 && (
          <div className="mt-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-3 border-blue-500 dark:border-blue-600 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <p className="text-lg font-black text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <Search className="w-6 h-6" />
                📋 Outras Opções ({allWebsiteResults.length} alternativas)
              </p>
              <Badge className="bg-blue-600 text-white">
                Scroll para ver mais ↓
              </Badge>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-blue-100">
              {allWebsiteResults.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const cleanDomain = option.url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
                    setDiscoveredDomain(cleanDomain);
                    setDigitalPresence({
                      website: option.url,
                      confidence: option.confidence,
                      sources: ['Busca Oficial (escolha usuário)'],
                      emails: [],
                      phones: [],
                      addresses: [],
                    });
                    setAllWebsiteResults([]); // Fecha dropdown
                    
                    // 🧹 LIMPAR tabela de empresas similares
                    setSimilarCompaniesOptions([]);
                    
                    toast({
                      title: '✅ Website selecionado!',
                      description: option.title,
                    });
                  }}
                  className={`
                    w-full p-4 text-left rounded-lg border-2 transition-all hover:scale-[1.02]
                    ${option.isBacklink 
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-400 dark:border-red-600' 
                      : 'bg-white dark:bg-slate-900 border-blue-300 dark:border-blue-600 hover:border-blue-500 hover:shadow-lg'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-black text-base text-slate-900 dark:text-white">#{idx + 1}</span>
                        {option.isBacklink && (
                          <Badge variant="destructive" className="text-xs font-bold">⚠️ BACKLINK</Badge>
                        )}
                        <Badge className={`text-xs font-bold ${
                          option.confidence >= 80 ? 'bg-green-600' :
                          option.confidence >= 60 ? 'bg-blue-600' :
                          option.confidence >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                        } text-white`}>
                          {option.confidence}%
                        </Badge>
                      </div>
                      <p className="font-bold text-base text-slate-900 dark:text-white mb-1">{option.title}</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mb-2 break-all">{option.url}</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{option.snippet}</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 🏢 Empresas Similares movidas para aba Competitors */}
        
        {/* 🚨 CARD EXPLICATIVO - SUPER DISCOVERY - CORPORATE THEME */}
        {!domain && !discoveredDomain && !discoveryMutation.isPending && websiteOptions.length === 0 && (
          <Card className="mt-4 p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-muted">
                <Sparkles className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h4 className="text-lg font-semibold">SUPER DISCOVERY</h4>
                <p className="text-sm text-muted-foreground">Arsenal Completo de Ferramentas</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span><strong>Serper:</strong> Website + Redes Sociais</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Search className="w-4 h-4 text-muted-foreground" />
                <span><strong>BrasilAPI:</strong> Email → Domain</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span><strong>Hunter.io:</strong> Domain + Emails</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span><strong>Apollo.io:</strong> Organization</span>
              </div>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                Busca completa em:
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1.5">
                  <Globe className="w-3 h-3" />
                  Website oficial
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <Linkedin className="w-3 h-3" />
                  LinkedIn
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  Instagram
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Twitter/X
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  YouTube
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <Mail className="w-3 h-3" />
                  Emails
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <Phone className="w-3 h-3" />
                  Telefones
                </Badge>
              </div>
            </div>
          </Card>
        )}

        {/* 🟡 LOADING STATE - Discovery em progresso */}
        {discoveryMutation.isPending && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg">
            <p className="text-base font-semibold text-yellow-900 dark:text-yellow-100 mb-3 flex items-center gap-2 animate-pulse">
              <Loader2 className="w-6 h-6 animate-spin" />
              🔍 Varrendo toda a web com 8 ferramentas...
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                '✓ Google Search (website oficial)...',
                '✓ LinkedIn corporativo...',
                '✓ Instagram da empresa...',
                '✓ Twitter/X oficial...',
                '✓ Facebook page...',
                '✓ BrasilAPI (email corporativo)...',
                '✓ Hunter.io (domain search)...',
                '✓ Apollo.io (organization)...',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-yellow-800 dark:text-yellow-200">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🟢 RESULTADO DISCOVERY */}
        {digitalPresence && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg">
            <p className="text-base font-bold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              ✅ Presença Digital Encontrada! (Confiança: {digitalPresence.confidence}%)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {digitalPresence.website && (
                <div className="flex items-start gap-3 p-4 bg-white/60 dark:bg-black/30 rounded-lg border border-green-300 dark:border-green-700">
                  <Globe className="w-8 h-8 text-green-600 dark:text-green-400" />{/* ✅ 2x maior */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-green-900 dark:text-green-100 text-base mb-1">Website Oficial</p>
                    <a href={digitalPresence.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block">
                      {digitalPresence.website}
                    </a>
                  </div>
                </div>
              )}
              {digitalPresence.linkedin && (
                <div className="flex items-start gap-3 p-4 bg-white/60 dark:bg-black/30 rounded-lg border border-blue-300 dark:border-blue-700">
                  <Linkedin className="w-8 h-8 text-blue-600 dark:text-blue-400" />{/* ✅ LinkedIn icon + 2x maior */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-green-900 dark:text-green-100 text-base mb-1">LinkedIn</p>
                    <a href={digitalPresence.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block">
                      Perfil corporativo →
                    </a>
                  </div>
                </div>
              )}
              {digitalPresence.instagram && (
                <div className="flex items-start gap-3 p-4 bg-white/60 dark:bg-black/30 rounded-lg border border-pink-300 dark:border-pink-700">
                  <TrendingUp className="w-8 h-8 text-pink-600 dark:text-pink-400" />{/* ✅ 2x maior */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-green-900 dark:text-green-100 text-base mb-1">Instagram</p>
                    <a href={digitalPresence.instagram} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block">
                      Perfil oficial →
                    </a>
                  </div>
                </div>
              )}
              {digitalPresence.twitter && (
                <div className="flex items-start gap-3 p-4 bg-white/60 dark:bg-black/30 rounded-lg border border-sky-300 dark:border-sky-700">
                  <Target className="w-8 h-8 text-sky-600 dark:text-sky-400" />{/* ✅ 2x maior */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-green-900 dark:text-green-100 text-base mb-1">Twitter/X</p>
                    <a href={digitalPresence.twitter} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block">
                      Perfil oficial →
                    </a>
                  </div>
                </div>
              )}
              {digitalPresence.facebook && (
                <div className="flex items-start gap-3 p-4 bg-white/60 dark:bg-black/30 rounded-lg border border-indigo-300 dark:border-indigo-700">
                  <Globe className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />{/* ✅ Facebook 2x maior */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-green-900 dark:text-green-100 text-base mb-1">Facebook</p>
                    <a href={digitalPresence.facebook} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block">
                      Página oficial →
                    </a>
                  </div>
                </div>
              )}
              {digitalPresence.emails.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-white/60 dark:bg-black/30 rounded-lg border border-green-300 dark:border-green-700 col-span-2">
                  <Search className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-green-900 dark:text-green-100 text-sm mb-2">
                      Emails Corporativos ({digitalPresence.emails.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {digitalPresence.emails.slice(0, 5).map((email, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{email}</Badge>
                      ))}
                      {digitalPresence.emails.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{digitalPresence.emails.length - 5} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-green-300 dark:border-green-700">
              <p className="text-xs text-green-700 dark:text-green-300">
                <strong>Fontes utilizadas:</strong> {digitalPresence.sources.join(' | ')}
              </p>
            </div>
          </div>
        )}
        
        {/* 🧠 RELATÓRIO DE INTELIGÊNCIA (IA) */}
        {intelligenceReport && (
          <div className="mt-4 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 border-4 border-indigo-500 dark:border-indigo-600 rounded-2xl shadow-2xl">
            <h4 className="text-2xl font-black mb-6 flex items-center gap-3 text-indigo-900 dark:text-indigo-100">
              <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              🧠 Relatório de Inteligência (IA)
            </h4>
            
            {/* SCORES */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border-3 border-slate-500 dark:border-slate-600">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Digital Health Score</p>
                <p className="text-4xl font-black text-indigo-700 dark:text-indigo-300">{intelligenceReport.digitalHealthScore}/100</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border-3 border-slate-500 dark:border-slate-600">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Google Compliance</p>
                <p className="text-4xl font-black text-indigo-700 dark:text-indigo-300">{intelligenceReport.googleCompliance.score}%</p>
              </div>
            </div>

            {/* 🔽 GOOGLE COMPLIANCE - DROPDOWN COLAPSÁVEL */}
            {(intelligenceReport.googleCompliance.issues.length > 0 || intelligenceReport.googleCompliance.recommendations.length > 0) && (
              <div className="mb-6">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-between text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                    >
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        📋 Google Compliance - Issues & Recomendações
                      </span>
                      <ChevronDown className="w-4 h-4 transition-transform" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-3">
                    {/* ISSUES */}
                    {intelligenceReport.googleCompliance.issues.length > 0 && (
                      <div className="p-4 bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-700 rounded-lg">
                        <p className="text-sm font-bold text-red-900 dark:text-red-200 mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          🚨 Issues de Compliance Google:
                        </p>
                        <ul className="space-y-1 text-sm text-red-800 dark:text-red-300 list-disc list-inside">
                          {intelligenceReport.googleCompliance.issues.map((issue, idx) => (
                            <li key={idx}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* RECOMENDAÇÕES */}
                    {intelligenceReport.googleCompliance.recommendations.length > 0 && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg">
                        <p className="text-sm font-bold text-yellow-900 dark:text-yellow-200 mb-3 flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          💡 Recomendações:
                        </p>
                        <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-300 list-disc list-inside">
                          {intelligenceReport.googleCompliance.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {/* ANÁLISE DE REDES SOCIAIS */}
            <div className="mb-6">
              <p className="text-base font-bold text-indigo-900 dark:text-indigo-100 mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                📱 Análise de Redes Sociais:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {intelligenceReport.socialMediaAnalysis.platforms.map((platform, idx) => (
                  <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-lg border-2 border-indigo-300 dark:border-indigo-700">
                    <p className="font-bold text-sm text-indigo-900 dark:text-indigo-100 mb-2">
                      {platform.platform === 'linkedin' && '🔵 LinkedIn'}
                      {platform.platform === 'instagram' && '🟣 Instagram'}
                      {platform.platform === 'facebook' && '🔵 Facebook'}
                      {platform.platform === 'twitter' && '🐦 Twitter'}
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mb-2">
                      {platform.bio || platform.about || 'Bio não disponível'}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      📝 {platform.recentPosts.length} posts analisados
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge className={`
                  ${intelligenceReport.socialMediaAnalysis.overallPresence === 'excellent' ? 'bg-green-600' : ''}
                  ${intelligenceReport.socialMediaAnalysis.overallPresence === 'good' ? 'bg-blue-600' : ''}
                  ${intelligenceReport.socialMediaAnalysis.overallPresence === 'poor' ? 'bg-yellow-600' : ''}
                  ${intelligenceReport.socialMediaAnalysis.overallPresence === 'absent' ? 'bg-red-600' : ''}
                  text-white
                `}>
                  Presença: {intelligenceReport.socialMediaAnalysis.overallPresence.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* AI INSIGHTS */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border-3 border-indigo-400 dark:border-indigo-600">
              <p className="text-lg font-black text-indigo-900 dark:text-indigo-100 mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-600" />
                🤖 Insights da IA (GPT-4o-mini):
              </p>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-bold text-indigo-800 dark:text-indigo-200">Modelo de Negócio:</span>
                  <p className="text-slate-800 dark:text-slate-200">{intelligenceReport.aiInsights.businessModel}</p>
                </div>
                <div>
                  <span className="font-bold text-indigo-800 dark:text-indigo-200">Público-Alvo:</span>
                  <p className="text-slate-800 dark:text-slate-200">{intelligenceReport.aiInsights.targetAudience}</p>
                </div>
                <div>
                  <span className="font-bold text-indigo-800 dark:text-indigo-200">Posição no Mercado:</span>
                  <p className="text-slate-800 dark:text-slate-200">{intelligenceReport.aiInsights.marketPosition}</p>
                </div>
                {intelligenceReport.aiInsights.keyProducts.length > 0 && (
                  <div>
                    <span className="font-bold text-indigo-800 dark:text-indigo-200">Produtos/Serviços:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {intelligenceReport.aiInsights.keyProducts.map((prod, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{prod}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {intelligenceReport.aiInsights.opportunities.length > 0 && (
                  <div>
                    <span className="font-bold text-green-700 dark:text-green-300">✅ Oportunidades TOTVS:</span>
                    <ul className="text-xs text-green-800 dark:text-green-200 mt-1 space-y-1 list-disc list-inside">
                      {intelligenceReport.aiInsights.opportunities.map((opp, idx) => (
                        <li key={idx}>{opp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* EXECUTIVE SUMMARY */}
            <div className="mt-6 p-5 bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900 dark:to-blue-900 rounded-xl border-3 border-indigo-500 dark:border-indigo-600">
              <p className="text-base font-black text-indigo-900 dark:text-indigo-100 mb-3 flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                📋 Resumo Executivo:
              </p>
              <p className="text-base text-indigo-900 dark:text-indigo-100 leading-relaxed font-medium">
                {intelligenceReport.executiveSummary}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Loader */}
      {seoMutation.isPending && (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium mb-1">Analisando SEO...</p>
              <p className="text-sm text-muted-foreground">
                Extraindo keywords e buscando empresas similares
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 🔥 RESULTADO DA ANÁLISE SEO */}
      {seoData && (
        <>
          {/* Estatísticas gerais */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Keywords</span>
              </div>
              <div className="text-2xl font-bold mb-1">{seoData.profile.keywords.length}</div>
              <Badge variant="outline" className="text-xs">extraídas</Badge>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Empresas Similares</span>
              </div>
              <div className="text-2xl font-bold mb-1">{seoData.similarCompanies.length}</div>
              <Badge variant="outline" className="text-xs">encontradas</Badge>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Content Score</span>
              </div>
              <div className="text-2xl font-bold mb-1">{seoData.profile.contentScore}</div>
              <Badge 
                variant={seoData.profile.contentScore > 70 ? 'default' : 'secondary'} 
                className="text-xs"
              >
                /100
              </Badge>
            </Card>
          </div>

          {/* Profile SEO */}
          <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Perfil SEO de {companyName}</h4>
            </div>
            
            <div className="grid gap-4">
              {/* Meta Tags */}
              {seoData.profile.metaTags.title && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Title Tag:</span>
                  <p className="text-sm mt-1 font-medium">{seoData.profile.metaTags.title}</p>
                </div>
              )}
              
              {seoData.profile.metaTags.description && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Meta Description:</span>
                  <p className="text-sm mt-1">{seoData.profile.metaTags.description}</p>
                </div>
              )}
              
              {/* Top Headings */}
              {seoData.profile.topHeadings.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Top Headings:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {seoData.profile.topHeadings.slice(0, 5).map((heading: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {heading}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Top Keywords - 4 COLUNAS LADO A LADO (OPÇÃO 2 - PROFISSIONAL) */}
          <Card className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
            <h4 className="text-xl font-black mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Top Keywords ({seoData.profile.keywords.length})
            </h4>
            {/* GRID 4 COLUNAS - COMPACTO E PROFISSIONAL */}
            <div className="grid grid-cols-4 gap-3">
              {/* COLUNA 1: Keywords #1-#13 */}
              <div className="border-2 border-yellow-500 dark:border-yellow-600 rounded-lg overflow-hidden">
                <div className="bg-yellow-500 dark:bg-yellow-600 p-2">
                  <p className="text-xs font-black text-slate-900 dark:text-white text-center">Keywords #1-#13</p>
                </div>
                <div className="bg-white dark:bg-slate-900 divide-y-2 divide-yellow-400 dark:divide-yellow-600">
                  {seoData.profile.keywords
                    .sort((a, b) => b.relevance - a.relevance)
                    .slice(0, 13)
                    .map((kw: KeywordData, idx: number) => (
                      <div key={idx} className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-blue-700 dark:text-blue-400">#{idx + 1}</span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-white flex-1 truncate">{kw.keyword}</span>
                          <Badge 
                            className={`text-[10px] font-black px-1.5 py-0.5 ${
                              kw.relevance >= 90 ? 'bg-green-600 text-white' :
                              kw.relevance >= 70 ? 'bg-blue-600 text-white' :
                              kw.relevance >= 50 ? 'bg-yellow-600 text-white' :
                              'bg-red-600 text-white'
                            }`}
                          >
                            {kw.relevance}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* COLUNA 2: Keywords #14-#26 */}
              <div className="border-2 border-yellow-500 dark:border-yellow-600 rounded-lg overflow-hidden">
                <div className="bg-yellow-500 dark:bg-yellow-600 p-2">
                  <p className="text-xs font-black text-slate-900 dark:text-white text-center">Keywords #14-#26</p>
                </div>
                <div className="bg-white dark:bg-slate-900 divide-y-2 divide-yellow-400 dark:divide-yellow-600">
                  {seoData.profile.keywords
                    .sort((a, b) => b.relevance - a.relevance)
                    .slice(13, 26)
                    .map((kw: KeywordData, idx: number) => (
                      <div key={idx} className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-blue-700 dark:text-blue-400">#{idx + 14}</span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-white flex-1 truncate">{kw.keyword}</span>
                          <Badge 
                            className={`text-[10px] font-black px-1.5 py-0.5 ${
                              kw.relevance >= 90 ? 'bg-green-600 text-white' :
                              kw.relevance >= 70 ? 'bg-blue-600 text-white' :
                              kw.relevance >= 50 ? 'bg-yellow-600 text-white' :
                              'bg-red-600 text-white'
                            }`}
                          >
                            {kw.relevance}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* COLUNA 3: Keywords #27-#39 */}
              <div className="border-2 border-yellow-500 dark:border-yellow-600 rounded-lg overflow-hidden">
                <div className="bg-yellow-500 dark:bg-yellow-600 p-2">
                  <p className="text-xs font-black text-slate-900 dark:text-white text-center">Keywords #27-#39</p>
                </div>
                <div className="bg-white dark:bg-slate-900 divide-y-2 divide-yellow-400 dark:divide-yellow-600">
                  {seoData.profile.keywords
                    .sort((a, b) => b.relevance - a.relevance)
                    .slice(26, 39)
                    .map((kw: KeywordData, idx: number) => (
                      <div key={idx} className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-blue-700 dark:text-blue-400">#{idx + 27}</span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-white flex-1 truncate">{kw.keyword}</span>
                          <Badge 
                            className={`text-[10px] font-black px-1.5 py-0.5 ${
                              kw.relevance >= 90 ? 'bg-green-600 text-white' :
                              kw.relevance >= 70 ? 'bg-blue-600 text-white' :
                              kw.relevance >= 50 ? 'bg-yellow-600 text-white' :
                              'bg-red-600 text-white'
                            }`}
                          >
                            {kw.relevance}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* COLUNA 4: Keywords #40-#50 */}
              <div className="border-2 border-yellow-500 dark:border-yellow-600 rounded-lg overflow-hidden">
                <div className="bg-yellow-500 dark:bg-yellow-600 p-2">
                  <p className="text-xs font-black text-slate-900 dark:text-white text-center">Keywords #40-#50</p>
                </div>
                <div className="bg-white dark:bg-slate-900 divide-y-2 divide-yellow-400 dark:divide-yellow-600">
                  {seoData.profile.keywords
                    .sort((a, b) => b.relevance - a.relevance)
                    .slice(39, 50)
                    .map((kw: KeywordData, idx: number) => (
                      <div key={idx} className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-blue-700 dark:text-blue-400">#{idx + 40}</span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-white flex-1 truncate">{kw.keyword}</span>
                          <Badge 
                            className={`text-[10px] font-black px-1.5 py-0.5 ${
                              kw.relevance >= 90 ? 'bg-green-600 text-white' :
                              kw.relevance >= 70 ? 'bg-blue-600 text-white' :
                              kw.relevance >= 50 ? 'bg-yellow-600 text-white' :
                              'bg-red-600 text-white'
                            }`}
                          >
                            {kw.relevance}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </Card>

          {/* 🔥 INTELIGÊNCIA COMPETITIVA DUPLA */}
          {competitiveAnalysis && (
            <>
              {/* 🔥 RESUMO EXECUTIVO - DESIGN PREMIUM ALTO CONTRASTE */}
              <Card className="p-8 bg-gradient-to-br from-white via-blue-50 to-white dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 border-4 border-blue-500 dark:border-blue-600 shadow-2xl">
                <h4 className="text-3xl font-black mb-8 flex items-center gap-3 text-slate-900 dark:text-white">
                  <Sparkles className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  💎 Inteligência Competitiva Dupla
                </h4>
                <div className="grid grid-cols-4 gap-6">
                  {/* TOTAL - COMPACTO + ALTO CONTRASTE */}
                  <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border-3 border-slate-500 dark:border-slate-500 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase">Total</span>
                    </div>
                    <p className="text-4xl font-black text-slate-900 dark:text-white mb-1">{competitiveAnalysis.summary.totalAnalyzed}</p>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-bold">analisadas</p>
                  </div>
                  
                  {/* VENDA - COMPACTO + VERDE FORTE */}
                  <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-950 rounded-xl border-3 border-green-600 dark:border-green-500 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-green-900 dark:text-green-200" />
                      <span className="text-xs font-black text-green-900 dark:text-white uppercase">Venda</span>
                    </div>
                    <p className="text-4xl font-black text-green-900 dark:text-green-200 mb-1">{competitiveAnalysis.summary.vendaTotvsCount}</p>
                    <p className="text-sm text-green-900 dark:text-green-100 font-bold">TOTVS</p>
                  </div>
                  
                  {/* PARCERIA - COMPACTO + AZUL FORTE */}
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-950 rounded-xl border-3 border-blue-600 dark:border-blue-500 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-900 dark:text-blue-200" />
                      <span className="text-xs font-black text-blue-900 dark:text-white uppercase">Parceria</span>
                    </div>
                    <p className="text-4xl font-black text-blue-900 dark:text-blue-200 mb-1">{competitiveAnalysis.summary.parceriaCount}</p>
                    <p className="text-sm text-blue-900 dark:text-blue-100 font-bold">oportunidades</p>
                  </div>
                  
                  {/* REVENUE - COMPACTO + ROXO FORTE */}
                  <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-950 rounded-xl border-3 border-purple-600 dark:border-purple-500 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-5 h-5 text-purple-900 dark:text-purple-200" />
                      <span className="text-xs font-black text-purple-900 dark:text-white uppercase">Revenue</span>
                    </div>
                    <p className="text-2xl font-black text-purple-900 dark:text-purple-200 mb-1">{competitiveAnalysis.summary.estimatedRevenue}</p>
                    <p className="text-sm text-purple-900 dark:text-purple-100 font-bold">ARR potencial</p>
                  </div>
                </div>
              </Card>

              {/* 💰 OPORTUNIDADES DE VENDA TOTVS */}
              {competitiveAnalysis.vendaTotvs.length > 0 && (
                <Card className="p-8 border-4 border-green-400 dark:border-green-600 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 shadow-lg">
                  <h4 className="text-2xl font-black mb-4 flex items-center gap-3 text-green-800 dark:text-green-200">
                    <Target className="w-8 h-8 text-green-700 dark:text-green-400" />
                    💰 Oportunidades de Venda TOTVS
                    <Badge className="bg-green-700 dark:bg-green-600 text-white text-base px-4 py-1">
                      {competitiveAnalysis.vendaTotvs.length} empresas
                    </Badge>
                  </h4>
                  <p className="text-base text-green-800 dark:text-green-200 mb-6 font-semibold bg-white/60 dark:bg-black/30 p-3 rounded-lg border border-green-300 dark:border-green-700">
                    🎯 Empresas que usam <strong className="text-green-900 dark:text-green-100">concorrentes do TOTVS</strong> (SAP, Oracle, Microsoft, etc.) → <strong className="text-red-700 dark:text-red-400">Prospectar para migração!</strong>
                  </p>
                  
                  <div className="space-y-3">
                    {competitiveAnalysis.vendaTotvs.slice(0, 10).map((intel: CompanyIntelligence, idx: number) => (
                      <div key={idx} className="border-2 border-green-300 rounded-lg p-4 bg-white hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">#{idx + 1}</span>
                            <span className="font-semibold">{intel.company.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-600 text-xs">
                              Overlap: {intel.company.overlapScore}%
                            </Badge>
                            <Badge variant="default" className="bg-red-600 text-xs">
                              {intel.opportunity.priority}
                            </Badge>
                          </div>
                        </div>
                        
                        <a 
                          href={intel.company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mb-2"
                        >
                          {intel.company.website}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        
                        {/* Tecnologias detectadas */}
                        {intel.detectedTechnologies.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Tecnologias:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {intel.detectedTechnologies.map((tech, tidx) => (
                                <Badge key={tidx} variant={tech.isTotvsCompetitor ? 'destructive' : 'secondary'} className="text-xs">
                                  {tech.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Insights */}
                        <div className="bg-green-50 rounded p-2 text-xs space-y-1">
                          {intel.insights.map((insight, iidx) => (
                            <p key={iidx}>{insight}</p>
                          ))}
                          <p className="font-medium text-green-700 mt-2">
                            💰 {intel.opportunity.estimatedValue}
                          </p>
                        </div>
                        
                        {/* Keywords compartilhadas */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {intel.company.sharedKeywords.slice(0, 5).map((kw: string, kidx: number) => (
                            <Badge key={kidx} variant="outline" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* 🤝 OPORTUNIDADES DE PARCERIA */}
              {competitiveAnalysis.parceria.length > 0 && (
                <Card className="p-6 border-2 border-blue-200 bg-blue-50/50">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    🤝 Oportunidades de Parceria
                    <Badge variant="default" className="bg-blue-600">
                      {competitiveAnalysis.parceria.length} empresas
                    </Badge>
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Empresas que <strong>vendem software/serviços de TI</strong> - Parceria estratégica como revendedor/implementador TOTVS!
                  </p>
                  
                  <div className="space-y-3">
                    {competitiveAnalysis.parceria.slice(0, 10).map((intel: CompanyIntelligence, idx: number) => (
                      <div key={idx} className="border-2 border-blue-300 rounded-lg p-4 bg-white hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">#{idx + 1}</span>
                            <span className="font-semibold">{intel.company.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-blue-600 text-xs">
                              Overlap: {intel.company.overlapScore}%
                            </Badge>
                            <Badge variant="default" className="bg-orange-600 text-xs">
                              {intel.opportunity.priority}
                            </Badge>
                          </div>
                        </div>
                        
                        <a 
                          href={intel.company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mb-2"
                        >
                          {intel.company.website}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        
                        {/* Insights */}
                        <div className="bg-blue-50 rounded p-3 text-xs space-y-1">
                          {intel.insights.map((insight, iidx) => (
                            <p key={iidx}>{insight}</p>
                          ))}
                          <p className="font-medium text-blue-700 mt-2">
                            🤝 {intel.opportunity.reason}
                          </p>
                          
                          {/* Partnership Score */}
                          {intel.partnershipScore && (
                            <div className="mt-3 pt-2 border-t border-blue-200">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-blue-800">Partnership Score:</span>
                                <span className="text-lg font-bold text-blue-900">{intel.partnershipScore}/100</span>
                              </div>
                              <div className="w-full bg-blue-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${intel.partnershipScore}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Complementarity Score */}
                          {intel.complementarity && intel.complementarity.hasComplementaryStack && (
                            <div className="mt-2 pt-2 border-t border-blue-200">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-blue-800">Sinergia Score:</span>
                                <span className="text-lg font-bold text-blue-900">{intel.complementarity.synergyScore}/100</span>
                              </div>
                              <div className="w-full bg-purple-200 rounded-full h-2">
                                <div 
                                  className="bg-purple-600 h-2 rounded-full transition-all"
                                  style={{ width: `${intel.complementarity.synergyScore}%` }}
                                />
                              </div>
                              <p className="text-xs text-purple-700 mt-1">
                                🔗 Áreas: {intel.complementarity.complementaryAreas.join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Keywords compartilhadas */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {intel.company.sharedKeywords.slice(0, 5).map((kw: string, kidx: number) => (
                            <Badge key={kidx} variant="outline" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Empresas Similares por SEO (fallback se não houver análise competitiva) */}
          {seoData.similarCompanies.length > 0 && !competitiveAnalysis && (
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Empresas com Keywords Similares
                <Badge variant="outline">{seoData.similarCompanies.length} encontradas</Badge>
              </h4>
              
              <div className="space-y-3">
                {seoData.similarCompanies.slice(0, 15).map((company: SimilarCompanyBySEO, idx: number) => (
                  <div key={idx} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">#{idx + 1}</span>
                        <span className="font-medium">{company.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={company.overlapScore > 70 ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          Overlap: {company.overlapScore}%
                        </Badge>
                        {company.ranking && (
                          <Badge variant="outline" className="text-xs">
                            Ranking: #{company.ranking}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 mb-2"
                    >
                      {company.website}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    
                    <div className="flex flex-wrap gap-1">
                      {company.sharedKeywords.slice(0, 8).map((kw: string, kidx: number) => (
                        <Badge key={kidx} variant="outline" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                      {company.sharedKeywords.length > 8 && (
                        <Badge variant="secondary" className="text-xs">
                          +{company.sharedKeywords.length - 8} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Insights dinâmicos */}
          <Card className="p-6 bg-primary/5">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Insights Estratégicos
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  Extraídas <strong>{seoData.profile.keywords.length} keywords únicas</strong> do website
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  Encontradas <strong>{seoData.similarCompanies.length} empresas</strong> com keywords similares (overlap &gt;40%)
                </span>
              </li>
              {seoData.profile.contentScore > 70 && (
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    ✅ Content Score <strong>excelente ({seoData.profile.contentScore}/100)</strong> - SEO bem otimizado
                  </span>
                </li>
              )}
              {seoData.similarCompanies.length > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    🎯 Top empresa similar: <strong>{seoData.similarCompanies[0].name}</strong> (overlap: {seoData.similarCompanies[0].overlapScore}%)
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  💡 Use essas empresas similares como <strong>leads qualificados</strong> para prospecção
                </span>
              </li>
            </ul>
          </Card>
        </>
      )}

      {/* Estado vazio */}
      {!seoData && !seoMutation.isPending && (
        <Card className="p-12 text-center">
          <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h4 className="font-semibold mb-2">Análise SEO não executada</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Clique em "Análise SEO Completa" para extrair keywords e encontrar empresas similares
          </p>
          {!domain && (
            <Badge variant="destructive" className="text-xs">
              ⚠️ Domain não disponível
            </Badge>
          )}
        </Card>
      )}

      {/* 🚨 BOTÃO SALVAR - FIXO E GRANDE */}
      {(digitalPresence || seoData) && (
        <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 p-4 rounded-b-lg shadow-2xl border-t-4 border-green-400 dark:border-green-500 mt-6">
          <Button
            onClick={() => {
              const dataToSave = { digitalPresence, seoData, competitiveAnalysis };
              onDataChange?.(dataToSave);
              toast({
                title: '✅ Dados salvos!',
                description: 'Análise Keywords & SEO salva no relatório',
              });
            }}
            size="lg"
            className="w-full bg-white hover:bg-green-50 text-green-900 font-black text-lg h-14 shadow-xl border-2 border-green-300"
          >
            <Save className="w-6 h-6 mr-3" />
            💾 SALVAR ANÁLISE KEYWORDS & SEO
          </Button>
          <p className="text-center text-xs text-white mt-2 font-semibold">
            ⚠️ Clique para salvar antes de trocar de aba (evitar perda de créditos!)
          </p>
        </div>
      )}
    </div>
  );
}

