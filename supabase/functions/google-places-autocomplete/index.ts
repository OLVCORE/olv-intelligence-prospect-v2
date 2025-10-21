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
    const { input, types, componentRestrictions } = await req.json();
    
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      throw new Error('GOOGLE_API_KEY não configurado');
    }

    if (!input || input.length < 3) {
      return new Response(
        JSON.stringify({ success: true, predictions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Buscando autocomplete para:', input);

    // Construir URL da API Places Autocomplete
    const params = new URLSearchParams({
      input,
      key: googleApiKey,
      language: 'pt-BR'
    });

    if (types && types.length > 0) {
      params.append('types', types.join('|'));
    }

    if (componentRestrictions?.country) {
      params.append('components', `country:${componentRestrictions.country}`);
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Erro na API Google Places: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'OK' && data.predictions) {
      return new Response(
        JSON.stringify({
          success: true,
          predictions: data.predictions
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, predictions: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no google-places-autocomplete:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
