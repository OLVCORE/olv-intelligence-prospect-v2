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

    // 1. Buscar estratégia + histórico de touchpoints
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

    if (strategyError) throw strategyError;

    // 2. Buscar touchpoints recentes
    const { data: touchpoints } = await supabaseClient
      .from('account_touchpoints')
      .select('*')
      .eq('account_strategy_id', accountStrategyId)
      .order('completed_at', { ascending: false })
      .limit(5);

    // 3. Preparar contexto para IA
    const systemPrompt = `Você é um assistente de vendas estratégico que sugere a próxima melhor ação.

**SUA MISSÃO:** Analisar o contexto atual e sugerir a próxima ação mais eficaz.

**CONSIDERE:**
- Etapa atual do relacionamento
- Histórico de interações
- Preferências da persona
- Timing adequado
- Próximos passos lógicos

**FORMATE:** Ação clara, objetiva e executável imediatamente.`;

    const lastTouchpoint = touchpoints?.[0];
    const daysSinceLastContact = lastTouchpoint 
      ? Math.floor((Date.now() - new Date(lastTouchpoint.completed_at).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const userPrompt = `Sugira a próxima melhor ação para:

**EMPRESA:** ${strategy.companies.name}
**ETAPA ATUAL:** ${strategy.current_stage}
**ENGAGEMENT:** ${strategy.engagement_level}
**PERSONA:** ${strategy.buyer_personas.name} (${strategy.buyer_personas.role})

**ÚLTIMO CONTATO:**
${lastTouchpoint ? `
- Tipo: ${lastTouchpoint.touchpoint_type}
- Há ${daysSinceLastContact} dias
- Resultado: ${lastTouchpoint.outcome || 'Não registrado'}
- Sentimento: ${lastTouchpoint.sentiment || 'Neutro'}
` : 'Nenhum contato registrado ainda'}

**HISTÓRICO RECENTE:**
${touchpoints?.map(t => `- ${t.touchpoint_type} (${t.stage}): ${t.outcome}`).join('\n') || 'Sem histórico'}

**CANAIS PREFERIDOS DA PERSONA:**
${JSON.stringify(strategy.buyer_personas.preferred_channels)}

**GERE JSON:**
{
  "action": "Ação específica a tomar",
  "channel": "email/whatsapp/call/meeting",
  "timing": "Quando executar (ex: 'Hoje', 'Amanhã', 'Em 3 dias')",
  "rationale": "Por que essa é a melhor próxima ação",
  "talking_points": ["Ponto 1", "Ponto 2", "Ponto 3"],
  "expected_outcome": "Resultado esperado",
  "fallback_action": "Ação alternativa se não houver resposta",
  "priority": "high/medium/low"
}

Retorne APENAS JSON válido.`;

    // 4. Chamar IA
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
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

    // 5. Parse JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('IA não retornou JSON válido');
    }

    const suggestion = JSON.parse(jsonMatch[0]);

    console.log('✅ Próxima ação sugerida:', suggestion.action);

    return new Response(
      JSON.stringify({
        success: true,
        suggestion
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
