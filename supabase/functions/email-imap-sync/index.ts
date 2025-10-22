import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log(`IMAP sync requested by user: ${user.id}`);

    // Get user's email integration
    const { data: integration, error: integrationError } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('user_id', user.id)
      .eq('channel', 'email')
      .eq('provider', 'imap_smtp')
      .eq('status', 'active')
      .single();

    if (integrationError || !integration) {
      throw new Error('No active email integration found');
    }

    const credentials = integration.credentials;
    const imapConfig = {
      host: credentials['imap.host'],
      port: parseInt(credentials['imap.port']) || 993,
      user: credentials['imap.user'],
      password: credentials['imap.password'],
    };

    if (!imapConfig.host || !imapConfig.user || !imapConfig.password) {
      throw new Error('Incomplete IMAP configuration');
    }

    console.log(`Connecting to IMAP: ${imapConfig.host}:${imapConfig.port}`);

    // IMAP fetch is not supported in this environment (Edge runtime has no raw TCP/IMAP access)
    console.log('IMAP fetch not implemented in this environment; skipping message creation');

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsProcessed: 0,
        message: 'IMAP sync is not available in this environment. Configure email forwarding/webhook to ingest real emails.' 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('IMAP sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});