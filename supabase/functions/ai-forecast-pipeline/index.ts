import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch deals data
    const { data: deals, error: dealsError } = await supabase
      .from('sdr_deals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (dealsError) throw dealsError;

    // Prepare data for AI analysis
    const openDeals = deals?.filter(d => d.status === 'open') || [];
    const closedDeals = deals?.filter(d => d.status !== 'open') || [];
    const wonDeals = deals?.filter(d => d.status === 'won') || [];

    const pipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const avgDealSize = deals.length > 0 ? deals.reduce((sum, d) => sum + (d.value || 0), 0) / deals.length : 0;
    const winRate = closedDeals.length > 0 ? (wonDeals.length / closedDeals.length) * 100 : 0;

    // Stage distribution
    const stageDistribution = openDeals.reduce((acc, d) => {
      acc[d.stage] = (acc[d.stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const prompt = `Você é um analista de vendas especializado. Analise os dados do pipeline e gere uma previsão inteligente de fechamento para os próximos 90 dias.

DADOS ATUAIS:
- Pipeline Total: R$ ${pipelineValue.toLocaleString('pt-BR')}
- Deals Ativos: ${openDeals.length}
- Taxa de Conversão Histórica: ${winRate.toFixed(1)}%
- Ticket Médio: R$ ${avgDealSize.toLocaleString('pt-BR')}
- Distribuição por Estágio: ${JSON.stringify(stageDistribution)}

DEALS NO PIPELINE:
${openDeals.slice(0, 20).map(d => `
  - ${d.title}: R$ ${d.value?.toLocaleString('pt-BR')} | Estágio: ${d.stage} | Probabilidade: ${d.probability}% | Prioridade: ${d.priority}
`).join('')}

INSTRUÇÕES:
1. Calcule uma previsão realista (Best Case, Expected Case, Worst Case) para os próximos 30, 60 e 90 dias
2. Identifique os top 5 deals com maior probabilidade de fechamento
3. Liste os principais riscos que podem impactar o forecast
4. Sugira 3 ações prioritárias para acelerar o pipeline

Seja preciso, use os dados fornecidos e forneça números específicos.`;

    console.log("Calling OpenAI for forecast...");

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Você é um analista de vendas B2B especializado em forecast e previsão de pipeline. Forneça análises objetivas e acionáveis baseadas em dados."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const forecastAnalysis = aiData.choices[0]?.message?.content || "Unable to generate forecast";

    console.log("AI Forecast generated successfully");

    return new Response(
      JSON.stringify({
        forecast: forecastAnalysis,
        metadata: {
          pipelineValue,
          openDeals: openDeals.length,
          winRate,
          avgDealSize,
          stageDistribution,
          generatedAt: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in ai-forecast-pipeline:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
