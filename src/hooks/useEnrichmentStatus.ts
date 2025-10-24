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
          digital_maturity_score,
          decision_makers (id),
          digital_maturity (id),
          insights (id)
        `)
        .eq('id', companyId)
        .single();

      if (error) throw error;

      // Buscar legal_data separadamente
      const { data: legalData } = await supabase
        .from('legal_data')
        .select('id')
        .eq('company_id', companyId)
        .maybeSingle();

      const status: EnrichmentStatus = {
        companyId: company.id,
        companyName: company.name,
        hasReceitaWS: !!company.cnpj && !!company.raw_data,
        hasDecisionMakers: (company.decision_makers?.length || 0) > 0,
        hasDigitalPresence: !!company.digital_maturity?.length,
        hasMaturityScore: !!company.digital_maturity_score,
        hasFitScore: false,
        hasLegalData: !!legalData,
        hasInsights: (company.insights?.length || 0) > 0,
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
          digital_maturity_score,
          decision_makers (id),
          digital_maturity (id),
          insights (id)
        `);

      if (error) throw error;

      // Buscar legal_data para todas as empresas
      const { data: legalDataList } = await supabase
        .from('legal_data')
        .select('company_id')
        .in('company_id', companies.map(c => c.id));

      const legalDataMap = new Set(legalDataList?.map(ld => ld.company_id) || []);

      const statusList: EnrichmentStatus[] = companies.map(company => {
        const status: EnrichmentStatus = {
          companyId: company.id,
          companyName: company.name,
          hasReceitaWS: !!company.cnpj && !!company.raw_data,
          hasDecisionMakers: (company.decision_makers?.length || 0) > 0,
          hasDigitalPresence: !!company.digital_maturity?.length,
          hasMaturityScore: !!company.digital_maturity_score,
          hasFitScore: false,
          hasLegalData: legalDataMap.has(company.id),
          hasInsights: (company.insights?.length || 0) > 0,
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
