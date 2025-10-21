import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendMessageRequest {
  channel: 'whatsapp' | 'email';
  conversationId?: string;
  companyId?: string;
  contactId?: string;
  to: string;
  body: string;
  subject?: string;
  templateId?: string;
}

// Send WhatsApp message via provider
async function sendWhatsApp(to: string, body: string): Promise<{ success: boolean; providerMessageId?: string; error?: string }> {
  const provider = Deno.env.get('WHATSAPP_PROVIDER') || 'twilio';

  try {
    switch (provider) {
      case 'twilio': {
        const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const from = Deno.env.get('TWILIO_WHATSAPP_FROM');

        if (!accountSid || !authToken || !from) {
          return { success: false, error: 'Twilio credentials not configured' };
        }

        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const auth = btoa(`${accountSid}:${authToken}`);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: `whatsapp:${from}`,
            To: `whatsapp:${to}`,
            Body: body,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          return { success: false, error: data.message || 'Twilio API error' };
        }

        return { success: true, providerMessageId: data.sid };
      }

      case 'meta360': {
        const phoneNumberId = Deno.env.get('META_WA_PHONE_NUMBER_ID');
        const accessToken = Deno.env.get('META_WA_ACCESS_TOKEN');

        if (!phoneNumberId || !accessToken) {
          return { success: false, error: 'Meta WhatsApp credentials not configured' };
        }

        const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: { body: body },
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          return { success: false, error: data.error?.message || 'Meta API error' };
        }

        return { success: true, providerMessageId: data.messages?.[0]?.id };
      }

      default:
        return { success: false, error: `Unknown provider: ${provider}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Send Email via SMTP
async function sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean; providerMessageId?: string; error?: string }> {
  // For now, return not implemented
  // In production, use nodemailer or similar
  return { success: false, error: 'Email sending not yet implemented' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channel, conversationId, companyId, contactId, to, body, subject, templateId }: SendMessageRequest = await req.json();

    if (!channel || !to || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: channel, to, body' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate Company Context
    if (!companyId && !conversationId && !contactId) {
      return new Response(
        JSON.stringify({ error: 'Company context required: provide companyId, conversationId, or contactId' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get conversation or create new one
    let conversation;
    if (conversationId) {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
      conversation = data;
    } else {
      // Find contact or create
      let contact;
      if (contactId) {
        const { data } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', contactId)
          .single();
        contact = data;
      } else {
        // Create contact from to address
        const { data: newContact } = await supabase
          .from('contacts')
          .insert({
            [channel === 'whatsapp' ? 'phone' : 'email']: to,
            name: to,
            company_id: companyId,
            channel: { whatsapp: channel === 'whatsapp', email: channel === 'email' },
          })
          .select()
          .single();
        contact = newContact;
      }

      // Create conversation
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          contact_id: contact?.id,
          company_id: companyId,
          channel,
          status: 'open',
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();
      conversation = newConv;
    }

    if (!conversation) {
      return new Response(
        JSON.stringify({ error: 'Failed to create or find conversation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send message via provider
    let sendResult;
    if (channel === 'whatsapp') {
      sendResult = await sendWhatsApp(to, body);
    } else {
      sendResult = await sendEmail(to, subject || 'No Subject', body);
    }

    if (!sendResult.success) {
      return new Response(
        JSON.stringify({ error: sendResult.error, raw: sendResult }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save message to database
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        direction: 'out',
        channel,
        from_id: channel === 'whatsapp' ? Deno.env.get('TWILIO_WHATSAPP_FROM') : Deno.env.get('SMTP_USER'),
        to_id: to,
        body,
        provider_message_id: sendResult.providerMessageId,
        status: 'sent',
      })
      .select()
      .single();

    if (messageError) {
      console.error('[Send Message] Error saving message:', messageError);
    }

    // Update conversation
    await supabase
      .from('conversations')
      .update({
        status: 'open',
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversation.id);

    // Log audit
    await supabase.from('sdr_audit').insert({
      entity: 'message',
      entity_id: conversation.id,
      action: 'sent',
      payload: { channel, to, providerMessageId: sendResult.providerMessageId },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: message?.id,
        conversationId: conversation.id,
        providerMessageId: sendResult.providerMessageId 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Send Message] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
