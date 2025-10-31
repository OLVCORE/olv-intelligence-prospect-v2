import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDeleteQuarantineBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (analysisIds: string[]) => {
      console.log('[DELETE BATCH] Deletando:', analysisIds);

      const { error } = await supabase
        .from('icp_analysis_results')
        .delete()
        .in('id', analysisIds);

      if (error) {
        console.error('[DELETE BATCH] Erro:', error);
        throw error;
      }

      return analysisIds;
    },
    onSuccess: (deletedIds) => {
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
      toast.success(`${deletedIds.length} empresa(s) deletada(s) com sucesso`);
    },
    onError: (error: any) => {
      console.error('[DELETE BATCH] Erro:', error);
      toast.error(`Erro ao deletar empresas: ${error.message}`);
    },
  });
}
