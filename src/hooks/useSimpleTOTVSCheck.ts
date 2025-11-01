import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SimpleTOTVSCheckParams {
  companyId: string;
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
      const { data, error } = await supabase
        .from('simple_totvs_checks')
        .select('*')
        .eq('company_id', companyId)
        .order('checked_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar verificação:', error);
        throw error;
      }

      if (data) return data;

      // 2) Fallback inteligente para registros da QUARENTENA
      const { data: q, error: qErr } = await supabase
        .from('icp_analysis_results')
        .select('id, is_cliente_totvs, totvs_evidences, totvs_check_date, updated_at')
        .eq('id', companyId)
        .maybeSingle();

      if (qErr) {
        console.warn('Fallback QUARENTENA falhou:', qErr);
        return null;
      }

      if (!q) return null;

      const total = Array.isArray(q.totvs_evidences) ? q.totvs_evidences.length : 0;
      const status = q.is_cliente_totvs ? 'no-go' : (total >= 2 ? 'no-go' : total === 1 ? 'revisar' : 'go');
      const confidence = q.is_cliente_totvs || total >= 5 ? 'high' : total >= 2 ? 'medium' : 'low';

      return {
        company_id: companyId,
        status,
        confidence,
        total_evidences: total,
        checked_at: q.totvs_check_date || q.updated_at || new Date().toISOString(),
      } as any;
    },
    enabled: !!companyId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always'
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
