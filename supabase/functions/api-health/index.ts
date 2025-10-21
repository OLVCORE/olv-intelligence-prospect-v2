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
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        whatsapp: {
          twilio: !!Deno.env.get('TWILIO_ACCOUNT_SID'),
          meta360: !!Deno.env.get('META_ACCESS_TOKEN'),
        },
        email: {
          imap: !!Deno.env.get('IMAP_HOST'),
          smtp: !!Deno.env.get('SMTP_HOST'),
        },
      },
    };

    return new Response(
      JSON.stringify(health),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ status: 'error', error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
