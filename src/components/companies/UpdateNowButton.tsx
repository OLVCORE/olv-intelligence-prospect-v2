import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
        // Se não tem apollo_organization_id, fazer busca inicial
        console.log('[UpdateNow] 🔍 Buscando empresa no Apollo:', companyName);
        
        const cleanDomain = companyDomain
          ?.replace(/^https?:\/\//i, '')
          .replace(/^www\./i, '')
          .replace(/\/.*$/, '')
          .trim();

        const { data, error } = await supabase.functions.invoke('enrich-apollo', {
          body: {
            type: 'enrich_company',
            companyId,
            organizationName: companyName,
            ...(cleanDomain ? { domain: cleanDomain } : {})
          }
        });

        if (error) throw error;

        const count = data?.people_count ?? 0;
        toast.success(`✅ Enriquecimento inicial concluído!`, {
          description: count > 0 
            ? `${count} decisor(es) encontrado(s)` 
            : 'Empresa registrada. Execute novamente para atualizar dados.'
        });
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

  return (
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
  );
}
