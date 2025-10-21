import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const request: SendMessageRequest = await req.json();
    console.log(`[Send Message] Channel: ${request.channel}, To: ${request.to}`);

    // Validate required fields
    if (!request.to || !request.body) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          details: 'to and body are required' 
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Company context validation (STRICT)
    if (!request.companyId && !request.conversationId) {
      return new Response(
        JSON.stringify({ 
          error: 'Company context required',
          details: 'Either companyId or conversationId with company linkage is required'
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let conversationId = request.conversationId;
    let companyId = request.companyId;

    // Get or create conversation
    if (!conversationId) {
      // Find or create contact
      const phoneOrEmail = request.channel === 'whatsapp' ? { phone: request.to } : { email: request.to };
      
      let { data: contact } = await supabase
        .from('contacts')
        .select('*')
        .match(phoneOrEmail)
        .eq('company_id', companyId)
        .maybeSingle();

      if (!contact) {
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            ...phoneOrEmail,
            name: request.to,
            company_id: companyId,
            channel: { [request.channel]: true },
          })
          .select()
          .single();

        if (contactError) throw contactError;
        contact = newContact;
      }

      // Create conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          contact_id: contact.id,
          company_id: companyId,
          channel: request.channel,
          status: 'open',
          priority: 'medium',
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (convError) throw convError;
      conversationId = newConv.id;
    } else {
      // Validate conversation exists and get company_id
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('company_id')
        .eq('id', conversationId)
        .single();

      if (convError || !conv) {
        return new Response(
          JSON.stringify({ error: 'Conversation not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!conv.company_id) {
        return new Response(
          JSON.stringify({ 
            error: 'Conversation not linked to company',
            details: 'This conversation must be linked to a company before sending messages'
          }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      companyId = conv.company_id;
    }

    // Send message via provider
    let sendResult;
    if (request.channel === 'whatsapp') {
      sendResult = await sendWhatsApp(request.to, request.body);
    } else if (request.channel === 'email') {
      sendResult = await sendEmail(request.to, request.subject || 'Mensagem', request.body);
    } else {
      throw new Error('Unsupported channel');
    }

    if (!sendResult.success) {
      throw new Error(sendResult.error || 'Failed to send message');
    }

    // Save message to database
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        channel: request.channel,
        direction: 'out',
        from_id: user.id,
        to_id: request.to,
        body: request.body,
        status: 'sent',
        provider_message_id: sendResult.providerMessageId,
        metadata: {
          subject: request.subject,
          templateId: request.templateId,
        },
      })
      .select()
      .single();

    if (msgError) throw msgError;

    // Update conversation
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        status: 'open',
      })
      .eq('id', conversationId);

    // Log audit
    await supabase.from('sdr_audit').insert({
      entity: 'message',
      entity_id: message.id,
      action: 'sent',
      user_id: user.id,
      payload: { channel: request.channel, to: request.to, companyId },
    });

    console.log(`[Send Message] Success: ${message.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: message.id,
        conversationId,
        providerMessageId: sendResult.providerMessageId,
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

async function sendWhatsApp(to: string, body: string): Promise<{ success: boolean; providerMessageId?: string; error?: string }> {
  const provider = Deno.env.get('WHATSAPP_PROVIDER') || 'twilio';
  
  try {
    if (provider === 'twilio') {
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const fromNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

      if (!accountSid || !authToken || !fromNumber) {
        return { 
          success: false, 
          error: 'Twilio credentials not configured. Please configure in Integrations page.' 
        };
      }

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: `whatsapp:${to}`,
            From: `whatsapp:${fromNumber}`,
            Body: body,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[Twilio] Error:', error);
        return { success: false, error: `Twilio error: ${response.statusText}` };
      }

      const data = await response.json();
      return { success: true, providerMessageId: data.sid };
    }

    if (provider === 'meta360') {
      const accessToken = Deno.env.get('META_ACCESS_TOKEN');
      const phoneNumberId = Deno.env.get('META_PHONE_NUMBER_ID');

      if (!accessToken || !phoneNumberId) {
        return { 
          success: false, 
          error: 'Meta 360 credentials not configured. Please configure in Integrations page.' 
        };
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: { body },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[Meta 360] Error:', error);
        return { success: false, error: `Meta 360 error: ${response.statusText}` };
      }

      const data = await response.json();
      return { success: true, providerMessageId: data.messages?.[0]?.id };
    }

    return { success: false, error: `Unsupported provider: ${provider}` };

  } catch (error: any) {
    console.error('[WhatsApp] Send error:', error);
    return { success: false, error: error.message };
  }
}

async function sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean; providerMessageId?: string; error?: string }> {
  // TODO: Implement SMTP email sending
  console.log('[Email] Not implemented yet');
  return { 
    success: false, 
    error: 'Email sending not implemented. Please configure SMTP in Integrations page.' 
  };
}
