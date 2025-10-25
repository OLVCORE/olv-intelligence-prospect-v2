// ✅ Edge Function para análise contextual com IA baseada em dados reais
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id, analysis_type } = await req.json();

    if (!company_id) {
      return new Response(
        JSON.stringify({ error: 'company_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI_CONTEXTUAL_ANALYSIS', 'Processing analysis', { company_id, analysis_type });

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar dados reais da empresa
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single();

    if (!company) {
      throw new Error('Empresa não encontrada');
    }

    // Buscar dados de presença digital
    const { data: digitalPresence } = await supabase
      .from('digital_presence')
      .select('*')
      .eq('company_id', company_id)
      .maybeSingle();

    // Buscar dados jurídicos
    const { data: legalData } = await supabase
      .from('legal_data')
      .select('*')
      .eq('company_id', company_id)
      .maybeSingle();

    // Buscar dados financeiros
    const { data: financialData } = await supabase
      .from('financial_data')
      .select('*')
      .eq('company_id', company_id)
      .maybeSingle();

    // Buscar dados de reputação
    const { data: reputationData } = await supabase
      .from('reputation_data')
      .select('*')
      .eq('company_id', company_id)
      .maybeSingle();

    // Preparar contexto para IA
    const context = {
      empresa: {
        nome: company.name,
        cnpj: company.cnpj,
        setor: company.industry,
        funcionarios: company.employees,
        website: company.website
      },
      presenca_digital: digitalPresence ? {
        score_geral: digitalPresence.overall_score,
        linkedin: digitalPresence.linkedin_data,
        website_metrics: digitalPresence.website_metrics
      } : null,
      juridico: legalData ? {
        total_processos: legalData.total_processes,
        processos_ativos: legalData.active_processes,
        nivel_risco: legalData.risk_level,
        dados_jusbrasil: legalData.jusbrasil_data
      } : null,
      financeiro: financialData ? {
        score_credito: financialData.credit_score,
        classificacao_risco: financialData.risk_classification,
        score_preditivo: financialData.predictive_risk_score
      } : null,
      reputacao: reputationData ? {
        score_reputacao: reputationData.reputation_score,
        total_reviews: reputationData.total_reviews,
        sentimento: reputationData.sentiment_score
      } : null
    };

    // Usar OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const prompt = `Analise a seguinte empresa e gere:
1. Lista de RISCOS identificados (formato: array de objetos com type, severity, description, source)
2. Lista de RECOMENDAÇÕES (formato: array de strings)
3. Lista de OPORTUNIDADES (formato: array de strings)

Dados da empresa:
${JSON.stringify(context, null, 2)}

IMPORTANTE:
- Se NÃO HOUVER processos jurídicos (total_processos = 0), NÃO mencione riscos jurídicos
- Se houver processos, indique a fonte real (jusbrasil_data)
- Seja preciso e baseie-se APENAS nos dados fornecidos
- Se não houver dados suficientes, retorne arrays vazios
- Para severity use apenas: baixa, media, alta, critica

Retorne em formato JSON:
{
  "risks": [{"type": "...", "severity": "...", "description": "...", "source": "..."}],
  "recommendations": ["..."],
  "opportunities": ["..."]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um analista B2B especializado. Retorne APENAS JSON válido sem markdown ou formatação extra.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI_CONTEXTUAL_ANALYSIS', 'Lovable AI error', { status: response.status, error: errorText });
      
      // Fallback com dados vazios se IA falhar
      return new Response(
        JSON.stringify({ 
          risks: [],
          recommendations: [],
          opportunities: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let analysisText = data.choices?.[0]?.message?.content || '{}';
    
    // Remover markdown se presente
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (e) {
      console.error('AI_CONTEXTUAL_ANALYSIS', 'Failed to parse JSON', { analysisText });
      analysis = { risks: [], recommendations: [], opportunities: [] };
    }

    console.log('AI_CONTEXTUAL_ANALYSIS', 'Analysis generated', { 
      risksCount: analysis.risks?.length || 0,
      recommendationsCount: analysis.recommendations?.length || 0,
      opportunitiesCount: analysis.opportunities?.length || 0
    });

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI_CONTEXTUAL_ANALYSIS', 'Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        risks: [],
        recommendations: [],
        opportunities: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
