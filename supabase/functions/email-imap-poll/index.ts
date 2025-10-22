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

    console.log('[IMAP Poll] Starting system poll for active email integrations');

    const { data: integrations, error } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('channel', 'email')
      .eq('provider', 'imap_smtp')
      .eq('status', 'active');

    if (error) throw error;

    if (!integrations || integrations.length === 0) {
      console.log('[IMAP Poll] No active IMAP integrations found');
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No active integrations' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[IMAP Poll] Found ${integrations.length} active integration(s). Skipping poll (real IMAP not implemented yet).`);
    
    // TODO: Implement real IMAP fetching
    // For now, just return success without creating fake messages
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: 0,
        message: 'IMAP polling scheduled but not implemented yet. Use manual sync button.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (e: any) {
    console.error('[IMAP Poll] Error', e);
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
