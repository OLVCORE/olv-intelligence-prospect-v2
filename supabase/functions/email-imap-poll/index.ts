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

    let processed = 0;

    for (const integration of integrations || []) {
      const credentials = integration.credentials || {};
      const imapConfig = {
        host: credentials['imap.host'],
        port: parseInt(credentials['imap.port']) || 993,
        user: credentials['imap.user'],
      };

      if (!imapConfig.host || !imapConfig.user) {
        console.warn('[IMAP Poll] Skipping integration with incomplete IMAP config', integration.id);
        continue;
      }

      // Simulate fetching a recent email (placeholder for real IMAP fetch)
      const messageId = `poll-${integration.user_id}-${new Date().toISOString().slice(0,16).replace(/[-:T]/g,'')}`;

      // Check duplication by provider_message_id
      const { data: existing } = await supabase
        .from('messages')
        .select('id')
        .eq('provider_message_id', messageId)
        .maybeSingle();

      if (existing) {
        continue; // already processed this interval
      }

      const email = {
        from: 'no-reply@olv-intelligence.com',
        to: imapConfig.user,
        subject: 'Sincronização Automática - OLV Inbox',
        body: `<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h3 style="color: #2563eb;">Verificando novos emails automaticamente</h3>
          <p>Execução: ${new Date().toLocaleString('pt-BR')}</p>
        </div>`,
        date: new Date().toISOString(),
        messageId,
      };

      // Ensure contact exists
      let { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', email.from)
        .maybeSingle();

      if (!contact) {
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({ email: email.from, name: 'OLV Inbox', channel: { email: true } })
          .select('id')
          .single();
        if (contactError) {
          console.error('[IMAP Poll] contact error', contactError);
          continue;
        }
        contact = newContact;
      }

      // Ensure conversation exists
      let { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_id', contact.id)
        .eq('channel', 'email')
        .maybeSingle();

      if (!conversation) {
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            contact_id: contact.id,
            channel: 'email',
            status: 'open',
            last_message_at: email.date,
          })
          .select('id')
          .single();
        if (convError) {
          console.error('[IMAP Poll] conversation error', convError);
          continue;
        }
        conversation = newConversation;
      }

      // Insert message
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          channel: 'email',
          direction: 'in',
          from_id: email.from,
          to_id: email.to,
          body: email.body,
          metadata: { subject: email.subject, messageId: email.messageId },
          provider_message_id: email.messageId,
          status: 'delivered',
        });

      if (msgError) {
        console.error('[IMAP Poll] message error', msgError);
      } else {
        // Update conversation timestamp
        await supabase
          .from('conversations')
          .update({ last_message_at: email.date, status: 'open' })
          .eq('id', conversation.id);
        processed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed }),
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
