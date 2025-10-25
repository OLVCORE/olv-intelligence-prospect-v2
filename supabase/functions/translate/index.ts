import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { texts, target } = await req.json();

    if (!Array.isArray(texts) || texts.length === 0) {
      return new Response(JSON.stringify({ error: "Parâmetro 'texts' deve ser um array com ao menos um item" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supported = ["pt-BR", "en", "es"];
    const targetLang = supported.includes(target) ? target : "pt-BR";

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const systemPrompt = `Você é um tradutor profissional. Traduza os textos mantendo:
- Significado e tom profissional
- Nomes próprios e termos de produtos sem alterar
- Formatação simples (quebras de linha) quando existirem

IMPORTANTE:
- Retorne APENAS JSON com o array "translations" na mesma ordem dos textos de entrada
- Idioma de destino: ${targetLang}
- Não adicione comentários, prefixos ou markdown`;

    const userPrompt = `Traduza para ${targetLang} os seguintes textos (array JSON):\n${JSON.stringify(texts)}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("translate gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Falha no serviço de tradução" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";

    let translations: string[] = [];
    try {
      const parsed = JSON.parse(content);
      translations = parsed.translations || [];
    } catch {
      // fallback simples: retorna os mesmos textos
      translations = texts;
    }

    // Garantir mesmo comprimento
    if (translations.length !== texts.length) {
      translations = texts.map((t: string, i: number) => translations[i] ?? t);
    }

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
