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
      sendResult = await sendWhatsApp(request.to, request.body, user.id, supabase);
    } else if (request.channel === 'email') {
      sendResult = await sendEmail(request.to, request.subject || 'Mensagem', request.body, user.id, supabase);
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

async function sendWhatsApp(to: string, body: string, userId: string, supabase: any): Promise<{ success: boolean; providerMessageId?: string; error?: string }> {
  try {
    // Get WhatsApp integration credentials from database
    const { data: integration, error: integrationError } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('channel', 'whatsapp')
      .maybeSingle();

    if (integrationError) {
      console.error('[WhatsApp] Error loading integration:', integrationError);
      return { 
        success: false, 
        error: 'Erro ao carregar configuração de integração' 
      };
    }

    if (!integration) {
      return { 
        success: false, 
        error: 'WhatsApp não configurado. Configure em Integrações > WhatsApp.' 
      };
    }

    const provider = integration.provider;
    
    if (provider === 'twilio') {
      const accountSid = integration.credentials?.accountSid;
      const authToken = integration.credentials?.authToken;
      const fromNumber = integration.credentials?.phoneNumber;

      if (!accountSid || !authToken || !fromNumber) {
        return { 
          success: false, 
          error: 'Credenciais Twilio incompletas. Verifique Account SID, Auth Token e número do WhatsApp.' 
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

    if (provider === 'meta_cloud') {
      const accessToken = integration.credentials?.accessToken;
      const phoneNumberId = integration.credentials?.phoneNumberId;

      if (!accessToken || !phoneNumberId) {
        return { 
          success: false, 
          error: 'Credenciais Meta Cloud incompletas. Verifique Access Token e Phone Number ID.' 
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

async function sendEmail(to: string, subject: string, body: string, userId: string, supabase: any): Promise<{ success: boolean; providerMessageId?: string; error?: string }> {
  try {
    // Get email integration credentials from database
    const { data: integration, error: integrationError } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('channel', 'email')
      .eq('provider', 'imap_smtp')
      .eq('status', 'active')
      .maybeSingle();

    if (integrationError) {
      console.error('[Email] Error loading integration:', integrationError);
      return { 
        success: false, 
        error: 'Erro ao carregar configuração de email' 
      };
    }

    if (!integration) {
      return { 
        success: false, 
        error: 'Email não configurado. Configure em Integrações > Email.' 
      };
    }

    const credentials = integration.credentials;
    const fromEmail = credentials['smtp.user'];

    if (!fromEmail) {
      return { 
        success: false, 
        error: 'Email remetente não configurado.' 
      };
    }

    console.log(`[Email] Sending via Resend from: ${fromEmail}`);

    // Check if Resend API key is configured
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('[Email] RESEND_API_KEY not configured');
      return { 
        success: false, 
        error: 'Serviço de email não configurado no servidor. Entre em contato com o suporte.' 
      };
    }

    // Send via Resend API directly
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'OLV Consultores <contato@consultores.olvinternacional.com.br>',
        to: [to],
        subject: subject,
        html: body.replace(/\n/g, '<br>'),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Email] Resend API error:', errorData);
      return { 
        success: false, 
        error: `Erro ao enviar email: ${errorData.message || response.statusText}` 
      };
    }

    const data = await response.json();
    console.log('[Email] Sent successfully via Resend:', data.id);

    return { 
      success: true, 
      providerMessageId: data.id || `${Date.now()}@resend.dev`,
    };

  } catch (error: any) {
    console.error('[Email] Send error:', error);
    return { success: false, error: error.message };
  }
}
