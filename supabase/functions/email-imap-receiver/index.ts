import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * This edge function polls IMAP servers for new emails
 * Should be called periodically (e.g., every 1-5 minutes via cron)
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting IMAP email polling...');

    // Get all active email integrations
    const { data: integrations, error: intError } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('channel', 'email')
      .eq('status', 'active');

    if (intError) throw intError;

    if (!integrations || integrations.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active email integrations found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const integration of integrations) {
      try {
        const { credentials, config } = integration;
        const { imap } = credentials;

        if (!imap) {
          console.log(`No IMAP config for integration ${integration.id}`);
          continue;
        }

        console.log(`Checking IMAP: ${imap.host}`);

        // In production, use a proper IMAP library
        // For now, this is a placeholder that shows the structure
        
        // Simulated email fetch
        const newEmails = await fetchNewEmails(imap, integration.id);

        for (const email of newEmails) {
          // Process email into conversation/message
          await processIncomingEmail(supabase, email, integration.user_id);
        }

        results.push({
          integration_id: integration.id,
          success: true,
          emails_processed: newEmails.length,
        });

      } catch (error: any) {
        console.error(`Error processing integration ${integration.id}:`, error);
        results.push({
          integration_id: integration.id,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${integrations.length} integrations`,
        results 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('IMAP receiver error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchNewEmails(imapConfig: any, integrationId: string) {
  // In production, implement actual IMAP connection
  // Using libraries like node-imap or similar
  
  // This is a placeholder showing the structure
  console.log(`Fetching emails from ${imapConfig.host}`);
  
  // Example: Connect to IMAP, fetch UNSEEN messages
  // Mark them as SEEN after processing
  
  return [
    // {
    //   messageId: 'msg-123',
    //   from: { email: 'sender@example.com', name: 'Sender Name' },
    //   to: [{ email: 'inbox@yourdomain.com' }],
    //   subject: 'Test email',
    //   body: 'Email content here',
    //   receivedAt: new Date().toISOString(),
    //   headers: {},
    //   attachments: [],
    // }
  ];
}

async function processIncomingEmail(supabase: any, email: any, userId: string) {
  console.log(`Processing email: ${email.subject}`);

  // Find or create contact
  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('email', email.from.email)
    .maybeSingle();

  let contactId = contact?.id;

  if (!contactId) {
    const { data: newContact } = await supabase
      .from('contacts')
      .insert({
        email: email.from.email,
        name: email.from.name || email.from.email,
        channel: { email: true },
      })
      .select()
      .single();

    contactId = newContact?.id;
  }

  // Find or create conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('contact_id', contactId)
    .eq('channel', 'email')
    .eq('status', 'open')
    .maybeSingle();

  let conversationId = conversation?.id;

  if (!conversationId) {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        contact_id: contactId,
        channel: 'email',
        status: 'open',
        priority: 'medium',
        last_message_at: email.receivedAt,
      })
      .select()
      .single();

    conversationId = newConv?.id;
  } else {
    // Update conversation
    await supabase
      .from('conversations')
      .update({ 
        last_message_at: email.receivedAt,
        status: 'open',
      })
      .eq('id', conversationId);
  }

  // Create message
  await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      channel: 'email',
      direction: 'in',
      from_id: email.from.email,
      to_id: email.to[0]?.email,
      body: email.body,
      provider_message_id: email.messageId,
      metadata: {
        subject: email.subject,
        headers: email.headers,
        attachments: email.attachments,
      },
    });

  console.log(`Email processed into conversation ${conversationId}`);
}
