import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CompanyReport {
  identification: {
    razao_social: string;
    nome_fantasia?: string;
    cnpj: string;
    website?: string;
    linkedin_url?: string;
    domain?: string;
  };
  location: {
    endereco: string;
    cidade: string;
    estado: string;
    pais: string;
  };
  activity: {
    setor: string;
    segmento?: string;
    atividade_principal?: string;
  };
  structure: {
    total_funcionarios: number;
    faixa_funcionarios: string;
    total_decisores: number;
    decisores_por_departamento?: Record<string, number>;
  };
  financials: {
    receita_anual?: string;
    porte: string;
    capacidade_investimento: string;
  };
  digitalPresence: {
    website_status: string;
    tecnologias: string[];
    maturidade_digital: number;
    classificacao_maturidade: string;
    social_media?: any;
  };
  metrics: {
    score_global: number;
    componentes: {
      maturidade_digital: number;
      sinais_compra: number;
      estrutura_decisores: number;
    };
    potencial_negocio: {
      score: number;
      classificacao: string;
      ticket_estimado: {
        minimo: number;
        medio: number;
        maximo: number;
        produtos_base?: Array<{
          sku: string;
          nome: string;
          preco_base: number;
        }>;
        desconto_aplicado?: number;
      };
    };
    priorizacao: {
      urgencia: string;
      nivel_esforco: string;
      roi_esperado: number;
    };
  };
  insights: {
    resumo_executivo: string;
    pontos_fortes: string[];
    oportunidades: string[];
    riscos?: string[];
    recomendacoes: {
      melhor_canal: string;
      angulo_venda: string;
      proximos_passos: string[];
    };
  };
  decisors?: any[];
  signals?: any[];
  generatedAt?: string;
  sources?: {
    used: string[];
    failed: string[];
  };
  _metadata?: {
    dataQualityScore?: number;
    sourcesUsed?: string[];
    runId?: string;
    lastUpdated?: string;
  };
}

export function useCompanyReport(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company-report', companyId],
    queryFn: async () => {
      if (!companyId) {
        throw new Error('Company ID is required');
      }

      // Buscar relatório persistido
      const { data: existingReport } = await supabase
        .from('executive_reports')
        .select('content, data_quality_score, sources_used, run_id, updated_at')
        .eq('company_id', companyId)
        .eq('report_type', 'company')
        .maybeSingle();

      if (existingReport?.content) {
        const content = typeof existingReport.content === 'object' ? existingReport.content : {};
        return {
          ...(content as any),
          _metadata: {
            dataQualityScore: existingReport.data_quality_score,
            sourcesUsed: existingReport.sources_used,
            runId: existingReport.run_id,
            lastUpdated: existingReport.updated_at
          }
        };
      }

      // Se não existir, gerar novo
      const { data, error } = await supabase.functions.invoke('generate-company-report', {
        body: { companyId }
      });
      
      if (error) {
        console.error('Error generating report:', error);
        throw error;
      }

      return data;
    },
    enabled: !!companyId,
    staleTime: 300000, // 5 minutes
  });
}
