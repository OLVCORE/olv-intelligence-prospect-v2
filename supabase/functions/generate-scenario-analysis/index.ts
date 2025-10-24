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

    const { company_id, account_strategy_id, quote_id, base_investment, base_annual_benefit } = await req.json();

    console.log('📊 Gerando análise de cenários...', { company_id, base_investment, base_annual_benefit });

    // Buscar contexto
    const { data: company } = await supabase
      .from('companies')
      .select('name, industry, employees, digital_maturity_score')
      .eq('id', company_id)
      .single();

    // Calcular cenários com variações
    const discount_rate = 0.12;
    const project_years = 5;

    // MELHOR CASO: +30% benefício, -10% investimento
    const best_investment = base_investment * 0.9;
    const best_benefit = base_annual_benefit * 1.3;
    const best_payback = best_investment / best_benefit * 12;
    let best_npv = -best_investment;
    for (let year = 1; year <= project_years; year++) {
      best_npv += best_benefit / Math.pow(1 + discount_rate, year);
    }
    const best_roi = ((best_benefit * project_years - best_investment) / best_investment) * 100;
    const best_cumulative = best_benefit * project_years - best_investment;

    // CENÁRIO ESPERADO: valores base
    const exp_investment = base_investment;
    const exp_benefit = base_annual_benefit;
    const exp_payback = exp_investment / exp_benefit * 12;
    let exp_npv = -exp_investment;
    for (let year = 1; year <= project_years; year++) {
      exp_npv += exp_benefit / Math.pow(1 + discount_rate, year);
    }
    const exp_roi = ((exp_benefit * project_years - exp_investment) / exp_investment) * 100;
    const exp_cumulative = exp_benefit * project_years - exp_investment;

    // PIOR CASO: -20% benefício, +15% investimento
    const worst_investment = base_investment * 1.15;
    const worst_benefit = base_annual_benefit * 0.8;
    const worst_payback = worst_investment / worst_benefit * 12;
    let worst_npv = -worst_investment;
    for (let year = 1; year <= project_years; year++) {
      worst_npv += worst_benefit / Math.pow(1 + discount_rate, year);
    }
    const worst_roi = ((worst_benefit * project_years - worst_investment) / worst_investment) * 100;
    const worst_cumulative = worst_benefit * project_years - worst_investment;

    // IA: Análise estratégica dos cenários
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    let key_insights: string[] = [];
    let risk_factors: any[] = [];
    let assumptions: string[] = [];

    if (LOVABLE_API_KEY) {
      try {
        const aiPrompt = `Analise estes cenários de investimento para ${company?.name || 'empresa'}:

MELHOR CASO:
- Investimento: R$ ${best_investment.toFixed(2)}
- Benefício Anual: R$ ${best_benefit.toFixed(2)}
- ROI: ${best_roi.toFixed(1)}%
- NPV: R$ ${best_npv.toFixed(2)}
- Payback: ${best_payback.toFixed(1)} meses

ESPERADO:
- Investimento: R$ ${exp_investment.toFixed(2)}
- Benefício Anual: R$ ${exp_benefit.toFixed(2)}
- ROI: ${exp_roi.toFixed(1)}%
- NPV: R$ ${exp_npv.toFixed(2)}
- Payback: ${exp_payback.toFixed(1)} meses

PIOR CASO:
- Investimento: R$ ${worst_investment.toFixed(2)}
- Benefício Anual: R$ ${worst_benefit.toFixed(2)}
- ROI: ${worst_roi.toFixed(1)}%
- NPV: R$ ${worst_npv.toFixed(2)}
- Payback: ${worst_payback.toFixed(1)} meses

Forneça análise estruturada com insights-chave, fatores de risco e premissas.`;

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
                content: 'Você é um CFO experiente analisando cenários de investimento. Responda APENAS com JSON válido.'
              },
              { role: 'user', content: aiPrompt }
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'provide_scenario_analysis',
                description: 'Fornecer análise de cenários',
                parameters: {
                  type: 'object',
                  properties: {
                    key_insights: { 
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Lista de 3-5 insights principais'
                    },
                    risk_factors: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          factor: { type: 'string' },
                          impact: { type: 'string', enum: ['low', 'medium', 'high'] },
                          probability: { type: 'number', minimum: 0, maximum: 1 },
                          mitigation: { type: 'string' }
                        }
                      }
                    },
                    assumptions: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Premissas críticas da análise'
                    }
                  },
                  required: ['key_insights', 'risk_factors', 'assumptions']
                }
              }
            }],
            tool_choice: { type: 'function', function: { name: 'provide_scenario_analysis' } }
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall) {
            const analysis = JSON.parse(toolCall.function.arguments);
            key_insights = analysis.key_insights || [];
            risk_factors = analysis.risk_factors || [];
            assumptions = analysis.assumptions || [];
          }
        }
      } catch (aiError) {
        console.error('⚠️  Erro na IA:', aiError);
      }
    }

    // Definir defaults se IA falhar
    if (key_insights.length === 0) {
      key_insights = [
        `O cenário esperado apresenta ROI de ${exp_roi.toFixed(1)}% em ${project_years} anos`,
        `Payback esperado de ${exp_payback.toFixed(1)} meses`,
        `NPV positivo em todos os cenários indica viabilidade do investimento`,
      ];
    }

    // Salvar análise
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenario_analysis')
      .insert({
        company_id,
        account_strategy_id,
        quote_id,
        best_case: {
          roi: best_roi,
          npv: best_npv,
          payback_months: best_payback,
          total_investment: best_investment,
          annual_benefit: best_benefit,
          cumulative_5y: best_cumulative,
        },
        expected_case: {
          roi: exp_roi,
          npv: exp_npv,
          payback_months: exp_payback,
          total_investment: exp_investment,
          annual_benefit: exp_benefit,
          cumulative_5y: exp_cumulative,
        },
        worst_case: {
          roi: worst_roi,
          npv: worst_npv,
          payback_months: worst_payback,
          total_investment: worst_investment,
          annual_benefit: worst_benefit,
          cumulative_5y: worst_cumulative,
        },
        key_insights,
        risk_factors,
        assumptions,
        recommended_scenario: 'expected',
        confidence_level: 0.75,
      })
      .select()
      .single();

    if (scenarioError) throw scenarioError;

    console.log('✅ Análise de cenários concluída:', scenario.id);

    return new Response(JSON.stringify({
      success: true,
      scenario,
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
