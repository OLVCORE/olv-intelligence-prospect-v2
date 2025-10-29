import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar dados do usuário
    const { data: deals } = await supabase
      .from("sdr_deals")
      .select(`
        *,
        company:companies(*)
      `)
      .eq("status", "open")
      .order("updated_at", { ascending: false })
      .limit(10);

    // Buscar sinais de intent recentes
    const { data: signals } = await supabase
      .from("intent_signals")
      .select("*, company:companies(*)")
      .gte("detected_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("confidence_score", { ascending: false })
      .limit(5);

    // Buscar deals estagnados (sem atividade há mais de 7 dias)
    const { data: staleDeals } = await supabase
      .from("sdr_deals")
      .select("*, company:companies(*)")
      .eq("status", "open")
      .lt("last_activity_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("value", { ascending: false })
      .limit(5);

    // Preparar prompt para IA
    const systemPrompt = `Você é um AI Sales Copilot expert. Analise os dados do pipeline de vendas e gere sugestões ACIONÁVEIS e PRIORITÁRIAS.

Regras:
1. Máximo 5 sugestões
2. Priorize deals de alto valor e sinais de compra fortes
3. Identifique riscos (deals estagnados, baixa probabilidade)
4. Sugira ações concretas (ligar, enviar proposta, agendar reunião)
5. Seja direto e específico

Retorne APENAS um JSON array com este formato exato:
[
  {
    "type": "action|alert|opportunity|warning|insight",
    "priority": "urgent|high|medium|low",
    "title": "Título curto e direto",
    "description": "Descrição detalhada (max 100 chars)",
    "action": {
      "label": "Ação a ser tomada",
      "type": "navigate|create_task|send_message|update_deal|create_proposal",
      "payload": { "dealId": "uuid", "url": "/path" }
    },
    "metadata": {
      "dealId": "uuid",
      "companyId": "uuid",
      "companyName": "Nome",
      "score": 85,
      "confidence": 0.92
    }
  }
]`;

    const userPrompt = `Analise o pipeline e gere sugestões:

DEALS ATIVOS (${deals?.length || 0}):
${deals?.slice(0, 5).map((d: any) => `
- ${d.company?.name || "N/A"} - ${d.title}
  Estágio: ${d.stage} | Valor: R$ ${d.value} | Prob: ${d.probability}%
  Última atividade: ${d.last_activity_at}
  Prioridade: ${d.priority}
`).join("\n")}

SINAIS DE COMPRA (${signals?.length || 0}):
${signals?.map((s: any) => `
- ${s.company?.name}: ${s.signal_type} (${s.confidence_score}/100)
  Detectado: ${s.detected_at}
`).join("\n")}

DEALS ESTAGNADOS (${staleDeals?.length || 0}):
${staleDeals?.map((d: any) => `
- ${d.company?.name} - R$ ${d.value}
  Sem atividade há ${Math.floor((Date.now() - new Date(d.last_activity_at).getTime()) / (24 * 60 * 60 * 1000))} dias
`).join("\n")}

Gere 3-5 sugestões PRIORITÁRIAS agora.`;

    // Chamar Lovable AI (usando modelo mais econômico)
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errorText);
      
      // Tratar erros específicos
      if (aiResponse.status === 402) {
        throw new Error("Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage");
      }
      if (aiResponse.status === 429) {
        throw new Error("Limite de requisições excedido. Aguarde alguns instantes");
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;

    // Extrair JSON do response
    let suggestions = [];
    try {
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = JSON.parse(aiContent);
      }
    } catch (e) {
      console.error("Failed to parse AI response:", aiContent);
      suggestions = [];
    }

    // Adicionar IDs únicos
    suggestions = suggestions.map((s: any) => ({
      ...s,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    }));

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Copilot suggest error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        suggestions: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
