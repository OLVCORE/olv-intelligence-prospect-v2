import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createDeterminateProgressToast } from '@/lib/utils/progressToast';
import { invokeEdgeFunctionWithRetry } from '@/lib/utils/retry';

interface Company {
  id: string;
  razao_social?: string | null;
  cnpj?: string | null;
  website?: string | null;
}

/**
 * 🔄 Hook para RE-VERIFICAR TODAS as empresas com Lógica V2
 * 
 * AÇÕES:
 * 1. Deleta TODOS os registros de cache (simple_totvs_checks)
 * 2. Limpa campos totvs_check_* de icp_analysis_results
 * 3. Dispara verificações em batch (10 por vez com delay)
 * 4. Mostra progress bar: "Re-verificando 45/130 empresas..."
 * 
 * ⚠️ AVISOS:
 * - Consome créditos do Serper API (~5 queries por empresa)
 * - Leva ~10-15 min para 130 empresas
 * - Invalida TODAS as verificações antigas
 */
export function useReverifyAllCompanies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companies: Company[]) => {
      if (!companies || companies.length === 0) {
        throw new Error('Nenhuma empresa para re-verificar');
      }

      const total = companies.length;
      const companyIds = companies.map(c => c.id);

      // Mostrar confirmação ao usuário
      const confirmed = window.confirm(
        `⚠️ RE-VERIFICAÇÃO EM MASSA (Lógica V2)\n\n` +
        `Isso vai:\n` +
        `✅ Invalidar TODAS as verificações antigas\n` +
        `✅ Re-verificar ${total} empresas com a lógica unificada V2\n` +
        `⏱️ Tempo estimado: ~${Math.ceil(total / 10)} minutos\n` +
        `💳 Custo: ~${total * 5} queries Serper API\n\n` +
        `Deseja continuar?`
      );

      if (!confirmed) {
        throw new Error('Re-verificação cancelada pelo usuário');
      }

      const progress = createDeterminateProgressToast(
        '🔄 Re-verificando empresas com Lógica V2...',
        total
      );

      try {
        // PASSO 1: Deletar cache antigo (simple_totvs_checks)
        console.log('[REVERIFY] 🗑️ Deletando cache antigo...');
        toast.loading('Limpando cache antigo...', { id: 'cleanup' });
        
        const { error: deleteCacheError } = await supabase
          .from('simple_totvs_checks')
          .delete()
          .in('company_id', companyIds);

        if (deleteCacheError) {
          console.warn('[REVERIFY] ⚠️ Erro ao deletar cache:', deleteCacheError);
        }
        
        toast.dismiss('cleanup');

        // PASSO 2: Limpar campos totvs_check_* da quarentena
        console.log('[REVERIFY] 🧹 Limpando campos de quarentena...');
        const { error: clearError } = await supabase
          .from('icp_analysis_results')
          .update({
            totvs_check_status: null,
            totvs_check_confidence: null,
            totvs_evidences: null,
            totvs_check_reasoning: null,
            totvs_check_date: null,
            logic_version: null
          })
          .in('id', companyIds);

        if (clearError) {
          console.warn('[REVERIFY] ⚠️ Erro ao limpar quarentena:', clearError);
        }

        // PASSO 3: Re-verificar em batches de 10 (evitar rate limit)
        const BATCH_SIZE = 10;
        const DELAY_BETWEEN_BATCHES = 2000; // 2 segundos

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < total; i += BATCH_SIZE) {
          const batch = companies.slice(i, i + BATCH_SIZE);
          console.log(`[REVERIFY] 📦 Processando batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(total / BATCH_SIZE)}`);

          // Processar batch em paralelo
          const batchPromises = batch.map(async (company) => {
            try {
              await invokeEdgeFunctionWithRetry(
                supabase,
                'simple-totvs-check',
                {
                  company_id: company.id,
                  company_name: company.razao_social || '',
                  cnpj: company.cnpj,
                  domain: company.website
                },
                { maxAttempts: 2 } // Menos retries para não travar
              );
              successCount++;
              return { success: true, id: company.id };
            } catch (err: any) {
              failCount++;
              console.error(`[REVERIFY] ❌ Falha em ${company.razao_social}:`, err.message);
              return { success: false, id: company.id, error: err.message };
            }
          });

          await Promise.all(batchPromises);

          // Atualizar progress
          progress.set(Math.min(i + BATCH_SIZE, total));

          // Delay entre batches (exceto no último)
          if (i + BATCH_SIZE < total) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
          }
        }

        // Resultado final
        if (failCount === 0) {
          progress.success(`✅ ${successCount} empresas re-verificadas com sucesso (V2)`);
        } else if (successCount > 0) {
          progress.error(`⚠️ ${successCount} ok, ${failCount} falhas`);
          toast.info(`${failCount} empresas falharam. Tente re-verificar individualmente.`);
        } else {
          progress.error('❌ Todas as re-verificações falharam');
        }

        return { successCount, failCount };

      } catch (error: any) {
        progress.error('❌ Erro na re-verificação em massa');
        throw error;
      }
    },
    onSuccess: ({ successCount, failCount }) => {
      // Invalidar TODAS as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['simple-totvs-check'] });
      queryClient.invalidateQueries({ queryKey: ['simple-totvs-checks-multiple'] });
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });

      console.log(`[REVERIFY] ✅ Concluído: ${successCount} ok, ${failCount} falhas`);
    },
    onError: (error: any) => {
      if (error.message !== 'Re-verificação cancelada pelo usuário') {
        toast.error('Erro na re-verificação em massa', {
          description: error.message || 'Erro desconhecido'
        });
      }
    }
  });
}
