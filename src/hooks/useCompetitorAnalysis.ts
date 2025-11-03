import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CompetitorERP {
  name: string;
  category: string;
  detected_in: string[];
  confidence: number;
  market_share?: string;
  pricing_tier?: string;
}

export function useCompetitorAnalysis(companyId: string | undefined) {
  return useQuery({
    queryKey: ['competitor-analysis', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      // Buscar dados de tecnologias da empresa
      const { data: technologies } = await supabase
        .from('company_technologies')
        .select('*')
        .eq('company_id', companyId);

      // Buscar dados de análise ICP se disponível
      const { data: icpData } = await supabase
        .from('icp_analysis_results')
        .select('raw_analysis')
        .eq('company_id', companyId)
        .maybeSingle();

      const competitors: CompetitorERP[] = [];

      // Extrair ERPs das tecnologias detectadas
      if (technologies) {
        const erpTechs = technologies.filter(t => 
          t.category?.toLowerCase().includes('erp') || 
          t.technology?.toLowerCase().includes('erp') ||
          ['sap', 'oracle', 'microsoft dynamics', 'sage', 'netsuite', 'epicor', 'infor'].some(erp => 
            t.technology?.toLowerCase().includes(erp.toLowerCase())
          )
        );

        erpTechs.forEach(tech => {
          competitors.push({
            name: tech.technology,
            category: tech.category || 'ERP',
            detected_in: [tech.source || 'Tecnologias'],
            confidence: 85,
            market_share: 'Alto',
            pricing_tier: 'Enterprise'
          });
        });
      }

      // Extrair dados de análise RAW
      if (icpData?.raw_analysis) {
        const rawData = icpData.raw_analysis as any;
        if (rawData?.apollo?.competitor_erp) {
          const existing = competitors.find(c => 
            c.name.toLowerCase().includes(rawData.apollo.competitor_erp.toLowerCase())
          );
          
          if (!existing) {
            competitors.push({
              name: rawData.apollo.competitor_erp,
              category: 'ERP Sistema',
              detected_in: ['Enriquecimento Apollo'],
              confidence: 90,
              market_share: 'Médio',
              pricing_tier: 'Média Empresa'
            });
          }
        }
      }

      return competitors;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000 // 5 minutos
  });
}