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
        q_organization_name: organizationName,
        ...(domain && { q_organization_domains: domain })
      });

      const response = await fetch(`https://api.apollo.io/v1/organizations/search?${params}`, {
        headers: {
          'X-Api-Key': apolloApiKey,
        }
      });
      
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
      // Buscar decisores com múltiplas estratégias (domínio, ID da organização, variações de nome)
      const titlesList = Array.isArray(titles) && titles.length > 0
        ? titles
        : ['CEO','CTO','CFO','CIO','Diretor','Diretora','Gerente','VP','Head','TI','Tecnologia','Financeiro','Compras','Procurement','Operations','COO'];

      // 1) Tentar por domínio diretamente (mais preciso)
      const tryByDomain = async (): Promise<any[]> => {
        if (!domain) return [];
        const body = {
          page: 1,
          per_page: 10,
          q_organization_domains: [domain],
          person_titles: titlesList.join(',')
        };
        const resp = await fetch('https://api.apollo.io/v1/mixed_people/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloApiKey },
          body: JSON.stringify(body)
        });
        if (!resp.ok) {
          const t = await resp.text();
          console.error('ENRICH_APOLLO domain search error', resp.status, t);
          return [];
        }
        const data = await resp.json();
        return data.people || [];
      };

      // 2) Tentar obter ID da organização e buscar por ID
      const tryByOrganizationId = async (): Promise<any[]> => {
        const params = new URLSearchParams({
          q_organization_name: organizationName,
          ...(domain ? { q_organization_domains: domain } : {}) as any
        });
        const orgResp = await fetch(`https://api.apollo.io/v1/organizations/search?${params}`, {
          headers: { 'X-Api-Key': apolloApiKey }
        });
        if (!orgResp.ok) {
          const t = await orgResp.text();
          console.error('ENRICH_APOLLO org search error', orgResp.status, t);
          return [];
        }
        const orgData = await orgResp.json();
        const org = orgData.organizations?.[0];
        if (!org?.id) return [];

        const body = {
          page: 1,
          per_page: 10,
          organization_ids: [org.id],
          person_titles: titlesList.join(',')
        };
        const resp = await fetch('https://api.apollo.io/v1/mixed_people/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloApiKey },
          body: JSON.stringify(body)
        });
        if (!resp.ok) {
          const t = await resp.text();
          console.error('ENRICH_APOLLO id search error', resp.status, t);
          return [];
        }
        const data = await resp.json();
        return data.people || [];
      };

      // 3) Tentar por variações de nome (remover parênteses, usar primeira parte)
      const tryByNameVariants = async (): Promise<any[]> => {
        const baseName = (organizationName || '').trim();
        const noParens = baseName.replace(/\([^)]*\)/g, '').trim();
        const firstPart = noParens.split(' - ')[0].trim();
        const candidates = Array.from(new Set([baseName, noParens, firstPart])).filter(Boolean);

        for (const name of candidates) {
          const body = {
            page: 1,
            per_page: 10,
            q_organization_name: name,
            person_titles: titlesList.join(',')
          };
          const resp = await fetch('https://api.apollo.io/v1/mixed_people/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloApiKey },
            body: JSON.stringify(body)
          });
          if (resp.ok) {
            const data = await resp.json();
            if ((data.people || []).length > 0) return data.people;
          } else {
            const t = await resp.text();
            console.error('ENRICH_APOLLO name search error', resp.status, t);
          }
        }
        return [];
      };

      let people: any[] = [];
      try {
        people = await tryByDomain();
        if (people.length === 0) people = await tryByOrganizationId();
        if (people.length === 0) people = await tryByNameVariants();
      } catch (e) {
        console.error('ENRICH_APOLLO search flow error', e);
        people = [];
      }

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
