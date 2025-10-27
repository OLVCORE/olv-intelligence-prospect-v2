import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id, scenario, context_input } = await req.json();
    
    // scenario: 'objection_handling', 'pricing_negotiation', 'competitive_positioning', 'closing'
    // context_input: texto livre do usuário sobre a situação

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch comprehensive context
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single();

    if (!company) {
      throw new Error('Company not found');
    }

    // Get battle card
    const { data: battleCard } = await supabase
      .from('company_battle_cards')
      .select('*')
      .eq('company_id', company_id)
      .maybeSingle();

    // Get intent signals
    const { data: intentSignals } = await supabase
      .from('intent_signals')
      .select('*')
      .eq('company_id', company_id)
      .gte('detected_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('detected_at', { ascending: false })
      .limit(5);

    // Get win/loss history
    const { data: winLossHistory } = await supabase
      .from('win_loss_analysis')
      .select('*')
      .order('closed_at', { ascending: false })
      .limit(3);

    const systemPrompt = `You are an expert B2B sales negotiation coach for TOTVS ERP solutions. 
Your role is to provide real-time, actionable advice during sales negotiations.

CONCORRENTES REAIS DE TOTVS PARA PMEs (FOCO PRINCIPAL):
- **Bling**: Forte em e-commerce, marketplaces (R$ 59-299/mês)
- **Conta Azul**: Financeiro para micro/pequenas (R$ 90-300/mês)
- **Omie**: ERP completo PMEs, preço competitivo (R$ 149-899/mês)
- **Tiny**: E-commerce, integrações populares (R$ 69-399/mês)
- **vhsys**: ERP completo PME (R$ 89-599/mês)
- **Senior Sistemas**: Consolidado PMEs/Grandes
- **Sankhya**: Médias empresas

IMPORTANTE: NUNCA recomende estratégias para SAP/Oracle a menos que seja realmente detectado. 
Foque em concorrentes SMB reais como Bling, Omie, Conta Azul, Tiny, vhsys.

Key principles:
1. Be specific and tactical - provide exact phrases and responses
2. Leverage the company's context (size, sector, TOTVS usage, intent signals)
3. Use competitive intelligence from battle cards
4. Reference proof points and success stories
5. Focus on value, not features
6. Address concerns directly and confidently
7. Compare TOTVS vs concorrente SMB específico (ROI, suporte, escala)

Format your response as JSON:
{
  "primary_response": "<Main recommendation or script>",
  "alternative_approaches": [<2-3 alternative tactics>],
  "proof_points": [<Relevant proof points to use>],
  "warnings": [<Things to avoid or watch out for>],
  "next_best_actions": [<2-3 immediate next steps>]
}`;

    const contextSummary = `
COMPANY CONTEXT:
- Name: ${company.name}
- Sector: ${company.industry_sector || 'N/A'}
- Employees: ${company.employees || 'N/A'}
- Revenue: ${company.annual_revenue ? `R$ ${company.annual_revenue.toLocaleString()}` : 'N/A'}
- Location: ${company.city}, ${company.state}

TOTVS DETECTION:
- Score: ${company.totvs_detection_score || 0}/100
- Risk Level: ${company.totvs_detection_score >= 70 ? 'HIGH (Already TOTVS customer)' : company.totvs_detection_score >= 30 ? 'MEDIUM (Some TOTVS usage)' : 'LOW (Not using TOTVS)'}

INTENT SIGNALS (Last 90 days):
${intentSignals?.length ? intentSignals.map(s => `- ${s.signal_type}: ${s.description} (Confidence: ${s.confidence_score}%)`).join('\n') : '- No recent intent signals'}

COMPETITIVE INTELLIGENCE:
${battleCard ? `
- Competitor Detected: ${battleCard.competitor_name}
- Competitor Type: ${battleCard.competitor_type}
- Detection Confidence: ${battleCard.detection_confidence}%
- Win Strategy: ${battleCard.win_strategy}
- TOTVS Advantages: ${battleCard.totvs_advantages?.join(', ')}
- Objection Handling Available: ${battleCard.objection_handling?.length || 0} pre-loaded responses
- Proof Points Available: ${battleCard.proof_points?.length || 0} success stories
` : '- No battle card generated yet'}

HISTORICAL PERFORMANCE:
${winLossHistory?.length ? winLossHistory.map(w => 
  `- ${w.outcome.toUpperCase()}: R$ ${w.deal_value?.toLocaleString() || 'N/A'} vs ${w.primary_competitor} - ${w.win_reasons?.join(', ') || w.loss_reasons?.join(', ') || 'No details'}`
).join('\n') : '- No historical deals'}
`;

    const scenarioPrompts = {
      objection_handling: `The prospect raised this objection: "${context_input}"

Provide a tactical response that:
1. Acknowledges their concern
2. Reframes using company-specific data
3. Uses competitive intelligence
4. Offers proof points
5. Guides to next step`,

      pricing_negotiation: `Pricing negotiation situation: "${context_input}"

Provide negotiation tactics that:
1. Anchor on value and ROI
2. Use company size and sector benchmarks
3. Reference competitive pricing intelligence
4. Offer strategic concessions (if any)
5. Build urgency`,

      competitive_positioning: `Competitive positioning challenge: "${context_input}"

Provide positioning strategy that:
1. Differentiate from detected competitor
2. Highlight TOTVS advantages relevant to this company
3. Use battle card intelligence
4. Neutralize competitor strengths
5. Amplify their weaknesses`,

      closing: `Closing situation: "${context_input}"

Provide closing tactics that:
1. Leverage intent signals and urgency
2. Address final concerns
3. Propose clear next steps
4. Create commitment
5. Set implementation timeline`,
    };

    const userPrompt = `${contextSummary}

SCENARIO: ${scenario.toUpperCase().replace('_', ' ')}

${scenarioPrompts[scenario as keyof typeof scenarioPrompts] || context_input}`;

    console.log('AI Negotiation Request:', { company_id, scenario, context_input });

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;

    console.log('AI Response:', aiContent);

    // Parse JSON response
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    let parsedResponse;
    
    if (jsonMatch) {
      parsedResponse = JSON.parse(jsonMatch[0]);
    } else {
      // Fallback if AI didn't return JSON
      parsedResponse = {
        primary_response: aiContent,
        alternative_approaches: [],
        proof_points: battleCard?.proof_points?.slice(0, 3) || [],
        warnings: ['Sempre confirme entendimento antes de prosseguir'],
        next_best_actions: ['Agendar follow-up', 'Enviar proposta formal'],
      };
    }

    const result = {
      company_id,
      company_name: company.name,
      scenario,
      context_input,
      advice: parsedResponse,
      battle_card_available: !!battleCard,
      intent_signals_count: intentSignals?.length || 0,
      generated_at: new Date().toISOString(),
    };

    console.log('Negotiation Assistant Result:', JSON.stringify(result, null, 2));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI negotiation assistant:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
