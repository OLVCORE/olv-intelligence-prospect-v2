import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SimpleTOTVSCheckParams {
  companyId?: string;
  companyName?: string;
  cnpj?: string;
  domain?: string;
  enabled?: boolean;
}

export const useSimpleTOTVSCheck = ({
  companyId,
  companyName,
  cnpj,
  domain,
  enabled = false,
}: SimpleTOTVSCheckParams) => {
  return useQuery({
    queryKey: ['simple-totvs-check', companyId, companyName, cnpj],
    queryFn: async () => {
      console.log('[HOOK] Chamando simple-totvs-check...');

      const { data, error } = await supabase.functions.invoke('simple-totvs-check', {
        body: {
          company_id: companyId,
          company_name: companyName,
          cnpj,
          domain,
        },
      });

      if (error) {
        console.error('[HOOK] Erro:', error);
        throw error;
      }

      console.log('[HOOK] Resultado:', data);
      
      // AUTO-SALVAR NO HISTÓRICO STC
      if (data?.data && companyId) {
        try {
          const result = data.data;
          await supabase.from('stc_verification_history').insert({
            company_id: companyId,
            company_name: companyName || 'N/A',
            cnpj: cnpj || null,
            status: result.status || 'unknown',
            confidence: result.confidence || 'low',
            triple_matches: result.tripleMatches || 0,
            double_matches: result.doubleMatches || 0,
            single_matches: result.singleMatches || 0,
            total_score: result.totalScore || 0,
            evidences: result.evidences || [],
            sources_consulted: result.sourcesConsulted || 0,
            queries_executed: result.queriesExecuted || 0,
            verification_duration_ms: result.verificationDurationMs || 0
          });
          console.log('[STC] ✅ Verificação salva no histórico');
        } catch (historyError: any) {
          console.warn('[STC] ⚠️ Erro ao salvar histórico (não crítico):', historyError.message);
          // Não falha a verificação se salvar histórico falhar
        }
      }
      
      return data;
    },
    enabled: enabled && (!!companyName || !!cnpj),
    staleTime: 60 * 1000,      // 1 minuto (balanceado)
    gcTime: 5 * 60 * 1000,     // 5 minutos
    refetchOnMount: true,      // Verificar ao abrir
    refetchOnWindowFocus: false,
  });
};
