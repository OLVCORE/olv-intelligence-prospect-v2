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
    const { query, limit = 10, country = 'BR', language = 'pt' } = await req.json();

    console.log('[WEB-SEARCH] Query:', query, 'Limit:', limit);

    const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');
    
    if (!SERPER_API_KEY) {
      console.error('[WEB-SEARCH] SERPER_API_KEY não configurada');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'SERPER_API_KEY não configurada', 
          results: [] 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: limit,
        gl: country.toLowerCase(),
        hl: language.toLowerCase()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WEB-SEARCH] Serper API error:', response.status, errorText);
      throw new Error(`Serper API error: ${response.status}`);
    }

    const data = await response.json();
    
    const results = (data.organic || []).map((item: any) => ({
      title: item.title,
      url: item.link,
      description: item.snippet,
      snippet: item.snippet,
      position: item.position,
      date: item.date
    }));

    console.log('[WEB-SEARCH] Resultados encontrados:', results.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        total: results.length,
        query: query
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[WEB-SEARCH] Erro:', error.message);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message, 
        results: [] 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
