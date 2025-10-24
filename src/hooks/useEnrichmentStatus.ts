import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EnrichmentStatus {
  companyId: string;
  companyName: string;
  hasReceitaWS: boolean;
  hasDecisionMakers: boolean;
  hasDigitalPresence: boolean;
  hasMaturityScore: boolean;
  hasFitScore: boolean;
  hasLegalData: boolean;
  hasInsights: boolean;
  completionPercentage: number;
  isFullyEnriched: boolean;
}

export function useEnrichmentStatus(companyId?: string) {
  return useQuery({
    queryKey: ['enrichment-status', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data: company, error } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          cnpj,
          raw_data,
          digital_maturity_score
        `)
        .eq('id', companyId)
        .single();

      if (error) throw error;

      const [decisorsCountRes, digitalPresenceRes, insightsRes, legalDataRes] = await Promise.all([
        supabase.from('decision_makers').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('digital_presence').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('insights').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('legal_data').select('id').eq('company_id', companyId).maybeSingle(),
      ]);

      const status: EnrichmentStatus = {
        companyId: company.id,
        companyName: company.name,
        hasReceitaWS: !!company.cnpj && !!company.raw_data,
        hasDecisionMakers: (decisorsCountRes.count || 0) > 0,
        hasDigitalPresence: (digitalPresenceRes.count || 0) > 0,
        hasMaturityScore: !!company.digital_maturity_score,
        hasFitScore: false,
        hasLegalData: !!(legalDataRes as any).data,
        hasInsights: (insightsRes.count || 0) > 0,
        completionPercentage: 0,
        isFullyEnriched: false,
      };

      // Calcula percentual de completude
      const checks = [
        status.hasReceitaWS,
        status.hasDecisionMakers,
        status.hasDigitalPresence,
        status.hasMaturityScore,
        status.hasLegalData,
        status.hasInsights,
      ];
      
      status.completionPercentage = Math.round(
        (checks.filter(Boolean).length / checks.length) * 100
      );
      
      status.isFullyEnriched = status.completionPercentage === 100;

      return status;
    },
    enabled: !!companyId,
    refetchInterval: false, // Desabilitado - use manual refetch quando necessário
    staleTime: 60000, // Considera dados válidos por 1 minuto
  });
}

export function useAllEnrichmentStatus() {
  return useQuery({
    queryKey: ['all-enrichment-status'],
    queryFn: async () => {
      const { data: companies, error } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          cnpj,
          raw_data,
          digital_maturity_score
        `);

      if (error) throw error;

      // Buscar conjuntos de relacionamentos para todas as empresas
      const [decisorsListRes, digitalMaturityListRes, insightsListRes, legalDataListRes] = await Promise.all([
        supabase.from('decision_makers').select('company_id'),
        supabase.from('digital_presence').select('company_id'),
        supabase.from('insights').select('company_id'),
        supabase.from('legal_data').select('company_id'),
      ]);

      const decisorsSet = new Set((decisorsListRes.data || []).map((r: any) => r.company_id));
      const digitalMaturitySet = new Set((digitalMaturityListRes.data || []).map((r: any) => r.company_id));
      const insightsSet = new Set((insightsListRes.data || []).map((r: any) => r.company_id));
      const legalDataSet = new Set((legalDataListRes.data || []).map((r: any) => r.company_id));

      const statusList: EnrichmentStatus[] = companies.map(company => {
        const status: EnrichmentStatus = {
          companyId: company.id,
          companyName: company.name,
          hasReceitaWS: !!company.cnpj && !!company.raw_data,
          hasDecisionMakers: decisorsSet.has(company.id),
          hasDigitalPresence: digitalMaturitySet.has(company.id),
          hasMaturityScore: !!company.digital_maturity_score,
          hasFitScore: false,
          hasLegalData: legalDataSet.has(company.id),
          hasInsights: insightsSet.has(company.id),
          completionPercentage: 0,
          isFullyEnriched: false,
        };

        const checks = [
          status.hasReceitaWS,
          status.hasDecisionMakers,
          status.hasDigitalPresence,
          status.hasMaturityScore,
          status.hasLegalData,
          status.hasInsights,
        ];
        
        status.completionPercentage = Math.round(
          (checks.filter(Boolean).length / checks.length) * 100
        );
        
        status.isFullyEnriched = status.completionPercentage === 100;

        return status;
      });

      return statusList;
    },
    refetchInterval: false, // Desabilitado - use manual refetch quando necessário
    staleTime: 30000, // Considera dados válidos por 30 segundos
  });
}
