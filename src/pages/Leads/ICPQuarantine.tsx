import { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Flame, Thermometer, Snowflake, Download, Filter, Search, RefreshCw, FileText, Globe, ArrowUpDown, Loader2, AlertCircle } from 'lucide-react';
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
import { QuarantineActionsMenu } from '@/components/icp/QuarantineActionsMenu';
import { QuarantineRowActions } from '@/components/icp/QuarantineRowActions';
import TOTVSCheckCard from '@/components/totvs/TOTVSCheckCard';
import { STCAgent } from '@/components/intelligence/STCAgent';
import { QuarantineEnrichmentStatusBadge } from '@/components/icp/QuarantineEnrichmentStatusBadge';
import { QuarantineCNPJStatusBadge } from '@/components/icp/QuarantineCNPJStatusBadge';
import { ICPScoreTooltip } from '@/components/icp/ICPScoreTooltip';
import { toast } from 'sonner';
import * as Papa from 'papaparse';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollControls } from '@/components/common/ScrollControls';
import { ExecutiveReportModal } from '@/components/reports/ExecutiveReportModal';

export default function ICPQuarantine() {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('pendente');
  const [tempFilter, setTempFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  // Mutations para enriquecimento na quarentena
  const enrichReceitaMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { data: analysis } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (!analysis?.cnpj) throw new Error('CNPJ não disponível');

      // Chamar com apenas CNPJ (sem company_id)
      const { data, error } = await supabase.functions.invoke('enrich-company-receita', {
        body: { cnpj: analysis.cnpj },
      });

      if (error) throw error;

      // Atualizar dados na quarentena
      const rawData = (analysis.raw_analysis && typeof analysis.raw_analysis === 'object' && !Array.isArray(analysis.raw_analysis)) 
        ? analysis.raw_analysis as Record<string, any>
        : {};

      const { error: updateError } = await supabase
        .from('icp_analysis_results')
        .update({
          raw_analysis: {
            ...rawData,
            receita_federal: data,
          },
        })
        .eq('id', analysisId);

      if (updateError) throw updateError;

      // CRÍTICO: Chamar função SQL para recalcular score após enriquecimento
      const { error: scoreError } = await supabase.rpc('calculate_icp_score_quarantine', {
        p_analysis_id: analysisId
      });

      if (scoreError) console.error('Erro ao recalcular score:', scoreError);

      // Se tem company_id, atualizar cnpj_status baseado na situação
      if (analysis.company_id && data?.data?.situacao) {
        const cnpjStatus = data.data.situacao.toLowerCase().includes('ativa') 
          ? 'ativa' 
          : data.data.situacao.toLowerCase().includes('inapta') 
          ? 'inativo' 
          : 'pendente';

        await supabase
          .from('companies')
          .update({ cnpj_status: cnpjStatus })
          .eq('id', analysis.company_id);
      }

      return data;
    },
    onSuccess: () => {
      toast.success('✅ Receita Federal atualizada - Score recalculado', {
        description: 'Campos UF, Setor e Porte foram atualizados'
      });
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao enriquecer com Receita Federal', {
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

      const rawData = (analysis.raw_analysis && typeof analysis.raw_analysis === 'object' && !Array.isArray(analysis.raw_analysis)) 
        ? analysis.raw_analysis as Record<string, any>
        : {};

      const { data, error } = await supabase.functions.invoke('enrich-apollo', {
        body: { 
          type: 'search_organizations',
          name: analysis.razao_social,
          domain: rawData.domain || analysis.website || '',
        },
      });

      if (error) throw error;

      // Extrair website do Apollo se disponível
      let websiteUpdate = {};
      if (data?.organization?.website_url) {
        websiteUpdate = { website: data.organization.website_url };
      }

      await supabase
        .from('icp_analysis_results')
        .update({
          ...websiteUpdate,
          raw_analysis: {
            ...rawData,
            apollo: data,
          },
        })
        .eq('id', analysisId);

      // Recalcular score após Apollo
      await supabase.rpc('calculate_icp_score_quarantine', {
        p_analysis_id: analysisId
      });

      return data;
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

      const rawData = (analysis.raw_analysis && typeof analysis.raw_analysis === 'object' && !Array.isArray(analysis.raw_analysis)) 
        ? analysis.raw_analysis as Record<string, any>
        : {};

      // Progresso: 1/5 - Verificando empresa
      toast.loading('Enriquecimento 360° iniciado...', { id: '360-progress' });

      // Se já tem company_id linkado, usar. Senão criar empresa primeiro
      let companyId = analysis.company_id;
      
      if (!companyId && analysis.cnpj) {
        // Verificar se empresa já existe pelo CNPJ
        const { data: existing } = await supabase
          .from('companies')
          .select('id')
          .eq('cnpj', analysis.cnpj)
          .maybeSingle();
        
        if (existing) {
          companyId = existing.id;
          await supabase
            .from('icp_analysis_results')
            .update({ company_id: companyId })
            .eq('id', analysisId);
        } else {
          // Criar empresa
          const { data: newCompany, error: createError } = await supabase
            .from('companies')
            .insert({
              name: analysis.razao_social,
              cnpj: analysis.cnpj,
              domain: rawData.domain || analysis.website || null,
              website: rawData.domain || analysis.website || null,
            })
            .select('id')
            .single();
          
          if (createError) throw createError;
          companyId = newCompany.id;
          
          // Linkar empresa ao registro da quarentena
          await supabase
            .from('icp_analysis_results')
            .update({ company_id: companyId })
            .eq('id', analysisId);
        }
      }
      
      if (!companyId) throw new Error('Impossível criar/encontrar empresa');

      // Progresso: 2/5 - Enriquecendo dados
      toast.loading('Executando enriquecimento 360°... (2/5)', { id: '360-progress' });

      const { data, error } = await supabase.functions.invoke('enrich-company-360', {
        body: { company_id: companyId },
      });

      if (error) throw error;

      // Progresso: 3/5 - Salvando dados
      toast.loading('Salvando dados enriquecidos... (3/5)', { id: '360-progress' });

      await supabase
        .from('icp_analysis_results')
        .update({
          raw_analysis: {
            ...rawData,
            enrichment_360: data,
          },
        })
        .eq('id', analysisId);

      // Progresso: 4/5 - Recalculando score
      toast.loading('Recalculando Score ICP... (4/5)', { id: '360-progress' });

      await supabase.rpc('calculate_icp_score_quarantine', {
        p_analysis_id: analysisId
      });

      toast.dismiss('360-progress');

      return data;
    },
    onSuccess: () => {
      toast.success('✅ Enriquecimento 360° concluído com sucesso!', {
        description: 'Todos os dados foram atualizados e o score foi recalculado'
      });
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
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
    .filter(c => 
      c.razao_social?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cnpj?.includes(searchQuery)
    )
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
    
    toast.loading(`Enriquecendo ${selectedIds.length} empresa(s) com Apollo...`, { id: 'bulk-apollo' });
    
    let success = 0;
    let errors = 0;
    
    for (const id of selectedIds) {
      try {
        await enrichApolloMutation.mutateAsync(id);
        success++;
      } catch (error) {
        errors++;
        console.error(`Erro ao enriquecer ${id}:`, error);
      }
    }
    
    toast.dismiss('bulk-apollo');
    if (errors === 0) {
      toast.success(`✅ ${success} empresa(s) enriquecida(s) com Apollo!`);
    } else {
      toast.warning(`Concluído: ${success} sucesso, ${errors} erro(s)`);
    }
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
    
    toast.loading(`Executando TOTVS Check em ${selectedIds.length} empresa(s)...`, { id: 'bulk-totvs' });
    
    let success = 0;
    let errors = 0;
    
    for (const id of selectedIds) {
      try {
        await enrichTotvsCheckMutation.mutateAsync(id);
        success++;
      } catch (error) {
        errors++;
        console.error(`Erro no TOTVS Check ${id}:`, error);
      }
    }
    
    toast.dismiss('bulk-totvs');
    if (errors === 0) {
      toast.success(`✅ TOTVS Check concluído em ${success} empresa(s)!`);
    } else {
      toast.warning(`Concluído: ${success} sucesso, ${errors} erro(s)`);
    }
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
      `Tem certeza que deseja aprovar ${selectedIds.length} empresa(s) e movê-las para o pool de leads?`
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
    <div className="container mx-auto p-6 space-y-6">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{companies.filter(c => c.status === 'pendente').length}</div>
            <p className="text-sm text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-500">{companies.filter(c => c.temperatura === 'hot').length}</div>
            <p className="text-sm text-muted-foreground">Hot Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{companies.filter(c => c.status === 'aprovada').length}</div>
            <p className="text-sm text-muted-foreground">Aprovadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{companies.filter(c => c.status === 'descartada').length}</div>
            <p className="text-sm text-muted-foreground">Descartadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ações em Lote</CardTitle>
              <CardDescription>
                {selectedIds.length > 0 ? `${selectedIds.length} empresas selecionadas` : 'Selecione empresas para ações em lote'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
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
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleAutoApprove}
                      disabled={isAutoApproving}
                      variant="outline"
                    >
                      {isAutoApproving ? 'Aprovando...' : 'Auto-aprovar Hot Leads (70+)'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Detecta hot leads e aprova automaticamente</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleApproveBatch}
                      disabled={selectedIds.length === 0 || isApproving}
                      variant="default"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isApproving ? 'Aprovando...' : `Aprovar ${selectedIds.length || ''}`}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Aprovar selecionadas e mover para o Pool</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => refetch()}
                      disabled={isLoading}
                      aria-label="Atualizar"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Forçar atualização da página</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CNPJ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
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
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto w-full">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[44px]">
                    <Checkbox
                      checked={selectedIds.length === filteredCompanies.length && filteredCompanies.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="min-w-[220px] max-w-[260px]">
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
                  <TableHead className="min-w-[130px]">
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
                  <TableHead className="min-w-[100px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('cnpj_status')}
                      className="h-8 flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors group"
                    >
                      <span className="font-semibold">Status CNPJ</span>
                      <ArrowUpDown className={`h-4 w-4 transition-colors ${sortColumn === 'cnpj_status' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[100px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('setor')}
                      className="h-8 flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors group"
                    >
                      <span className="font-semibold">Setor</span>
                      <ArrowUpDown className={`h-4 w-4 transition-colors ${sortColumn === 'setor' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[90px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('uf')}
                      className="h-8 flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors group"
                    >
                      <span className="font-semibold">UF/Região</span>
                      <ArrowUpDown className={`h-4 w-4 transition-colors ${sortColumn === 'uf' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[80px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('score')}
                      className="h-8 flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors group"
                    >
                      <span className="font-semibold">Score ICP</span>
                      <ArrowUpDown className={`h-4 w-4 transition-colors ${sortColumn === 'score' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[90px]"><span className="font-semibold">Status Análise</span></TableHead>
                  <TableHead className="min-w-[110px]"><span className="font-semibold">Website</span></TableHead>
                  <TableHead className="min-w-[60px]"><span className="font-semibold">Agent</span></TableHead>
                  <TableHead className="w-[50px]"><span className="font-semibold">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                    Nenhuma empresa encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((company) => {
                  const rawData = (company.raw_analysis && typeof company.raw_analysis === 'object' && !Array.isArray(company.raw_analysis)) 
                    ? company.raw_analysis as Record<string, any>
                    : {};
                  
                  return (
                  <TableRow key={company.id}>
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
                    <TableCell>
                      <QuarantineCNPJStatusBadge 
                        cnpj={company.cnpj} 
                        cnpjStatus={company.cnpj_status}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="max-w-[100px]">
                        {company.setor ? (
                          <span className="text-sm line-clamp-2 leading-snug" title={company.setor}>
                            {company.setor}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Não identificado</span>
                        )}
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
                        showProgress
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
                            <div>
                              <STCAgent
                                companyId={company.id}
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
                        onEnrichTotvsCheck={handleEnrichTotvsCheck}
                        onDiscoverCNPJ={handleDiscoverCNPJ}
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
                );
                })
              )}
            </TableBody>
          </Table>
          </div>
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
      
      <ScrollControls />
    </div>
  );
}
