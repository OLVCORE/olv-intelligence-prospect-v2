import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createDeterminateProgressToast } from '@/lib/utils/progressToast';
import { invokeEdgeFunctionWithRetry } from '@/lib/utils/retry';

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

      const total = items.length;
      const progress = createDeterminateProgressToast('Atualizando relatórios...', total);

      let ok = 0;
      let fail = 0;

      for (let i = 0; i < total; i++) {
        const item = items[i];
        try {
          const data = await invokeEdgeFunctionWithRetry<any>(
            supabase,
            'icp-refresh-report',
            { ids: [item.id] }
          );
          if (data?.ok > 0) ok += data.ok; else fail += 1;
        } catch (err: any) {
          fail += 1;
          console.error('Refresh failed for', item.id, err);
        } finally {
          progress.set(i + 1);
        }
      }

      if (ok > 0 && fail === 0) {
        progress.success(`${ok} relatório(s) atualizado(s) com sucesso`);
      } else if (ok > 0 && fail > 0) {
        progress.error(`Concluído com avisos: ${ok} ok, ${fail} falha(s)`);
        toast.info('Alguns relatórios falharam ao atualizar');
      } else {
        progress.error('Todos os relatórios falharam ao atualizar');
      }

      return { ok, fail };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar relatórios', {
        description: error?.message || 'Falha desconhecida',
      });
    },
  });
}

