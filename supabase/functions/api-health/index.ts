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
    // Verificar todas as APIs configuradas
    const apis = [
      {
        name: 'ReceitaWS',
        status: Deno.env.get('RECEITAWS_API_TOKEN') ? 'online' : 'offline',
        configured: !!Deno.env.get('RECEITAWS_API_TOKEN'),
        category: 'data'
      },
      {
        name: 'Hunter.io',
        status: Deno.env.get('HUNTER_API_KEY') ? 'online' : 'offline',
        configured: !!Deno.env.get('HUNTER_API_KEY'),
        category: 'email'
      },
      {
        name: 'Apollo.io',
        status: Deno.env.get('APOLLO_API_KEY') ? 'online' : 'offline',
        configured: !!Deno.env.get('APOLLO_API_KEY'),
        category: 'people'
      },
      {
        name: 'PhantomBuster',
        status: Deno.env.get('PHANTOMBUSTER_API_KEY') ? 'online' : 'offline',
        configured: !!Deno.env.get('PHANTOMBUSTER_API_KEY'),
        category: 'scraping'
      },
      {
        name: 'Google Places',
        status: Deno.env.get('GOOGLE_API_KEY') ? 'online' : 'offline',
        configured: !!Deno.env.get('GOOGLE_API_KEY'),
        category: 'location'
      },
      {
        name: 'Mapbox',
        status: Deno.env.get('MAPBOX_PUBLIC_TOKEN') ? 'online' : 'offline',
        configured: !!Deno.env.get('MAPBOX_PUBLIC_TOKEN'),
        category: 'maps'
      },
      {
        name: 'OpenAI',
        status: Deno.env.get('OPENAI_API_KEY') ? 'online' : 'offline',
        configured: !!Deno.env.get('OPENAI_API_KEY'),
        category: 'ai'
      },
      {
        name: 'Lovable AI',
        status: Deno.env.get('LOVABLE_API_KEY') ? 'online' : 'offline',
        configured: !!Deno.env.get('LOVABLE_API_KEY'),
        category: 'ai'
      },
      {
        name: 'Serper (Search)',
        status: Deno.env.get('SERPER_API_KEY') ? 'online' : 'offline',
        configured: !!Deno.env.get('SERPER_API_KEY'),
        category: 'search'
      },
      {
        name: 'Twilio (WhatsApp)',
        status: Deno.env.get('TWILIO_ACCOUNT_SID') && Deno.env.get('TWILIO_AUTH_TOKEN') ? 'online' : 'offline',
        configured: !!(Deno.env.get('TWILIO_ACCOUNT_SID') && Deno.env.get('TWILIO_AUTH_TOKEN')),
        category: 'messaging'
      },
      {
        name: 'Resend (Email)',
        status: Deno.env.get('RESEND_API_KEY') ? 'online' : 'offline',
        configured: !!Deno.env.get('RESEND_API_KEY'),
        category: 'email'
      }
    ];

    const onlineCount = apis.filter(api => api.status === 'online').length;
    const totalCount = apis.length;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      apis,
      summary: {
        online: onlineCount,
        total: totalCount,
        percentage: Math.round((onlineCount / totalCount) * 100)
      }
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
