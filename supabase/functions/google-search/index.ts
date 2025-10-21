// ✅ Edge Function para busca com Google Custom Search Engine
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
    const { query, type, options = {} } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_API_KEY');
    const cseId = Deno.env.get('GOOGLE_CSE_ID');

    if (!apiKey || !cseId) {
      throw new Error('GOOGLE_API_KEY ou GOOGLE_CSE_ID não configurados');
    }

    console.log('GOOGLE_SEARCH', 'Processing search', { query, type });

    const baseUrl = 'https://www.googleapis.com/customsearch/v1';
    
    // Construir query baseado no tipo
    let searchQuery = query;
    let siteSearch = '';

    if (type === 'news') {
      // Buscar em sites de notícias
      const newsSites = [
        'g1.globo.com',
        'folha.uol.com.br',
        'estadao.com.br',
        'valor.com.br',
        'exame.com',
        'infomoney.com.br'
      ];
      siteSearch = newsSites.map(site => `site:${site}`).join(' OR ');
      searchQuery = `${query} (${siteSearch})`;
    } else if (type === 'social') {
      // Buscar redes sociais
      const platform = options.platform;
      if (platform) {
        const platformDomains: Record<string, string> = {
          linkedin: 'linkedin.com',
          facebook: 'facebook.com',
          instagram: 'instagram.com',
          twitter: 'twitter.com',
          youtube: 'youtube.com'
        };
        siteSearch = `site:${platformDomains[platform]}`;
      } else {
        siteSearch = 'site:linkedin.com OR site:facebook.com OR site:instagram.com OR site:twitter.com OR site:youtube.com';
      }
      searchQuery = `"${query}" ${siteSearch}`;
    }

    const params = new URLSearchParams({
      key: apiKey,
      cx: cseId,
      q: searchQuery,
      num: (options.numResults || 10).toString(),
      ...(options.language && { lr: `lang_${options.language}` }),
      ...(options.dateRestrict && { dateRestrict: options.dateRestrict }),
      ...(options.exactTerms && { exactTerms: options.exactTerms }),
    });

    const response = await fetch(`${baseUrl}?${params}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GOOGLE_SEARCH', 'API error', { status: response.status, error: errorText });
      throw new Error(`Google CSE API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('GOOGLE_SEARCH', 'Search completed', {
      totalResults: data.searchInformation?.totalResults,
      itemsCount: data.items?.length || 0
    });

    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('GOOGLE_SEARCH', 'Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        data: null
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
