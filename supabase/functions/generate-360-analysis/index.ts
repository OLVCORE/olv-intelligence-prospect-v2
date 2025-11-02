import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('[360] Request received:', req.method);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('[360] Responding to OPTIONS');
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    console.log('[360] Processing POST request');

    // Return mock payload to validate CORS and wiring first
    const mockData = {
      success: true,
      data: {
        opportunity_score: 75,
        score_breakdown: {
          test: { points: 75, max: 100, description: 'Função de teste - CORS funcionando!' },
        },
        timing: 'immediate',
        recommended_products: [],
        insights: ['Função de teste - CORS funcionando!'],
        generated_at: new Date().toISOString(),
      },
    };

    console.log('[360] Returning mock data');
    return new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[360] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});