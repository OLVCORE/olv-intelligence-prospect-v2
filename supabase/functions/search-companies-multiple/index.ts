import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Buscar múltiplas empresas via Google Search + Apollo
async function searchMultipleCompanies(query: string, limit = 20) {
  const companies: any[] = [];
  
  // 1. Buscar no Google
  const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
  const googleCseId = Deno.env.get('GOOGLE_CSE_ID');
  
  if (googleApiKey && googleCseId) {
    try {
      console.log('[Google] Buscando empresas:', query);
      const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(query + ' empresa brasil cnpj')}&num=10`;
      const googleResponse = await fetch(googleUrl);
      
      if (googleResponse.ok) {
        const googleData = await googleResponse.json();
        
        if (googleData.items) {
          for (const item of googleData.items) {
            // Extrair CNPJ se existir no snippet
            const cnpjMatch = item.snippet?.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
            const cnpj = cnpjMatch ? cnpjMatch[0].replace(/\D/g, '') : undefined;
            
            // Extrair domínio
            let domain = '';
            try {
              domain = new URL(item.link).hostname.replace('www.', '');
            } catch {
              domain = item.displayLink || '';
            }
            
            companies.push({
              source: 'google',
              name: item.title.split(' - ')[0].split('|')[0].trim(),
              cnpj,
              domain,
              website: item.link,
              snippet: item.snippet,
              score: 1.0
            });
          }
        }
      }
    } catch (error) {
      console.error('[Google] Erro:', error);
    }
  }
  
  // 2. Buscar no Apollo.io
  const apolloApiKey = Deno.env.get('APOLLO_API_KEY');
  
  if (apolloApiKey) {
    try {
      console.log('[Apollo] Buscando empresas:', query);
      const apolloUrl = `https://api.apollo.io/v1/organizations/search`;
      const apolloResponse = await fetch(apolloUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apolloApiKey
        },
        body: JSON.stringify({
          q_organization_name: query,
          per_page: 15,
          page: 1
        })
      });
      
      if (apolloResponse.ok) {
        const apolloData = await apolloResponse.json();
        
        if (apolloData.organizations) {
          for (const org of apolloData.organizations) {
            // Verificar se já existe (evitar duplicatas)
            const exists = companies.find(c => 
              c.domain === org.primary_domain || 
              c.name.toLowerCase() === org.name.toLowerCase()
            );
            
            if (!exists) {
              companies.push({
                source: 'apollo',
                name: org.name,
                domain: org.primary_domain,
                website: org.website_url,
                linkedin_url: org.linkedin_url,
                industry: org.industry,
                employees: org.estimated_num_employees,
                location: `${org.city || ''}, ${org.state || ''}, ${org.country || ''}`.replace(/^,\s*|,\s*$/g, ''),
                score: 0.9
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('[Apollo] Erro:', error);
    }
  }
  
  // Ordenar por relevância (score) e limitar
  companies.sort((a, b) => b.score - a.score);
  const limitedCompanies = companies.slice(0, Math.min(limit, 50));
  
  console.log(`[Search] Encontradas ${limitedCompanies.length} empresas`);
  
  return limitedCompanies;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 20 } = await req.json();
    
    if (!query || query.trim().length < 3) {
      return new Response(
        JSON.stringify({ 
          error: 'Query deve ter no mínimo 3 caracteres' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[Search Multiple] Iniciando busca:', { query, limit });
    
    const companies = await searchMultipleCompanies(query, limit);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        companies,
        total: companies.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('[Search Multiple] Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao buscar empresas'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
