// ✅ Edge Function para análise contextual com IA
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI_CONTEXTUAL_ANALYSIS', 'Processing prompt', { promptLength: prompt.length });

    // Usar OpenAI GPT-4
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'Você é um analista de inteligência de negócios especializado em análise 360° de empresas B2B. Forneça insights estratégicos, objetivos e acionáveis baseados em dados reais.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 800
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI_CONTEXTUAL_ANALYSIS', 'OpenAI error', { status: response.status, error: errorText });
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || 'Análise não disponível';

    console.log('AI_CONTEXTUAL_ANALYSIS', 'Analysis generated', { analysisLength: analysis.length });

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI_CONTEXTUAL_ANALYSIS', 'Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        analysis: 'Análise contextual temporariamente indisponível.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
