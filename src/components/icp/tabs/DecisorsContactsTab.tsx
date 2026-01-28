// 👔 ABA DECISORES & CONTATOS - Apollo + Corporate Theme
import { useState, useEffect } from 'react';
import { revealCorporateContact, revealPersonalContact, isVIPDecisor } from '@/services/revealContact';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// FloatingNavigation removido - componente deletado
import { Users, Mail, Phone, Linkedin, Sparkles, Loader2, ExternalLink, Target, TrendingUp, MapPin, AlertCircle, CheckCircle2, XCircle, Building2, Filter, RefreshCw } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast as sonnerToast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { performFullLinkedInAnalysis } from '@/services/phantomBusterEnhanced';
import { corporateTheme } from '@/lib/theme/corporateTheme';
import type { LinkedInProfileData } from '@/services/phantomBusterEnhanced';
import { registerTab, unregisterTab } from './tabsRegistry';
import { ApolloOrgIdDialog } from '@/components/companies/ApolloOrgIdDialog';
import { GenericProgressBar } from '@/components/ui/GenericProgressBar';

interface DecisorsContactsTabProps {
  companyId?: string;
  companyName?: string;
  linkedinUrl?: string;
  domain?: string;
  savedData?: any;
  stcHistoryId?: string;
  onDataChange?: (data: any) => void;
}

