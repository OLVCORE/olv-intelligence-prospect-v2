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

      return data;
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5 // 5 minutos
  });
}

export function useSimpleTOTVSCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SimpleTOTVSCheckParams) => {
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['simple-totvs-check'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      
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
