import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('[SIMILAR] Request received:', req.method);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('[SIMILAR] Responding to OPTIONS');
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    console.log('[SIMILAR] Processing POST request');

    // Return mock payload to validate CORS and wiring first
    const mockData = {
      success: true,
      data: {
        similar_companies: [],
        statistics: {
          total: 0,
          using_totvs: 0,
          percentage_totvs: 0,
          not_using_totvs: 0,
        },
        insights: ['Função de teste - CORS funcionando!'],
        search_criteria: {},
      },
    };

    console.log('[SIMILAR] Returning mock data');
    return new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[SIMILAR] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});