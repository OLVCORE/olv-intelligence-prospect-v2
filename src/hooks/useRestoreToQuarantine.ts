import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useRestoreToQuarantine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (discardedCompanyId: string) => {
      // 1. Buscar dados da empresa descartada
      const { data: discarded, error: fetchError } = await supabase
        .from('discarded_companies')
        .select('*')
        .eq('id', discardedCompanyId)
        .single();

      if (fetchError) throw fetchError;
      if (!discarded) throw new Error('Empresa descartada não encontrada');

      // 2. Restaurar para icp_analysis_results
      const { error: insertError } = await supabase
        .from('icp_analysis_results')
        .insert({
          company_id: discarded.company_id || null,
          cnpj: discarded.cnpj,
          razao_social: discarded.company_name,
          icp_score: discarded.original_icp_score || 50,
          temperatura: discarded.original_icp_temperature || 'cold',
          status: 'pendente',
          motivo_descarte: null,
          raw_analysis: {},
        });

      if (insertError) throw insertError;

      // 3. Remover de discarded_companies
      const { error: deleteError } = await supabase
        .from('discarded_companies')
        .delete()
        .eq('id', discardedCompanyId);

      if (deleteError) throw deleteError;

      // 4. Atualizar status da empresa se existir company_id
      if (discarded.company_id) {
        await supabase
          .from('companies')
          .update({
            is_disqualified: false,
            disqualification_reason: null,
          })
          .eq('id', discarded.company_id);
      }

      return discarded;
    },
    onSuccess: (data) => {
      toast.success(`✅ ${data.company_name} restaurada para quarentena`);
      queryClient.invalidateQueries({ queryKey: ['discarded-companies'] });
      queryClient.invalidateQueries({ queryKey: ['discarded-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao restaurar empresa', {
        description: error.message,
      });
    },
  });
}
