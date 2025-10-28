import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

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

/**
 * CICLO 3: Botão "Atualizar agora" para re-enriquecimento on-demand
 * Coleta 100% dos campos + Decisores com paginação completa
 */
export function UpdateNowButton({
  companyId,
  companyName,
  companyDomain,
  apolloOrganizationId,
  onSuccess
}: UpdateNowButtonProps) {
  const [updating, setUpdating] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [orgResults, setOrgResults] = useState<OrgResult[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrgResult | null>(null);
  const handleUpdate = async () => {
    setUpdating(true);
    try {
      // Se já tem apollo_organization_id, fazer enriquecimento completo
      if (apolloOrganizationId) {
        console.log('[UpdateNow] 🔄 Atualizando com Apollo Org ID:', apolloOrganizationId);
        
        const { data, error } = await supabase.functions.invoke('enrich-apollo', {
          body: {
            type: 'ciclo3_enrich_complete',
            companyId,
            apolloOrganizationId
          }
        });

        if (error) throw error;

        const decisorsCount = data?.decisors_saved || 0;
        const fieldsCount = data?.fields_enriched || 0;
        const similarsCount = data?.similar_companies || 0;

        toast.success(`✅ Dados atualizados com sucesso!`, {
          description: `${decisorsCount} decisores · ${fieldsCount} campos · ${similarsCount} similares`
        });
      } else {
        // Se não tem apollo_organization_id, fazer busca/resolução inicial
        console.log('[UpdateNow] 🔍 Buscando empresa no Apollo:', companyName);
        
        const cleanDomain = companyDomain
          ?.replace(/^https?:\/\//i, '')
          .replace(/^www\./i, '')
          .replace(/\/.*$/, '')
          .trim();

        const { data, error } = await supabase.functions.invoke('enrich-apollo', {
          body: {
            type: 'search_organizations',
            name: companyName,
            domain: cleanDomain
          }
        });

        if (error) throw error;

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

      onSuccess?.();
    } catch (error: any) {
      console.error('[UpdateNow] ❌ Erro:', error);
      toast.error("Erro ao atualizar dados da empresa", {
        description: error.message || "Tente novamente mais tarde"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmAssign = async () => {
    if (!selectedOrg) return;
    setUpdating(true);
    try {
      console.log('[UpdateNow] ✅ Atribuindo Apollo Org e enriquecendo:', selectedOrg.id);
      const { data, error } = await supabase.functions.invoke('enrich-apollo', {
        body: {
          type: 'assign_apollo_org',
          companyId,
          apolloOrganizationId: selectedOrg.id
        }
      });
      if (error) throw error;

      const decisorsCount = data?.decisors_saved || data?.decisors_collected || 0;
      const fieldsCount = data?.fields_enriched || 0;
      const similarsCount = data?.similar_companies || 0;

      toast.success('✅ Dados atualizados com sucesso!', {
        description: `${decisorsCount} decisores · ${fieldsCount} campos · ${similarsCount} similares`
      });

      setAssignOpen(false);
      setSelectedOrg(null);
      onSuccess?.();
    } catch (error: any) {
      console.error('[UpdateNow] ❌ Erro ao enriquecer após seleção:', error);
      toast.error('Erro ao enriquecer com Apollo', {
        description: error.message || 'Tente novamente mais tarde'
      });
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
          ? 'Atualizando...' 
          : apolloOrganizationId 
            ? 'Atualizar agora' 
            : 'Enriquecer Apollo'
        }
      </Button>

      <Dialog open={assignOpen} onOpenChange={(open) => { setAssignOpen(open); if (!open) setSelectedOrg(null); }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedOrg ? 'Validar e confirmar' : 'Empresas encontradas no Apollo'}</DialogTitle>
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
                  <img src={selectedOrg.logo_url} alt={`Logo ${selectedOrg.name}`} className="h-10 w-10 rounded-sm object-contain" loading="lazy" />
                ) : (
                  <div className="h-10 w-10 rounded-sm bg-muted" />
                )}
                <div>
                  <div className="text-lg font-semibold">{selectedOrg.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedOrg.primary_domain || selectedOrg.website_url || '—'}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Indústria</div>
                  <div className="font-medium">{selectedOrg.industry || '—'}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Funcionários</div>
                  <div className="font-medium">{selectedOrg.estimated_num_employees ?? '—'}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Local</div>
                  <div className="font-medium">{[selectedOrg.city, selectedOrg.state, selectedOrg.country].filter(Boolean).join(', ') || '—'}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Fundação</div>
                  <div className="font-medium">{selectedOrg.founded_year ?? '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {selectedOrg.website_url && <a href={selectedOrg.website_url} target="_blank" rel="noreferrer" className="text-primary text-sm underline">Abrir site</a>}
                {selectedOrg.linkedin_url && <a href={selectedOrg.linkedin_url} target="_blank" rel="noreferrer" className="text-primary text-sm underline">Abrir LinkedIn</a>}
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
