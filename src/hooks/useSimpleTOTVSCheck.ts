import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SimpleTOTVSCheckParams {
  companyId?: string; // pode ser omitido quando não houver company real
  companyName: string;
  cnpj?: string;
  domain?: string;
}

export interface Evidence {
  source: string;
  category: 'vagas' | 'noticias' | 'docs_oficiais';
  title: string;
  url: string;
  snippet: string;
  timestamp: string;
  totvs_products: string[];
  match_type?: 'triple' | 'double';
  weight?: number;
}

export interface SimpleTOTVSCheckResult {
  status: 'go' | 'no-go' | 'revisar';
  detected_totvs: boolean;
  confidence: 'high' | 'medium' | 'low';
  total_evidences: number;
  evidences_by_category: {
    vagas: Evidence[];
    noticias: Evidence[];
    docs_oficiais: Evidence[];
  };
  reasoning: string;
  checked_at: string;
}

export function useLatestSimpleTOTVSCheck(companyId?: string) {
  return useQuery({
    queryKey: ['simple-totvs-check', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      // 1) Tenta buscar no histórico oficial (companies)
      // 🎯 FASE 1: Filtrar apenas verificações V2 (lógica unificada)
      const { data, error } = await supabase
        .from('simple_totvs_checks')
        .select('*')
        .eq('company_id', companyId)
        .gte('logic_version', 2) // ✅ Apenas lógica V2 ou superior
        .order('checked_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar verificação:', error);
        throw error;
      }

      if (data) {
        const ev = (data as any).evidences || { vagas: [], noticias: [], docs_oficiais: [] };
        const total = (data as any).total_evidences ?? Object.values(ev).flat().length;
        // console.log(`[HOOK] ✅ Verificação V2 encontrada para ${companyId}: ${(data as any).status}`);
        return {
          company_id: companyId,
          status: (data as any).status,
          detected_totvs: (data as any).detected_totvs ?? ((data as any).status === 'no-go'),
          confidence: (data as any).confidence,
          total_evidences: total,
          evidences_by_category: ev,
          reasoning: (data as any).reasoning || '',
          checked_at: (data as any).checked_at || new Date().toISOString(),
          source: 'cache_v2'
        } as any;
      }

      // 2) Sem cache V2 = retornar null (não usar dados V1 da quarentena)
      return null;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5min para evitar refetchs agressivos
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });
}

export function useSimpleTOTVSCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SimpleTOTVSCheckParams) => {
      // Invalidar cache ANTES da requisição para forçar loading state
      queryClient.removeQueries({ queryKey: ['simple-totvs-check', params.companyId] });
      
      const { data, error } = await supabase.functions.invoke('simple-totvs-check', {
        body: {
          company_id: params.companyId,
          company_name: params.companyName,
          cnpj: params.cnpj,
          domain: params.domain
        },
      });

      if (error) throw error;
      return data as SimpleTOTVSCheckResult;
    },
    onSuccess: (data, variables) => {
      // Invalidar TODOS os caches relacionados
      queryClient.invalidateQueries({ queryKey: ['simple-totvs-check'] });
      queryClient.invalidateQueries({ queryKey: ['simple-totvs-check', variables.companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      
      // Forçar refetch imediato
      queryClient.refetchQueries({ queryKey: ['simple-totvs-check', variables.companyId] });
      
      if (data.status === 'no-go') {
        toast.error('❌ NO-GO - Empresa JÁ USA TOTVS', {
          description: data.reasoning,
          duration: 8000,
        });
      } else if (data.status === 'go') {
        toast.success('✅ GO - Empresa qualificada para prospecção', {
          description: data.reasoning,
          duration: 6000,
        });
      } else {
        toast.warning('⚠️ REVISAR - Validação manual necessária', {
          description: data.reasoning,
          duration: 6000,
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Erro na verificação TOTVS', {
        description: error.message,
      });
    },
  });
}
