// Boas práticas: use Deno.serve (não importe serve do std)
// Use npm: com versão fixa
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

type CompanyData = {
  id?: string;
  company_name: string;
  fantasy_name?: string;
  main_activity?: string;
  company_size?: string;
  city?: string;
  state?: string;
  employee_count?: number;
  annual_revenue?: number;
  website?: string;
};

type DecisionMaker = {
  full_name: string;
  position?: string;
  department?: string;
  seniority_level?: string;
};

type Payload = {
  companyId?: string;
  companyData: CompanyData;
  decisionMakers?: DecisionMaker[];
  save_to_db?: boolean;
};

type Stakeholder = {
  name: string;
  role: string;
  influence_level: "Alto" | "Médio" | "Baixo";
  engagement_approach: string;
  recommended_content: string;
};

type NextAction = {
  action: string;
  responsible: string;
  timeline: string;
  priority: "Alta" | "Média" | "Baixa";
};

type ContentStrategy = {
  first_touch: string;
  nurture_sequence: string[];
  meeting_preparation: string;
};

type AccountStrategy = {
  executive_summary: string;
  key_stakeholders: Stakeholder[];
  value_proposition: string;
  pain_points_addressed: string[];
  competitive_advantages: string[];
  next_actions: NextAction[];
  content_strategy: ContentStrategy;
  success_metrics: string[];
  estimated_timeline: string;
  risk_factors: string[];
};

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

console.info("generate-account-strategy started");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API Key não configurada nas Edge Functions secrets");
    }

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });

    const { companyId, companyData, decisionMakers, save_to_db }: Payload = await req.json();

    if (!companyData?.company_name) {
      throw new Error("company_name é obrigatório");
    }

    // Construct strategy prompt
    const decisionMakersList = decisionMakers && decisionMakers.length > 0
      ? decisionMakers.map((d) => `${d.full_name} - ${d.position || "Cargo não informado"}`).join(", ")
      : "Decisores não identificados ainda";

    const prompt = `Gere uma estratégia completa de Account-Based Selling (ABS) para:

DADOS DA EMPRESA:
- Nome: ${companyData.company_name}
- Setor: ${companyData.main_activity || "N/A"}
- Porte: ${companyData.company_size || "N/A"}
- Localização: ${companyData.city || "N/A"}, ${companyData.state || "N/A"}
- Funcionários: ${companyData.employee_count || "N/A"}
- Receita Anual: R$ ${companyData.annual_revenue ? companyData.annual_revenue.toLocaleString("pt-BR") : "N/A"}
- Website: ${companyData.website || "N/A"}

DECISORES IDENTIFICADOS:
${decisionMakersList}

Forneça em JSON estruturado e válido:
{
  "executive_summary": "resumo executivo da oportunidade (2-3 parágrafos)",
  "key_stakeholders": [
    {
      "name": "nome do decisor",
      "role": "cargo",
      "influence_level": "Alto|Médio|Baixo",
      "engagement_approach": "abordagem específica para este stakeholder",
      "recommended_content": "tipo de conteúdo a enviar"
    }
  ],
  "value_proposition": "proposta de valor específica para esta empresa",
  "pain_points_addressed": ["dor 1", "dor 2", "dor 3"],
  "competitive_advantages": ["vantagem 1", "vantagem 2"],
  "next_actions": [
    {
      "action": "descrição da ação",
      "responsible": "SDR|BDR|AE",
      "timeline": "prazo",
      "priority": "Alta|Média|Baixa"
    }
  ],
  "content_strategy": {
    "first_touch": "tipo de primeiro contato",
    "nurture_sequence": ["conteúdo 1", "conteúdo 2", "conteúdo 3"],
    "meeting_preparation": "pontos chave para reunião"
  },
  "success_metrics": ["métrica 1", "métrica 2", "métrica 3"],
  "estimated_timeline": "prazo estimado para fechamento",
  "risk_factors": ["risco 1", "risco 2"]
}

Seja específico e prático. Foque em ações concretas.`;

    // Try GPT-4 first, fallback to GPT-3.5
    let modelUsed = "gpt-4";
    let response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "Você é um especialista em estratégias de vendas B2B e Account-Based Selling. Responda sempre em JSON válido e estruturado.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    // Fallback to GPT-3.5 if GPT-4 fails
    if (!response.ok) {
      console.warn("GPT-4 failed, trying GPT-3.5-turbo...");
      modelUsed = "gpt-3.5-turbo";
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "Você é um especialista em estratégias de vendas B2B. Responda em JSON válido.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 1500,
        }),
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const result = await response.json();
    const strategyText = result.choices?.[0]?.message?.content;

    if (!strategyText) {
      throw new Error("OpenAI retornou resposta vazia");
    }

    // Parse JSON response
    let strategy: AccountStrategy;
    try {
      strategy = JSON.parse(strategyText);
    } catch (parseError) {
      // Se não for JSON válido, cria estrutura mínima
      strategy = {
        executive_summary: strategyText,
        key_stakeholders: [],
        value_proposition: "Análise manual necessária",
        pain_points_addressed: [],
        competitive_advantages: [],
        next_actions: [],
        content_strategy: {
          first_touch: "Email personalizado",
          nurture_sequence: [],
          meeting_preparation: "Preparar demonstração",
        },
        success_metrics: [],
        estimated_timeline: "3-6 meses",
        risk_factors: [],
      };
    }

    // Salvar no banco se solicitado
    if (save_to_db && companyId) {
      await supabase.from("analysis_runs").insert({
        company_id: companyId,
        analysis_type: "account_strategy",
        input_parameters: { companyData, decisionMakers },
        result_data: strategy,
        status: "completed",
        completed_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        strategy,
        company_id: companyId,
        generated_at: new Date().toISOString(),
        model_used: modelUsed,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    console.error("generate-account-strategy error:", err);
    const message = typeof err?.message === "string" ? err.message : "Internal error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
