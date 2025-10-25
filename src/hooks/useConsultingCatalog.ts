import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ConsultingCategory = 'DIAGNÓSTICO' | 'OPERACIONAL' | 'ESTRATÉGICO' | 'TECNOLOGIA' | 'COMPLIANCE' | 'CAPACITAÇÃO';

export interface ConsultingService {
  id: string;
  sku: string;
  name: string;
  category: ConsultingCategory;
  description?: string;
  base_hourly_rate?: number;
  min_hourly_rate?: number;
  max_hourly_rate?: number;
  estimated_hours_min?: number;
  estimated_hours_max?: number;
  base_project_price?: number;
  min_project_price?: number;
  max_project_price?: number;
  pricing_models?: string[];
  requires_platforms?: string[];
  target_sectors?: string[];
  complexity_factors?: Record<string, any>;
  implementation_cost?: number;
  training_cost?: number;
  travel_daily_rate?: number;
  consultant_level?: 'JÚNIOR' | 'PLENO' | 'SÊNIOR' | 'ESPECIALISTA' | 'TRIBUTÁRIO' | 'COMPLIANCE';
  is_configurable?: boolean;
  dependencies?: string[];
  recommended_with?: string[];
  active: boolean;
}

export interface ConsultantRate {
  id: string;
  level: 'JÚNIOR' | 'PLENO' | 'SÊNIOR' | 'ESPECIALISTA' | 'TRIBUTÁRIO' | 'COMPLIANCE';
  hourly_rate_min: number;
  hourly_rate_max: number;
  description?: string;
  experience_years_min?: number;
  experience_years_max?: number;
  active: boolean;
}

export function useConsultingCatalog() {
  return useQuery({
    queryKey: ['consulting-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consulting_services')
        .select('*')
        .eq('active', true)
        .order('category', { ascending: true });
      if (error) throw error;
      return data as ConsultingService[];
    },
  });
}

export function useConsultantRates() {
  return useQuery({
    queryKey: ['consultant-rates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultant_rates')
        .select('*')
        .eq('active', true)
        .order('level', { ascending: true });
      if (error) throw error;
      return data as ConsultantRate[];
    },
  });
}
