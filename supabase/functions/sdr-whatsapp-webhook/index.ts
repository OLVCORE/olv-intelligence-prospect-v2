import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Webhook endpoint for WhatsApp messages (Twilio, Meta 360, Zenvia)
 * Validates signatures, ensures idempotency, routes conversations
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const provider = Deno.env.get('WHATSAPP_PROVIDER') || 'twilio';
    console.log(`[WhatsApp Webhook] Provider: ${provider}`);

    const contentType = req.headers.get('content-type') || '';
    let payload: any;
    let rawBody = '';

    // Twilio sends form-urlencoded, Meta/Zenvia send JSON
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      payload = Object.fromEntries(formData.entries());
      console.log(`[WhatsApp Webhook] Form data received:`, payload);
    } else {
      rawBody = await req.text();
      payload = JSON.parse(rawBody);
      console.log(`[WhatsApp Webhook] JSON received:`, payload);
    }

    // Verify webhook signature
    const signature = req.headers.get('x-twilio-signature') || 
                     req.headers.get('x-hub-signature-256');
    
    if (signature && rawBody && !verifySignature(rawBody, signature, provider)) {
      console.error('[WhatsApp Webhook] Invalid signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize message from different providers
    const message = normalizeWhatsAppMessage(payload, provider);

    console.log(`[WhatsApp Webhook] Message from: ${message.from}, to: ${message.to}`);

    // Check idempotency - prevent duplicate messages
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('provider_message_id', message.providerMessageId)
      .maybeSingle();

    if (existingMessage) {
      console.log(`[WhatsApp Webhook] Duplicate message: ${message.providerMessageId}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Duplicate message ignored' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find or create contact
    let { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone', message.from)
      .maybeSingle();

    if (!contact) {
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          phone: message.from,
          name: message.from, // Will be enriched later
          channel: { whatsapp: true },
        })
        .select()
        .single();

      if (contactError) throw contactError;
      contact = newContact;
    }

    // Find or create conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('contact_id', contact.id)
      .eq('channel', 'whatsapp')
      .in('status', ['open', 'pending'])
      .maybeSingle();

    if (!conversation) {
      // Apply routing rules
      const routingResult = await applyRoutingRules(supabase, contact, message);

      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          contact_id: contact.id,
          channel: 'whatsapp',
          status: 'open',
          priority: routingResult.priority,
          assigned_to: routingResult.assignedTo,
          sla_due_at: routingResult.slaDueAt,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (convError) throw convError;
      conversation = newConv;

      console.log(`[WhatsApp Webhook] New conversation created: ${conversation.id}`);
    } else {
      // Update existing conversation
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          status: 'open',
        })
        .eq('id', conversation.id);
    }

    // Insert message
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        channel: 'whatsapp',
        direction: 'in',
        from_id: message.from,
        to_id: message.to,
        body: message.body,
        provider_message_id: message.providerMessageId,
        metadata: message.metadata,
        raw: message.raw,
      });

    if (msgError) throw msgError;

    // Log audit
    await supabase.from('sdr_audit').insert({
      entity: 'message',
      entity_id: conversation.id,
      action: 'received',
      payload: { from: message.from, provider },
    });

    console.log(`[WhatsApp Webhook] Message processed successfully`);

    return new Response(
      JSON.stringify({ success: true, conversationId: conversation.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[WhatsApp Webhook] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function normalizeWhatsAppMessage(payload: any, provider: string): any {
  switch (provider) {
    case 'twilio':
      return {
        from: payload.From?.replace('whatsapp:', '') || '',
        to: payload.To?.replace('whatsapp:', '') || '',
        body: payload.Body || '',
        providerMessageId: payload.MessageSid || payload.SmsMessageSid,
        metadata: {
          numMedia: payload.NumMedia,
          mediaUrl: payload.MediaUrl0,
        },
        raw: payload,
      };
    
    case 'meta360':
      const entry = payload.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];
      return {
        from: message?.from || '',
        to: change?.value?.metadata?.phone_number_id || '',
        body: message?.text?.body || '',
        providerMessageId: message?.id,
        metadata: {
          type: message?.type,
          timestamp: message?.timestamp,
        },
        raw: payload,
      };
    
    case 'zenvia':
      return {
        from: payload.from || '',
        to: payload.to || '',
        body: payload.contents?.[0]?.text || '',
        providerMessageId: payload.id,
        metadata: payload.contents,
        raw: payload,
      };

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

function verifySignature(payload: string, signature: string, provider: string): boolean {
  // TODO: Implement actual signature verification per provider
  // For now, skip verification (development mode)
  console.log(`[Signature] Skipping verification for ${provider}`);
  return true;
}

async function applyRoutingRules(supabase: any, contact: any, message: any) {
  // Fetch routing rules
  const { data: rules } = await supabase
    .from('sdr_routing_rules')
    .select('*')
    .eq('active', true)
    .order('priority', { ascending: false });

  // Default values
  let priority = 'medium';
  let assignedTo = null;
  let slaMinutes = 60;

  if (rules && rules.length > 0) {
    // Apply first matching rule
    for (const rule of rules) {
      const conditions = rule.conditions || {};
      
      // Simple condition matching (can be extended)
      if (conditions.channel === 'whatsapp' || !conditions.channel) {
        priority = rule.priority || priority;
        assignedTo = rule.assign_to;
        slaMinutes = rule.sla_minutes || slaMinutes;
        break;
      }
    }
  }

  const slaDueAt = new Date();
  slaDueAt.setMinutes(slaDueAt.getMinutes() + slaMinutes);

  return {
    priority,
    assignedTo,
    slaDueAt: slaDueAt.toISOString(),
  };
}
