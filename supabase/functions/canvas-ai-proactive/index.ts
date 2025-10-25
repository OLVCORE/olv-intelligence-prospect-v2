import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyData, digitalMaturity, buyingSignals } = await req.json();

    console.log('Canvas AI Proactive Analysis:', { 
      company: companyData?.name,
      maturityScore: digitalMaturity?.overall_score,
      signalsCount: buyingSignals?.length 
    });

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Construir contexto rico para análise
    const context = `
DADOS DA EMPRESA:
Nome: ${companyData?.name || 'N/A'}
Indústria: ${companyData?.industry || 'N/A'}
Funcionários: ${companyData?.employees || 'N/A'}
Website: ${companyData?.website || 'N/A'}

MATURIDADE DIGITAL:
Score Geral: ${digitalMaturity?.overall_score || 0}/100
Sistemas: ${digitalMaturity?.systems_score || 0}
Infraestrutura: ${digitalMaturity?.infrastructure_score || 0}
Inovação: ${digitalMaturity?.innovation_score || 0}

SINAIS DE COMPRA (${buyingSignals?.length || 0}):
${buyingSignals?.map((s: any) => `- ${s.signal_type}: ${s.description}`).join('\n') || 'Nenhum sinal detectado'}

TECNOLOGIAS:
${companyData?.technologies?.join(', ') || 'Não detectado'}
`;

    const systemPrompt = `Você é um analista estratégico de vendas B2B especializado em prospecção inteligente.

Sua função é analisar os dados da empresa e gerar insights ACIONÁVEIS e ESPECÍFICOS.

IMPORTANTE: Responda SEMPRE em português brasileiro.

Retorne EXATAMENTE 3-5 sugestões no seguinte formato JSON:
{
  "suggestions": [
    {
      "type": "insight" | "risk" | "hypothesis" | "task",
      "content": "Texto da sugestão em português (máximo 200 caracteres)"
    }
  ]
}

REGRAS:
- Insights: oportunidades identificadas nos dados
- Riscos: pontos de atenção ou barreiras
- Hipóteses: suposições que precisam validação
- Tasks: ações específicas recomendadas

Seja direto, objetivo e focado em VENDAS B2B. SEMPRE em português.`;

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
          { role: 'user', content: context }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const resultText = aiData.choices[0]?.message?.content || '{}';
    
    // Parse JSON response
    let suggestions = [];
    try {
      const parsed = JSON.parse(resultText);
      suggestions = parsed.suggestions || [];
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      // Fallback: criar sugestão genérica
      suggestions = [{
        type: 'insight',
        content: 'Análise em andamento. Aguarde mais dados para sugestões específicas.'
      }];
    }

    console.log('AI Proactive suggestions generated:', suggestions.length);

    return new Response(
      JSON.stringify({ suggestions }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Canvas AI Proactive error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
