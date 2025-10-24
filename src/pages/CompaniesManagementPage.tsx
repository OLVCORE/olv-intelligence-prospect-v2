import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/common/BackButton';
import { BulkUploadDialog } from '@/components/companies/BulkUploadDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { EnrichmentStatusBadge } from '@/components/companies/EnrichmentStatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Search, Edit, Trash2, Zap, Plus, Loader2, Eye, Sparkles, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useCompanies, useDeleteCompany } from '@/hooks/useCompanies';

export default function CompaniesManagementPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'cnpj' | 'industry' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const { data: companiesResult, isLoading: loading, refetch } = useCompanies({
    page,
    pageSize: 50,
    search: searchTerm,
    sortBy,
    sortOrder,
  });
  
  const companies = companiesResult?.data || [];
  const totalCount = companiesResult?.count || 0;
  const totalPages = companiesResult?.totalPages || 0;
  
  const deleteCompany = useDeleteCompany();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<any>(null);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBatchEnriching, setIsBatchEnriching] = useState(false);
  const [isBatchEnriching360, setIsBatchEnriching360] = useState(false);
  const [enrichingReceitaId, setEnrichingReceitaId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!companyToDelete) return;

    try {
      setIsDeleting(true);
      await deleteCompany.mutateAsync(companyToDelete.id);
      toast.success('Empresa excluída com sucesso');
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
      await refetch();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Erro ao excluir empresa');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCompanies.length === 0) return;

    try {
      setIsDeleting(true);
      
      // Delete all selected companies
      for (const companyId of selectedCompanies) {
        await deleteCompany.mutateAsync(companyId);
      }
      
      toast.success(`${selectedCompanies.length} empresa(s) excluída(s) com sucesso`);
      setSelectedCompanies([]);
      await refetch();
    } catch (error) {
      console.error('Error deleting companies:', error);
      toast.error('Erro ao excluir empresas');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedCompanies.length === companies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(companies.map(c => c.id));
    }
  };

  const toggleSelectCompany = (companyId: string) => {
    setSelectedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleEnrich = async (companyId: string) => {
    try {
      setEnrichingId(companyId);
      toast.info('Iniciando análise 360°...');

      const { data, error } = await supabase.functions.invoke('enrich-company-360', {
        body: { company_id: companyId }
      });

      if (error) throw error;

      toast.success('Análise 360° concluída!');
      refetch(); // Recarrega para pegar dados atualizados
    } catch (error) {
      console.error('Error enriching company:', error);
      toast.error('Erro ao executar análise 360°');
    } finally {
      setEnrichingId(null);
    }
  };

  const handleEnrichReceita = async (companyId: string) => {
    try {
      setEnrichingReceitaId(companyId);
      toast.info('Enriquecendo dados da Receita Federal...');

      const { error } = await supabase.functions.invoke('enrich-receitaws', {
        body: { company_id: companyId }
      });

      if (error) throw error;
      toast.success('Dados da Receita Federal atualizados!');
      refetch();
    } catch (error) {
      console.error('Error enriching ReceitaWS:', error);
      toast.error('Erro ao enriquecer com Receita Federal');
    } finally {
      setEnrichingReceitaId(null);
    }
  };

  const handleBatchEnrichReceitaWS = async () => {
    try {
      setIsBatchEnriching(true);
      toast.info('Iniciando enriquecimento em lote com Receita Federal...');

      const { data, error } = await supabase.functions.invoke('batch-enrich-receitaws', {
        body: {}
      });

      if (error) throw error;

      const summary = data?.summary;
      if (summary) {
        toast.success(
          `Enriquecimento concluído! ${summary.enriched} empresas atualizadas, ${summary.skipped} já tinham dados, ${summary.errors} erros.`
        );
      } else {
        toast.success('Enriquecimento em lote concluído!');
      }

      refetch(); // Recarrega para ver os dados atualizados
    } catch (error) {
      console.error('Error batch enriching:', error);
      toast.error('Erro ao executar enriquecimento em lote');
    } finally {
      setIsBatchEnriching(false);
    }
  };

  const handleBatchEnrich360 = async () => {
    try {
      setIsBatchEnriching360(true);
      toast.info('Iniciando enriquecimento 360° em todas as empresas...');

      const { data, error } = await supabase.functions.invoke('trigger-batch-enrichment', {
        body: {}
      });

      if (error) throw error;

      toast.success(
        `Enriquecimento 360° iniciado! ${data?.processed || 0} empresas sendo processadas.`
      );

      refetch();
    } catch (error) {
      console.error('Error batch enriching 360:', error);
      toast.error('Erro ao executar enriquecimento 360°');
    } finally {
      setIsBatchEnriching360(false);
    }
  };

  const handleSort = (field: 'name' | 'cnpj' | 'industry' | 'created_at') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(0); // Reset to first page when sorting
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <BackButton className="mb-2" />
            <h1 className="text-3xl font-bold">Gerenciar Empresas</h1>
            <p className="text-muted-foreground">
              Visualize, edite, exclua e enriqueça empresas cadastradas
            </p>
          </div>
          <div className="flex gap-2">
            <BulkUploadDialog />
            <Button 
              variant="outline" 
              onClick={handleBatchEnrichReceitaWS}
              disabled={isBatchEnriching}
            >
              {isBatchEnriching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Building2 className="h-4 w-4 mr-2" />
              )}
              Enriquecer com Receita Federal
            </Button>
            <Button 
              variant="default" 
              onClick={handleBatchEnrich360}
              disabled={isBatchEnriching360}
            >
              {isBatchEnriching360 ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Enriquecimento 360° Completo
            </Button>
            {selectedCompanies.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Excluir {selectedCompanies.length} selecionada(s)
              </Button>
            )}
            <Button size="lg" onClick={() => navigate('/search')}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>
          </div>
        </div>

        {/* Google Sheets Sync Config removido desta página (agora na tela de Busca) */}

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Empresas
            </CardTitle>
            <CardDescription>
              {totalCount} {totalCount === 1 ? 'empresa cadastrada' : 'empresas cadastradas'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Buscar por nome, CNPJ ou domínio..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0); // Reset to first page when searching
              }}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {companies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/search')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeira Empresa
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedCompanies.length === companies.length && companies.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('name')}
                        className="h-8 flex items-center gap-1"
                      >
                        Empresa
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('cnpj')}
                        className="h-8 flex items-center gap-1"
                      >
                        CNPJ
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('industry')}
                        className="h-8 flex items-center gap-1"
                      >
                        Setor
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>UF/Região</TableHead>
                    <TableHead>Status Análise</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCompanies.includes(company.id)}
                          onCheckedChange={() => toggleSelectCompany(company.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <div>
                            <button
                              onClick={() => navigate(`/company/${company.id}`)}
                              className="font-medium hover:text-primary hover:underline text-left"
                            >
                              {company.name}
                            </button>
                            {company.domain && (
                              <p className="text-xs text-muted-foreground">{company.domain}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.cnpj ? (
                          <Badge variant="outline">{company.cnpj}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.industry || <span className="text-xs text-muted-foreground">N/A</span>}
                      </TableCell>
                      <TableCell>
                        {(company.location as any)?.state ? (
                          <Badge variant="secondary">{(company.location as any).state}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <EnrichmentStatusBadge companyId={company.id} showProgress />
                      </TableCell>
                      <TableCell>
                        {company.website ? (
                          <a
                            href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {company.website}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/company/${company.id}`)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/search?companyId=${company.id}`)}
                            title="Editar/Salvar Dados"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEnrichReceita(company.id)}
                            disabled={enrichingReceitaId === company.id}
                            title="Enriquecer Receita Federal"
                          >
                            {enrichingReceitaId === company.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Building2 className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEnrich(company.id)}
                            disabled={enrichingId === company.id}
                            title="Executar análise 360°"
                          >
                            {enrichingId === company.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCompanyToDelete(company);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive hover:text-destructive"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {/* Paginação */}
            {companies.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {page * 50 + 1} - {Math.min((page + 1) * 50, totalCount)} de {totalCount}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1 px-2">
                    <span className="text-sm">
                      Página {page + 1} de {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir <strong>{companyToDelete?.name}</strong>?
                Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
