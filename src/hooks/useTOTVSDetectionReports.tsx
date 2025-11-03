import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TOTVSDetectionReport {
  id: string;
  company_id: string;
  sdr_deal_id?: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  detection_status: string;
  evidences: any[];
  methodology: any;
  score_breakdown: any;
  execution_time_ms?: number;
  sources_checked: number;
  sources_with_results: number;
  created_at: string;
  created_by?: string;
}

export const useTOTVSDetectionReports = (companyId: string | undefined) => {
  return useQuery({
    queryKey: ['totvs-detection-reports', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('totvs_detection_reports')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TOTVSDetectionReport[];
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useLatestTOTVSReport = (companyId: string | undefined) => {
  return useQuery({
    queryKey: ['totvs-latest-report', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from('totvs_detection_reports')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as TOTVSDetectionReport | null;
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });
};
