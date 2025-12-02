import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Flame, Thermometer, Snowflake, Download, Filter, Search, RefreshCw, FileText, Globe, ArrowUpDown, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DraggableDialog } from "@/components/ui/draggable-dialog";
import { useNavigate } from 'react-router-dom';
import { useQuarantineCompanies, useApproveQuarantineBatch, useRejectQuarantine, useAutoApprove } from '@/hooks/useICPQuarantine';
import { useDeleteQuarantineBatch } from '@/hooks/useDeleteQuarantineBatch';
import { useRefreshQuarantineBatch } from '@/hooks/useRefreshQuarantineBatch';
import { useReverifyAllCompanies } from '@/hooks/useReverifyAllCompanies';
import { useRestoreAllBatchDiscarded } from '@/hooks/useRestoreDiscarded';
import { QuarantineActionsMenu } from '@/components/icp/QuarantineActionsMenu';
import { QuarantineRowActions } from '@/components/icp/QuarantineRowActions';
import { DiscardedCompaniesModal } from '@/components/icp/DiscardedCompaniesModal';
import TOTVSCheckCard from '@/components/totvs/TOTVSCheckCard';
import { STCAgent } from '@/components/intelligence/STCAgent';
import { QuarantineEnrichmentStatusBadge } from '@/components/icp/QuarantineEnrichmentStatusBadge';
import { QuarantineCNPJStatusBadge } from '@/components/icp/QuarantineCNPJStatusBadge';
import { ICPScoreTooltip } from '@/components/icp/ICPScoreTooltip';
import { TOTVSStatusBadge } from '@/components/totvs/TOTVSStatusBadge';
import { EnrichmentProgressModal, type EnrichmentProgress } from '@/components/companies/EnrichmentProgressModal';
import { ExpandedCompanyCard } from '@/components/companies/ExpandedCompanyCard';
import { toast } from 'sonner';
import * as Papa from 'papaparse';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExecutiveReportModal } from '@/components/reports/ExecutiveReportModal';
import { consultarReceitaFederal } from '@/services/receitaFederal';
import { searchApolloOrganizations, searchApolloPeople } from '@/services/apolloDirect';
import { enrichment360Simplificado } from '@/services/enrichment360';
import { ColumnFilter } from '@/components/companies/ColumnFilter';
import { UnifiedEnrichButton } from '@/components/companies/UnifiedEnrichButton';
import { UnifiedCompanySearch } from '@/components/companies/UnifiedCompanySearch';

