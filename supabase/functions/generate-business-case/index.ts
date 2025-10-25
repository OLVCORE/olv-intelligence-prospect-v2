import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accountStrategyId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // 1. Buscar Account Strategy completa
    const { data: strategy, error: strategyError } = await supabaseClient
      .from('account_strategies')
      .select(`
        *,
        companies(*),
        buyer_personas(*),
        decision_makers(*)
      `)
      .eq('id', accountStrategyId)
      .single();

    if (strategyError || !strategy) {
      throw new Error('Estratégia não encontrada');
    }

    const company = strategy.companies;
    const persona = strategy.buyer_personas;

    // 2. Preparar prompt para IA
    const systemPrompt = `Você é um consultor especializado em criar Business Cases de alto impacto para PMEs.

**SUA MISSÃO:** Gerar um Business Case completo, convincente e orientado a ROI.

**ESTRUTURA DO BUSINESS CASE:**
1. Situação Atual (problemas e impacto no negócio)
2. Solução Proposta (detalhada e acionável)
3. Implementação (fases e timeline)
4. Investimento e ROI (detalhado com cálculos)
5. Benefícios Mensuráveis
6. Mitigação de Riscos
7. Casos de Sucesso Similares

**TOM:** Executivo, data-driven, focado em resultados de negócio.`;

    const userPrompt = `Crie um Business Case completo para:

**EMPRESA:** ${company.name}
**INDÚSTRIA:** ${company.industry}
**GAPS IDENTIFICADOS:**
${JSON.stringify(strategy.identified_gaps)}

**PRODUTOS RECOMENDADOS:**
${JSON.stringify(strategy.recommended_products)}

**PROPOSTA DE VALOR:**
${strategy.value_proposition}

**ROADMAP DE TRANSFORMAÇÃO:**
${JSON.stringify(strategy.transformation_roadmap)}

**FINANCEIRO:**
- Investimento: R$ ${strategy.investment_required}
- ROI Projetado: ${strategy.projected_roi}%
- Payback: ${strategy.payback_period}

**GERE JSON com:**
{
  "current_situation": "Descrição executiva da situação atual (3-4 parágrafos)",
  "identified_problems": [
    {
      "problem": "Problema específico",
      "impact": "Impacto quantificado no negócio",
      "evidence": "Evidência concreta"
    }
  ],
  "business_impact": "Análise do impacto geral nos negócios (2-3 parágrafos)",
  "proposed_solution": "Solução completa proposta (4-5 parágrafos)",
  "implementation_phases": [
    {
      "phase": "Fase 1",
      "duration": "2 meses",
      "activities": ["Atividade 1", "Atividade 2"],
      "deliverables": ["Entrega 1", "Entrega 2"]
    }
  ],
  "products_included": [
    {
      "product": "Nome do produto TOTVS",
      "purpose": "Para quê serve",
      "benefits": ["Benefício 1", "Benefício 2"],
      "investment": 50000
    }
  ],
  "investment_breakdown": {
    "software_licenses": 100000,
    "implementation": 50000,
    "training": 20000,
    "support_year1": 30000,
    "total": 200000
  },
  "roi_calculation": {
    "year1_savings": 150000,
    "year2_savings": 300000,
    "year3_savings": 450000,
    "total_benefit_3years": 900000,
    "net_benefit": 700000,
    "roi_percentage": 350
  },
  "payment_terms": "Condições de pagamento sugeridas",
  "expected_benefits": [
    {
      "benefit": "Benefício mensurável",
      "metric": "Métrica específica",
      "target": "Meta numérica"
    }
  ],
  "risk_mitigation": [
    {
      "risk": "Risco identificado",
      "probability": "low/medium/high",
      "mitigation": "Como mitigar"
    }
  ],
  "success_metrics": [
    {
      "metric": "Métrica de sucesso",
      "baseline": "Valor atual",
      "target": "Valor desejado",
      "timeline": "Prazo"
    }
  ],
  "similar_cases": [
    {
      "company_profile": "Perfil similar",
      "challenge": "Desafio enfrentado",
      "solution": "Solução implementada",
      "results": "Resultados obtidos"
    }
  ]
}

Retorne APENAS JSON válido.`;

    // 3. Chamar IA
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;

    // 4. Parse JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('IA não retornou JSON válido');
    }

    const businessCaseData = JSON.parse(jsonMatch[0]);

    // 5. Salvar Business Case
    const { data: businessCase, error: bcError } = await supabaseClient
      .from('business_cases')
      .insert({
        account_strategy_id: accountStrategyId,
        company_id: strategy.company_id,
        version: 1,
        status: 'draft',
        current_situation: businessCaseData.current_situation,
        identified_problems: businessCaseData.identified_problems,
        business_impact: businessCaseData.business_impact,
        proposed_solution: businessCaseData.proposed_solution,
        implementation_phases: businessCaseData.implementation_phases,
        products_included: businessCaseData.products_included,
        investment_breakdown: businessCaseData.investment_breakdown,
        roi_calculation: businessCaseData.roi_calculation,
        payment_terms: businessCaseData.payment_terms,
        expected_benefits: businessCaseData.expected_benefits,
        risk_mitigation: businessCaseData.risk_mitigation,
        success_metrics: businessCaseData.success_metrics,
        similar_cases: businessCaseData.similar_cases,
        created_by: req.headers.get('x-user-id') || null
      })
      .select()
      .single();

    if (bcError) {
      console.error('Business Case Insert Error:', bcError);
      throw bcError;
    }

    console.log('✅ Business Case criado:', businessCase.id);

    return new Response(
      JSON.stringify({
        success: true,
        businessCase
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
