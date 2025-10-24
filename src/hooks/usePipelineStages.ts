import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PipelineStage {
  id: string;
  name: string;
  key: string;
  order_index: number;
  color: string;
  probability_default: number;
  is_closed: boolean;
  is_won: boolean;
}

export function usePipelineStages() {
  return useQuery({
    queryKey: ['sdr_pipeline_stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sdr_pipeline_stages')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as PipelineStage[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
