// Boas práticas: use Deno.serve (não importe serve do std)
// Use npm: com versão fixa
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

type CompanyData = {
  id?: string;
  company_name: string;
  fantasy_name?: string;
  cnpj?: string;
  main_activity?: string;
  company_size?: string;
  employee_count?: number;
  annual_revenue?: number;
  city?: string;
  state?: string;
};

type Payload = {
  companyData: CompanyData;
  save_to_db?: boolean; // se true, salva resultado em analysis_runs
};

type AnalysisResult = {
  fit_score: number;
  recommended_products: string[];
  pain_points: string[];
  engagement_strategy: string;
  priority_level: "Alta" | "Média" | "Baixa";
  estimated_deal_size: string;
};

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

console.info("analyze-totvs-fit started");

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

    const { companyData, save_to_db }: Payload = await req.json();

    if (!companyData?.company_name) {
      throw new Error("company_name é obrigatório");
    }

    // Construct analysis prompt
    const prompt = `Analise a adequação desta empresa brasileira para soluções TOTVS ERP:

Empresa: ${companyData.company_name}
Nome Fantasia: ${companyData.fantasy_name || "N/A"}
CNPJ: ${companyData.cnpj || "N/A"}
Atividade Principal: ${companyData.main_activity || "N/A"}
Porte: ${companyData.company_size || "N/A"}
Funcionários: ${companyData.employee_count || "N/A"}
Receita Anual: R$ ${companyData.annual_revenue ? companyData.annual_revenue.toLocaleString("pt-BR") : "N/A"}
Localização: ${companyData.city || "N/A"}, ${companyData.state || "N/A"}

Forneça uma análise estruturada em JSON válido com:
{
  "fit_score": 0-100,
  "recommended_products": ["produto1", "produto2", "produto3"],
  "pain_points": ["dor1", "dor2", "dor3"],
  "engagement_strategy": "estratégia detalhada de abordagem",
  "priority_level": "Alta|Média|Baixa",
  "estimated_deal_size": "valor estimado do negócio em R$"
}

Considere o perfil da empresa, setor de atuação e porte para a recomendação.`;

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: "Você é um especialista em análise de fit para soluções TOTVS ERP. Responda sempre em JSON válido.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const result = await response.json();
    const analysisText = result.choices?.[0]?.message?.content;

    if (!analysisText) {
      throw new Error("OpenAI retornou resposta vazia");
    }

    // Parse JSON response
    let analysis: AnalysisResult;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      // Se não for JSON válido, cria estrutura padrão
      analysis = {
        fit_score: 50,
        recommended_products: ["TOTVS Protheus"],
        pain_points: ["Análise manual necessária"],
        engagement_strategy: analysisText,
        priority_level: "Média",
        estimated_deal_size: "A definir",
      };
    }

    // Salvar no banco se solicitado
    if (save_to_db && companyData.id) {
      await supabase.from("analysis_runs").insert({
        company_id: companyData.id,
        analysis_type: "totvs_fit",
        input_parameters: { companyData },
        result_data: analysis,
        status: "completed",
        completed_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        company_id: companyData.id,
        analyzed_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    console.error("analyze-totvs-fit error:", err);
    const message = typeof err?.message === "string" ? err.message : "Internal error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
