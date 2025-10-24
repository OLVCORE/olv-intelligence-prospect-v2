import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Buscar dados da empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError) throw companyError;

    // 2. Buscar dados relacionados em paralelo
    const [decisorsRes, presenceRes, signalsRes] = await Promise.all([
      supabase.from('decision_makers').select('*').eq('company_id', companyId),
      supabase.from('digital_presence').select('*').eq('company_id', companyId).maybeSingle(),
      supabase.from('governance_signals').select('*').eq('company_id', companyId).order('detected_at', { ascending: false })
    ]);

    const decisors = decisorsRes.data || [];
    const maturity = presenceRes.data;
    const signals = signalsRes.data || [];

    // 3. Calcular métricas
    const metrics = calculateCompanyMetrics(company, decisors, maturity, signals);

    // 4. Gerar insights com IA
    const insights = await generateInsightsWithAI(company, metrics, maturity);

    // 5. Compilar relatório
    const report = {
      identification: buildIdentification(company),
      location: buildLocation(company),
      activity: buildActivity(company),
      structure: buildStructure(company, decisors),
      financials: buildFinancials(company),
      digitalPresence: buildDigitalPresence(company, maturity),
      metrics,
      insights,
      decisors,
      signals,
      generatedAt: new Date().toISOString()
    };

    // 6. Persistir relatório em executive_reports
    await supabase
      .from('executive_reports')
      .upsert({
        company_id: companyId,
        report_type: 'company',
        content: report
      }, { onConflict: 'company_id,report_type' });

    console.log('[generate-company-report] Relatório persistido no banco');

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[generate-company-report] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function buildIdentification(company: any) {
  return {
    razao_social: company.name,
    nome_fantasia: company.name,
    cnpj: company.cnpj || 'N/A',
    website: company.website,
    linkedin_url: company.linkedin_url,
    domain: company.domain
  };
}

function buildLocation(company: any) {
  const location = company.location || {};
  return {
    endereco: location.address || 'N/A',
    cidade: location.city || 'N/A',
    estado: location.state || 'N/A',
    pais: location.country || 'Brasil'
  };
}

function buildActivity(company: any) {
  return {
    setor: company.industry || 'N/A',
    segmento: company.industry || 'N/A',
    atividade_principal: company.industry || 'N/A'
  };
}

function buildStructure(company: any, decisors: any[]) {
  return {
    total_funcionarios: company.employees || 0,
    faixa_funcionarios: getFaixaFuncionarios(company.employees),
    total_decisores: decisors.length,
    decisores_por_departamento: getDepartmentCounts(decisors)
  };
}

function buildFinancials(company: any) {
  return {
    receita_anual: company.revenue || 'N/A',
    porte: getPorte(company.employees),
    capacidade_investimento: calculateInvestmentCapacity(company)
  };
}

function buildDigitalPresence(company: any, maturity: any) {
  return {
    website_status: company.website ? 'ATIVO' : 'NÃO ENCONTRADO',
    tecnologias: company.technologies || [],
    maturidade_digital: maturity?.overall_score || 0,
    classificacao_maturidade: maturity ? getMaturityClassification(maturity.overall_score) : 'N/A'
  };
}

function calculateCompanyMetrics(company: any, decisors: any[], maturity: any, signals: any[]) {
  const maturityScore = maturity?.overall_score || 0;
  const signalsScore = signals.length * 10;
  const decisorsScore = decisors.length * 5;
  
  const scoreGlobal = Math.min(100, (maturityScore * 0.4) + (signalsScore * 0.3) + (decisorsScore * 0.3));
  
  return {
    score_global: Math.round(scoreGlobal),
    componentes: {
      maturidade_digital: Math.round(maturityScore),
      sinais_compra: Math.min(100, signalsScore),
      estrutura_decisores: Math.min(100, decisorsScore)
    },
    potencial_negocio: {
      score: Math.round(scoreGlobal),
      classificacao: getClassification(scoreGlobal),
      ticket_estimado: estimateTicket(company, maturity)
    },
    priorizacao: {
      urgencia: getUrgency(signals),
      nivel_esforco: getEffortLevel(maturityScore),
      roi_esperado: calculateROI(company, maturity)
    }
  };
}

