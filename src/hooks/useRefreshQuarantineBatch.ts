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

      let ok = 0;
      let fail = 0;

      // Disparar consultas básicas aos buscadores para validar chaves/saúde
      for (const item of items) {
        const query = item.razao_social || item.cnpj || '';
        if (!query) {
          fail += 1;
          continue;
        }
        try {
          // Preferir Serper se disponível; se falhar, tenta Google CSE
          const serper = await supabase.functions.invoke('serper-search', {
            body: { type: 'search', query, numResults: 3 },
          });
          if (serper.error) throw serper.error;
          ok += 1;
        } catch (_) {
          try {
            const google = await supabase.functions.invoke('google-search', {
              body: { query, type: 'search', options: { numResults: 3 } },
            });
            if (google.error) throw google.error;
            ok += 1;
          } catch (err) {
            console.error('[Refresh ICP] Falha ao consultar buscadores:', err);
            fail += 1;
          }
        }
      }

      return { ok, fail, total: items.length };
    },
    onSuccess: ({ ok, fail, total }) => {
      if (ok > 0) {
        toast.success(`Atualização disparada para ${ok}/${total} empresa(s)`);
      }
      if (fail > 0) {
        toast.error(`${fail} empresa(s) falharam ao atualizar`);
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
