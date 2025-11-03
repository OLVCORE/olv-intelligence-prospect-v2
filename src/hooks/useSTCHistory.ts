import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface STCHistoryRecord {
  id: string;
  company_id: string | null;
  company_name: string;
  cnpj: string | null;
  status: string;
  confidence: string;
  triple_matches: number;
  double_matches: number;
  single_matches: number;
  total_score: number;
  evidences: any[];
  sources_consulted: number;
  queries_executed: number;
  verification_duration_ms: number | null;
  full_report: any;
  created_at: string;
}

/**
 * Hook para buscar histórico completo de verificações STC de uma empresa
 */
export function useSTCHistory(companyId?: string, companyName?: string) {
  return useQuery({
    queryKey: ['stc-history', companyId, companyName],
    queryFn: async () => {
      let query = supabase
        .from('stc_verification_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      } else if (companyName) {
        query = query.eq('company_name', companyName);
      }

      const { data, error } = await query.limit(10);

      if (error) throw error;
      return data as STCHistoryRecord[];
    },
    enabled: !!(companyId || companyName),
  });
}

/**
 * Hook para buscar o último relatório salvo (mais recente)
 */
export function useLatestSTCReport(companyId?: string, companyName?: string) {
  return useQuery({
    queryKey: ['stc-latest', companyId, companyName],
    queryFn: async () => {
      let query = supabase
        .from('stc_verification_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (companyId) {
        query = query.eq('company_id', companyId);
      } else if (companyName) {
        query = query.ilike('company_name', companyName);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = não encontrado
      return data as STCHistoryRecord | null;
    },
    enabled: !!(companyId || companyName),
  });
}
