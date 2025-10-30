// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { deals } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurado");
    }

    const systemPrompt = `Você é um especialista em análise preditiva de vendas B2B. 
Analise os deals fornecidos e retorne predições sobre probabilidade de fechamento, fatores de risco e recomendações.
Responda APENAS com JSON válido no formato especificado.`;

    const userPrompt = `Analise os seguintes deals e retorne predições:

${deals.map((d: any, i: number) => `
Deal ${i + 1}:
- Título: ${d.title}
- Estágio: ${d.stage}
- Valor: R$ ${d.value}
- Probabilidade atual: ${d.probability}%
- Criado em: ${d.created_at}
- Data esperada fechamento: ${d.expected_close_date || 'não definida'}
- Empresa: ${d.company_name || 'N/A'}
`).join('\n')}

Para cada deal, analise:
1. Probabilidade real de fechamento (0-100)
2. Data prevista de fechamento
3. Fatores de risco identificados
4. Recomendações específicas para aumentar conversão`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_predictions",
              description: "Retorna predições de fechamento para deals",
              parameters: {
                type: "object",
                properties: {
                  predictions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        dealId: { type: "string" },
                        dealTitle: { type: "string" },
                        currentStage: { type: "string" },
                        winProbability: { 
                          type: "number",
                          minimum: 0,
                          maximum: 100
                        },
                        predictedCloseDate: { type: "string" },
                        riskFactors: {
                          type: "array",
                          items: { type: "string" }
                        },
                        recommendations: {
                          type: "array",
                          items: { type: "string" }
                        }
                      },
                      required: ["dealId", "dealTitle", "currentStage", "winProbability", "predictedCloseDate", "riskFactors", "recommendations"]
                    }
                  }
                },
                required: ["predictions"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_predictions" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos no workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Erro AI Gateway:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI Response:", JSON.stringify(aiResponse));

    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("AI não retornou predições estruturadas");
    }

    const predictions = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(predictions),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro ao processar predições:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido",
        predictions: []
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