async function generateInsightsWithAI(company: any, metrics: any, maturity: any) {
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é um consultor especialista em transformação digital e vendas B2B. Analise os dados da empresa e forneça insights acionáveis em formato JSON.'
          },
          {
            role: 'user',
            content: `Analise esta empresa e forneça insights no formato JSON:
            
Empresa: ${company.name}
Setor: ${company.industry || 'N/A'}
Funcionários: ${company.employees || 0} ${!company.employees || company.employees === 0 ? '(ATENÇÃO: Empresa sem funcionários registrados - microempresa ou dado não disponível)' : ''}
Maturidade Digital: ${maturity?.overall_score || 0}/100
Score Global: ${metrics.score_global}/100

IMPORTANTE: Se a empresa tem 0 funcionários, mencione isso como ponto de atenção nos riscos.
Seja preciso e factual nos insights, não exagere ou especule.

Retorne apenas JSON válido com esta estrutura:
{
  "resumo_executivo": "texto de 100-150 palavras",
  "pontos_fortes": ["ponto 1", "ponto 2", "ponto 3"],
  "oportunidades": ["oportunidade 1", "oportunidade 2", "oportunidade 3"],
  "riscos": ["risco 1", "risco 2"],
  "recomendacoes": {
    "melhor_canal": "EMAIL ou LINKEDIN ou TELEFONE",
    "angulo_venda": "texto curto",
    "proximos_passos": ["ação 1", "ação 2", "ação 3"]
  }
}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    
    return JSON.parse(jsonStr.trim());
  } catch (error) {
    console.error('[AI Insights] Error:', error);
    return {
      resumo_executivo: 'Análise automática indisponível no momento.',
      pontos_fortes: ['Dados cadastrais completos'],
      oportunidades: ['Avaliação de maturidade digital'],
      riscos: ['Dados limitados para análise completa'],
      recomendacoes: {
        melhor_canal: 'EMAIL',
        angulo_venda: 'Modernização de processos',
        proximos_passos: ['Enriquecer dados da empresa', 'Identificar decisores', 'Mapear tecnologias']
      }
    };
  }
}

// Helper functions
function getFaixaFuncionarios(employees: number | null): string {
  if (!employees) return 'N/A';
  if (employees <= 10) return '1-10';
  if (employees <= 50) return '11-50';
  if (employees <= 200) return '51-200';
  if (employees <= 500) return '201-500';
  return '500+';
}

function getDepartmentCounts(decisors: any[]) {
  const counts: Record<string, number> = {};
  decisors.forEach(d => {
    const dept = d.department || 'Outros';
    counts[dept] = (counts[dept] || 0) + 1;
  });
  return counts;
}

function getPorte(employees: number | null): string {
  if (!employees) return 'N/A';
  if (employees <= 10) return 'MICRO';
  if (employees <= 50) return 'PEQUENO';
  if (employees <= 200) return 'MÉDIO';
  return 'GRANDE';
}

function calculateInvestmentCapacity(company: any): string {
  const employees = company.employees || 0;
  if (employees > 500) return 'MUITO ALTA';
  if (employees > 200) return 'ALTA';
  if (employees > 50) return 'MÉDIA';
  return 'BAIXA';
}

function getMaturityClassification(score: number): string {
  if (score >= 80) return 'AVANÇADA';
  if (score >= 60) return 'INTERMEDIÁRIA';
  if (score >= 40) return 'BÁSICA';
  return 'INICIAL';
}

function getClassification(score: number): string {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

function estimateTicket(company: any, maturity: any) {
  const employees = company.employees || 0;
  const baseTicket = employees * 100;
  const multiplier = maturity?.overall_score ? (maturity.overall_score / 100) + 1 : 1;
  
  return {
    minimo: Math.round(baseTicket * 0.5 * multiplier),
    medio: Math.round(baseTicket * multiplier),
    maximo: Math.round(baseTicket * 2 * multiplier)
  };
}

function getUrgency(signals: any[]): string {
  if (signals.length >= 5) return 'CRÍTICA';
  if (signals.length >= 3) return 'ALTA';
  if (signals.length >= 1) return 'MÉDIA';
  return 'BAIXA';
}

function getEffortLevel(maturityScore: number): string {
  if (maturityScore < 30) return 'ALTO';
  if (maturityScore < 60) return 'MÉDIO';
  return 'BAIXO';
}

function calculateROI(company: any, maturity: any): number {
  const employees = company.employees || 0;
  const maturityScore = maturity?.overall_score || 0;
  
  // ROI baseado em tamanho e maturidade
  const baseROI = 150;
  const sizeMultiplier = Math.log10(employees + 1);
  const maturityGap = (100 - maturityScore) / 100;
  
  return Math.round(baseROI + (sizeMultiplier * 50) + (maturityGap * 100));
}
