import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type OrgResult = {
  id: string;
  name: string;
  primary_domain?: string | null;
  website_url?: string | null;
  linkedin_url?: string | null;
  logo_url?: string | null;
  industry?: string | null;
  industries?: string[] | null;
  secondary_industries?: string[] | null;
  keywords?: string[] | null;
  estimated_num_employees?: number | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  founded_year?: number | null;
  description?: string | null;
};

interface UpdateNowButtonProps {
  companyId: string;
  companyName: string;
  companyDomain?: string;
  apolloOrganizationId?: string;
  onSuccess?: () => void;
}

export function UpdateNowButton({
  companyId,
  companyName,
  companyDomain,
  apolloOrganizationId,
  onSuccess
}: UpdateNowButtonProps) {
  const [updating, setUpdating] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [orgResults, setOrgResults] = useState<OrgResult[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrgResult | null>(null);
  const [estimate, setEstimate] = useState<any>(null);
  const [creditsAvailable, setCreditsAvailable] = useState<number>(0);

  const invokeEnrichApollo = async (payload: any) => {
    const { data, error } = await supabase.functions.invoke('enrich-apollo', {
      body: payload,
    });
    if (error) throw error;
    return data as any;
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      // Se já tem apollo_organization_id, fazer estimativa primeiro
      if (apolloOrganizationId) {
        console.log('[UpdateNow] 🔄 Estimando créditos para:', apolloOrganizationId);
        
        const dryRunData = await invokeEnrichApollo({
          organization_id: apolloOrganizationId,
          company_id: companyId,
          modes: ['company', 'people', 'similar'],
          dry_run: true
        });

        setEstimate(dryRunData.estimate);
        setCreditsAvailable(dryRunData.creditsAvailable || 0);
        setConfirmOpen(true);

        if (dryRunData.creditWarning) {
          toast.warning(dryRunData.creditWarning);
        }
      } else {
        // Se não tem apollo_organization_id, fazer busca/resolução inicial
        console.log('[UpdateNow] 🔍 Buscando empresa no Apollo:', companyName);
        
        const cleanDomain = companyDomain
          ?.replace(/^https?:\/\//i, '')
          .replace(/^www\./i, '')
          .replace(/\/.*$/, '')
          .trim();

        const data = await invokeEnrichApollo({
          type: 'search_organizations',
          name: companyName,
          domain: cleanDomain,
        });

        const orgs = (data?.organizations ?? []) as OrgResult[];
        const total = data?.total ?? orgs.length ?? 0;
        if (total > 0) {
          setOrgResults(orgs);
          setAssignOpen(true);
          toast.success(`✅ Empresas encontradas no Apollo (${total})`, {
            description: `${orgs[0].name}${orgs[0].primary_domain ? ' · ' + orgs[0].primary_domain : ''}`
          });
        } else {
          toast.warning('Empresa não encontrada no Apollo', {
            description: 'Tente ajustar o nome ou domínio da empresa'
          });
        }
      }
    } catch (error: any) {
      console.error('[UpdateNow] ❌ Erro:', error);
      if (error instanceof FunctionsHttpError) {
        try {
          // @ts-ignore
          const detail = await (error as any)?.context?.response?.json();
          
          if (detail?.error === 'insufficient_credits') {
            toast.error('❌ Créditos insuficientes', { 
              description: detail.hint || 'Faça upgrade do plano Apollo para continuar.' 
            });
          } else {
            toast.error('Erro ao atualizar dados da empresa', { 
              description: detail?.error || detail?.message || 'Falha na função' 
            });
          }
        } catch {
          toast.error('Erro ao atualizar dados da empresa', { description: 'Falha na função' });
        }
      } else {
        toast.error('Erro ao atualizar dados da empresa', {
          description: error.message || 'Tente novamente mais tarde'
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmUpdate = async () => {
    if (!apolloOrganizationId) return;
    
    setConfirmOpen(false);
    setUpdating(true);
    
    try {
      console.log('[UpdateNow] ✅ Executando enriquecimento:', apolloOrganizationId);
      
      const data = await invokeEnrichApollo({
        organization_id: apolloOrganizationId,
        company_id: companyId,
        modes: ['company', 'people', 'similar'],
        force: true
      });

      const peopleCount = data?.peopleLinked || 0;
      const fieldsCount = data?.companyFieldsCount || data?.companyFields?.length || 0;
      const similarsCount = data?.similarLinked || 0;
      const creditsUsed = data?.actualCreditsConsumed || 0;

      toast.success(`✅ Dados atualizados com sucesso!`, {
        description: `${fieldsCount} campos · ${peopleCount} decisores · ${similarsCount} similares · ${creditsUsed} créditos`
      });

      if (data?.creditWarning) {
        toast.warning(data.creditWarning);
      }

      onSuccess?.();
    } catch (error: any) {
      console.error('[UpdateNow] ❌ Erro:', error);
      if (error instanceof FunctionsHttpError) {
        try {
          // @ts-ignore
          const detail = await (error as any)?.context?.response?.json();
          
          if (detail?.error === 'insufficient_credits') {
            toast.error('❌ Créditos insuficientes', { 
              description: detail.hint || 'Faça upgrade do plano Apollo para continuar.' 
            });
          } else {
            toast.error('Erro ao atualizar dados da empresa', { 
              description: detail?.error || detail?.message || 'Falha na função' 
            });
          }
        } catch {
          toast.error('Erro ao atualizar dados da empresa', { description: 'Falha na função' });
        }
      } else {
        toast.error('Erro ao atualizar dados da empresa', {
          description: error.message || 'Tente novamente mais tarde'
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmAssign = async () => {
    if (!selectedOrg) return;
    setUpdating(true);
    try {
      console.log('[UpdateNow] ✅ Atribuindo Apollo Org e enriquecendo:', selectedOrg.id);
      
      // 1) Atualizar o apollo_organization_id na empresa
      const { error: updateError } = await supabase
        .from('companies')
        .update({ apollo_organization_id: selectedOrg.id })
        .eq('id', companyId);

      if (updateError) {
        throw new Error('Erro ao atribuir organização: ' + updateError.message);
      }

      // 2) Disparar enriquecimento completo (company, people, similar)
      const enriched = await invokeEnrichApollo({
        organization_id: selectedOrg.id,
        company_id: companyId,
        modes: ['company', 'people', 'similar'],
        force: true
      });

      const peopleCount = enriched?.peopleLinked || 0;
      const fieldsCount = enriched?.companyFieldsCount || enriched?.companyFields?.length || 0;
      const similarsCount = enriched?.similarLinked || 0;
      const creditsUsed = enriched?.actualCreditsConsumed || 0;

      toast.success('✅ Dados atualizados com sucesso!', {
        description: `${fieldsCount} campos · ${peopleCount} decisores · ${similarsCount} similares · ${creditsUsed} créditos`
      });

      if (enriched?.creditWarning) {
        toast.warning(enriched.creditWarning);
      }

      setAssignOpen(false);
      setSelectedOrg(null);
      onSuccess?.();
    } catch (error: any) {
      console.error('[UpdateNow] ❌ Erro ao enriquecer após seleção:', error);
      if (error instanceof FunctionsHttpError) {
        try {
          // @ts-ignore
          const detail = await (error as any)?.context?.response?.json();
          toast.error('Erro ao enriquecer com Apollo', { description: detail?.error || detail?.message || 'Falha na função' });
        } catch {
          toast.error('Erro ao enriquecer com Apollo', { description: 'Falha na função' });
        }
      } else if (error?.message === 'auth_required') {
        toast.error('Sessão expirada. Faça login para continuar.');
      } else {
        toast.error('Erro ao enriquecer com Apollo', {
          description: error?.message || 'Tente novamente mais tarde'
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleUpdate}
        disabled={updating}
        variant="outline"
        size="sm"
        className="gap-2 hover-scale"
      >
        <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
        {updating 
          ? 'Processando...' 
          : apolloOrganizationId 
            ? 'Atualizar agora' 
            : 'Enriquecer Apollo'
        }
      </Button>

      {/* Modal de Confirmação com Estimativa */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Atualização</AlertDialogTitle>
            <AlertDialogDescription>
              Esta operação consumirá aproximadamente:
              <div className="mt-4 space-y-2 p-4 bg-muted rounded-md">
                <div className="flex justify-between">
                  <span>🏢 Company:</span>
                  <strong>{estimate?.company || 0} crédito(s)</strong>
                </div>
                <div className="flex justify-between">
                  <span>👥 People:</span>
                  <strong>{estimate?.people || 0} crédito(s)</strong>
                </div>
                <div className="flex justify-between">
                  <span>🔗 Similar:</span>
                  <strong>{estimate?.similar || 0} crédito(s)</strong>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Total:</span>
                  <strong className="text-lg">{estimate?.total || 0} crédito(s)</strong>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Créditos disponíveis:</span>
                  <span className="text-sm font-medium">{creditsAvailable}</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Deseja continuar?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUpdate}>
              Confirmar e Atualizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Seleção de Organização */}
      <Dialog open={assignOpen} onOpenChange={(open) => { setAssignOpen(open); if (!open) setSelectedOrg(null); }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedOrg ? 'Validar e confirmar' : 'Empresas encontradas no Apollo'}</DialogTitle>
            <DialogDescription>Selecione a empresa do Apollo para atribuir e enriquecer. Revise os dados antes de confirmar.</DialogDescription>
          </DialogHeader>

          {!selectedOrg ? (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {orgResults.map((org) => (
                <div key={org.id} className="border rounded-md p-3 bg-background">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {org.logo_url ? (
                        <img src={org.logo_url} alt={`Logo ${org.name}`} className="h-8 w-8 rounded-sm object-contain" loading="lazy" />
                      ) : (
                        <div className="h-8 w-8 rounded-sm bg-muted" />
                      )}
                      <div>
                        <div className="font-medium">{org.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {org.primary_domain || org.website_url || '—'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(org.industry || 'Indústria não informada')} • {(org.estimated_num_employees ? `${org.estimated_num_employees} funcionários` : '—')} • { [org.city, org.state, org.country].filter(Boolean).join(', ') || 'Local não informado' }
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {org.website_url && <a href={org.website_url} target="_blank" rel="noreferrer" className="text-primary text-sm underline">Site</a>}
                      {org.linkedin_url && <a href={org.linkedin_url} target="_blank" rel="noreferrer" className="text-primary text-sm underline">LinkedIn</a>}
                      <Button size="sm" onClick={() => setSelectedOrg(org)}>Selecionar</Button>
                    </div>
                  </div>
                </div>
              ))}
              {orgResults.length === 0 && (
                <div className="text-sm text-muted-foreground">Nenhum resultado para exibir.</div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {selectedOrg.logo_url ? (
                  <img src={selectedOrg.logo_url} alt={`Logo ${selectedOrg.name}`} className="h-12 w-12 rounded-sm object-contain" loading="lazy" />
                ) : (
                  <div className="h-12 w-12 rounded-sm bg-muted" />
                )}
                <div>
                  <div className="text-lg font-semibold">{selectedOrg.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedOrg.primary_domain || selectedOrg.website_url || '—'}</div>
                </div>
              </div>

              {selectedOrg.description && (
                <div className="rounded-md border p-3">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Descrição da Empresa</div>
                  <div className="text-sm">{selectedOrg.description}</div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Indústria Principal</div>
                  <div className="font-medium">{selectedOrg.industry || '—'}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Funcionários</div>
                  <div className="font-medium">{selectedOrg.estimated_num_employees ?? '—'}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Localização</div>
                  <div className="font-medium">{[selectedOrg.city, selectedOrg.state, selectedOrg.country].filter(Boolean).join(', ') || '—'}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Ano de Fundação</div>
                  <div className="font-medium">{selectedOrg.founded_year ?? '—'}</div>
                </div>
              </div>

              {selectedOrg.industries && selectedOrg.industries.length > 0 && (
                <div className="rounded-md border p-3">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Indústrias</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedOrg.industries.map((ind, idx) => (
                      <span key={idx} className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrg.secondary_industries && selectedOrg.secondary_industries.length > 0 && (
                <div className="rounded-md border p-3">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Indústrias Secundárias</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedOrg.secondary_industries.map((ind, idx) => (
                      <span key={idx} className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrg.keywords && selectedOrg.keywords.length > 0 && (
                <div className="rounded-md border p-3">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Palavras-chave</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedOrg.keywords.slice(0, 12).map((kw, idx) => (
                      <span key={idx} className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-1 text-xs">
                        {kw}
                      </span>
                    ))}
                    {selectedOrg.keywords.length > 12 && (
                      <span className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-1 text-xs font-medium">
                        +{selectedOrg.keywords.length - 12} mais
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                {selectedOrg.website_url && (
                  <a href={selectedOrg.website_url} target="_blank" rel="noreferrer" className="text-primary text-sm underline">
                    Abrir site
                  </a>
                )}
                {selectedOrg.linkedin_url && (
                  <a href={selectedOrg.linkedin_url} target="_blank" rel="noreferrer" className="text-primary text-sm underline">
                    Abrir LinkedIn
                  </a>
                )}
                {selectedOrg.id && (
                  <a href={`https://app.apollo.io/#/organizations/${selectedOrg.id}`} target="_blank" rel="noreferrer" className="text-primary text-sm underline">
                    Ver no Apollo
                  </a>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Revise as informações e confirme para atribuir e iniciar o enriquecimento completo com Apollo.
              </div>
            </div>
          )}

          <DialogFooter>
            {!selectedOrg ? (
              <Button variant="outline" onClick={() => setAssignOpen(false)}>Fechar</Button>
            ) : (
              <div className="flex w-full items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedOrg(null)}>Voltar</Button>
                <Button onClick={handleConfirmAssign} disabled={updating} className="gap-2">
                  <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
                  {updating ? 'Enriquecendo...' : 'Atribuir & Enriquecer'}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
