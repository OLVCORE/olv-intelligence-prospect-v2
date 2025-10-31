import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createDeterminateProgressToast } from '@/lib/utils/progressToast';
import { invokeEdgeFunctionWithRetry } from '@/lib/utils/retry';

interface TOTVSCheckItem {
  id: string;
  razao_social?: string | null;
  cnpj?: string | null;
  domain?: string | null;
}

export function useSimpleTOTVSCheckBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: TOTVSCheckItem[]) => {
      if (!items || items.length === 0) throw new Error('Nenhuma empresa selecionada');

      const total = items.length;
      const progress = createDeterminateProgressToast('Executando TOTVS Check...', total);

      let ok = 0;
      let fail = 0;

      for (let i = 0; i < total; i++) {
        const item = items[i];
        try {
          await invokeEdgeFunctionWithRetry<any>(
            supabase,
            'simple-totvs-check',
            {
              company_id: item.id,
              company_name: item.razao_social || '',
              cnpj: item.cnpj,
              domain: item.domain
            }
          );
          ok += 1;
        } catch (err: any) {
          fail += 1;
          console.error('TOTVS Check failed for', item.id, err);
        } finally {
          progress.set(i + 1);
        }
      }

      if (ok > 0 && fail === 0) {
        progress.success(`${ok} verificação(ões) concluída(s) com sucesso`);
      } else if (ok > 0 && fail > 0) {
        progress.error(`Concluído com avisos: ${ok} ok, ${fail} falha(s)`);
        toast.info('Algumas verificações falharam');
      } else {
        progress.error('Todas as verificações falharam');
      }

      return { ok, fail };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-totvs-check'] });
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao executar TOTVS Check', {
        description: error?.message || 'Falha desconhecida',
      });
    },
  });
}
