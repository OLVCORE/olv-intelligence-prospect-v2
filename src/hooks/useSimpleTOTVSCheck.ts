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
        console.log(`[HOOK] ✅ Verificação V2 encontrada para ${companyId}: ${(data as any).status}`);
        return {
          company_id: companyId,
          status: (data as any).status,
          detected_totvs: (data as any).detected_totvs ?? ((data as any).status === 'no-go'),
          confidence: (data as any).confidence,
          total_evidences: total,
          evidences_by_category: ev,
          reasoning: (data as any).reasoning || '',
          checked_at: (data as any).checked_at || new Date().toISOString()
        } as any;
      }

      // 2) Fallback INTELIGENTE para registros da QUARENTENA (icp_analysis_results) - apenas V2
      console.log(`[HOOK] Cache V2 não encontrado, tentando fallback quarentena...`);
      const { data: q, error: qErr } = await supabase
        .from('icp_analysis_results')
        .select(`
          id, 
          totvs_check_status,
          totvs_check_confidence,
          totvs_check_evidences,
          totvs_check_date,
          totvs_check_total_weight,
          totvs_check_reasoning,
          is_cliente_totvs,
          totvs_evidences,
          updated_at,
          logic_version
        `)
        .eq('id', companyId)
        .gte('logic_version', 2)
        .maybeSingle();

      if (qErr) {
        console.warn('Fallback QUARENTENA falhou:', qErr);
        return null;
      }

      if (!q) return null;

      // Se tiver dados do STC completo (novas colunas), usar eles
      if (q.totvs_check_status) {
        const evidences = q.totvs_check_evidences || { vagas: [], noticias: [], docs_oficiais: [] };
        const total = Object.values(evidences).flat().length;
        
        return {
          company_id: companyId,
          status: q.totvs_check_status,
          confidence: q.totvs_check_confidence,
          total_evidences: total,
          evidences_by_category: evidences,
          total_weight: q.totvs_check_total_weight,
          reasoning: q.totvs_check_reasoning,
          checked_at: q.totvs_check_date || new Date().toISOString(),
          detected_totvs: q.totvs_check_status === 'no-go'
        } as any;
      }

      // Sem verificação STC = retornar null (não criar status falso)
      return null;
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
