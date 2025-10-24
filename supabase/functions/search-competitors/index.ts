import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productCategory, keywords } = await req.json();
    const serperApiKey = Deno.env.get('SERPER_API_KEY');

    if (!serperApiKey) {
      throw new Error('SERPER_API_KEY não configurada');
    }

    console.log('[Search Competitors] Buscando concorrentes:', { productCategory, keywords });

    // Montar query de busca
    const searchQuery = `${productCategory} software ERP competitors alternatives ${keywords || ''}`.trim();

    // Buscar via Serper
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: searchQuery,
        num: 15,
        gl: 'br',
        hl: 'pt-br'
      })
    });

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status}`);
    }

    const searchData = await response.json();
    console.log('[Search Competitors] Resultados encontrados:', searchData.organic?.length || 0);

    // Extrair potenciais concorrentes dos resultados
    const competitors = [];
    const seen = new Set();

    for (const result of searchData.organic || []) {
      // Extrair domínio
      let domain = '';
      try {
        const url = new URL(result.link);
        domain = url.hostname.replace('www.', '');
      } catch {
        continue;
      }

      // Evitar duplicatas
      if (seen.has(domain)) continue;
      seen.add(domain);

      // Extrair nome da empresa do título
      const title = result.title || '';
      const name = title.split(/[-–|]/)[0].trim();

      if (name && name.length > 2 && name.length < 100) {
        competitors.push({
          name,
          domain,
          description: result.snippet || '',
          source_url: result.link,
          market_signals: {
            search_position: result.position,
            title: result.title,
            snippet: result.snippet
          }
        });
      }

      if (competitors.length >= 10) break;
    }

    console.log('[Search Competitors] Concorrentes extraídos:', competitors.length);

    return new Response(
      JSON.stringify({
        success: true,
        competitors,
        query: searchQuery,
        total_results: searchData.organic?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('[Search Competitors] Erro:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
