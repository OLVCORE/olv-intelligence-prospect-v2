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
    const { companyId, personaId, decisionMakerId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // 1. Buscar dados da empresa
    const { data: company, error: companyError } = await supabaseClient
      .from('companies')
      .select('*, digital_maturity(*), governance_signals(*), decision_makers(*)')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      throw new Error('Empresa não encontrada');
    }

    // 2. Buscar persona
    const { data: persona, error: personaError } = await supabaseClient
      .from('buyer_personas')
      .select('*')
      .eq('id', personaId)
      .single();

    if (personaError || !persona) {
      throw new Error('Persona não encontrada');
    }

    // 3. Buscar decision maker específico
    let decisionMaker = null;
    if (decisionMakerId) {
      const { data: dm } = await supabaseClient
        .from('decision_makers')
        .select('*')
        .eq('id', decisionMakerId)
        .single();
      decisionMaker = dm;
    }

    // 4. Preparar contexto para IA
    const governanceAnalysis = company.governance_signals?.[0] || {};
    const maturityData = company.digital_maturity?.[0] || {};
    
    const systemPrompt = `Você é um consultor estratégico especializado em PMEs brasileiras.

**SUA MISSÃO:** Criar uma estratégia de Account Plan completa e executável.

**PERFIL DA PERSONA-ALVO:**
- Nome: ${persona.name}
- Cargo: ${persona.role} (${persona.seniority})
- Estilo de Comunicação: ${persona.communication_style}
- Fatores de Decisão: ${JSON.stringify(persona.decision_factors)}
- Dores: ${JSON.stringify(persona.pain_points)}
- Objeções Típicas: ${JSON.stringify(persona.objections)}
- Canais Preferidos: ${JSON.stringify(persona.preferred_channels)}

**IMPORTANTE:**
- Adapte toda a estratégia ao perfil dessa persona
- Use linguagem e argumentos que ressoam com ela
- Antecipe objeções e prepare contra-argumentações
- Sugira abordagens nos canais preferidos dela`;

    const userPrompt = `Crie uma estratégia comercial completa para:

**EMPRESA:** ${company.name}
**INDÚSTRIA:** ${company.industry}
**FUNCIONÁRIOS:** ${company.employees}
**MATURIDADE DIGITAL:** ${maturityData.overall_score || 0}/10

**GAPS IDENTIFICADOS:**
${governanceAnalysis.raw_data ? JSON.stringify(governanceAnalysis.raw_data.gaps || []) : 'Nenhum gap identificado ainda'}

**DECISION MAKER:**
${decisionMaker ? `${decisionMaker.name} - ${decisionMaker.title}` : 'Não mapeado ainda'}

**GERE:**
1. **value_proposition**: Proposta de valor personalizada para essa persona (max 200 palavras)
2. **approach_strategy**: Estratégia de abordagem detalhada (3-5 parágrafos)
3. **identified_gaps**: Array com gaps críticos encontrados
4. **recommended_products**: Array com produtos TOTVS recomendados (nome, justificativa, prioridade)
5. **transformation_roadmap**: Objeto com {immediate: [], shortTerm: [], mediumTerm: [], longTerm: []}
6. **projected_roi**: ROI projetado em % (número)
7. **investment_required**: Investimento necessário em R$ (número)
8. **payback_period**: Período de retorno (string: "6-12 meses")
9. **stakeholder_map**: Array com stakeholders chave e estratégia para cada
10. **ai_insights**: Objeto com insights estratégicos
11. **ai_recommendations**: Array com 5 próximas ações recomendadas

Retorne APENAS JSON válido, sem markdown.`;

    // 5. Chamar IA
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
      const errorText = await aiResponse.text();
      console.error('AI API Error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;

    // 6. Parse JSON da IA
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('IA não retornou JSON válido');
    }

    const strategy = JSON.parse(jsonMatch[0]);

    // 7. Criar Account Strategy no banco
    const { data: accountStrategy, error: strategyError } = await supabaseClient
      .from('account_strategies')
      .insert({
        company_id: companyId,
        persona_id: personaId,
        decision_maker_id: decisionMakerId,
        status: 'draft',
        current_stage: 'cold_outreach',
        priority: governanceAnalysis.transformation_priority === 'CRITICO' ? 'critical' : 'high',
        value_proposition: strategy.value_proposition,
        approach_strategy: strategy.approach_strategy,
        expected_timeline: '3-6 meses',
        identified_gaps: strategy.identified_gaps || [],
        recommended_products: strategy.recommended_products || [],
        transformation_roadmap: strategy.transformation_roadmap || {},
        projected_roi: strategy.projected_roi || 0,
        investment_required: strategy.investment_required || 0,
        payback_period: strategy.payback_period || '12 meses',
        stakeholder_map: strategy.stakeholder_map || [],
        relationship_score: 0,
        engagement_level: 'cold',
        ai_insights: strategy.ai_insights || {},
        ai_recommendations: strategy.ai_recommendations || [],
        created_by: req.headers.get('x-user-id') || null
      })
      .select()
      .single();

    if (strategyError) {
      console.error('Strategy Insert Error:', strategyError);
      throw strategyError;
    }

    console.log('✅ Account Strategy criada:', accountStrategy.id);

    return new Response(
      JSON.stringify({
        success: true,
        strategy: accountStrategy
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