export default function ICPQuarantine() {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all'); // ✅ Mostrar TODAS (pendente + analisadas)
  const [tempFilter, setTempFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [apolloSearchQuery, setApolloSearchQuery] = useState(''); // 🆕 BUSCA APOLLO DECISORES/COLABORADORES
  const [pageSize, setPageSize] = useState(50); // 🔢 Paginação configurável
  
  // 🔍 FILTROS POR COLUNA (tipo Excel)
  const [filterOrigin, setFilterOrigin] = useState<string[]>([]);
  const [filterCNPJStatus, setFilterCNPJStatus] = useState<string[]>([]);
  const [filterSector, setFilterSector] = useState<string[]>([]);
  const [filterUF, setFilterUF] = useState<string[]>([]);
  const [filterAnalysisStatus, setFilterAnalysisStatus] = useState<string[]>([]);
  const [filterTOTVSStatus, setFilterTOTVSStatus] = useState<string[]>([]); // 🆕 FILTRO STATUS TOTVS
  
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCompany, setPreviewCompany] = useState<any>(null);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingWebsiteId, setEditingWebsiteId] = useState<string | null>(null);
  const [websiteInput, setWebsiteInput] = useState<string>('');
  const [executiveReportOpen, setExecutiveReportOpen] = useState(false);
  const [executiveReportCompanyId, setExecutiveReportCompanyId] = useState<string | undefined>();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectCompanyData, setRejectCompanyData] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectCustomReason, setRejectCustomReason] = useState<string>('');
  const [showDiscardedModal, setShowDiscardedModal] = useState(false);
  
  // ✅ MODAL DE PROGRESSO EM TEMPO REAL
  const [enrichmentModalOpen, setEnrichmentModalOpen] = useState(false);
  const [enrichmentProgress, setEnrichmentProgress] = useState<EnrichmentProgress[]>([]);
  const [cancelEnrichment, setCancelEnrichment] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null); // 🆕 EXPANSÃO DE LINHAS

  const { data: companies = [], isLoading, refetch } = useQuarantineCompanies({
    status: statusFilter === 'all' ? undefined : statusFilter,
    temperatura: tempFilter === 'all' ? undefined : (tempFilter as any),
  });

  const { mutate: approveBatch, isPending: isApproving } = useApproveQuarantineBatch();
  const { mutate: rejectCompany } = useRejectQuarantine();
  const { mutate: autoApprove, isPending: isAutoApproving } = useAutoApprove();
  const { mutate: deleteBatch, isPending: isDeleting } = useDeleteQuarantineBatch();
  const { mutate: refreshBatch, isPending: isRefreshing } = useRefreshQuarantineBatch();
  const { mutate: reverifyAll, isPending: isReverifying } = useReverifyAllCompanies();
  const { mutate: restoreAllDiscarded, isPending: isRestoring } = useRestoreAllBatchDiscarded();

  const queryClient = useQueryClient();

  const sanitizeDomain = (value?: string | null): string | null => {
    if (!value) return null;
    const v = String(value).trim();
    if (!v || /\s/.test(v)) return null;
    try {
      const url = v.startsWith('http') ? new URL(v) : new URL(`https://${v}`);
      const host = url.hostname.replace(/^www\./, '');
      const domainRegex = /^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/i;
      return domainRegex.test(host) ? host : null;
    } catch {
      const cleaned = v.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      const domainRegex = /^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/i;
      return domainRegex.test(cleaned) ? cleaned : null;
    }
  };

  const saveWebsite = async (analysisId: string, value: string) => {
    const sanitized = sanitizeDomain(value);
    if (!sanitized) {
      toast.error('Website inválido', { description: 'Informe um domínio válido, ex: empresa.com.br' });
      return;
    }
    const { error } = await supabase
      .from('icp_analysis_results')
      .update({ website: sanitized })
      .eq('id', analysisId);
    if (error) {
      toast.error('Erro ao salvar website', { description: error.message });
      return;
    }
    toast.success('Website atualizado');
    setEditingWebsiteId(null);
    setWebsiteInput('');
    queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
  };

  // ✅ NOVA VERSÃO: Mutations para enriquecimento DIRETO (sem Edge Functions)
  const enrichReceitaMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { data: analysis } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (!analysis?.cnpj) throw new Error('CNPJ não disponível');

      // ✅ CHAMAR API DIRETAMENTE (sem Edge Function)
      const result = await consultarReceitaFederal(analysis.cnpj);

      if (!result.success) throw new Error(result.error || 'Erro ao consultar Receita Federal');

      // Atualizar dados na quarentena
      const rawData = (analysis.raw_data && typeof analysis.raw_data === 'object' && !Array.isArray(analysis.raw_data)) 
        ? analysis.raw_data as Record<string, any>
        : {};

      const { error: updateError } = await supabase
        .from('icp_analysis_results')
        .update({
          uf: result.data?.uf || analysis.uf,
          municipio: result.data?.municipio || analysis.municipio,
          porte: result.data?.porte || analysis.porte,
          cnae_principal: result.data?.atividade_principal?.[0]?.text || analysis.cnae_principal,
          raw_data: {
            ...rawData,
            receita_federal: result.data,
            receita_source: result.source,
          },
        })
        .eq('id', analysisId);

      if (updateError) throw updateError;

      // Função calculate_icp_score_quarantine não existe - score será calculado manualmente se necessário
      console.log('[Receita] ✅ Dados salvos, score será atualizado na próxima análise');

      // Se tem company_id, atualizar cnpj_status baseado na situação
      if (analysis.company_id && result.data?.situacao) {
        const cnpjStatus = result.data.situacao.toLowerCase().includes('ativa') 
          ? 'ativa' 
          : result.data.situacao.toLowerCase().includes('inapta') 
          ? 'inativo' 
          : 'pendente';

        await supabase
          .from('companies')
          .update({ cnpj_status: cnpjStatus })
          .eq('id', analysis.company_id);
      }

      return result;
    },
    onSuccess: () => {
      toast.success('✅ Receita Federal atualizada!', {
        description: 'Campos UF, Município e Porte atualizados via BrasilAPI'
      });
      // Forçar atualização IMEDIATA dos dados
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
      refetch(); // Refetch manual para atualizar cards
    },
    onError: (error: any) => {
      toast.error('Erro ao enriquecer com Receita Federal', {
        description: error.message,
      });
    },
  });

  // ⚡ NOVO: ANÁLISE COMPLETA 360° - TUDO EM 1 CLIQUE!
  const enrichCompletoMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const results = {
        receita: null as any,
        apollo: null as any,
        enrich360: null as any,
        errors: [] as string[],
      };

      // 1️⃣ RECEITA FEDERAL
      toast.loading('⚡ 1/3: Consultando Receita Federal...', { id: 'completo' });
      try {
        await enrichReceitaMutation.mutateAsync(analysisId);
        results.receita = 'success';
      } catch (error: any) {
        results.errors.push(`Receita: ${error.message}`);
        console.error('[COMPLETO] Receita falhou:', error);
      }

      // Delay entre chamadas
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 2️⃣ APOLLO DECISORES (SKIP - CORS bloqueado)
      toast.loading('⚡ 2/3: Apollo (indisponível - CORS)...', { id: 'completo' });
      results.errors.push('Apollo: Requer Edge Function (CORS)');
      console.warn('[COMPLETO] Apollo pulado (CORS bloqueado no frontend)');
      
      // Delay antes do próximo
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3️⃣ INTELLIGENCE 360°
      toast.loading('⚡ 3/3: Executando Intelligence 360°...', { id: 'completo' });
      try {
        await enrich360Mutation.mutateAsync(analysisId);
        results.enrich360 = 'success';
      } catch (error: any) {
        results.errors.push(`360°: ${error.message}`);
        console.error('[COMPLETO] 360° falhou:', error);
      }

      return results;
    },
    onSuccess: (results) => {
      const successCount = [results.receita, results.apollo, results.enrich360].filter(r => r === 'success').length;
      
      toast.dismiss('completo');
      
      if (successCount === 2) {
        // Sucesso parcial (Receita + 360°)
        toast.success('✅ Análise Completa 2/3 concluída!', {
          description: '✅ Receita (BrasilAPI) | ✅ Scores 360° | ⚠️ Apollo (CORS)',
          duration: 5000,
        });
      } else if (successCount > 0) {
        toast.warning(`⚠️ Análise parcial (${successCount}/3)`, {
          description: 'Alguns enriquecimentos falharam - veja logs',
          duration: 7000,
        });
      } else {
        toast.error('❌ Análise falhou', {
          description: 'Todos enriquecimentos falharam - veja console',
          duration: 10000,
        });
      }
      
      // Forçar atualização IMEDIATA e AGRESSIVA
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
      setTimeout(() => refetch(), 500); // Refetch com delay para garantir
    },
    onError: (error: any) => {
      toast.dismiss('completo');
      toast.error('Erro na Análise Completa', {
        description: error.message,
      });
    },
  });

  const enrichApolloMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { data: analysis } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (!analysis) throw new Error('Empresa não encontrada');

      // 🔍 Buscar company_id
      let targetCompanyId = analysis.company_id;
      
      if (!targetCompanyId) {
        const { data: lead } = await supabase
          .from('leads_pool')
          .select('company_id')
          .eq('cnpj', analysis.cnpj)
          .single();
        
        targetCompanyId = lead?.company_id;
      }

      if (!targetCompanyId) {
        throw new Error('company_id não encontrado');
      }

      // 🔥 EDGE FUNCTION Apollo com FILTROS INTELIGENTES
      const { error } = await supabase.functions.invoke('enrich-apollo-decisores', {
        body: {
          company_id: targetCompanyId,
          company_name: analysis.company_name || analysis.name,
          domain: analysis.website || analysis.domain,
          modes: ['people', 'company'],
          city: analysis.city || analysis.municipio,
          state: analysis.state || analysis.uf,
          industry: analysis.industry || analysis.setor,
          cep: analysis.cep || (analysis.raw_data as any)?.receita_federal?.cep,
          fantasia: analysis.fantasia || (analysis.raw_data as any)?.receita_federal?.fantasia
        }
      });
      
      if (error) throw error;
      
      console.log('[QUARANTINE] ✅ Apollo enrichment concluído');
    },
    onSuccess: () => {
      toast.success('✅ Apollo atualizado - Website e decisores adicionados');
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao enriquecer com Apollo', {
        description: error.message,
      });
    },
  });

  // ECONODATA: Desabilitado temporariamente - será usado na fase 2
  // Mantendo estrutura intacta para uso futuro
  /* const enrichEconodataMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { data: analysis } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (!analysis?.cnpj) throw new Error('CNPJ não disponível');

      const rawData = (analysis.raw_analysis && typeof analysis.raw_analysis === 'object' && !Array.isArray(analysis.raw_analysis)) 
        ? analysis.raw_analysis as Record<string, any>
        : {};

      // Enviar apenas CNPJ
      const { data, error } = await supabase.functions.invoke('enrich-econodata', {
        body: { cnpj: analysis.cnpj },
      });

      if (error) throw error;

      await supabase
        .from('icp_analysis_results')
        .update({
          raw_analysis: {
            ...rawData,
            econodata: data,
          },
        })
        .eq('id', analysisId);

      return data;
    },
    onSuccess: () => {
      toast.success('Dados da Econodata atualizados');
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao enriquecer com Econodata', {
        description: error.message,
      });
    },
  }); */

  // FASE 3: TOTVS Simple Check Mutation
  const enrichTotvsCheckMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { data: analysis } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (!analysis) throw new Error('Empresa não encontrada');
      if (!analysis.uf) throw new Error('UF não disponível. Execute enriquecimento Receita Federal primeiro.');

      const rawData = (analysis.raw_analysis && typeof analysis.raw_analysis === 'object' && !Array.isArray(analysis.raw_analysis)) 
        ? analysis.raw_analysis as Record<string, any>
        : {};

      // Executar apenas Simple TOTVS Check (unificado)
      const simpleDomain = sanitizeDomain(rawData.domain || analysis.website || null);
      const { data, error } = await supabase.functions.invoke('simple-totvs-check', {
        body: {
          company_id: analysis.company_id || analysis.id,
          company_name: analysis.razao_social,
          cnpj: analysis.cnpj,
          domain: simpleDomain || undefined
        },
      });

      if (error) throw error;

      // Atualizar campos na quarentena
      await supabase
        .from('icp_analysis_results')
        .update({
          is_cliente_totvs: data?.status === 'no-go',
          totvs_check_date: new Date().toISOString(),
          totvs_evidences: (data?.evidences_by_category ? Object.values(data.evidences_by_category).flat() : []) as any,
          raw_analysis: {
            ...rawData,
            simple_totvs_check: data,
          },
        })
        .eq('id', analysisId);

      // Recalcular score após TOTVS check
      await supabase.rpc('calculate_icp_score_quarantine', {
        p_analysis_id: analysisId
      });

      return data;
    },
    onSuccess: (data) => {
      const status = data?.found ? '⚠️ Cliente TOTVS detectado' : '✅ NÃO é cliente TOTVS';
      toast.success(`TOTVS Check concluído - ${status}`);
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
    },
    onError: (error: any) => {
      toast.error('Erro no TOTVS Check', {
        description: error.message,
      });
    },
  });

  const enrich360Mutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { data: analysis } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (!analysis) throw new Error('Empresa não encontrada');

      const rawData = (analysis.raw_data && typeof analysis.raw_data === 'object' && !Array.isArray(analysis.raw_data)) 
        ? analysis.raw_data as Record<string, any>
        : {};

      // ✅ ENRIQUECIMENTO SIMPLIFICADO (sem Edge Function)
      toast.loading('Calculando scores 360°...', { id: '360-progress' });

      const result = await enrichment360Simplificado({
        razao_social: analysis.razao_social,
        website: analysis.website,
        domain: analysis.domain,
        uf: analysis.uf,
        porte: analysis.porte,
        cnae: analysis.cnae_principal,
        raw_data: rawData,
      });

      if (!result.success) throw new Error(result.error || 'Erro ao calcular 360°');

      // Salvar scores
      toast.loading('Salvando scores...', { id: '360-progress' });

      await supabase
        .from('icp_analysis_results')
        .update({
          raw_data: {
            ...rawData,
            enrichment_360: {
              scores: result.scores,
              analysis: result.analysis,
              calculated_at: new Date().toISOString(),
            },
          },
        })
        .eq('id', analysisId);

      // Scores já foram salvos no raw_data, não precisa recalcular
      console.log('[360°] ✅ Scores salvos em raw_data.enrichment_360');

      toast.dismiss('360-progress');

      return result;
    },
    onSuccess: () => {
      toast.success('✅ Enriquecimento 360° concluído!', {
        description: 'Scores calculados: Presença Digital, Maturidade e Saúde'
      });
      // Forçar atualização IMEDIATA dos dados
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
      refetch(); // Refetch manual para atualizar cards
    },
    onError: (error: any) => {
      toast.dismiss('360-progress');
      toast.error('Erro no enriquecimento 360°', {
        description: error.message,
      });
    },
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredCompanies = companies
    .filter(c => {
      // 🔍 BUSCA GERAL: nome e CNPJ (PRESERVADA)
      if (searchQuery) {
        const matchesSearch = c.razao_social?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.cnpj?.includes(searchQuery);
        
        if (!matchesSearch) return false;
      }
      
      // 🔍 FILTROS INTELIGENTES POR COLUNA
      
      // Filtro por Origem
      if (filterOrigin.length > 0 && !filterOrigin.includes(c.source_name || '')) {
        return false;
      }
      
      // Filtro por Status CNPJ
      if (filterCNPJStatus.length > 0) {
        const rawData = (c as any).raw_data?.receita_federal || (c as any).raw_data || {};
        let status = 'PENDENTE';
        
        if (rawData.situacao || rawData.status) {
          status = rawData.situacao || rawData.status;
          
          if (status.toUpperCase().includes('ATIVA') || status === '02') {
            status = 'ATIVA';
          } else if (status.toUpperCase().includes('SUSPENSA') || status === '03') {
            status = 'SUSPENSA';
          } else if (status.toUpperCase().includes('INAPTA') || status === '04') {
            status = 'INAPTA';
          } else if (status.toUpperCase().includes('BAIXADA') || status === '08') {
            status = 'BAIXADA';
          } else if (status.toUpperCase().includes('NULA') || status === '01') {
            status = 'NULA';
          }
        }
        
        if (!filterCNPJStatus.includes(status)) return false;
      }
      
      // Filtro por Setor
      if (filterSector.length > 0) {
        const sector = c.segmento || (c as any).raw_data?.setor_amigavel || (c as any).raw_data?.atividade_economica || 'N/A';
        if (!filterSector.includes(sector)) return false;
      }
      
      // Filtro por UF (apenas empresas COM UF válido)
      if (filterUF.length > 0) {
        const uf = c.uf || (c as any).raw_data?.uf || '';
        // ❌ Se UF está vazio/N/A, não incluir quando há filtro ativo
        if (!uf || uf === 'N/A' || uf === '') return false;
        if (!filterUF.includes(uf)) return false;
      }
      
      // Filtro por Status Análise
      if (filterAnalysisStatus.length > 0) {
        const rawData = (c as any).raw_data || {};
        const hasReceitaWS = !!(rawData.receita_federal || rawData.cnpj);
        const hasDecisionMakers = ((c as any).decision_makers_count || 0) > 0;
        const hasDigitalPresence = !!(rawData.digital_intelligence);
        const hasLegalData = !!(rawData.totvs_report);
        
        const checks = [hasReceitaWS, hasDecisionMakers, hasDigitalPresence, hasLegalData];
        const percentage = Math.round((checks.filter(Boolean).length / checks.length) * 100);
        
        let statusLabel = '0-25%';
        if (percentage > 75) statusLabel = '76-100%';
        else if (percentage > 50) statusLabel = '51-75%';
        else if (percentage > 25) statusLabel = '26-50%';
        
        if (!filterAnalysisStatus.includes(statusLabel)) return false;
      }
      
      // 🆕 FILTRO APOLLO: Busca em decisores/colaboradores
      if (apolloSearchQuery) {
        const apolloQuery = apolloSearchQuery.toLowerCase();
        const rawData = (c as any).raw_data || {};
        const apolloData = rawData.apollo_organization || rawData.enrichment_360?.apollo || {};
        const apolloPeople = apolloData.people || [];
        
        const matchesApolloPeople = apolloPeople.some((person: any) => {
          return person.name?.toLowerCase().includes(apolloQuery) ||
            person.title?.toLowerCase().includes(apolloQuery) ||
            person.email?.toLowerCase().includes(apolloQuery) ||
            person.departments?.some((dept: string) => dept.toLowerCase().includes(apolloQuery));
        });
        
        if (!matchesApolloPeople) return false;
      }
      
      // 🆕 FILTRO STATUS TOTVS
      if (filterTOTVSStatus.length > 0) {
        const totvsStatus = c.totvs_status || 'nao-verificado';
        // Mapear para label legível
        let totvsLabel = 'Não Verificado';
        if (totvsStatus === 'go') totvsLabel = 'GO - Não é Cliente';
        if (totvsStatus === 'no-go') totvsLabel = 'NO-GO - É Cliente';
        
        if (!filterTOTVSStatus.includes(totvsLabel)) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      if (!sortColumn) return 0;
      
      let aVal: any = '';
      let bVal: any = '';
      
      const aRaw = (a.raw_analysis && typeof a.raw_analysis === 'object' && !Array.isArray(a.raw_analysis)) 
        ? a.raw_analysis as Record<string, any>
        : {};
      const bRaw = (b.raw_analysis && typeof b.raw_analysis === 'object' && !Array.isArray(b.raw_analysis)) 
        ? b.raw_analysis as Record<string, any>
        : {};
      
      switch (sortColumn) {
        case 'empresa':
          aVal = a.razao_social || '';
          bVal = b.razao_social || '';
          break;
        case 'cnpj':
          aVal = a.cnpj || '';
          bVal = b.cnpj || '';
          break;
        case 'cnpj_status':
          aVal = (a as any).cnpj_status || '';
          bVal = (b as any).cnpj_status || '';
          break;
        case 'setor':
          aVal = a.setor || '';
          bVal = b.setor || '';
          break;
        case 'uf':
          aVal = a.uf || '';
          bVal = b.uf || '';
          break;
        case 'score':
          aVal = a.icp_score || 0;
          bVal = b.icp_score || 0;
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        default:
          return 0;
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

  // 🔄 SINCRONIZAR: Desmarcar empresas que não estão mais visíveis após filtro
  useEffect(() => {
    const visibleIds = filteredCompanies.map(c => c.id);
    const currentSelected = selectedIds.filter(id => visibleIds.includes(id));
    
    if (currentSelected.length !== selectedIds.length) {
      setSelectedIds(currentSelected);
    }
  }, [filteredCompanies, selectedIds]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredCompanies.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (analysisId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, analysisId]);
    } else {
      setSelectedIds(selectedIds.filter(id => id !== analysisId));
    }
  };

  const handleApproveBatch = () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }
    approveBatch(selectedIds, {
      onSuccess: () => setSelectedIds([]),
    });
  };

  const handleAutoApprove = () => {
    autoApprove({
      minScore: 70,
      temperatura: 'hot',
      autoCreateDeals: true,
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }
    
    const confirmed = window.confirm(
      `Tem certeza que deseja deletar ${selectedIds.length} empresa(s)? Esta ação não pode ser desfeita.`
    );
    
    if (!confirmed) return;
    
    deleteBatch(selectedIds, {
      onSuccess: () => setSelectedIds([]),
    });
  };

  const handleExportSelected = () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }

    const selectedCompanies = filteredCompanies.filter(c => selectedIds.includes(c.id));
    
    const csvData = selectedCompanies.map(c => ({
      'Empresa': c.razao_social,
      'CNPJ': c.cnpj,
      'Score ICP': c.icp_score,
      'Temperatura': c.temperatura,
      'Status': c.status,
      'Motivo Qualificação': (c as any).motivo_qualificacao || '',
      'Motivo Descarte': (c as any).motivo_descarte || '',
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `quarentena-icp-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${selectedIds.length} empresa(s) exportada(s)`);
  };

  const handlePreviewSelected = () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }
    setPreviewCompany(null);
    setPreviewOpen(true);
  };

  const handleRefreshSelected = () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }
    const items = filteredCompanies
      .filter(c => selectedIds.includes(c.id))
      .map(c => ({ id: c.id, razao_social: c.razao_social, cnpj: c.cnpj }));
    refreshBatch(items);
  };

  const handlePreviewSingle = (company: any) => {
    setPreviewCompany(company);
    setPreviewOpen(true);
  };

  const handleApproveSingle = (id: string) => {
    approveBatch([id]);
  };

  const handleRejectSingle = (id: string, motivo: string) => {
    const company = filteredCompanies.find(c => c.id === id);
    if (!company) return;
    
    setRejectCompanyData({ id, name: company.razao_social || 'Empresa' });
    setRejectReason('');
    setRejectCustomReason('');
    setRejectModalOpen(true);
  };

  const confirmReject = () => {
    if (!rejectCompanyData) return;
    
    const finalReason = rejectReason === 'outro' 
      ? rejectCustomReason.trim() 
      : rejectReason;
    
    if (!finalReason) {
      toast.error('Por favor, selecione ou digite um motivo de descarte');
      return;
    }
    
    rejectCompany({ 
      analysisId: rejectCompanyData.id, 
      motivo: finalReason 
    });
    
    setRejectModalOpen(false);
    setRejectCompanyData(null);
    setRejectReason('');
    setRejectCustomReason('');
  };

  const handleDeleteSingle = (id: string) => {
    deleteBatch([id]);
  };

  const handleRefreshSingle = (id: string) => {
    const company = filteredCompanies.find(c => c.id === id);
    if (!company) return;
    refreshBatch([{ id, razao_social: company.razao_social, cnpj: company.cnpj }]);
  };

  // Handlers para enriquecimento
  const handleEnrichReceita = async (id: string) => {
    return enrichReceitaMutation.mutateAsync(id);
  };

  const handleEnrichApollo = async (id: string) => {
    return enrichApolloMutation.mutateAsync(id);
  };

  const handleEnrichTotvsCheck = async (id: string) => {
    return enrichTotvsCheckMutation.mutateAsync(id);
  };

  // ECONODATA: Desabilitado - fase 2
  /* const handleEnrichEconodata = async (id: string) => {
    return enrichEconodataMutation.mutateAsync(id);
  }; */

  const handleEnrich360 = async (id: string) => {
    return enrich360Mutation.mutateAsync(id);
  };

  // ⚡ NOVO: Handler para Análise Completa (3 em 1)
  const handleEnrichCompleto = async (id: string) => {
    return enrichCompletoMutation.mutateAsync(id);
  };

  const discoverCNPJMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { data: analysis } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (!analysis) throw new Error('Empresa não encontrada');
      if (analysis.cnpj) throw new Error('CNPJ já cadastrado');

      const rawData = (analysis.raw_analysis && typeof analysis.raw_analysis === 'object' && !Array.isArray(analysis.raw_analysis)) 
        ? analysis.raw_analysis as Record<string, any>
        : {};

      // Chamar edge function de descoberta de CNPJ
      const { data, error } = await supabase.functions.invoke('discover-cnpj', {
        body: { 
          company_name: analysis.razao_social,
          domain: rawData.domain || analysis.website,
        },
      });

      if (error) throw error;
      if (!data?.cnpj) throw new Error('CNPJ não encontrado');

      // Atualizar com CNPJ descoberto
      await supabase
        .from('icp_analysis_results')
        .update({
          cnpj: data.cnpj,
          raw_analysis: {
            ...rawData,
            cnpj_discovery: data,
          },
        })
        .eq('id', analysisId);

      return data;
    },
    onSuccess: (data) => {
      toast.success(`✅ CNPJ descoberto: ${data.cnpj}`);
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao descobrir CNPJ', {
        description: error.message,
      });
    },
  });

  const handleDiscoverCNPJ = async (id: string) => {
    return discoverCNPJMutation.mutateAsync(id);
  };

  // Handlers de bulk enrichment
  const handleBulkEnrichReceita = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }
    
    toast.loading(`Enriquecendo ${selectedIds.length} empresa(s) com Receita Federal...`, { id: 'bulk-receita' });
    
    let success = 0;
    let errors = 0;
    
    for (const id of selectedIds) {
      try {
        await enrichReceitaMutation.mutateAsync(id);
        success++;
      } catch (error) {
        errors++;
        console.error(`Erro ao enriquecer ${id}:`, error);
      }
    }
    
    toast.dismiss('bulk-receita');
    if (errors === 0) {
      toast.success(`✅ ${success} empresa(s) enriquecida(s) com sucesso!`);
    } else {
      toast.warning(`Concluído: ${success} sucesso, ${errors} erro(s)`);
    }
  };

  const handleBulkEnrichApollo = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }
    
    setCancelEnrichment(false);
    
    const selectedCompanies = companies.filter(c => selectedIds.includes(c.id));
    
    // ✅ INICIALIZAR MODAL DE PROGRESSO
    const initialProgress: EnrichmentProgress[] = selectedCompanies.map(c => ({
      companyId: c.id,
      companyName: c.razao_social,
      status: 'pending',
    }));
    
    setEnrichmentProgress(initialProgress);
    setEnrichmentModalOpen(true);
    
    let success = 0;
    let errors = 0;
    
    for (let i = 0; i < selectedCompanies.length; i++) {
      // ✅ VERIFICAR CANCELAMENTO
      if (cancelEnrichment) {
        toast.info('❌ Processo cancelado pelo usuário');
        break;
      }
      
      const company = selectedCompanies[i];
      
      try {
        // ✅ ATUALIZAR STATUS: PROCESSANDO
        setEnrichmentProgress(prev => prev.map(p => 
          p.companyId === company.id 
            ? { ...p, status: 'processing', message: 'Buscando decisores no Apollo...' }
            : p
        ));
        
        await enrichApolloMutation.mutateAsync(company.id);
        
        // ✅ ATUALIZAR STATUS: SUCESSO
        setEnrichmentProgress(prev => prev.map(p => 
          p.companyId === company.id 
            ? { ...p, status: 'success', message: 'Decisores identificados!' }
            : p
        ));
        
        success++;
      } catch (error) {
        errors++;
        console.error(`Erro ao enriquecer ${company.razao_social}:`, error);
        
        // ✅ ATUALIZAR STATUS: ERRO
        setEnrichmentProgress(prev => prev.map(p => 
          p.companyId === company.id 
            ? { ...p, status: 'error', message: 'Falha ao buscar decisores' }
            : p
        ));
      }
      
      // Delay entre empresas (evitar rate limit)
      if (i < selectedCompanies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    toast.success(`✅ Enriquecimento concluído!`, {
      description: `${success} sucesso, ${errors} erro(s)`
    });
  };

  const handleBulkEnrich360 = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }
    
    toast.loading(`Enriquecimento 360° em ${selectedIds.length} empresa(s)...`, { id: 'bulk-360' });
    
    let success = 0;
    let errors = 0;
    
    for (const id of selectedIds) {
      try {
        await enrich360Mutation.mutateAsync(id);
        success++;
      } catch (error) {
        errors++;
        console.error(`Erro ao enriquecer ${id}:`, error);
      }
    }
    
    toast.dismiss('bulk-360');
    if (errors === 0) {
      toast.success(`✅ ${success} empresa(s) enriquecidas 360°!`);
    } else {
      toast.warning(`Concluído: ${success} sucesso, ${errors} erro(s)`);
    }
  };

  const handleBulkTotvsCheck = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }
    
    const selectedCompanies = companies.filter(c => selectedIds.includes(c.id));
    
    const confirmacao = window.confirm(
      `🎯 PROCESSAMENTO TOTVS EM LOTE\n\n` +
      `Empresas selecionadas: ${selectedIds.length}\n\n` +
      `O que será processado:\n` +
      `✅ TOTVS Check (GO/NO-GO)\n` +
      `✅ Decisores (se GO)\n` +
      `✅ Digital (se GO)\n` +
      `✅ Relatório completo salvo automaticamente\n\n` +
      `Custo estimado:\n` +
      `- Créditos: ~${selectedIds.length * 150}\n` +
      `- Valor: ~R$ ${selectedIds.length}\n` +
      `- Tempo: ~${Math.round(selectedIds.length * 35 / 60)} minutos\n\n` +
      `Continuar?`
    );
    
    if (!confirmacao) return;
    
    toast.loading(`🔄 Processando empresa 0/${selectedIds.length}...`, { 
      id: 'bulk-totvs',
      duration: Infinity,
    });
    
    let noGo = 0;
    let go = 0;
    let errors = 0;
    
    for (let i = 0; i < selectedCompanies.length; i++) {
      const company = selectedCompanies[i];
      
      try {
        toast.loading(
          `🔄 ${i + 1}/${selectedIds.length}: ${company.razao_social}`, 
          { id: 'bulk-totvs' }
        );
        
        console.log(`[BATCH] 📊 Processando ${i + 1}/${selectedIds.length}: ${company.razao_social}`);
        
        // 1. TOTVS Check
        const { data: totvsResult, error: totvsError } = await supabase.functions.invoke('simple-totvs-check', {
          body: {
            company_name: company.razao_social,
            cnpj: company.cnpj,
            domain: company.domain || company.website,
            company_id: company.company_id || company.id,
          },
        });
        
        if (totvsError) throw totvsError;
        
        const isNoGo = totvsResult?.status === 'no-go';
        const isGo = totvsResult?.status === 'go';
        
        // 2. Decisores (SEMPRE - GO ou NO-GO)
        // Custo baixo e pode ser útil no futuro mesmo se NO-GO
        let decisors = null;
        try {
          const receitaData = company.raw_data?.receita_federal || {};
          
          const { data: decisorsData } = await supabase.functions.invoke('enrich-apollo-decisores', {
            body: {
              companyName: company.razao_social,
              company_id: company.company_id,
              linkedinUrl: company.linkedin_url || '',
              modes: ['people', 'company'],
              domain: company.website || company.domain,
              city: receitaData?.municipio || company.city || company.municipio,
              state: receitaData?.uf || company.state || company.uf,
              cep: receitaData?.cep || company.raw_data?.cep || company.zip_code,
              fantasia: receitaData?.fantasia || company.raw_data?.fantasia || company.fantasy_name
            },
          });
          decisors = decisorsData;
          console.log(`[BATCH] ✅ Decisores extraídos: ${decisorsData?.decisores?.length || 0}`);
        } catch (err) {
          console.warn(`[BATCH] ⚠️ Decisores falhou (continuando):`, err);
        }
        
        // 3. Digital (SEMPRE - se tem website dos decisores)
        let digital = null;
        if (decisors?.companyData?.website) {
          digital = {
            website: decisors.companyData.website,
            linkedin: decisors.companyData.linkedinUrl,
            discovered_at: new Date().toISOString(),
          };
          console.log(`[BATCH] ✅ Digital descoberto: ${digital.website}`);
        }
        
        // 4. Salvar relatório completo
        const fullReport = {
          detection_report: totvsResult,
          decisors_report: decisors,
          keywords_seo_report: digital,
          __status: {
            detection: { status: 'completed' },
            decisors: { status: decisors ? 'completed' : 'skipped' },
            keywords: { status: digital ? 'completed' : 'skipped' },
          },
          __meta: {
            saved_at: new Date().toISOString(),
            batch_processing: true,
            version: '2.0',
            company: company.razao_social,
          },
        };
        
        console.log(`[BATCH] 💾 Salvando full_report:`, {
          hasDetection: !!totvsResult,
          hasDecisors: !!decisors,
          hasDigital: !!digital,
          evidencesCount: totvsResult?.evidences?.length || 0,
          decisorsCount: decisors?.decisores?.length || 0,
        });
        
        const { data: savedReport, error: saveError} = await supabase
          .from('stc_verification_history')
          .insert({
            company_id: company.company_id || company.id,
            company_name: company.razao_social,
            cnpj: company.cnpj,
            status: totvsResult.status,
            confidence: totvsResult.confidence || 'medium',
            triple_matches: totvsResult.triple_matches || 0,
            double_matches: totvsResult.double_matches || 0,
            single_matches: totvsResult.single_matches || 0,
            total_score: totvsResult.total_weight || 0,
            evidences: totvsResult.evidences || [],
            sources_consulted: totvsResult.methodology?.searched_sources || 0,
            queries_executed: totvsResult.methodology?.total_queries || 0,
            full_report: fullReport,
          })
          .select()
          .single();
        
        if (saveError) {
          console.error(`[BATCH] ❌ Erro ao salvar relatório:`, saveError);
          throw saveError;
        }
        
        console.log(`[BATCH] ✅ Relatório salvo:`, {
          id: savedReport.id,
          hasFullReport: !!savedReport.full_report,
          fullReportKeys: savedReport.full_report ? Object.keys(savedReport.full_report) : [],
        });
        
        // 5. Contabilizar GO/NO-GO (SEM auto-descartar!)
        // ✅ MUDANÇA: Empresas NO-GO ficam na quarentena para revisão manual
        // Usuario decide se descarta ou não (pode haver falsos positivos)
        if (isNoGo) {
          noGo++;
          console.log(`[BATCH] ⚠️ ${company.razao_social}: NO-GO detectado (permanece na quarentena para revisão)`);
        } else {
          go++;
          console.log(`[BATCH] ✅ ${company.razao_social}: GO confirmado`);
        }
        
        console.log(`[BATCH] ✅ ${company.razao_social}: ${totvsResult.status} (${totvsResult.evidences?.length || 0} evidências)`);
        
      } catch (error: any) {
        errors++;
        console.error(`[BATCH] ❌ Erro em ${company.razao_social}:`, error);
      }
      
      // Delay entre empresas (evitar rate limit)
      if (i < selectedCompanies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    toast.dismiss('bulk-totvs');
    toast.success(`🎉 Processamento em lote concluído!`, {
      description: `✅ ${go} GO (prospects prontos) | ❌ ${noGo} NO-GO (auto-descartados) | ⚠️ ${errors} erros`,
      duration: 10000,
    });
    
    // Recarregar lista
    queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
  };

  const handleBulkDiscoverCNPJ = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }
    
    // Filtrar apenas empresas sem CNPJ
    const companiesWithoutCNPJ = companies.filter(c => 
      selectedIds.includes(c.id) && !c.cnpj
    );
    
    if (companiesWithoutCNPJ.length === 0) {
      toast.info('Todas as empresas selecionadas já possuem CNPJ');
      return;
    }
    
    toast.loading(`Descobrindo CNPJ de ${companiesWithoutCNPJ.length} empresa(s)...`, { id: 'bulk-cnpj' });
    
    let success = 0;
    let errors = 0;
    
    for (const company of companiesWithoutCNPJ) {
      try {
        await discoverCNPJMutation.mutateAsync(company.id);
        success++;
      } catch (error) {
        errors++;
        console.error(`Erro ao descobrir CNPJ de ${company.razao_social}:`, error);
      }
    }
    
    toast.dismiss('bulk-cnpj');
    if (errors === 0) {
      toast.success(`✅ CNPJ descoberto para ${success} empresa(s)!`);
    } else {
      toast.warning(`Concluído: ${success} sucesso, ${errors} erro(s)`);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }
    
    const confirmed = window.confirm(
      `Tem certeza que deseja aprovar ${selectedIds.length} empresa(s) e criar deals no Pipeline (Discovery)?`
    );
    
    if (!confirmed) return;
    
    approveBatch(selectedIds, {
      onSuccess: () => setSelectedIds([]),
    });
  };

  const handleOpenTotvsCheck = (company: any) => {
    if (!company?.id) {
      toast.error('ID da empresa não encontrado');
      return;
    }
    const name = encodeURIComponent(company.razao_social || 'Empresa');
    const cnpj = encodeURIComponent(company.cnpj || '');
    const domain = encodeURIComponent(company.domain || '');
    navigate(`/leads/icp-quarantine/report/${company.id}?name=${name}&cnpj=${cnpj}&domain=${domain}`);
  };

  // 🔢 APLICAR PAGINAÇÃO
  const paginatedCompanies = pageSize === 9999 
    ? filteredCompanies 
    : filteredCompanies.slice(0, pageSize);
  
  // 🐛 DEBUG
  console.log('[QUARENTENA] Total do banco:', companies.length);
  console.log('[QUARENTENA] Após filtros:', filteredCompanies.length);
  console.log('[QUARENTENA] Paginação ativa:', pageSize);
  console.log('[QUARENTENA] Exibindo:', paginatedCompanies.length);
  
  const selectedCompanies = filteredCompanies.filter(c => selectedIds.includes(c.id));
  const displayCompanies = previewCompany ? [previewCompany] : selectedCompanies;

  // Funções de UI helpers para preview dialog
  const getTempIcon = (temp: string) => {
    switch (temp) {
      case 'hot': return <Flame className="h-4 w-4 text-red-500" />;
      case 'warm': return <Thermometer className="h-4 w-4 text-orange-500" />;
      case 'cold': return <Snowflake className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  const getTempBadge = (temp: string) => {
    const variants: Record<string, any> = {
      hot: 'destructive',
      warm: 'default',
      cold: 'secondary',
    };
    return variants[temp] || 'secondary';
  };

  return (
    <div className="p-6 space-y-6">{/* ✅ SEM container - deixa scroll livre */}
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/central-icp')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Empresas em Quarentena ICP</h1>
          <p className="text-muted-foreground">
            Revise e aprove empresas analisadas antes de movê-las para o pool de leads
          </p>
        </div>
      </div>

      {/* Stats Cards - CLICÁVEIS PARA FILTRAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-all hover:shadow-lg hover:scale-105"
          onClick={() => setStatusFilter('pendente')}
        >
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{companies.filter(c => c.status === 'pendente').length}</div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Pendentes
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-all hover:shadow-lg hover:scale-105"
          onClick={() => setTempFilter('hot')}
        >
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-500 flex items-center gap-2">
              <Flame className="w-6 h-6" />
              {companies.filter(c => c.temperatura === 'hot').length}
            </div>
            <p className="text-sm text-muted-foreground">Hot Leads</p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-all hover:shadow-lg hover:scale-105"
          onClick={() => setStatusFilter('aprovada')}
        >
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500 flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              {companies.filter(c => c.status === 'aprovada').length}
            </div>
            <p className="text-sm text-muted-foreground">Aprovadas</p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-all hover:shadow-lg hover:scale-105"
          onClick={() => setStatusFilter('descartada')}
        >
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-500 flex items-center gap-2">
              <XCircle className="w-6 h-6" />
              {companies.filter(c => c.status === 'descartada').length}
            </div>
            <p className="text-sm text-muted-foreground">Descartadas</p>
          </CardContent>
        </Card>
      </div>

      {/* ✅ BARRA DE AÇÕES WORLD-CLASS - ELEGANTE E PROFISSIONAL */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* LEFT: Info + Contador */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">
                  {paginatedCompanies.length} de {filteredCompanies.length} {filteredCompanies.length === 1 ? 'empresa' : 'empresas'}
                </span>
                {selectedIds.length > 0 && (
                  <span className="text-xs text-blue-600 font-medium">
                    {selectedIds.length} selecionada{selectedIds.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* RIGHT: Ações Principais */}
            <div className="flex items-center gap-2">
              {/* UnifiedEnrichButton - Visível quando 1 empresa selecionada */}
              {selectedIds.length === 1 && (() => {
                const selectedCompany = filteredCompanies.find(c => selectedIds.includes(c.id));
                if (!selectedCompany) return null;
                
                const totvsStatus = (selectedCompany as any)?.totvs_status;
                const isGO = totvsStatus === 'go' || totvsStatus === 'GO';
                
                return (
                  <UnifiedEnrichButton
                    onQuickRefresh={async () => {
                      const id = selectedIds[0];
                      await handleEnrichReceita(id);
                    }}
                    onFullEnrich={async () => {
                      const id = selectedIds[0];
                      // ✅ FLUXO CORRETO: Sempre enriquecer Receita primeiro (sem verificar GO/NO-GO)
                      // Depois o usuário vai para Relatório STC → Aba TOTVS → Define GO/NO-GO
                      // Só então pode enriquecer Apollo se for GO
                      await handleEnrichReceita(id);
                      toast.info('✅ Receita Federal atualizada! Agora abra o Relatório STC → Aba TOTVS para verificar GO/NO-GO. Se GO, você poderá enriquecer Apollo.');
                    }}
                    onReceita={async () => {
                      const id = selectedIds[0];
                      await handleEnrichReceita(id).catch(() => {});
                    }}
                    onApollo={isGO ? async () => {
                      const id = selectedIds[0];
                      await handleEnrichApollo(id).catch(() => {});
                    } : undefined}
                    on360={async () => {
                      const id = selectedIds[0];
                      const result = await handleEnrich360(id);
                      // Ignorar retorno
                    }}
                    isProcessing={enrichReceitaMutation.isPending || enrichApolloMutation.isPending || enrich360Mutation.isPending || enrichCompletoMutation.isPending}
                    hasCNPJ={!!selectedCompany?.cnpj}
                    hasApolloId={!!(selectedCompany as any)?.apollo_organization_id}
                    variant="default"
                    size="sm"
                  />
                );
              })()}
              
              {/* Aprovar (apenas se tiver seleção) - BOTÃO PRINCIPAL DESTACADO */}
              {selectedIds.length > 0 && (
                <>
                  <Button
                    onClick={handleBulkApprove}
                    disabled={isApproving}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {isApproving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Aprovar ({selectedIds.length})
                  </Button>
                  
                  {/* Menu de Ações em Massa (dropdown) - SÓ APARECE COM SELEÇÃO */}
                  <QuarantineActionsMenu
                selectedCount={selectedIds.length}
                onDeleteSelected={handleDeleteSelected}
                onExportSelected={handleExportSelected}
                onPreviewSelected={handlePreviewSelected}
                onRefreshSelected={handleRefreshSelected}
                onBulkEnrichReceita={handleBulkEnrichReceita}
                onBulkEnrichApollo={handleBulkEnrichApollo}
                onBulkEnrich360={handleBulkEnrich360}
                onBulkTotvsCheck={handleBulkTotvsCheck}
                onBulkDiscoverCNPJ={handleBulkDiscoverCNPJ}
                onBulkApprove={handleBulkApprove}
                onRestoreDiscarded={() => restoreAllDiscarded()}
                onReverifyAllV2={() => reverifyAll(filteredCompanies.map(c => ({
                  id: c.company_id || c.id,
                  razao_social: c.razao_social,
                  cnpj: c.cnpj,
                  website: c.website
                })))}
                isProcessing={isApproving || isDeleting || isRefreshing}
                isReverifying={isReverifying}
                selectedItems={companies.filter(c => selectedIds.includes(c.id))}
                totalCompanies={filteredCompanies}
              />
                </>
              )}
              
              {/* Descartadas - SEMPRE VISÍVEL */}
              <Button
                onClick={() => setShowDiscardedModal(true)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Descartadas
              </Button>
              
              {/* Relatórios */}
              <Button
                onClick={() => navigate('/leads/stc-history')}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Relatórios
              </Button>
              
              {/* Paginação */}
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => setPageSize(Number(value))}
              >
                <SelectTrigger className="w-[90px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="150">150</SelectItem>
                  <SelectItem value="9999">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🔍 BUSCA ABRANGENTE UNIFICADA */}
      <UnifiedCompanySearch
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="🔍 Buscar por nome, CNPJ, domínio, cidade, UF, setor, origem..."
        totalCompanies={companies.length}
      />
      
      {/* FILTROS COMPLEMENTARES */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="aprovada">Aprovadas</SelectItem>
            <SelectItem value="descartada">Descartadas</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={tempFilter} onValueChange={setTempFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Temperaturas</SelectItem>
            <SelectItem value="hot">🔥 Hot</SelectItem>
            <SelectItem value="warm">☀️ Warm</SelectItem>
            <SelectItem value="cold">❄️ Cold</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* 👥 BUSCA APOLLO DECISORES (MANTIDA ABAIXO) */}
      {apolloSearchQuery && (
        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-cyan-400/70">
              🔍 Filtrando empresas que têm decisores com: "{apolloSearchQuery}"
            </p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">{/* ✅ EXATAMENTE COMO GERENCIAR EMPRESAS */}
            <Table className="text-[10px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-[44px]">
                    <Checkbox
                      checked={selectedIds.length === filteredCompanies.length && filteredCompanies.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="min-w-[180px] max-w-[200px]">{/* ✅ Reduzido */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('empresa')}
                      className="h-8 flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors group"
                    >
                      <span className="font-semibold">Empresa</span>
                      <ArrowUpDown className={`h-4 w-4 transition-colors ${sortColumn === 'empresa' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[110px]">{/* ✅ CNPJ reduzido */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('cnpj')}
                      className="h-8 flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors group"
                    >
                      <span className="font-semibold">CNPJ</span>
                      <ArrowUpDown className={`h-4 w-4 transition-colors ${sortColumn === 'cnpj' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[120px]">{/* ✅ Origem reduzido */}
                    <ColumnFilter
                      column="source_name"
                      title="Origem"
                      values={companies.map(c => c.source_name || '')}
                      selectedValues={filterOrigin}
                      onFilterChange={setFilterOrigin}
                      onSort={() => handleSort('source_name')}
                    />
                  </TableHead>
                  <TableHead className="min-w-[90px]">
                    <ColumnFilter
                      column="cnpj_status"
                      title="Status CNPJ"
                      values={companies.map(c => {
                        const rawData = (c as any).raw_data?.receita_federal || (c as any).raw_data || {};
                        
                        // ✅ Buscar status em MÚLTIPLOS CAMPOS
                        let status = rawData.situacao || rawData.status || (c as any).cnpj_status || '';
                        
                        // ✅ Se tem CNPJ mas sem status = assumir ATIVA
                        if (c.cnpj && !status) {
                          status = 'ATIVA';
                        }
                        
                        if (!status) {
                          return 'PENDENTE';
                        }
                        
                        // Normalizar
                        const statusUpper = String(status).toUpperCase();
                        if (statusUpper.includes('ATIVA') || status === '02') return 'ATIVA';
                        if (statusUpper.includes('SUSPENSA') || status === '03') return 'SUSPENSA';
                        if (statusUpper.includes('INAPTA') || status === '04') return 'INAPTA';
                        if (statusUpper.includes('BAIXADA') || status === '08') return 'BAIXADA';
                        if (statusUpper.includes('NULA') || status === '01') return 'NULA';
                        
                        return status;
                      })}
                      selectedValues={filterCNPJStatus}
                      onFilterChange={setFilterCNPJStatus}
                      onSort={() => handleSort('cnpj_status')}
                    />
                  </TableHead>
                  <TableHead className="min-w-[80px]">
                    <ColumnFilter
                      column="setor"
                      title="Setor"
                      values={companies.map(c => c.segmento || (c as any).raw_data?.setor_amigavel || (c as any).raw_data?.atividade_economica || 'N/A')}
                      selectedValues={filterSector}
                      onFilterChange={setFilterSector}
                      onSort={() => handleSort('setor')}
                    />
                  </TableHead>
                     <TableHead className="min-w-[60px]">
                      <ColumnFilter
                        column="uf"
                      title="UF"
                      values={companies.map(c => c.uf || (c as any).raw_data?.uf || '')}
                      selectedValues={filterUF}
                      onFilterChange={setFilterUF}
                      onSort={() => handleSort('uf')}
                    />
                     </TableHead>
                     <TableHead className="min-w-[70px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('score')}
                      className="h-8 flex items-center gap-1 px-1 hover:bg-primary/10 transition-colors group"
                    >
                      <span className="font-semibold text-[10px]">Score</span>
                      <ArrowUpDown className={`h-4 w-4 transition-colors ${sortColumn === 'score' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[80px]">
                    <ColumnFilter
                      column="analysis_status"
                      title="Status Análise"
                      values={companies.map(c => {
                        const rawData = (c as any).raw_data || {};
                        const hasReceitaWS = !!(rawData.receita_federal || rawData.cnpj);
                        const hasDecisionMakers = ((c as any).decision_makers_count || 0) > 0;
                        const hasDigitalPresence = !!(rawData.digital_intelligence);
                        const hasLegalData = !!(rawData.totvs_report);
                        
                        const checks = [hasReceitaWS, hasDecisionMakers, hasDigitalPresence, hasLegalData];
                        const percentage = Math.round((checks.filter(Boolean).length / checks.length) * 100);
                        
                        if (percentage > 75) return '76-100%';
                        if (percentage > 50) return '51-75%';
                        if (percentage > 25) return '26-50%';
                        return '0-25%';
                      })}
                      selectedValues={filterAnalysisStatus}
                      onFilterChange={setFilterAnalysisStatus}
                    />
                  </TableHead>
                  <TableHead className="min-w-[110px]">
                    <ColumnFilter
                      column="totvs_status"
                      title="Status TOTVS"
                      values={companies.map(c => {
                        const status = c.totvs_status || 'nao-verificado';
                        // Mapear para labels legíveis
                        if (status === 'go') return 'GO - Não é Cliente';
                        if (status === 'no-go') return 'NO-GO - É Cliente';
                        return 'Não Verificado';
                      })}
                      selectedValues={filterTOTVSStatus}
                      onFilterChange={setFilterTOTVSStatus}
                    />
                  </TableHead>
                  <TableHead className="min-w-[90px]"><span className="font-semibold text-[10px]">Website</span></TableHead>
                  <TableHead className="min-w-[50px]"><span className="font-semibold text-[10px]">STC</span></TableHead>
                  <TableHead className="w-[40px]"><span className="font-semibold text-[10px]">⚙️</span></TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={14} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : paginatedCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                    Nenhuma empresa encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCompanies.map((company) => {
                  // ✅ USAR raw_data (campo correto onde salvamos os enriquecimentos)
                  const rawData = (company.raw_data && typeof company.raw_data === 'object' && !Array.isArray(company.raw_data)) 
                    ? company.raw_data as Record<string, any>
                    : {};
                  
                  return (
                    <>
                  <TableRow key={company.id} className={expandedRow === company.id ? 'bg-muted/30' : ''}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedRow(expandedRow === company.id ? null : company.id);
                        }}
                      >
                        {expandedRow === company.id ? (
                          <ChevronUp className="h-4 w-4 text-primary" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(company.id)}
                        onCheckedChange={(checked) => 
                          handleSelectOne(company.id, checked as boolean)
                        }
                        disabled={company.status !== 'pendente'}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div 
                        className="flex flex-col cursor-pointer hover:text-primary transition-colors max-w-[250px]"
                        onClick={() => {
                          // 🎯 NAVEGAR PARA RELATÓRIO COMPLETO (9 ABAS) DA EMPRESA
                          if (company.company_id) {
                            navigate(`/company/${company.company_id}`);
                          } else {
                            toast.error('Empresa sem ID vinculado', {
                              description: 'Não foi possível localizar o ID da empresa'
                            });
                          }
                        }}
                      >
                        <span className="font-medium text-sm leading-snug line-clamp-2" title={company.razao_social}>
                          {company.razao_social}
                        </span>
                        {rawData?.domain && (
                          <span className="text-xs text-muted-foreground mt-0.5">{rawData.domain}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {company.cnpj ? (
                        <Badge 
                          variant="outline" 
                          className="font-mono text-xs cursor-pointer hover:bg-primary/10 transition-colors whitespace-nowrap"
                          onClick={() => {
                            if (company.company_id) {
                              setExecutiveReportCompanyId(company.company_id);
                              setExecutiveReportOpen(true);
                            } else {
                              toast.info('Empresa ainda não possui relatório completo', {
                                description: 'Aprove a empresa primeiro para gerar o relatório executivo'
                              });
                            }
                          }}
                        >
                          {company.cnpj}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      {company.source_name ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge 
                                variant="secondary" 
                                className="bg-blue-600/10 text-blue-600 border-blue-600/30 hover:bg-blue-600/20 transition-colors cursor-help max-w-[140px] truncate"
                              >
                                {company.source_name}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs space-y-1">
                                <p><strong>Origem:</strong> {company.source_name}</p>
                                {company.source_metadata?.campaign && (
                                  <p><strong>Campanha:</strong> {company.source_metadata.campaign}</p>
                                )}
                                {company.import_date && (
                                  <p><strong>Importado:</strong> {new Date(company.import_date).toLocaleDateString('pt-BR')}</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Sem origem
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <QuarantineCNPJStatusBadge 
                        cnpj={company.cnpj} 
                        cnpjStatus={(() => {
                          const receitaData = rawData?.receita_federal || rawData || {};
                          let status = receitaData.situacao || receitaData.status || company.cnpj_status || '';
                          
                          // Normalizar para lowercase
                          if (status.toUpperCase().includes('ATIVA') || status === '02') return 'ativa';
                          if (status.toUpperCase().includes('SUSPENSA') || status === '03') return 'inativo';
                          if (status.toUpperCase().includes('INAPTA') || status === '04') return 'inativo';
                          if (status.toUpperCase().includes('BAIXADA') || status === '08') return 'inexistente';
                          if (status.toUpperCase().includes('NULA') || status === '01') return 'inexistente';
                          
                          return status.toLowerCase();
                        })()}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="max-w-[100px]">
                        {(() => {
                          const sector = company.segmento || company.setor || rawData?.setor_amigavel || rawData?.atividade_economica;
                          return sector ? (
                            <span className="text-sm line-clamp-2 leading-snug" title={sector}>
                              {sector}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Não identificado</span>
                          );
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {company.uf ? (
                          <>
                            <Badge variant="secondary" className="w-fit">
                              {company.uf}
                            </Badge>
                            {company.municipio && (
                              <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={company.municipio}>
                                {company.municipio}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ICPScoreTooltip
                        score={company.icp_score || 0}
                        porte={company.porte}
                        setor={company.setor}
                        uf={company.uf}
                        is_cliente_totvs={company.is_cliente_totvs}
                        hasReceitaData={!!rawData?.receita_federal}
                        hasApolloData={!!rawData?.apollo || !!rawData?.enrichment_360}
                        hasWebsite={!!company.website}
                        hasContact={!!company.email || !!company.telefone}
                      />
                    </TableCell>
                    <TableCell>
                      <QuarantineEnrichmentStatusBadge 
                        rawAnalysis={rawData}
                        totvsStatus={company.totvs_status}
                        showProgress
                      />
                    </TableCell>
                    <TableCell>
                      <TOTVSStatusBadge
                        status={
                          rawData?.stc_verification_history?.status || 
                          rawData?.totvs_check?.status || 
                          (company as any).totvs_status || 
                          null
                        }
                        confidence={
                          rawData?.stc_verification_history?.confidence || 
                          rawData?.totvs_check?.confidence || 
                          undefined
                        }
                        tripleMatches={
                          rawData?.stc_verification_history?.triple_matches || 
                          rawData?.totvs_check?.triple_matches || 
                          0
                        }
                        doubleMatches={
                          rawData?.stc_verification_history?.double_matches || 
                          rawData?.totvs_check?.double_matches || 
                          0
                        }
                        size="sm"
                        showDetails={true}
                      />
                    </TableCell>
                    <TableCell>
                      {editingWebsiteId === company.id ? (
                        <div className="flex items-center gap-2 max-w-[110px]">
                          <Input
                            value={websiteInput}
                            onChange={(e) => setWebsiteInput(e.target.value)}
                            placeholder="empresa.com.br"
                            className="h-8 text-xs"
                          />
                          <Button size="sm" variant="secondary" className="h-8 px-2"
                            onClick={() => saveWebsite(company.id, websiteInput)}
                          >Salvar</Button>
                          <Button size="sm" variant="ghost" className="h-8 px-2"
                            onClick={() => { setEditingWebsiteId(null); setWebsiteInput(''); }}
                          >Cancelar</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 max-w-[110px]">
                          {(() => {
                            const domain = sanitizeDomain(company.website || rawData?.domain || null);
                            return domain ? (
                              <a
                                href={`https://${domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline inline-flex items-center gap-1 truncate"
                                onClick={(e) => e.stopPropagation()}
                                title={domain}
                              >
                                {domain}
                                <Globe className="h-3 w-3 flex-shrink-0" />
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            );
                          })()}
                          <Button size="sm" variant="ghost" className="h-7 px-2"
                            onClick={() => { setEditingWebsiteId(company.id); setWebsiteInput(sanitizeDomain(company.website || rawData?.domain || null) || ''); }}
                          >Editar</Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <STCAgent
                                companyId={company.company_id || company.id}
                                companyName={company.razao_social}
                                cnpj={company.cnpj}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p className="font-semibold">STC Agent</p>
                            <p className="text-xs">Assistente de vendas e análise TOTVS</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <QuarantineRowActions
                        company={company}
                        onApprove={handleApproveSingle}
                        onReject={handleRejectSingle}
                        onDelete={handleDeleteSingle}
                        onPreview={handlePreviewSingle}
                        onRefresh={handleRefreshSingle}
                        onEnrichReceita={handleEnrichReceita}
                        onEnrichApollo={handleEnrichApollo}
                        onEnrich360={handleEnrich360}
                        onEnrichCompleto={handleEnrichCompleto}
                        onEnrichTotvsCheck={handleEnrichTotvsCheck}
                        onDiscoverCNPJ={handleDiscoverCNPJ}
                        onRestoreIndividual={async (cnpj) => {
                          // Restaurar empresa individual
                          try {
                            // 1. Buscar empresa descartada
                            const { data: discarded } = await supabase
                              .from('discarded_companies')
                              .select('*')
                              .eq('cnpj', cnpj)
                              .single();
                            
                            if (!discarded) {
                              toast.error('Empresa não encontrada em descartadas');
                              return;
                            }
                            
                            // 2. Verificar se já existe na quarentena
                            const { data: existing } = await supabase
                              .from('icp_analysis_results')
                              .select('id')
                              .eq('cnpj', cnpj)
                              .maybeSingle();
                            
                            if (existing) {
                              // Atualizar status
                              await supabase
                                .from('icp_analysis_results')
                                .update({ status: 'pendente' })
                                .eq('id', existing.id);
                            }
                            
                            // 3. Remover de descartadas
                            await supabase
                              .from('discarded_companies')
                              .delete()
                              .eq('cnpj', cnpj);
                            
                            toast.success('✅ Empresa restaurada!');
                            refetch();
                          } catch (error: any) {
                            console.error('[RESTORE] Erro:', error);
                            toast.error('Erro ao restaurar', { description: error.message });
                          }
                        }}
                        onOpenExecutiveReport={() => {
                          if (company.company_id) {
                            setExecutiveReportCompanyId(company.company_id);
                            setExecutiveReportOpen(true);
                          } else {
                            toast.info('Empresa ainda não possui relatório completo', {
                              description: 'Aprove a empresa primeiro para gerar o relatório executivo'
                            });
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                  
                  {/* 🎨 LINHA EXPANDIDA COM CARD COMPLETO */}
                  {expandedRow === company.id && (
                    <TableRow>
                      <TableCell colSpan={14} className="bg-muted/20 p-0 border-t-0">
                        <ExpandedCompanyCard company={company} />
                      </TableCell>
                    </TableRow>
                  )}
                  </>
                );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <DraggableDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={previewCompany ? 'Preview da Empresa' : 'Preview das Empresas Selecionadas'}
        description={previewCompany 
          ? `Visualizando: ${previewCompany.razao_social}`
          : `${displayCompanies.length} empresa(s) selecionada(s)`
        }
        className="max-w-6xl"
        maxWidth="max-h-[90vh]"
      >
        <div className="space-y-6">
          {displayCompanies.map((company) => (
            <Card key={company.id} className="border-2">
              <CardContent className="pt-6">
                {/* Header Section */}
                <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Empresa</p>
                    <p className="text-xl font-bold">{company.razao_social}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">CNPJ</p>
                    <p className="font-mono text-lg">{company.cnpj}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Score ICP</p>
                    <Badge variant={company.icp_score >= 70 ? 'default' : 'secondary'} className="text-lg px-4 py-1">
                      {company.icp_score} pontos
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Temperatura</p>
                    <div className="flex items-center gap-2">
                      {getTempIcon(company.temperatura)}
                      <Badge variant={getTempBadge(company.temperatura)} className="text-lg px-4 py-1">
                        {company.temperatura?.toUpperCase() || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Status Section */}
                {company.status === 'descartada' && company.motivo_descarte && (
                  <div className="mb-6 p-4 bg-destructive/10 border-l-4 border-destructive rounded">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-destructive mb-1">Empresa Descartada</p>
                        <p className="text-sm">{company.motivo_descarte}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Qualification Reason */}
                {(company as any).motivo_qualificacao && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <p className="text-lg font-semibold">Resumo da Qualificação</p>
                    </div>
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                      <p className="text-sm leading-relaxed">{(company as any).motivo_qualificacao}</p>
                    </div>
                  </div>
                )}

                {/* Analysis Criteria */}
                {(() => {
                  const motivos: string[] = (company as any).motivos || [];
                  const breakdown = (company as any).breakdown || {};
                  const labelMap: Record<string, string> = {
                    web_presence: 'Presença web detectada',
                    news: 'Notícias recentes',
                    tecnologia: 'Tecnologia',
                    cnae: 'CNAE',
                    porte: 'Porte',
                    situacao: 'Situação',
                    localizacao: 'Localização',
                  };
                  const criteriosRaw: string[] = motivos.length > 0
                    ? motivos
                    : Object.keys(breakdown).map(k => labelMap[k] || k);
                  const criterios = Array.from(new Set(criteriosRaw)).filter(Boolean);
                  if (!criterios || criterios.length === 0) return null;
                  return (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Filter className="h-5 w-5 text-primary" />
                        <p className="text-lg font-semibold">Critérios de Análise Aplicados</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {criterios.map((criterio: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 bg-muted/50 p-3 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{criterio}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Buying Intent Signals */}
                {(() => {
                  const ra = (company as any).raw_analysis || {};
                  const sinais = (company as any).sinais_intencao_compra 
                    || ra.intencao_compra?.sinais 
                    || ra.signals 
                    || [];
                  if (!sinais || sinais.length === 0) return null;
                  return (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Flame className="h-5 w-5 text-orange-500" />
                        <p className="text-lg font-semibold">Sinais de Intenção de Compra</p>
                      </div>
                      <div className="space-y-3">
                        {sinais.map((sinal: any, idx: number) => (
                          <div key={idx} className="bg-orange-500/5 border-l-4 border-orange-500 p-4 rounded">
                            <p className="font-medium text-sm mb-1">{sinal?.tipo || 'Sinal Identificado'}</p>
                            <p className="text-sm text-muted-foreground">{sinal?.descricao || sinal?.texto || sinal}</p>
                            {sinal?.fonte && (
                              <a 
                                href={sinal.fonte} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline mt-2 inline-block"
                              >
                                Ver fonte →
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Evidence Section */}
                {(() => {
                  const ra = (company as any).raw_analysis || {};
                  const evidencias = (company as any).evidencias 
                    || (company as any).evidencias_totvs 
                    || ra.evidencias 
                    || [];
                  if (!evidencias || evidencias.length === 0) return null;
                  return (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <p className="text-lg font-semibold">
                          Evidências Coletadas ({evidencias.length})
                        </p>
                      </div>
                      <div className="space-y-3">
                        {evidencias.map((ev: any, idx: number) => (
                          <div key={idx} className="bg-muted/30 p-4 rounded-lg border">
                            <div className="flex items-start justify-between mb-2">
                              <p className="font-semibold text-sm">{ev?.criterio || ev?.fonte_nome || 'Evidência'}</p>
                              {ev?.relevancia && (
                                <Badge variant="outline" className="text-xs">
                                  Relevância: {ev.relevancia}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{ev?.evidencia || ev?.motivo || ev?.descricao || ev}</p>
                            {ev?.fonte_url && (
                              <a 
                                href={ev.fonte_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                              >
                                <span>Ver fonte completa</span>
                                <span>→</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Simple TOTVS Check removido do Preview: Preview deve exibir apenas o rosto/Resumo cadastral da empresa */}

                {/* Competitor Intelligence */}
                {(() => {
                  const ra = (company as any).raw_analysis || {};
                  const tecnologias = (company as any).tecnologias_detectadas || ra.tecnologias || ra.stacks || [];
                  if (!tecnologias || tecnologias.length === 0) return null;
                  return (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Search className="h-5 w-5 text-primary" />
                        <p className="text-lg font-semibold">Tecnologias e Ferramentas Detectadas</p>
                      </div>
                      <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-lg">
                        <div className="flex flex-wrap gap-2">
                          {tecnologias.map((tech: string, idx: number) => (
                            <Badge key={idx} variant="secondary">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                          💡 Oportunidade: Estas tecnologias podem indicar concorrentes diretos ou parceiros potenciais
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Data Sources */}
                {(() => {
                  const ra = (company as any).raw_analysis || {};
                  const fontes = (company as any).fontes_consultadas || ra.fontes || ra.sources || [];
                  if (!fontes || fontes.length === 0) return null;
                  return (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Download className="h-5 w-5 text-primary" />
                        <p className="text-lg font-semibold">Fontes Consultadas</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {fontes.map((fonte: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {fonte}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ))}
        </div>
      </DraggableDialog>

      {/* Reject/Discard Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Descartar Empresa
            </DialogTitle>
            <DialogDescription>
              Você está descartando: <strong>{rejectCompanyData?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Selecione o motivo do descarte:</Label>
              <RadioGroup value={rejectReason} onValueChange={setRejectReason}>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="ja_cliente_totvs" id="ja_cliente" />
                  <Label htmlFor="ja_cliente" className="flex-1 cursor-pointer">
                    ⚠️ Já é cliente TOTVS
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="fora_perfil_icp" id="fora_perfil" />
                  <Label htmlFor="fora_perfil" className="flex-1 cursor-pointer">
                    ❌ Fora do perfil ICP
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="porte_inadequado" id="porte" />
                  <Label htmlFor="porte" className="flex-1 cursor-pointer">
                    📊 Porte inadequado
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="setor_nao_atendido" id="setor" />
                  <Label htmlFor="setor" className="flex-1 cursor-pointer">
                    🏭 Setor não atendido
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="regiao_nao_coberta" id="regiao" />
                  <Label htmlFor="regiao" className="flex-1 cursor-pointer">
                    🗺️ Região não coberta
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="dados_insuficientes" id="dados" />
                  <Label htmlFor="dados" className="flex-1 cursor-pointer">
                    📋 Dados insuficientes
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="outro" id="outro" />
                  <Label htmlFor="outro" className="flex-1 cursor-pointer">
                    ✏️ Outro motivo (especificar)
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {rejectReason === 'outro' && (
              <div className="space-y-2 animate-in fade-in-50 duration-200">
                <Label htmlFor="custom-reason" className="text-sm font-semibold">
                  Descreva o motivo:
                </Label>
                <Textarea
                  id="custom-reason"
                  placeholder="Digite o motivo do descarte..."
                  value={rejectCustomReason}
                  onChange={(e) => setRejectCustomReason(e.target.value)}
                  className="min-h-[100px] resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {rejectCustomReason.length}/500 caracteres
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setRejectModalOpen(false);
                setRejectReason('');
                setRejectCustomReason('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectReason || (rejectReason === 'outro' && !rejectCustomReason.trim())}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Confirmar Descarte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Executive Report Modal */}
      <ExecutiveReportModal 
        open={executiveReportOpen}
        onOpenChange={setExecutiveReportOpen}
        companyId={executiveReportCompanyId}
      />
      
      {/* Discarded Companies Modal */}
      <DiscardedCompaniesModal
        open={showDiscardedModal}
        onOpenChange={setShowDiscardedModal}
      />
      
      {/* ✅ MODAL DE PROGRESSO EM TEMPO REAL */}
      <EnrichmentProgressModal
        open={enrichmentModalOpen}
        onOpenChange={setEnrichmentModalOpen}
        title="Enriquecimento Apollo - Decisores"
        companies={enrichmentProgress}
        onCancel={() => setCancelEnrichment(true)}
        isCancelling={cancelEnrichment}
      />
      
    </div>
  );
}
