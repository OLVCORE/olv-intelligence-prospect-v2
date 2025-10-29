import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Sector {
  id: string;
  sector_code: string;
  sector_name: string;
  description: string | null;
  created_at: string;
}

export function useSectors() {
  return useQuery({
    queryKey: ["sectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sectors")
        .select("*")
        .order("sector_name");

      if (error) throw error;
      return data as Sector[];
    },
  });
}
