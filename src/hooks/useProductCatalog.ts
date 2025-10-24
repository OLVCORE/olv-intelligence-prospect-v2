import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: 'BÁSICO' | 'INTERMEDIÁRIO' | 'AVANÇADO' | 'ESPECIALIZADO';
  description: string;
  base_price: number;
  min_price: number;
  is_configurable: boolean;
  config_options: Record<string, any>;
  dependencies: string[];
  recommended_with: string[];
  min_quantity: number;
  max_quantity?: number;
  active: boolean;
}

export function useProductCatalog() {
  return useQuery({
    queryKey: ['product-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_catalog')
        .select('*')
        .eq('active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      return data as Product[];
    },
  });
}

export function usePricingRules() {
  return useQuery({
    queryKey: ['pricing-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
