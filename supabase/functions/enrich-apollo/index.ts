// ✅ Edge Function para enriquecimento via Apollo.io
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, organizationName, domain, titles } = await req.json();

    if (!organizationName) {
      return new Response(
        JSON.stringify({ error: 'organizationName é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apolloApiKey = Deno.env.get('APOLLO_API_KEY');
    if (!apolloApiKey) {
      throw new Error('APOLLO_API_KEY not configured');
    }

    console.log('ENRICH_APOLLO', type === 'organization' ? 'Searching organization' : 'Searching people', { organizationName });

    if (type === 'organization') {
      // Buscar organização
      const params = new URLSearchParams({
        api_key: apolloApiKey,
        q_organization_name: organizationName,
        ...(domain && { q_organization_domains: domain })
      });

      const response = await fetch(`https://api.apollo.io/v1/organizations/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`Apollo API error: ${response.status}`);
      }

      const data = await response.json();
      const organization = data.organizations?.[0] || null;

      console.log('ENRICH_APOLLO', 'Organization result', { found: !!organization });

      return new Response(
        JSON.stringify({ organization }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Buscar decisores
      const defaultTitles = titles && titles.length > 0 
        ? titles.join(',')
        : 'CEO,CTO,CFO,CIO,Director,VP,Head,Manager,Gerente,Diretor';

      const params = new URLSearchParams({
        api_key: apolloApiKey,
        q_organization_name: organizationName,
        per_page: '10',
        person_titles: defaultTitles
      });

      const response = await fetch(`https://api.apollo.io/v1/people/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`Apollo API error: ${response.status}`);
      }

      const data = await response.json();
      const people = data.people || [];

      console.log('ENRICH_APOLLO', 'People result', { count: people.length });

      return new Response(
        JSON.stringify({ people }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('ENRICH_APOLLO', 'Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        organization: null,
        people: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
