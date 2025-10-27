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
    const { type, name, domain, organizationName, titles } = await req.json();
    
    const APOLLO_API_KEY = Deno.env.get('APOLLO_API_KEY');
    if (!APOLLO_API_KEY) {
      throw new Error('APOLLO_API_KEY não configurada');
    }

    console.log('[Apollo] 🚀 Requisição:', { type, name, domain, organizationName });

    // ============================================
    // BUSCAR ORGANIZAÇÃO
    // ============================================
    if (type === 'organization') {
      const params = new URLSearchParams({
        api_key: APOLLO_API_KEY,
        q_organization_name: name,
        ...(domain && { q_organization_domains: domain })
      });

      const response = await fetch(`https://api.apollo.io/v1/organizations/search?${params}`);
      
      if (!response.ok) {
        console.error('[Apollo] ❌ Erro na API:', response.status);
        return new Response(
          JSON.stringify({ error: `Apollo API retornou status ${response.status}` }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const org = data.organizations?.[0];

      if (!org) {
        console.log('[Apollo] ⚠️ Organização não encontrada');
        return new Response(
          JSON.stringify({ organization: null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[Apollo] ✅ Organização encontrada:', org.name);
      return new Response(
        JSON.stringify({ organization: org }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // BUSCAR PESSOAS (DECISORES)
    // ============================================
    if (type === 'people') {
      const defaultTitles = titles && titles.length > 0 
        ? titles.join(',')
        : 'CEO,CTO,CFO,CMO,COO,Diretor,VP,Gerente,Head,Manager';

      const params = new URLSearchParams({
        api_key: APOLLO_API_KEY,
        q_organization_name: organizationName,
        per_page: '25',
        person_titles: defaultTitles
      });

      if (domain) {
        params.append('q_organization_domains', domain);
      }

      const response = await fetch(`https://api.apollo.io/v1/people/search?${params}`);
      
      if (!response.ok) {
        console.error('[Apollo] ❌ Erro na busca de pessoas:', response.status);
        return new Response(
          JSON.stringify({ error: `Apollo API retornou status ${response.status}` }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const people = data.people || [];

      console.log('[Apollo] ✅ Decisores encontrados:', people.length);
      
      return new Response(
        JSON.stringify({ 
          people,
          total: people.length,
          source: 'apollo'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // IMPORTAR LEADS DO APOLLO
    // ============================================
    if (type === 'import_leads') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { searchParams } = await req.json();
      
      // Buscar organizações com os parâmetros fornecidos
      const params = new URLSearchParams({
        api_key: APOLLO_API_KEY,
        per_page: '100',
        ...searchParams
      });

      const response = await fetch(`https://api.apollo.io/v1/organizations/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`Apollo API error: ${response.status}`);
      }

      const data = await response.json();
      const organizations = data.organizations || [];

      console.log('[Apollo] 📥 Importando', organizations.length, 'empresas');

      const imported = [];
      
      for (const org of organizations) {
        // Verificar se empresa já existe
        const { data: existing } = await supabase
          .from('companies')
          .select('id')
          .or(`name.eq.${org.name},domain.eq.${org.primary_domain}`)
          .single();

        if (existing) {
          console.log('[Apollo] ⏭️ Empresa já existe:', org.name);
          continue;
        }

        // Criar nova empresa
        const { data: company, error } = await supabase
          .from('companies')
          .insert({
            name: org.name,
            domain: org.primary_domain,
            website: org.website_url,
            industry: org.industry,
            employees: org.estimated_num_employees,
            location: {
              city: org.city,
              state: org.state,
              country: org.country
            },
            linkedin_url: org.linkedin_url,
            technologies: org.technologies || [],
            enrichment_source: 'apollo',
            enriched_at: new Date().toISOString(),
            raw_data: org
          })
          .select()
          .single();

        if (error) {
          console.error('[Apollo] ❌ Erro ao criar empresa:', error);
          continue;
        }

        imported.push(company);
        console.log('[Apollo] ✅ Empresa importada:', org.name);
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          imported: imported.length,
          total: organizations.length,
          companies: imported
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Tipo de requisição inválido' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Apollo] ❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
