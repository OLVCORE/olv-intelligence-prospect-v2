import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TOTVSDetectionParams {
  companyId: string;
  companyName: string;
  companyDomain?: string;
  cnpj?: string;
  region?: string;
  sector?: string;
}

interface Evidence {
  source: string;
  platform: string;
  score: number;
  title: string;
  snippet: string;
  url: string;
  timestamp: string;
  confidence: string;
  reason: string;
  totvs_products_mentioned?: string[];
}

interface TOTVSDetectionResult {
  ok: boolean;
  score: number;
  status: 'qualified' | 'disqualified';
  confidence: string;
  disqualification_reason?: string;
  evidences: Evidence[];
  sources_checked: number;
  platforms_scanned: string[];
  message: string;
}

// Hook para buscar última detecção
export function useLatestTOTVSDetection(companyId?: string) {
  return useQuery({
    queryKey: ['totvs-detection', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const { data, error } = await supabase
        .from('totvs_usage_detection')
        .select('*')
        .eq('company_id', companyId)
        .order('checked_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

// Hook para executar nova detecção
export function useTOTVSDetectionV2() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, companyName, companyDomain, cnpj, region, sector }: TOTVSDetectionParams): Promise<TOTVSDetectionResult> => {
      const { data, error } = await supabase.functions.invoke('detect-totvs-usage-v2', {
        body: {
          company_id: companyId,
          company_name: companyName,
          domain: companyDomain,
          cnpj,
          region,
          sector,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
      queryClient.invalidateQueries({ queryKey: ['totvs-detection', variables.companyId] });
      
      if (data.status === 'disqualified') {
        toast.error('⛔ EMPRESA DESCARTADA - JÁ É CLIENTE TOTVS', {
          description: `Detectado uso de produtos TOTVS (Score: ${data.score}/100). ${data.evidences?.length || 0} evidências encontradas.`,
          duration: 8000,
        });
      } else {
        toast.success('✅ Empresa qualificada - Sem uso de TOTVS detectado', {
          description: `Lead válido para prospecção ativa (Score: ${data.score}/100)`,
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao detectar uso de TOTVS', {
        description: error.message,
      });
    },
  });
}
