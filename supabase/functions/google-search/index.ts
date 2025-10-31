// ✅ Edge Function de busca agora usa Serper como motor primário (mantendo o nome "google-search")
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

    const apiKey = Deno.env.get('SERPER_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_SEARCH_SERPER', 'SERPER_API_KEY não configurado');
      return new Response(
        JSON.stringify({ error: 'SERPER_API_KEY não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construir query efetiva (compatível com comportamento anterior)
    let effectiveQuery = String(query);

    if (type === 'news') {
      // Sem filtros adicionais aqui para preservar recall
    } else if (type === 'social') {
      const platform = options.platform;
      if (platform) {
        const platformDomains = {
          linkedin: 'site:linkedin.com',
          facebook: 'site:facebook.com',
          instagram: 'site:instagram.com',
          twitter: '(site:twitter.com OR site:x.com)',
          youtube: 'site:youtube.com',
        };
        const filter = platformDomains[String(platform)] || '';
        effectiveQuery = `"${query}" ${filter}`.trim();
      } else {
        effectiveQuery = `"${query}" (site:linkedin.com OR site:facebook.com OR site:instagram.com OR site:twitter.com OR site:x.com OR site:youtube.com)`;
      }
    }

    const num = Number(options.numResults || 10);

    const endpoint = type === 'news' ? 'news' : 'search';
    const body = { q: effectiveQuery, num };

    console.log('GOOGLE_SEARCH_SERPER', 'Request', { endpoint, q: effectiveQuery, num, type });

    const response = await fetch(`https://google.serper.dev/${endpoint}`, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GOOGLE_SEARCH_SERPER', 'API error', { status: response.status, error: errorText });
      return new Response(
        JSON.stringify({ error: `Serper API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    // Normalização para um formato semelhante ao Google CSE
    let items = [];

    if (endpoint === 'news') {
      const news = Array.isArray(data?.news) ? data.news : [];
      items = news.map((n) => ({
        title: n?.title,
        link: n?.link,
        snippet: n?.snippet ?? n?.source ?? '',
        source: n?.source,
        date: n?.date,
      })).filter((i) => i.link && i.title);
    } else {
      const organic = Array.isArray(data?.organic) ? data.organic : [];
      items = organic.map((o) => ({
        title: o?.title,
        link: o?.link,
        snippet: o?.snippet ?? '',
      })).filter((i) => i.link && i.title);
    }

    const payload = {
      items,
      searchInformation: {
        totalResults: String(items.length),
        queryDisplayed: effectiveQuery,
      },
    };

    console.log('GOOGLE_SEARCH_SERPER', 'Success', { items: items.length, type });

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('GOOGLE_SEARCH_SERPER', 'Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        data: null,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
