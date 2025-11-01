import { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Flame, Thermometer, Snowflake, Download, Filter, Search, RefreshCw, FileText, Globe } from 'lucide-react';
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
import { QuarantineActionsMenu } from '@/components/icp/QuarantineActionsMenu';
import { QuarantineRowActions } from '@/components/icp/QuarantineRowActions';
import { SimpleTOTVSCheckCard } from '@/components/intelligence/SimpleTOTVSCheckCard';
import { SimpleTOTVSCheckStatusBadge } from '@/components/icp/SimpleTOTVSCheckStatusBadge';
import { QuarantineEnrichmentStatusBadge } from '@/components/icp/QuarantineEnrichmentStatusBadge';
import { QuarantineCNPJStatusBadge } from '@/components/icp/QuarantineCNPJStatusBadge';
import { toast } from 'sonner';
import * as Papa from 'papaparse';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
export default function ICPQuarantine() {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('pendente');
  const [tempFilter, setTempFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCompany, setPreviewCompany] = useState<any>(null);

  const { data: companies = [], isLoading, refetch } = useQuarantineCompanies({
    status: statusFilter === 'all' ? undefined : statusFilter,
    temperatura: tempFilter === 'all' ? undefined : (tempFilter as any),
  });

  const { mutate: approveBatch, isPending: isApproving } = useApproveQuarantineBatch();
  const { mutate: rejectCompany } = useRejectQuarantine();
  const { mutate: autoApprove, isPending: isAutoApproving } = useAutoApprove();
  const { mutate: deleteBatch, isPending: isDeleting } = useDeleteQuarantineBatch();
  const { mutate: refreshBatch, isPending: isRefreshing } = useRefreshQuarantineBatch();

  const queryClient = useQueryClient();

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
      return data;
    },
    onSuccess: () => {
      toast.success('Dados da Receita Federal atualizados');
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
          domain: rawData.domain || '',
        },
      });

      if (error) throw error;

      await supabase
        .from('icp_analysis_results')
        .update({
          raw_analysis: {
            ...rawData,
            apollo: data,
          },
        })
        .eq('id', analysisId);

      return data;
    },
    onSuccess: () => {
      toast.success('Dados do Apollo atualizados');
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
        } else {
          // Criar empresa
          const { data: newCompany, error: createError } = await supabase
            .from('companies')
            .insert({
              name: analysis.razao_social,
              cnpj: analysis.cnpj,
              domain: rawData.domain || null,
              website: rawData.domain || null,
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

      const { data, error } = await supabase.functions.invoke('enrich-company-360', {
        body: { company_id: companyId },
      });

      if (error) throw error;

      await supabase
        .from('icp_analysis_results')
        .update({
          raw_analysis: {
            ...rawData,
            enrichment_360: data,
          },
        })
        .eq('id', analysisId);

      return data;
    },
    onSuccess: () => {
      toast.success('Enriquecimento 360° concluído');
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
    },
    onError: (error: any) => {
      toast.error('Erro no enriquecimento 360°', {
        description: error.message,
      });
    },
  });

  const filteredCompanies = companies.filter(c => 
    c.razao_social?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.cnpj?.includes(searchQuery)
  );

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
    rejectCompany({ analysisId: id, motivo });
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

  // ECONODATA: Desabilitado - fase 2
  /* const handleEnrichEconodata = async (id: string) => {
    return enrichEconodataMutation.mutateAsync(id);
  }; */

  const handleEnrich360 = async (id: string) => {
    return enrich360Mutation.mutateAsync(id);
  };

  const handleDiscoverCNPJ = (id: string) => {
    toast.info('Funcionalidade de descoberta de CNPJ em desenvolvimento');
    // TODO: Implementar descoberta de CNPJ via APIs
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
                isProcessing={isApproving || isDeleting || isRefreshing}
                selectedItems={companies.filter(c => selectedIds.includes(c.id))}
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
                      aria-label="Atualizar"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Atualizar</TooltipContent>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === filteredCompanies.length && filteredCompanies.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Status CNPJ</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>UF/Região</TableHead>
                <TableHead>Score ICP</TableHead>
                <TableHead>Status Análise</TableHead>
                <TableHead>Status (STC)</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Motivo Descarte</TableHead>
                <TableHead>Ações</TableHead>
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
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{company.razao_social}</span>
                        {rawData?.domain && (
                          <span className="text-xs text-muted-foreground">{rawData.domain}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.cnpj ? (
                        <Badge variant="outline" className="font-mono text-xs">
                          {company.cnpj}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <QuarantineCNPJStatusBadge 
                        cnpj={company.cnpj} 
                        cnpjStatus={(company as any).cnpj_status}
                      />
                    </TableCell>
                    <TableCell>
                      {(company as any).setor || rawData?.setor || (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(company as any).uf || rawData?.uf ? (
                        <Badge variant="secondary">
                          {(company as any).uf || rawData?.uf}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={company.icp_score >= 70 ? 'default' : 'secondary'}>
                        {company.icp_score}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <QuarantineEnrichmentStatusBadge 
                        rawAnalysis={rawData}
                        showProgress
                      />
                    </TableCell>
                    <TableCell>
                      <SimpleTOTVSCheckStatusBadge
                        companyId={company.id}
                        onViewReport={() => handleOpenTotvsCheck(company)}
                      />
                    </TableCell>
                    <TableCell>
                      {rawData?.domain || company.website ? (
                        <a
                          href={`https://${(rawData?.domain || company.website).replace(/^https?:\/\//, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(rawData?.domain || company.website).replace(/^https?:\/\//, '').replace(/^www\./, '')}
                          <Globe className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.motivo_descarte ? (
                        <span className="text-xs text-muted-foreground">
                          {company.motivo_descarte}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
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
                        onDiscoverCNPJ={handleDiscoverCNPJ}
                      />
                    </TableCell>
                  </TableRow>
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
    </div>
  );
}
