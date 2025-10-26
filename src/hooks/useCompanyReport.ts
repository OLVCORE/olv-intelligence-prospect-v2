import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CompanyReport {
  // ===== IDENTIFICAÇÃO (7 campos) =====
  identification: {
    cnpj: string;
    razao_social: string;
    nome_fantasia?: string;
    nome_empresa?: string;
    tipo_unidade?: string;
    natureza_juridica?: string;
    data_abertura?: string;
    situacao_cadastral?: string;
    data_situacao?: string;
    website?: string;
    linkedin_url?: string;
    domain?: string;
  };

  // ===== LOCALIZAÇÃO & CONTATO (15 campos) =====
  location: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cep: string;
    cidade: string;
    microrregiao?: string;
    mesorregiao?: string;
    estado: string;
    pais: string;
  };

  // ===== CONTATOS (24 campos telefone + email) =====
  contacts: {
    // Telefones (16 campos)
    assertividade?: string;
    melhor_telefone?: string;
    segundo_melhor_telefone?: string;
    telefones_alta_assertividade?: string[];
    telefones_media_assertividade?: string[];
    telefones_baixa_assertividade?: string[];
    telefones_matriz?: string[];
    telefones_filiais?: string[];
    celulares?: string[];
    melhor_celular?: string;
    fixos?: string[];
    pat_telefone?: string;
    whatsapp?: string;

    // E-mails (11 campos)
    emails_validados_departamentos?: string[];
    emails_validados_socios?: string[];
    emails_validados_decisores?: string[];
    emails_validados_colaboradores?: string[];
    email_pat?: string;
    email_receita_federal?: string;
    emails_publicos?: string[];
  };

  // ===== ATIVIDADE ECONÔMICA (10 campos) =====
  activity: {
    setor_amigavel: string;
    setor?: string;
    segmento?: string;
    atividade_economica: string;
    cod_atividade_economica: string;
    atividades_secundarias?: string[];
    cod_atividades_secundarias?: string[];
    cod_ncms_primarios?: string[];
    ncms_primarios?: string[];
    importacao?: boolean;
    exportacao?: boolean;
    regime_tributario?: string;
  };

  // ===== ESTRUTURA ORGANIZACIONAL (13 campos) =====
  structure: {
    // Funcionários (7 campos)
    funcionarios_presumido_matriz_cnpj?: number;
    funcionarios_presumido_este_cnpj?: number;
    pat_funcionarios?: number;
    total_funcionarios: number;
    faixa_funcionarios: string;
    porte_estimado?: string;

    // Filiais (1 campo)
    qtd_filiais?: number;

    // Pessoas (5 campos)
    socios_administradores?: Array<{
      nome: string;
      qualificacao: string;
      cpf?: string;
    }>;
    decisores_cargos?: string[];
    decisores_linkedin?: string[];
    colaboradores_cargos?: string[];
    colaboradores_linkedin?: string[];
    total_decisores: number;
    decisores_por_departamento?: Record<string, number>;
  };

  // ===== FINANCEIRO (21 campos) =====
  financials: {
    // Dados básicos (9 campos)
    capital_social?: number;
    recebimentos_governo_federal?: number;
    enquadramento_porte?: string;
    faturamento_presumido_matriz_cnpj?: number;
    faturamento_presumido_este_cnpj?: number;
    crescimento_empresa?: string;
    receita_anual?: string;
    porte: string;
    capacidade_investimento: string;

    // Dívidas (12 campos)
    perc_dividas_cnpj_sobre_faturamento?: number;
    perc_dividas_cnpj_socios_sobre_faturamento?: number;
    total_dividas_cnpj_uniao?: number;
    total_dividas_cnpj_socios_uniao?: number;
    dividas_gerais_cnpj_uniao?: number;
    dividas_gerais_cnpj_socios_uniao?: number;
    dividas_cnpj_fgts?: number;
    dividas_cnpj_socios_fgts?: number;
    dividas_cnpj_previdencia?: number;
    dividas_cnpj_socios_previdencia?: number;
  };

  // ===== PRESENÇA DIGITAL (10 campos) =====
  digitalPresence: {
    // Sites (5 campos)
    sites?: string[];
    melhor_site?: string;
    segundo_melhor_site?: string;
    website_status: string;

    // Redes Sociais (9 campos)
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    outras_redes?: string[];
    social_media?: any;

    // Tecnologia (4 campos)
    tecnologias: string[];
    ferramentas?: string[];
    maturidade_digital: number;
    classificacao_maturidade: string;
  };

  // ===== ANÁLISE & INTELIGÊNCIA (7 campos) =====
  metrics: {
    score_global: number;
    componentes: {
      maturidade_digital: number;
      sinais_compra: number;
      estrutura_decisores: number;
      financeiro?: number;
      juridico?: number;
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
    nivel_atividade?: string;
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
    tags?: string[];
    notas?: string;
  };

  // ===== METADATA =====
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
