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
    const googleConfigured = Boolean(Deno.env.get('GOOGLE_API_KEY') && Deno.env.get('GOOGLE_CSE_ID'));
    const serperConfigured = Boolean(Deno.env.get('SERPER_API_KEY'));

    return new Response(
      JSON.stringify({
        ok: true,
        google: { configured: googleConfigured },
        serper: { configured: serperConfigured },
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Erro' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});