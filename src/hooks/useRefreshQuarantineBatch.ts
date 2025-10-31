import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RefreshItem {
  id: string;
  razao_social?: string | null;
  cnpj?: string | null;
}

export function useRefreshQuarantineBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: RefreshItem[]) => {
      if (!items || items.length === 0) throw new Error('Nenhuma empresa selecionada');

      const { data, error } = await supabase.functions.invoke('icp-refresh-report', {
        body: { ids: items.map(item => item.id) }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.ok > 0) {
        toast.success(`${data.ok} relatório(s) atualizado(s) com sucesso`);
      }
      if (data?.fail > 0) {
        toast.error(`${data.fail} relatório(s) falharam ao atualizar`);
      }
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar relatórios', {
        description: error?.message || 'Falha desconhecida',
      });
    },
  });
}
