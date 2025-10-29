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
    const { companyId, apolloOrganizationId } = await req.json();
    
    const APOLLO_API_KEY = Deno.env.get('APOLLO_API_KEY');
    if (!APOLLO_API_KEY) {
      throw new Error('APOLLO_API_KEY não configurada');
    }

    if (!companyId || !apolloOrganizationId) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros ausentes', details: 'companyId e apolloOrganizationId são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Apollo Assign] 🚀 Atribuindo org', apolloOrganizationId, 'para empresa', companyId);

    // Buscar organização no Apollo
    const resp = await fetch('https://api.apollo.io/v1/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': APOLLO_API_KEY },
      body: JSON.stringify({ id: apolloOrganizationId })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[Apollo Assign] ❌ Erro ao obter organização:', resp.status, errText);
      return new Response(
        JSON.stringify({ error: `Apollo API error: ${resp.status}`, details: errText }),
        { status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orgData = await resp.json();
    const org = orgData.organization || orgData;

    // Conectar ao Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar raw_data existente
    const { data: existing } = await supabase
      .from('companies')
      .select('raw_data')
      .eq('id', companyId)
      .maybeSingle();

    // Preparar dados de atualização
    const updateData: Record<string, unknown> = {
      apollo_organization_id: org.id || apolloOrganizationId,
      apollo_id: org.id || apolloOrganizationId,
      domain: org.primary_domain ?? null,
      website: org.website_url ?? null,
      industry: org.industry ?? (org.industries?.[0] ?? null),
      employees: org.estimated_num_employees ?? null,
      employee_count_from_apollo: org.estimated_num_employees ?? null,
      sic_codes: org.sic_codes ?? [],
      naics_codes: org.naics_codes ?? [],
      phone_numbers: org.phone ? [org.phone] : (org.primary_phone?.sanitized_number ? [org.primary_phone.sanitized_number] : []),
      social_urls: {
        blog: org.blog_url ?? null,
        twitter: org.twitter_url ?? null,
        facebook: org.facebook_url ?? null,
        linkedin: org.linkedin_url ?? null,
      },
      apollo_metadata: {
        keywords: org.keywords ?? [],
        founded_year: org.founded_year ?? null,
      },
      location: {
        city: org.city ?? null,
        state: org.state ?? null,
        country: org.country ?? null,
        street: org.street_address ?? null,
        postal_code: org.postal_code ?? null,
      },
      apollo_last_enriched_at: new Date().toISOString(),
      raw_data: { ...(existing?.raw_data || {}), apollo: org },
    };

    const { error: upErr } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', companyId);

    if (upErr) {
      console.error('[Apollo Assign] ❌ Erro atualizando empresa:', upErr);
      return new Response(
        JSON.stringify({ error: 'Falha ao salvar empresa', details: upErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Apollo Assign] ✅ Empresa atualizada com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true, 
        fields_enriched: Object.keys(updateData).length, 
        decisors_saved: 0, 
        similar_companies: 0 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('[Apollo Assign] ❌ Erro:', e);
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: e?.message || String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
