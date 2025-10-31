import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TOTVSDetectionV5Params {
  companyId: string;
  companyName: string;
  cnpj?: string;
  domain?: string;
  state: string;
  city?: string;
  sectorCode?: string;
  nicheCode: string;
}

export interface TOTVSDetectionV5Result {
  ok: boolean;
  score: number;
  status: 'qualified' | 'disqualified';
  evidences: Array<{
    source: string;
    platform: string;
    score: number;
    title: string;
    snippet: string;
    url: string;
    timestamp: string;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
  }>;
  niche: string;
  audit: {
    accepted: number;
    rejected: number;
  };
}

export function useLatestTOTVSDetectionV5(companyId: string | undefined) {
  return useQuery({
    queryKey: ['totvs-detection-v5', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from('totvs_usage_detection')
        .select('*')
        .eq('company_id', companyId)
        .order('checked_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 30000
  });
}

export function useTOTVSDetectionV5() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TOTVSDetectionV5Params): Promise<TOTVSDetectionV5Result> => {
      const { data, error } = await supabase.functions.invoke('detect-totvs-usage-v5', {
        body: {
          company_id: params.companyId,
          company_name: params.companyName,
          cnpj: params.cnpj,
          domain: params.domain,
          state: params.state,
          city: params.city,
          sector_code: params.sectorCode,
          niche_code: params.nicheCode,
        },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Erro ao detectar uso de TOTVS');

      // Salvar também na tabela antiga para compatibilidade
      const { error: insertError } = await supabase
        .from('totvs_usage_detection')
        .insert([{
          company_id: params.companyId,
          company_name: params.companyName,
          cnpj: params.cnpj,
          region: params.state,
          sector: params.sectorCode,
          score: data.score,
          confidence: (data as any).confidence || (data.score >= 70 ? 'high' : data.score >= 40 ? 'medium' : 'low'),
          status: data.status,
          evidences: data.evidences as any,
          platforms_scanned: (data as any).platforms_scanned as any,
          methodology: (data as any).methodology as any,
          disqualification_reason: data.status === 'disqualified' 
            ? `Uso de TOTVS detectado em ${data.niche} (${data.evidences?.length || 0} evidências)` 
            : null,
          sources_checked: (data as any).total_portals ?? (Array.isArray((data as any).platforms_scanned) ? (data as any).platforms_scanned.length : 0),
        }]);

      if (insertError) {
        console.error('Erro ao salvar detecção na tabela antiga:', insertError);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidar as queries da nova tabela
      queryClient.invalidateQueries({ queryKey: ['totvs-detection-reports', variables.companyId] });
      // Invalidar também a tabela antiga para compatibilidade
      queryClient.invalidateQueries({ queryKey: ['totvs-detection-v5', variables.companyId] });
      
      const status = data.status === 'disqualified' ? '❌' : '✅';
      const statusText = data.status === 'disqualified' ? 'DESQUALIFICADO' : 'QUALIFICADO';
      
      toast.success(`${status} Detecção TOTVS v5.0 Concluída`, {
        description: `${statusText} | Score: ${data.score}/100 | Nicho: ${data.niche} | Aceitos: ${data.audit.accepted} | Rejeitados: ${data.audit.rejected}`,
      });
    },
    onError: (error: Error) => {
      console.error('Erro na detecção TOTVS v5:', error);
      toast.error('Erro na Detecção TOTVS v5', {
        description: error.message || 'Erro ao executar detecção. Tente novamente.',
      });
    },
  });
}