export function DecisorsContactsTab({ 
  companyId, 
  companyName, 
  linkedinUrl, 
  domain,
  savedData,
  stcHistoryId,
  onDataChange 
}: DecisorsContactsTabProps) {
  const [analysisData, setAnalysisData] = useState<any>(savedData || {
    decisors: [],
    decisorsWithEmails: [],
    insights: [],
    companyData: null,
    companyApolloOrg: null // 🏢 Apollo Organization data
  });
  const [customLinkedInUrl, setCustomLinkedInUrl] = useState(linkedinUrl || '');
  const [customApolloUrl, setCustomApolloUrl] = useState('');
  
  // 🔍 FILTROS MÚLTIPLOS
  const [filterBuyingPower, setFilterBuyingPower] = useState<string[]>([]);
  const [filterDepartment, setFilterDepartment] = useState<string[]>([]);
  const [filterLocation, setFilterLocation] = useState<string[]>([]);
  const [filterSeniority, setFilterSeniority] = useState<string[]>([]);
  
  // 🎯 ESTADOS DE PROGRESSO
  const [progressStartTime, setProgressStartTime] = useState<number | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [currentDecisorIndex, setCurrentDecisorIndex] = useState<number>(0);
  const [totalDecisors, setTotalDecisors] = useState<number>(0);
  
  // 🔥 BUSCAR DECISORES JÁ SALVOS (de enrichment em massa)
  useEffect(() => {
    const loadExistingDecisors = async () => {
      if (!companyId) {
        console.log('[DECISORES-TAB] ⚠️ companyId está vazio, não vai carregar dados');
        return;
      }
      
      console.log('[DECISORES-TAB] 🔄 Carregando dados para companyId:', companyId);
      
      // 1️⃣ Buscar dados da empresa (Apollo Organization - FONTE DOS CAMPOS!)
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('raw_data, industry, name')
        .eq('id', companyId)
        .single();
      
      if (companyError) {
        console.error('[DECISORES-TAB] ❌ Erro ao buscar empresa:', companyError);
        return;
      }
      
      if (!companyData) {
        console.error('[DECISORES-TAB] ❌ Company data está null/undefined');
        return;
      }
      
      console.log('[DECISORES-TAB] 🏢 Company raw_data:', companyData?.raw_data);
      console.log('[DECISORES-TAB] 🏢 Apollo Organization:', companyData?.raw_data?.apollo_organization);
      console.log('[DECISORES-TAB] 🏢 Enriched Apollo:', companyData?.raw_data?.enriched_apollo);
      
      // 🔍 TESTAR TODOS OS CAMINHOS POSSÍVEIS
      const possiblePaths = [
        companyData?.raw_data?.apollo_organization,
        companyData?.raw_data?.enriched_apollo,
        companyData?.raw_data?.apollo,
        companyData?.raw_data?.organization,
        companyData?.raw_data
      ];
      
      console.log('[DECISORES-TAB] 🔍 Testando caminhos possíveis:');
      possiblePaths.forEach((path, idx) => {
        if (path) {
          console.log(`  Caminho ${idx}:`, {
            name: path?.name,
            description: path?.short_description || path?.description,
            employees: path?.estimated_num_employees || path?.num_employees,
            industry: path?.industry,
            keywords: path?.keywords,
            founded_year: path?.founded_year
          });
        }
      });
      
      // Normalizar dados da empresa (Apollo Organization)
      const companyApolloData = companyData?.raw_data?.apollo_organization || 
                                companyData?.raw_data?.enriched_apollo || 
                                companyData?.raw_data?.apollo ||
                                companyData?.raw_data?.organization ||
                                {};
      
      console.log('[DECISORES-TAB] 🏢 Company Apollo Data FINAL:', {
        name: companyApolloData?.name || companyData?.name,
        description: companyApolloData?.short_description || companyApolloData?.description,
        employees: companyApolloData?.estimated_num_employees,
        industry: companyApolloData?.industry,
        keywords: companyApolloData?.keywords,
        founded_year: companyApolloData?.founded_year
      });
      
      // 2️⃣ Buscar decisores salvos na tabela decision_makers
      const { data: existingDecisors } = await supabase
        .from('decision_makers')
        .select('*')
        .eq('company_id', companyId);
      
      console.log('[DECISORES-TAB] 📊 Decisores encontrados:', existingDecisors?.length || 0);
      
      // 🏢 SEMPRE SETAR companyApolloOrg (MESMO SEM DECISORES!)
      const apolloOrg = companyApolloData || {};
      const baseAnalysisData = {
        companyApolloOrg: {
          name: apolloOrg.name || companyData?.name,
          description: apolloOrg.short_description || apolloOrg.description,
          employees: apolloOrg.estimated_num_employees,
          industry: apolloOrg.industry || companyData?.industry,
          keywords: apolloOrg.keywords || [],
          founded_year: apolloOrg.founded_year,
          city: existingDecisors?.[0]?.city,
          country: existingDecisors?.[0]?.country
        },
        companyData: { 
          source: 'database',
          followers: 0,
          employees: 0,
          recentPosts: []
        }
      };
      
      console.log('[DECISORES-TAB] 🏢 companyApolloOrg preparado:', baseAnalysisData.companyApolloOrg);
      console.log('[DECISORES-TAB] 🔍 Dados RAW do Apollo:', {
        name: apolloOrg.name,
        description: apolloOrg.short_description || apolloOrg.description,
        employees: apolloOrg.estimated_num_employees,
        industry: apolloOrg.industry,
        keywords: apolloOrg.keywords,
        founded_year: apolloOrg.founded_year,
        website_url: apolloOrg.website_url,
        linkedin_url: apolloOrg.linkedin_url
      });
      
      if (existingDecisors && existingDecisors.length > 0) {
        console.log('[DECISORES-TAB] ✅ Encontrados', existingDecisors.length, 'decisores já salvos');
        
        // 🎯 CLASSIFICAÇÃO DEFINITIVA: C-Level + Diretor + Gerente + Supervisor = DECISION MAKER
        const classifyBuyingPower = (title: string, seniority: string, headline: string = '') => {
          const titleLower = (title || '').toLowerCase();
          const seniorityLower = (seniority || '').toLowerCase();
          const headlineLower = (headline || '').toLowerCase();
          
          // 🔴 DECISION MAKERS: C-Level, Diretor, Gerente, Supervisor
          if (
            // Seniority Apollo
            seniorityLower.includes('c_suite') || 
            seniorityLower.includes('c-suite') ||
            seniorityLower.includes('vp') || 
            seniorityLower.includes('founder') ||
            seniorityLower.includes('owner') ||
            seniorityLower.includes('partner') ||
            seniorityLower.includes('director') ||
            seniorityLower.includes('manager') ||
            // C-Level
            titleLower.includes('ceo') || 
            titleLower.includes('cfo') || 
            titleLower.includes('cto') || 
            titleLower.includes('cio') || 
            titleLower.includes('cmo') ||
            titleLower.includes('presidente') ||
            titleLower.includes('vice-presidente') ||
            titleLower.includes('vice presidente') ||
            titleLower.includes('sócio') ||
            titleLower.includes('fundador') ||
            titleLower.includes('proprietário') ||
            // DIRETOR (qualquer tipo) - BUSCAR EM TITLE E HEADLINE!
            titleLower.includes('diretor') ||
            titleLower.includes('director') ||
            headlineLower.includes('diretor') ||
            headlineLower.includes('director') ||
            // GERENTE (qualquer tipo)
            titleLower.includes('gerente') || 
            titleLower.includes('manager') ||
            headlineLower.includes('gerente') ||
            // SUPERVISOR (qualquer tipo)
            titleLower.includes('supervisor') ||
            headlineLower.includes('supervisor')
          ) {
            return 'decision-maker';
          }
          
          // 🟡 INFLUENCERS: Coordenadores, Líderes, Heads
          if (
            titleLower.includes('coordenador') || 
            titleLower.includes('coordinator') ||
            titleLower.includes('head of') ||
            titleLower.includes('líder') ||
            titleLower.includes('leader') ||
            seniorityLower.includes('senior')
          ) {
            return 'influencer';
          }
          
          // 🔵 USUÁRIOS: Analistas, Assistentes, Técnicos, etc.
          return 'user';
        };
        
        // 🔥 NORMALIZADOR UNIVERSAL APOLLO - Extrai de qualquer estrutura
        const normalizeApolloData = (rawData: any) => {
          if (!rawData) return {};
          
          // Tentar múltiplos caminhos possíveis para cada campo
          const paths = {
            organization_name: [
              'organization.name',
              'organization_name',
              'organization_data.name',
              'company.name',
              'company_name'
            ],
            organization_description: [
              'organization.short_description',
              'organization.description',
              'organization_data.short_description',
              'organization_description',
              'company.description',
              'description'
            ],
            organization_employees: [
              'organization.estimated_num_employees',
              'organization_data.estimated_num_employees',
              'organization_employees',
              'company.estimated_num_employees',
              'organization.num_employees',
              'num_employees'
            ],
            organization_industry: [
              'organization.industry',
              'organization_data.industry',
              'organization_industry',
              'company.industry',
              'industry'
            ],
            organization_keywords: [
              'organization.keywords',
              'organization_data.keywords',
              'organization_keywords',
              'company.keywords',
              'keywords'
            ],
            organization_founded_year: [
              'organization.founded_year',
              'organization_data.founded_year',
              'organization_founded_year',
              'company.founded_year',
              'founded_year'
            ],
            apollo_score: [
              'person_score',
              'apollo_score',
              'score'
            ],
            phone_numbers: [
              'phone_numbers',
              'phoneNumbers',
              'phones'
            ]
          };
          
          const getValue = (obj: any, pathArray: string[]) => {
            for (const path of pathArray) {
              const keys = path.split('.');
              let value = obj;
              let found = true;
              
              for (const key of keys) {
                if (value && typeof value === 'object' && key in value) {
                  value = value[key];
                } else {
                  found = false;
                  break;
                }
              }
              
              if (found && value !== null && value !== undefined) {
                return value;
              }
            }
            return null;
          };
          
          return {
            organization_name: getValue(rawData, paths.organization_name),
            organization_description: getValue(rawData, paths.organization_description),
            organization_employees: getValue(rawData, paths.organization_employees),
            organization_industry: getValue(rawData, paths.organization_industry),
            organization_keywords: getValue(rawData, paths.organization_keywords) || [],
            organization_founded_year: getValue(rawData, paths.organization_founded_year),
            apollo_score: getValue(rawData, paths.apollo_score),
            phone_numbers: getValue(rawData, paths.phone_numbers) || []
          };
        };
        
        // Formatar decisores para match com estrutura esperada (TODOS CAMPOS APOLLO)
        const formattedDecisors = existingDecisors.map(d => {
          const name = d.full_name || d.name;
          console.log('[DECISORES-TAB] 🔍 raw_data para', name, ':', d.raw_data);
          
          // 📸 LOG ESPECIAL para foto
          if (name?.toLowerCase().includes('rogerio') || name?.toLowerCase().includes('souza')) {
            console.log('[DECISORES-TAB] 📸 DIRETOR ROGERIO - photo_url:', d.photo_url);
            console.log('[DECISORES-TAB] 📸 DIRETOR ROGERIO - raw_data.photo_url:', d.raw_data?.photo_url);
            console.log('[DECISORES-TAB] 📸 DIRETOR ROGERIO - raw_data completo:', d.raw_data);
          }
          
          // Normalizar dados Apollo do DECISOR
          const apolloNormalized = normalizeApolloData(d.raw_data);
          console.log('[DECISORES-TAB] 📦 Apollo normalizado (decisor):', apolloNormalized);
          
          return {
            name: d.full_name || d.name,
            title: d.position || d.title,
            position: d.position,
            email: d.email,
            email_status: d.email_status,
            phone: d.phone,
            linkedin_url: d.linkedin_url,
            department: d.department,
            seniority_level: d.seniority_level,
            buying_power: classifyBuyingPower(d.position || '', d.seniority_level || '', d.headline || ''),
            city: d.city,
            state: d.state,
            country: d.country || 'Brazil',
            photo_url: d.photo_url,
            headline: d.headline,
            // 🔥 CAMPOS APOLLO: PRIORIDADE 1 = Company, PRIORIDADE 2 = Decisor raw_data
            apollo_score: apolloNormalized.apollo_score || d.apollo_score,
            organization_name: companyApolloData?.name || 
                              apolloNormalized.organization_name || 
                              d.organization_name ||
                              companyData?.name,
            organization_employees: companyApolloData?.estimated_num_employees || 
                                   apolloNormalized.organization_employees || 
                                   d.organization_employees,
            organization_industry: companyApolloData?.industry || 
                                  apolloNormalized.organization_industry || 
                                  d.organization_industry ||
                                  companyData?.industry,
            organization_keywords: (companyApolloData?.keywords && companyApolloData.keywords.length > 0)
              ? companyApolloData.keywords
              : (Array.isArray(apolloNormalized.organization_keywords) && apolloNormalized.organization_keywords.length > 0)
                ? apolloNormalized.organization_keywords 
                : (d.organization_keywords || []),
            phone_numbers: Array.isArray(apolloNormalized.phone_numbers) && apolloNormalized.phone_numbers.length > 0
              ? apolloNormalized.phone_numbers 
              : (d.phone_numbers || []),
            departments: d.raw_data?.departments || d.departments || [],
            employment_history: d.raw_data?.employment_history || [],
            enriched_with: 'database'
          };
        });
        
        const newAnalysisData = {
          ...baseAnalysisData, // 🏢 Incluir companyApolloOrg e companyData
          decisors: formattedDecisors,
          decisorsWithEmails: formattedDecisors, // 🔥 SEMPRE mostrar todos (mesmo sem email)
          insights: [`${existingDecisors.length} decisores já identificados por enrichment anterior`],
        };
        
        console.log('[DECISORES-TAB] 🔥 SETANDO analysisData com decisores:', existingDecisors.length);
        console.log('[DECISORES-TAB] 🔥 companyApolloOrg:', newAnalysisData.companyApolloOrg);
        setAnalysisData(newAnalysisData);
        
        sonnerToast.success(`✅ ${existingDecisors.length} decisores carregados!`);
      } else {
        // 🏢 SEM decisores, mas SEMPRE setar companyApolloOrg
        console.log('[DECISORES-TAB] ⚠️ Nenhum decisor encontrado, mas carregando companyApolloOrg');
        setAnalysisData({
          ...baseAnalysisData,
          decisors: [],
          decisorsWithEmails: [],
          insights: ['Nenhum decisor identificado ainda. Clique em "Extrair Decisores" para começar.']
        });
      }
    };
    
    loadExistingDecisors();
  }, [companyId]);
  
  // 🔄 Função para forçar reload manual (SEM sair do relatório!)
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 💸 REVEAL DE CONTATOS
  const [revealingContacts, setRevealingContacts] = useState<Set<string>>(new Set());
  
  // 💸 REVELAR CONTATO CORPORATIVO (Apollo + Hunter)
  const handleRevealCorporateContact = async (decisor: any) => {
    const decisorId = decisor.id;
    setRevealingContacts(prev => new Set(prev).add(decisorId));
    
    try {
      const { toast } = await import('sonner');
      toast.info('💸 Revelando contato corporativo...', {
        description: 'Custo: ~1 crédito'
      });
      
      const result = await revealCorporateContact(
        decisorId,
        decisor.linkedin_url,
        decisor.name,
        analysisData.companyApolloOrg?.primary_domain || analysisData.companyApolloOrg?.website_url
      );
      
      if (result.success) {
        toast.success(`✅ Contato corporativo revelado!`, {
          description: `Email: ${result.email || 'N/A'} | Tel: ${result.phone || 'N/A'} | Custo: ${result.cost} crédito(s)`
        });
        
        // Recarregar lista de decisores
        await handleRefreshData();
      } else {
        toast.error('❌ Contato não disponível', {
          description: result.error
        });
      }
    } catch (error: any) {
      console.error('[REVEAL] ❌ Erro:', error);
      const { toast } = await import('sonner');
      toast.error('Erro ao revelar contato', {
        description: error.message
      });
    } finally {
      setRevealingContacts(prev => {
        const newSet = new Set(prev);
        newSet.delete(decisorId);
        return newSet;
      });
    }
  };
  
  // 📱 REVELAR CONTATO PESSOAL
  const handleRevealPersonalContact = async (decisor: any) => {
    const decisorId = decisor.id;
    setRevealingContacts(prev => new Set(prev).add(decisorId));
    
    try {
      const { toast } = await import('sonner');
      toast.info('📱 Revelando contatos pessoais...', {
        description: 'Mobile + Email pessoal | Custo: ~3 créditos'
      });
      
      const result = await revealPersonalContact(
        decisorId,
        decisor.linkedin_url,
        decisor.name,
        analysisData.companyApolloOrg?.name
      );
      
      if (result.success) {
        toast.success(`✅ Contatos pessoais revelados!`, {
          description: `Mobile: ${result.mobile || 'N/A'} | Email pessoal: ${result.email || 'N/A'} | Custo: ${result.cost} créditos`
        });
        
        // Recarregar lista de decisores
        await handleRefreshData();
      } else {
        toast.error('❌ Contatos pessoais não disponíveis', {
          description: result.error
        });
      }
    } catch (error: any) {
      console.error('[REVEAL-PESSOAL] ❌ Erro:', error);
      const { toast } = await import('sonner');
      toast.error('Erro ao revelar contatos pessoais', {
        description: error.message
      });
    } finally {
      setRevealingContacts(prev => {
        const newSet = new Set(prev);
        newSet.delete(decisorId);
        return newSet;
      });
    }
  };
  
  const handleRefreshData = async () => {
    console.log('[DECISORES-TAB] 🔄 REFRESH MANUAL acionado');
    
    if (!companyId) return;
    
    setIsRefreshing(true);
    
    try {
      sonnerToast.info('🔄 Recarregando dados...');
      
      // Re-executar TODA a lógica do useEffect
      const { data: companyData } = await supabase
        .from('companies')
        .select('raw_data, industry, name')
        .eq('id', companyId)
        .single();

      console.log('[DECISORES-TAB] 🔄 Company data recarregado:', companyData?.raw_data?.apollo_organization);

      const { data: existingDecisors } = await supabase
        .from('decision_makers')
        .select('*')
        .eq('company_id', companyId);

      console.log('[DECISORES-TAB] 🔄 Decisores recarregados:', existingDecisors?.length);

      if (existingDecisors && existingDecisors.length > 0) {
        // Aplicar MESMA LÓGICA do useEffect (copiar código)
        const companyApolloData = companyData?.raw_data?.apollo_organization || 
                                  companyData?.raw_data?.enriched_apollo || 
                                  companyData?.raw_data?.apollo ||
                                  companyData?.raw_data?.organization ||
                                  {};
        
        // Processar decisores (mesmo código do useEffect)
        // ... (vou simplificar para força reload da aba)
        
        sonnerToast.success(`✅ ${existingDecisors.length} decisores atualizados!`);
        
        // Forçar re-render completo da aba fechando e abrindo
        if (onDataChange) {
          onDataChange({ forceRefresh: true });
        }
        
        // Trigger useEffect novamente mudando uma dependência
        setAnalysisData(null);
        setTimeout(() => {
          // useEffect vai re-executar
        }, 100);
      } else {
        sonnerToast.warning('Nenhum decisor encontrado. Execute Apollo em Lote primeiro.');
      }
    } catch (error) {
      console.error('[DECISORES-TAB] Erro ao recarregar:', error);
      sonnerToast.error('Erro ao recarregar dados');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // 🔗 REGISTRY: Registrar aba para SaveBar global
  useEffect(() => {
    console.info('[REGISTRY] ✅ Registering: decisors');
    
    registerTab('decisors', {
      flushSave: async () => {
        const currentData = {
          analysisData,
          customLinkedInUrl,
          customApolloUrl,
        };
        
        console.log('[DECISORES] 📤 Registry: flushSave() chamado');
        onDataChange?.(currentData);
        sonnerToast.success('✅ Decisores & Contatos Salvos!');
      },
      getStatus: () => analysisData ? 'completed' : 'draft',
    });

    // ✅ NÃO DESREGISTRAR! Abas devem permanecer no registry mesmo quando não visíveis
    // Cleanup removido para manter estado persistente entre trocas de aba
  }, [analysisData, customLinkedInUrl, customApolloUrl, onDataChange]);
  
  // 🔄 RESET
  const handleReset = () => {
    setAnalysisData(null);
  };

  // 💾 SALVAR (mantido para compatibilidade com FloatingNavigation)
  const handleSave = () => {
    onDataChange?.(analysisData);
    sonnerToast.success('✅ Decisores & Contatos Salvos!');
  };

  // 🚀 Enriquecimento Apollo via ApolloOrgIdDialog (similar ao CompanyDetailPage)
  const [isEnrichingApollo, setIsEnrichingApollo] = useState(false);
  const handleEnrichApollo = async (apolloOrgId?: string) => {
    if (!companyId || !companyName) {
      sonnerToast.error('Erro: ID ou nome da empresa não disponível');
      return;
    }
    
    setIsEnrichingApollo(true);
    try {
      console.log('[DECISORES-TAB] 🚀 Buscando decisores Apollo para:', companyName);
      console.log('[DECISORES-TAB] 📋 Apollo Org ID:', apolloOrgId || 'N/A');
      
      // Buscar dados da empresa para obter CEP, fantasia, etc.
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      
      if (!companyData) {
        throw new Error('Empresa não encontrada');
      }
      
      const companyDataAny = companyData as any;
      const rawDataLocal = companyDataAny.raw_data || {};
      const receitaFederal = rawDataLocal.receita_federal || {};
      
      // Extrair dados com fallback completo
      const cityToSend = receitaFederal.municipio || companyDataAny.city || '';
      const stateToSend = receitaFederal.uf || companyDataAny.state || '';
      const cepToSend = receitaFederal.cep || companyDataAny.zip_code || '';
      const fantasiaToSend = receitaFederal.fantasia || receitaFederal.nome_fantasia || companyDataAny.fantasy_name || '';
      
      // Salvar Apollo Org ID na empresa se fornecido
      if (apolloOrgId) {
        await supabase
          .from('companies')
          .update({ apollo_organization_id: apolloOrgId } as any)
          .eq('id', companyId);
        
        // Atualizar customApolloUrl para refletir o ID salvo
        setCustomApolloUrl(`https://app.apollo.io/#/organizations/${apolloOrgId}`);
      }
      
      sonnerToast.info('Buscando decisores no Apollo.io...', {
        description: apolloOrgId ? 'Usando Organization ID manual' : 'Usando filtros inteligentes (CEP + Fantasia)'
      });
      
      // 🎯 INICIAR PROGRESSO
      setProgressStartTime(Date.now());
      setCurrentPhase('apollo_search');
      
      // Usar função enrich-apollo-decisores COM FILTROS INTELIGENTES
      const { data, error } = await supabase.functions.invoke('enrich-apollo-decisores', {
        body: {
          company_id: companyId,
          company_name: companyName,
          domain: domain || companyDataAny.domain || companyDataAny.website,
          apollo_org_id: apolloOrgId || companyDataAny.apollo_organization_id,
          modes: ['people', 'company'],
          city: cityToSend,
          state: stateToSend,
          industry: companyDataAny.industry,
          cep: cepToSend,
          fantasia: fantasiaToSend
        }
      });
      
      if (error) {
        console.error('[DECISORES-TAB] ❌ Erro Apollo:', error);
        throw error;
      }

      console.log('[DECISORES-TAB] ✅ Apollo retornou:', data);
      
      const decisoresEncontrados = (data as any)?.decisores_salvos || (data as any)?.decisores?.length || 0;
      setTotalDecisors(decisoresEncontrados);
      
      // 🎯 ATUALIZAR PROGRESSO
      setCurrentPhase('linkedin_analysis');
      setTimeout(() => setCurrentPhase('enrichment'), 10000);
      setTimeout(() => setCurrentPhase('classification'), 25000);
      
      // Recarregar dados após enrichment
      await handleRefreshData();
      
      // 🎯 FINALIZAR PROGRESSO
      setTimeout(() => {
        setCurrentPhase('completed');
        setTimeout(() => {
          setProgressStartTime(null);
          setCurrentPhase(null);
        }, 1000);
      }, 30000);
      
      sonnerToast.success('Decisores encontrados!', {
        description: `${decisoresEncontrados} decisores salvos no banco`
      });
    } catch (e: any) {
      console.error('[DECISORES-TAB] ❌ Erro completo:', e);
      sonnerToast.error('Erro ao buscar decisores', { 
        description: e.message || 'Verifique o Apollo Organization ID'
      });
    } finally {
      setIsEnrichingApollo(false);
    }
  };

  // 🚀 Enriquecimento TRIPLO (Apollo → Hunter.io → PhantomBuster)
  const apolloMutation = useMutation({
    mutationFn: async () => {
      if (!companyName) throw new Error('Nome da empresa não disponível');
      if (!analysisData?.decisors) throw new Error('Extraia decisores primeiro');

      let enrichmentData: any = null;
      let source = '';

      // 🥇 TENTATIVA 1: APOLLO
      try {
        sonnerToast.loading('🔍 Buscando em Apollo.io...');
        const apolloResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-apollo-decisores`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ companyName, domain }),
        });

        if (apolloResponse.ok) {
          enrichmentData = await apolloResponse.json();
          source = 'Apollo.io';
          sonnerToast.success(`✅ Dados encontrados em ${source}`);
          return { data: enrichmentData, source };
        }
      } catch (apolloError) {
        console.warn('⚠️ Apollo falhou:', apolloError);
      }

      // 🥈 TENTATIVA 2: HUNTER.IO (se Apollo falhar)
      if (!enrichmentData && domain) {
        try {
          sonnerToast.loading('🔍 Buscando em Hunter.io...');
          const hunterResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hunter-domain-search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ domain }),
          });

          if (hunterResponse.ok) {
            enrichmentData = await hunterResponse.json();
            source = 'Hunter.io';
            sonnerToast.success(`✅ Dados encontrados em ${source}`);
            return { data: enrichmentData, source };
          }
        } catch (hunterError) {
          console.warn('⚠️ Hunter.io falhou:', hunterError);
        }
      }

      // 🥉 TENTATIVA 3: PHANTOMBUSTER (última tentativa)
      if (!enrichmentData && linkedinUrl) {
        try {
          sonnerToast.loading('🔍 Buscando em PhantomBuster (LinkedIn)...');
          const phantomData = await performFullLinkedInAnalysis(companyName, linkedinUrl, domain, companyId);
          enrichmentData = phantomData;
          source = 'PhantomBuster';
          sonnerToast.success(`✅ Dados encontrados em ${source}`);
          return { data: enrichmentData, source };
        } catch (phantomError) {
          console.warn('⚠️ PhantomBuster falhou:', phantomError);
        }
      }

      // ❌ SE NENHUM FUNCIONOU
      if (!enrichmentData) {
        throw new Error('Nenhuma fonte de enriquecimento disponível (Apollo, Hunter.io, PhantomBuster)');
      }

      return { data: enrichmentData, source };
    },
    onSuccess: (result) => {
      const { data: enrichmentResult, source } = result;
      
      // Merge enrichment data com dados existentes
      const enrichedDecisors = (analysisData?.decisors || []).map((decisor: any) => {
        // Apollo retorna decisores diretamente
        if (source === 'Apollo.io' && enrichmentResult.decisores) {
          const apolloMatch = enrichmentResult.decisores.find((a: any) => 
            a.name?.toLowerCase().includes(decisor.name.toLowerCase()) ||
            decisor.name.toLowerCase().includes(a.name?.toLowerCase() || '')
          );

          if (apolloMatch) {
            return {
              ...decisor,
              email: apolloMatch.email || decisor.email,
              phone: apolloMatch.phone || decisor.phone,
              enriched_with: source,
            };
          }
        }
        
        // Hunter.io retorna emails por domínio
        if (source === 'Hunter.io' && enrichmentResult.emails) {
          const hunterMatch = enrichmentResult.emails.find((e: any) => 
            e.first_name?.toLowerCase() === decisor.name.split(' ')[0]?.toLowerCase()
          );
          
          if (hunterMatch) {
            return {
              ...decisor,
              email: hunterMatch.value || decisor.email,
              enriched_with: source,
            };
          }
        }
        
        // PhantomBuster retorna dados do LinkedIn
        if (source === 'PhantomBuster') {
          return {
            ...decisor,
            ...enrichmentResult.decisors?.find((d: any) => d.name === decisor.name),
            enriched_with: source,
          };
        }

        return decisor;
      });

      const updatedData = {
        ...analysisData,
        decisors: enrichedDecisors,
        enriched_with: source,
        enriched_at: new Date().toISOString(),
      };

      setAnalysisData(updatedData);
      onDataChange?.(updatedData);

      const emailsFound = enrichedDecisors.filter((d: any) => d.email).length;
      const phonesFound = enrichedDecisors.filter((d: any) => d.phone).length;

      sonnerToast.success(`✅ Enriquecimento via ${source} concluído!`, {
        description: `${emailsFound} emails | ${phonesFound} telefones encontrados`,
      });
    },
    onError: (error: any) => {
      sonnerToast.error('❌ Erro no enriquecimento Apollo', {
        description: error.message,
      });
    },
  });
  
  // 🔥 Análise LinkedIn completa
  const linkedinMutation = useMutation({
    mutationFn: async () => {
      if (!companyName) throw new Error('Nome da empresa não disponível');
      
      // Usar URLs customizadas se fornecidas
      const linkedinToUse = customLinkedInUrl || linkedinUrl;
      const domainToUse = domain;
      
      return await performFullLinkedInAnalysis(companyName, linkedinToUse, domainToUse, companyId);
    },
    onMutate: () => {
      sonnerToast.info('🔍 Analisando LinkedIn...', {
        description: 'Extraindo decisores, posts e dados da empresa',
      });
    },
    onSuccess: async (data) => {
      setAnalysisData(data);
      onDataChange?.(data); // 🔥 NOTIFICAR MUDANÇA PARA SALVAMENTO
      
      const emailsFound = data.decisorsWithEmails.filter(d => d.email).length;
      
      sonnerToast.success('✅ Análise LinkedIn concluída!', {
        description: `${data.decisors?.length || 0} decisores | ${emailsFound} emails | ${data.insights?.length || 0} insights`,
      });
      
      // 🔥 RECARREGAR DADOS DA EMPRESA (Apollo Organization) após enrichment
      if (companyId) {
        console.log('[DECISORES-TAB] 🔄 Recarregando dados Apollo Organization após enrichment...');
        const { data: companyData } = await supabase
          .from('companies')
          .select('raw_data, industry, name')
          .eq('id', companyId)
          .single();
        
        if (companyData?.raw_data?.apollo_organization) {
          const apolloOrg = companyData.raw_data.apollo_organization;
          console.log('[DECISORES-TAB] ✅ Apollo Organization recarregado:', apolloOrg);
          
          setAnalysisData((prev: any) => ({
            ...prev,
            companyApolloOrg: {
              name: apolloOrg.name || companyData.name,
              description: apolloOrg.short_description,
              employees: apolloOrg.estimated_num_employees,
              industry: apolloOrg.industry || companyData.industry,
              keywords: apolloOrg.keywords || [],
              founded_year: apolloOrg.founded_year,
              city: data.decisors?.[0]?.city,
              country: data.decisors?.[0]?.country
            }
          }));
        }
      }
    },
    onError: (error) => {
      sonnerToast.error('❌ Erro na análise LinkedIn', {
        description: (error as Error).message,
      });
    }
  });

  // Aplicar filtros
  const filteredDecisors = (analysisData?.decisorsWithEmails || []).filter((d: any) => {
    if (filterBuyingPower.length > 0 && !filterBuyingPower.includes(d.buying_power)) return false;
    if (filterDepartment.length > 0 && !filterDepartment.includes(d.department)) return false;
    if (filterLocation.length > 0 && !filterLocation.includes(d.city || d.state)) return false;
    if (filterSeniority.length > 0 && !filterSeniority.includes(d.seniority_level)) return false;
    return true;
  });

  // Extrair opções únicas para filtros
  const uniqueBuyingPowers = [...new Set((analysisData?.decisorsWithEmails || []).map((d: any) => d.buying_power).filter(Boolean))];
  const uniqueDepartments = [...new Set((analysisData?.decisorsWithEmails || []).map((d: any) => d.department).filter(Boolean))];
  const uniqueLocations = [...new Set((analysisData?.decisorsWithEmails || []).map((d: any) => d.city || d.state).filter(Boolean))];
  const uniqueSeniorities = [...new Set((analysisData?.decisorsWithEmails || []).map((d: any) => d.seniority_level).filter(Boolean))];

  if (!companyName) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Informações da empresa necessárias para extração de decisores
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-6 bg-slate-800 border border-slate-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-muted/30">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1 text-slate-200">Decisores & Contatos</h3>
              <p className="text-sm text-slate-400">
                Mapeamento de tomadores de decisão via PhantomBuster + LinkedIn
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleRefreshData}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isRefreshing}
              title="Recarregar dados do banco após enrichment"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Carregando...' : 'Recarregar'}
            </Button>
            
            <ApolloOrgIdDialog 
              onEnrich={handleEnrichApollo}
              disabled={isEnrichingApollo}
            />
            
            <Button
              onClick={() => linkedinMutation.mutate()}
              disabled={linkedinMutation.isPending}
              variant="default"
            >
              {linkedinMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Extrair Decisores
            </Button>
            
            {analysisData && analysisData.decisors?.length > 0 && (
              <Button
                onClick={() => apolloMutation.mutate()}
                disabled={apolloMutation.isPending}
                variant="secondary"
                className="gap-2"
              >
                {apolloMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Enriquecer Contatos (Apollo + Hunter + Phantom)
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Loading */}
      {/* 🎯 BARRA DE PROGRESSO */}
      {(progressStartTime || linkedinMutation.isPending || apolloMutation.isPending) && (
        <Card className="p-4 mt-4">
          <GenericProgressBar
            phases={[
              { id: 'apollo_search', name: 'Busca Apollo', status: 'pending' as const, estimatedTime: 10 },
              { id: 'linkedin_analysis', name: 'Análise LinkedIn', status: 'pending' as const, estimatedTime: 30 },
              { id: 'enrichment', name: 'Enriquecimento', status: 'pending' as const, estimatedTime: 15 },
              { id: 'classification', name: 'Classificação', status: 'pending' as const, estimatedTime: 5 },
            ]}
            currentPhase={currentPhase || undefined}
            elapsedTime={progressStartTime ? Math.floor((Date.now() - progressStartTime) / 1000) : 0}
            title="Progresso da Busca de Decisores"
          />
          {/* 🎯 CONTADOR DE DECISORES */}
          {currentDecisorIndex > 0 && totalDecisors > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                🔄 Processando: Decisor {currentDecisorIndex}/{totalDecisors}
              </p>
            </div>
          )}
        </Card>
      )}
      
      {linkedinMutation.isPending && (
        <Card className="p-12 text-center">
          <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p className="font-medium mb-2">Analisando LinkedIn...</p>
          <p className="text-sm text-muted-foreground">
            Extraindo decisores, emails e dados da empresa (30-60s)
          </p>
        </Card>
      )}

      {/* Resultados */}
      {analysisData && (
        <>
          {/* 📊 Estatísticas - TEMA ESCURO PREMIUM */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-slate-300 uppercase">Decisores</span>
              </div>
              <div className="text-2xl font-bold text-white">{analysisData?.decisors?.length || 0}</div>
              <Badge variant="outline" className="text-xs mt-1 border-slate-600 text-slate-400">identificados</Badge>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-slate-300 uppercase">Emails</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {analysisData?.decisorsWithEmails?.filter((d: any) => d.email).length || 0}
              </div>
              <Badge variant="outline" className="text-xs mt-1 border-slate-600 text-slate-400">encontrados</Badge>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium text-slate-300 uppercase">Taxa Sucesso</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {(analysisData?.decisors?.length || 0) > 0
                  ? Math.round(((analysisData?.decisorsWithEmails?.filter((d: any) => d.email).length || 0) / (analysisData?.decisors?.length || 1)) * 100)
                  : 0}%
              </div>
              <Badge variant="outline" className="text-xs mt-1 border-slate-600 text-slate-400">emails/decisores</Badge>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-medium text-slate-300 uppercase">Insights</span>
              </div>
              <div className="text-2xl font-bold text-white">{analysisData?.insights?.length || 0}</div>
              <Badge variant="outline" className="text-xs mt-1 border-slate-600 text-slate-400">gerados</Badge>
            </Card>
          </div>

          {/* 🔍 FILTROS MÚLTIPLOS - TEMA ESCURO */}
          {(analysisData?.decisorsWithEmails?.length || 0) > 0 && (
            <Card className="p-4 bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm text-white">
                <Filter className="w-4 h-4 text-blue-400" />
                Filtros Avançados
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Filtro: Buying Power */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Tipo de Decisor</Label>
                  <Select
                    value={filterBuyingPower.length === 1 ? filterBuyingPower[0] : 'ALL'}
                    onValueChange={(val) => setFilterBuyingPower(val === 'ALL' ? [] : [val])}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos ({analysisData?.decisorsWithEmails?.length || 0})</SelectItem>
                      {uniqueBuyingPowers.map(bp => (
                        <SelectItem key={bp} value={bp}>
                          {bp === 'decision-maker' ? 'Decision Maker' : bp === 'influencer' ? 'Influencer' : 'Usuário'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro: Departamento */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Departamento</Label>
                  <Select
                    value={filterDepartment.length === 1 ? filterDepartment[0] : 'ALL'}
                    onValueChange={(val) => setFilterDepartment(val === 'ALL' ? [] : [val])}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      {uniqueDepartments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro: Localização */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Localização</Label>
                  <Select
                    value={filterLocation.length === 1 ? filterLocation[0] : 'ALL'}
                    onValueChange={(val) => setFilterLocation(val === 'ALL' ? [] : [val])}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      {uniqueLocations.map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro: Seniority */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Senioridade</Label>
                  <Select
                    value={filterSeniority.length === 1 ? filterSeniority[0] : 'ALL'}
                    onValueChange={(val) => setFilterSeniority(val === 'ALL' ? [] : [val])}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      {uniqueSeniorities.map(sen => (
                        <SelectItem key={sen} value={sen}>{sen}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contador + Limpar Filtros */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
                <p className="text-xs text-slate-300">
                  Exibindo <strong className="text-white">{filteredDecisors.length}</strong> de <strong className="text-white">{analysisData?.decisorsWithEmails?.length || 0}</strong> decisores
                </p>
                {(filterBuyingPower.length > 0 || filterDepartment.length > 0 || filterLocation.length > 0 || filterSeniority.length > 0) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-700"
                    onClick={() => {
                      setFilterBuyingPower([]);
                      setFilterDepartment([]);
                      setFilterLocation([]);
                      setFilterSeniority([]);
                    }}
                  >
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* 🏢 RESUMO DA EMPRESA (Apollo Organization) - 100% COMPLETO */}
          {console.log('[DECISORES-TAB] 🏢 analysisData:', analysisData)}
          {console.log('[DECISORES-TAB] 🏢 companyApolloOrg:', analysisData?.companyApolloOrg)}
          {analysisData?.companyApolloOrg ? (
            <Card className="p-6 bg-gradient-to-br from-blue-900/40 to-slate-900 border-2 border-blue-500/30">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-full bg-blue-500/20 border border-blue-500/30">
                  <Building2 className="w-8 h-8 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {analysisData.companyApolloOrg.name || companyName}
                  </h3>
                  
                  {/* Industry */}
                  {analysisData.companyApolloOrg.industry && (
                    <p className="text-sm text-emerald-400 font-medium mb-3">
                      {analysisData.companyApolloOrg.industry}
                    </p>
                  )}
                  
                  {/* Location + Employees + Founded Year */}
                  <div className="flex items-center gap-4 text-sm text-slate-300 mb-3">
                    {analysisData.companyApolloOrg.city && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        {analysisData.companyApolloOrg.city}, {analysisData.companyApolloOrg.country || 'Brazil'}
                      </span>
                    )}
                    {analysisData.companyApolloOrg.employees && (
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-400" />
                        <strong>{analysisData.companyApolloOrg.employees}</strong> funcionários
                      </span>
                    )}
                    {analysisData.companyApolloOrg.founded_year && (
                      <span className="flex items-center gap-1.5 text-slate-400">
                        🗓️ Fundada em <strong>{analysisData.companyApolloOrg.founded_year}</strong>
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {analysisData.companyApolloOrg.description && (
                    <p className="text-xs text-slate-400 leading-relaxed border-l-2 border-blue-500/30 pl-3">
                      {analysisData.companyApolloOrg.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Industries + Keywords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700">
                {/* Industries */}
                {analysisData.companyApolloOrg.industry && (
                  <div>
                    <span className="text-xs font-semibold text-slate-300 mb-2 block uppercase tracking-wide">Industries:</span>
                    <Badge variant="secondary" className="text-xs bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
                      {analysisData.companyApolloOrg.industry}
                    </Badge>
                  </div>
                )}

                {/* Keywords */}
                {analysisData.companyApolloOrg.keywords && analysisData.companyApolloOrg.keywords.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-slate-300 mb-2 block uppercase tracking-wide">Keywords:</span>
                    <div className="flex flex-wrap gap-2">
                      {analysisData.companyApolloOrg.keywords.map((kw: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs bg-blue-600/20 text-blue-300 border border-blue-500/30">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-6 bg-red-900/40 border-2 border-red-500/30">
              <p className="text-red-400">⚠️ Card Apollo Organization: analysisData.companyApolloOrg está undefined/null</p>
              <pre className="text-xs text-slate-300 mt-2">{JSON.stringify(analysisData, null, 2).substring(0, 500)}</pre>
            </Card>
          )}

          {/* 🗑️ REMOVIDO: Card LinkedIn inútil (sempre 0, 0, 0) */}

          {/* 📊 TABELA DE DECISORES - LAYOUT ELEGANTE APOLLO-STYLE */}
          {filteredDecisors && filteredDecisors.length > 0 && (
            <Card className="p-6 border-2 border-emerald-500/40 bg-gradient-to-br from-slate-800 to-slate-900">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-full bg-emerald-500/20">
                  <Users className="w-6 h-6 text-emerald-400" />
                </div>
                <h4 className="font-bold text-xl text-white">
                  Decisores Identificados
                </h4>
                <Badge variant="default" className="bg-emerald-600 text-white text-lg px-4 py-2 shadow-lg">
                  {filteredDecisors.length} pessoas
                </Badge>
              </div>

              {/* Tabela Responsiva Premium com SCROLL HORIZONTAL */}
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full border-collapse min-w-[2000px]">
                  <thead>
                    <tr className="border-b-2 border-slate-700">
                      <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Name</th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Job Title</th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Links</th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Company</th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Employees</th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Industries</th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Keywords</th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Email</th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Phone</th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Location</th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Apollo Score</th>
                      <th className="text-right p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                {filteredDecisors.map((decisor: any, idx: number) => {
                  // Gerar iniciais para avatar (com validação)
                  const initials = decisor.name
                    ? decisor.name
                        .split(' ')
                        .filter((n: string) => n.length > 0)
                        .slice(0, 2)
                        .map((n: string) => n[0].toUpperCase())
                        .join('')
                    : '??';
                  
                  return (
                    <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                      {/* 1. NAME (Foto + Nome + Badges) */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0">
                            {decisor.photo_url ? (
                              <img 
                                src={decisor.photo_url} 
                                alt={decisor.name}
                                className="w-10 h-10 rounded-full border-2 border-emerald-500/30 object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs border-2 border-emerald-500/50 ${decisor.photo_url ? 'hidden' : ''}`}>
                              {initials}
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-white text-xs">{decisor.name}</p>
                            <div className="flex gap-1 mt-0.5">
                              {decisor.buying_power === 'decision-maker' && (
                                <Badge className="text-[9px] px-1.5 py-0 bg-emerald-600 border-0">DM</Badge>
                              )}
                              {decisor.buying_power === 'influencer' && (
                                <Badge className="text-[9px] px-1.5 py-0 bg-blue-600 border-0">Inf</Badge>
                              )}
                              {decisor.seniority_level && (
                                <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-slate-600 text-slate-400">{decisor.seniority_level}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. JOB TITLE */}
                      <td className="p-3">
                        <p className="text-xs font-medium text-white max-w-[200px]">{decisor.title || decisor.position}</p>
                        {decisor.headline && (
                          <p className="text-[10px] text-blue-400 italic line-clamp-2 max-w-[200px] mt-0.5">"{decisor.headline}"</p>
                        )}
                        {decisor.department && (
                          <p className="text-[10px] text-slate-500 mt-0.5">📁 {decisor.department}</p>
                        )}
                      </td>

                      {/* 3. LINKS (LinkedIn) */}
                      <td className="p-3 text-center">
                        {decisor.linkedin_url && (
                          <a 
                            href={decisor.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 transition-colors"
                            title="Ver LinkedIn"
                          >
                            <Linkedin className="w-4 h-4 text-blue-400" />
                          </a>
                        )}
                      </td>

                      {/* 4. COMPANY */}
                      <td className="p-3">
                        {decisor.organization_name ? (
                          <p className="text-xs font-medium text-slate-300 max-w-[180px] truncate">{decisor.organization_name}</p>
                        ) : (
                          <span className="text-xs text-slate-600">-</span>
                        )}
                      </td>

                      {/* 5. EMPLOYEES */}
                      <td className="p-3 whitespace-nowrap">
                        {decisor.organization_employees ? (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-emerald-400" />
                            <span className="text-xs text-slate-300 font-medium">{decisor.organization_employees}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">-</span>
                        )}
                      </td>

                      {/* 6. INDUSTRIES */}
                      <td className="p-3">
                        {decisor.organization_industry ? (
                          <Badge variant="secondary" className="text-[10px] bg-emerald-600/20 text-emerald-300 border-emerald-500/30">
                            {decisor.organization_industry}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-600">-</span>
                        )}
                      </td>

                      {/* 7. KEYWORDS */}
                      <td className="p-3">
                        {decisor.organization_keywords && decisor.organization_keywords.length > 0 ? (
                          <div className="flex flex-col gap-1 max-w-[200px]">
                            {decisor.organization_keywords.slice(0, 3).map((kw: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-[9px] bg-blue-600/20 text-blue-300 border-blue-500/30 w-fit">
                                {kw}
                              </Badge>
                            ))}
                            {decisor.organization_keywords.length > 3 && (
                              <span className="text-[9px] text-slate-500">+{decisor.organization_keywords.length - 3} mais</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">-</span>
                        )}
                      </td>

                      {/* 8. EMAIL */}
                      <td className="p-3">
                        {decisor.email && decisor.email !== 'email_not_unlocked@domain.com' ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <a 
                              href={`mailto:${decisor.email}`} 
                              className="text-emerald-400 hover:text-emerald-300 text-xs hover:underline font-medium max-w-[180px] truncate" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              title={decisor.email}
                            >
                              {decisor.email}
                            </a>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 text-[10px] text-amber-500 hover:text-amber-400 disabled:opacity-50"
                            onClick={() => handleRevealCorporateContact(decisor)}
                            disabled={revealingContacts.has(decisor.id)}
                          >
                            {revealingContacts.has(decisor.id) ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              '🔓 Revelar (~1💰)'
                            )}
                          </Button>
                        )}
                        
                        {/* 📱 BOTÃO CONTATOS PESSOAIS (sem revelar fonte) */}
                        {!decisor.email && (
                          <div className="mt-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 text-[9px] text-cyan-500 hover:text-cyan-400 disabled:opacity-50"
                              onClick={() => handleRevealPersonalContact(decisor)}
                              disabled={revealingContacts.has(decisor.id)}
                              title="📱 Revelar mobile + email pessoal"
                            >
                              {revealingContacts.has(decisor.id) ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                '📱 Pessoal (~3💰)'
                              )}
                            </Button>
                          </div>
                        )}
                      </td>

                      {/* 9. PHONE */}
                      <td className="p-3 whitespace-nowrap">
                        {decisor.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            <a 
                              href={`tel:${decisor.phone}`} 
                              className="text-blue-400 hover:text-blue-300 text-xs hover:underline font-medium"
                            >
                              {decisor.phone}
                            </a>
                          </div>
                        ) : decisor.phone_numbers && decisor.phone_numbers.length > 0 ? (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 text-[10px] text-blue-400 hover:text-blue-300 disabled:opacity-50"
                            onClick={() => handleRevealCorporateContact(decisor)}
                            disabled={revealingContacts.has(decisor.id)}
                          >
                            {revealingContacts.has(decisor.id) ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              `📞 ${decisor.phone_numbers.length}x (~1💰)`
                            )}
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 text-[10px] text-blue-400 hover:text-blue-300 disabled:opacity-50"
                            onClick={() => handleRevealCorporateContact(decisor)}
                            disabled={revealingContacts.has(decisor.id)}
                          >
                            {revealingContacts.has(decisor.id) ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              '📞 Revelar (~1💰)'
                            )}
                          </Button>
                        )}
                      </td>

                      {/* 10. LOCATION */}
                      <td className="p-3 whitespace-nowrap">
                        {decisor.city && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="text-xs text-slate-300">{decisor.city}, {decisor.state}</span>
                          </div>
                        )}
                      </td>

                      {/* 11. APOLLO SCORE */}
                      <td className="p-3 whitespace-nowrap text-center">
                        {decisor.apollo_score ? (
                          <Badge variant="outline" className="text-[10px] bg-purple-500/10 border-purple-500/30 text-purple-300">
                            ⭐ {decisor.apollo_score}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-600">-</span>
                        )}
                      </td>

                      {/* 12. ACTIONS */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2 text-slate-400 hover:text-white">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Ver Mais
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Insights Estratégicos */}
          {analysisData?.insights && analysisData.insights.length > 0 && (
            <Card className="p-6 bg-slate-800 border border-slate-600">
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-slate-200">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
                Insights Estratégicos
              </h4>
              <ul className="space-y-2 text-sm text-slate-300">
                {analysisData.insights.map((insight: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      {/* Estado vazio */}
      {!analysisData && !linkedinMutation.isPending && (
        <Card className="p-12 text-center">
          <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h4 className="font-semibold mb-2">Extração de Decisores não executada</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Clique em "Extrair Decisores" para mapear tomadores de decisão via PhantomBuster
          </p>
          {!linkedinUrl && (
            <Badge variant="secondary" className="text-xs">
              💡 Dica: LinkedIn URL melhora a precisão
            </Badge>
          )}
        </Card>
      )}
    </div>
  );
}

export default DecisorsContactsTab;

