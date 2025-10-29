import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Niche {
  id: string;
  sector_code: string;
  niche_code: string;
  niche_name: string;
  description: string | null;
  cnaes: string[] | null;
  ncms: string[] | null;
  keywords: string[];
  totvs_products: string[] | null;
  created_at: string;
}

export function useNichesBySector(sectorCode: string | undefined) {
  return useQuery({
    queryKey: ["niches", sectorCode],
    queryFn: async () => {
      if (!sectorCode) return [];

      const { data, error } = await supabase
        .from("niches")
        .select("*")
        .eq("sector_code", sectorCode)
        .order("niche_name");

      if (error) throw error;
      return data as Niche[];
    },
    enabled: !!sectorCode,
  });
}
