// Boas práticas: use Deno.serve (não importe serve do std)
// Use npm: com versão fixa
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

type Filters = {
  city?: string;
  state?: string;
  company_size?: string;
};

type Payload = {
  query?: string;
  filters?: Filters;
  page?: number;
  page_size?: number;
  select?: string; // opcional: projeção personalizada
};

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*", // ajuste para seu domínio em produção
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
// Se você precisar ignorar RLS (cuidado!), use a linha abaixo e troque o token usado no createClient:
// const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

const sanitizeIlike = (s: string) =>
  s.replaceAll("%", "\\%").replaceAll("_", "\\_"); // evitar tratamento como wildcard

console.info("search-companies started");

Deno.serve(async (req: Request) => {
  // CORS preflight
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
    const authHeader = req.headers.get("Authorization");
    // Por padrão, use ANON_KEY e propague o JWT do usuário com setAuth para respeitar RLS
    const supabase = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });
    // Alternativa (descomente para bypass de RLS — somente se necessário):
    // const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { query, filters, page, page_size, select }: Payload = await req.json().catch(() => ({}));

    const size = clamp(Number(page_size ?? 50) || 50, 1, 200);
    const pageNum = clamp(Number(page ?? 1) || 1, 1, 1000000);
    const from = (pageNum - 1) * size;
    const to = from + size - 1;

    // Selecione colunas necessárias (ajuste conforme seu schema)
    const columns =
      select ??
      "id, company_name, fantasy_name, cnpj, city, state, company_size, created_at";

    let qb = supabase
      .from("companies")
      .select(columns, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    // Busca textual
    if (query && String(query).trim() !== "") {
      const q = sanitizeIlike(String(query).trim());
      // Use or com ilike escapado
      qb = qb.or(
        `company_name.ilike.%${q}%,fantasy_name.ilike.%${q}%,cnpj.ilike.%${q}%`,
      );
    }

    // Filtros
    if (filters?.city) qb = qb.eq("city", filters.city);
    if (filters?.state) qb = qb.eq("state", filters.state);
    if (filters?.company_size) qb = qb.eq("company_size", filters.company_size);

    const { data, error, count } = await qb;
    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        companies: data ?? [],
        count: count ?? 0,
        page: pageNum,
        page_size: size,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("search-companies error:", err);
    const message = typeof err?.message === "string" ? err.message : "Internal error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
