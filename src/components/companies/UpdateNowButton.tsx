import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpdateNowButtonProps {
  companyId: string;
  apolloOrganizationId?: string;
  onSuccess?: () => void;
}

/**
 * CICLO 3: Botão "Atualizar agora" para re-enriquecimento on-demand
 * Coleta 100% dos campos + Decisores com paginação completa
 */
export function UpdateNowButton({
  companyId,
  apolloOrganizationId,
  onSuccess
}: UpdateNowButtonProps) {
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    if (!apolloOrganizationId) {
      toast.error("Apollo Organization ID não encontrado");
      return;
    }

    setUpdating(true);
    try {
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

      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao atualizar dados:', error);
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
      disabled={updating || !apolloOrganizationId}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
      {updating ? 'Atualizando...' : 'Atualizar agora'}
    </Button>
  );
}
