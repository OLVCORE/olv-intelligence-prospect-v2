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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { company_id, account_strategy_id, outcome, deal_value, competitors_faced, primary_competitor } = await req.json();

    console.log('🎯 Analisando resultado competitivo...', { outcome, primary_competitor });

    // Buscar contexto
    const { data: company } = await supabase
      .from('companies')
      .select('name, industry, employees')
      .eq('id', company_id)
      .single();

    // IA: Análise de Win/Loss
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    let win_reasons: string[] = [];
    let loss_reasons: string[] = [];
    let key_differentiators: string[] = [];
    let lessons_learned: string[] = [];
    let competitive_intensity = 'medium';

    if (LOVABLE_API_KEY) {
      try {
        const aiPrompt = `Analise este resultado de deal competitivo:

Empresa: ${company?.name} (${company?.employees} funcionários, ${company?.industry})
Resultado: ${outcome.toUpperCase()}
Valor do Deal: R$ ${deal_value.toLocaleString()}
Competidores Enfrentados: ${competitors_faced.join(', ')}
Principal Competidor: ${primary_competitor}

Forneça análise estruturada com razões de ${outcome === 'won' ? 'vitória' : outcome === 'lost' ? 'perda' : 'status atual'}, diferenciais-chave e lições aprendidas.`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'Você é um analista de vendas B2B especializado em análise competitiva. Responda APENAS com JSON válido.'
              },
              { role: 'user', content: aiPrompt }
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'provide_competitive_analysis',
                description: 'Fornecer análise competitiva do deal',
                parameters: {
                  type: 'object',
                  properties: {
                    win_reasons: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Razões de vitória (se won)'
                    },
                    loss_reasons: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Razões de perda (se lost)'
                    },
                    key_differentiators: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Diferenciais competitivos'
                    },
                    lessons_learned: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Lições aprendidas'
                    },
                    competitive_intensity: {
                      type: 'string',
                      enum: ['low', 'medium', 'high', 'extreme']
                    }
                  },
                  required: ['key_differentiators', 'lessons_learned', 'competitive_intensity']
                }
              }
            }],
            tool_choice: { type: 'function', function: { name: 'provide_competitive_analysis' } }
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall) {
            const analysis = JSON.parse(toolCall.function.arguments);
            win_reasons = analysis.win_reasons || [];
            loss_reasons = analysis.loss_reasons || [];
            key_differentiators = analysis.key_differentiators || [];
            lessons_learned = analysis.lessons_learned || [];
            competitive_intensity = analysis.competitive_intensity || 'medium';
          }
        }
      } catch (aiError) {
        console.error('⚠️  Erro na IA:', aiError);
      }
    }

    // Salvar análise
    const { data: analysis, error: analysisError } = await supabase
      .from('win_loss_analysis')
      .insert({
        company_id,
        account_strategy_id,
        outcome,
        deal_value,
        competitors_faced,
        primary_competitor,
        win_reasons,
        loss_reasons,
        key_differentiators,
        lessons_learned,
        competitive_intensity,
        closed_at: outcome !== 'ongoing' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (analysisError) throw analysisError;

    console.log('✅ Análise competitiva concluída:', analysis.id);

    return new Response(JSON.stringify({
      success: true,
      analysis,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
