import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalize message from different providers
function normalizeWhatsAppMessage(payload: any, provider: string): any {
  switch (provider) {
    case 'twilio':
      return {
        from: payload.From?.replace('whatsapp:', ''),
        to: payload.To?.replace('whatsapp:', ''),
        body: payload.Body,
        providerMessageId: payload.MessageSid,
        raw: payload,
      };
    case 'meta360':
      const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      return {
        from: message?.from,
        to: payload.entry?.[0]?.changes?.[0]?.value?.metadata?.display_phone_number,
        body: message?.text?.body || message?.image?.caption || '',
        providerMessageId: message?.id,
        raw: payload,
      };
    case 'zenvia':
      return {
        from: payload.from,
        to: payload.to,
        body: payload.message?.contents?.[0]?.text,
        providerMessageId: payload.id,
        raw: payload,
      };
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Verify webhook signatures
function verifySignature(payload: string, signature: string, provider: string): boolean {
  const secret = Deno.env.get(`${provider.toUpperCase()}_WEBHOOK_SECRET`);
  if (!secret) return true; // Skip verification if no secret configured
  
  // Implementation would vary by provider
  // For now, return true for development
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const provider = Deno.env.get('WHATSAPP_PROVIDER') || 'twilio';
    const signature = req.headers.get('x-twilio-signature') || req.headers.get('x-hub-signature-256') || '';
    
    const rawPayload = await req.text();
    
    // Verify signature (skip for development)
    // if (!verifySignature(rawPayload, signature, provider)) {
    //   return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    // }

    const payload = JSON.parse(rawPayload);
    const normalized = normalizeWhatsAppMessage(payload, provider);

    if (!normalized.from || !normalized.body) {
      console.log('[WhatsApp Webhook] Invalid message format:', normalized);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Initialize Supabase with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check for existing message (idempotency)
    if (normalized.providerMessageId) {
      const { data: existing } = await supabase
        .from('messages')
        .select('id')
        .eq('provider_message_id', normalized.providerMessageId)
        .maybeSingle();

      if (existing) {
        console.log('[WhatsApp Webhook] Duplicate message, skipping:', normalized.providerMessageId);
        return new Response('OK', { status: 200, headers: corsHeaders });
      }
    }

    // Find or create contact
    let { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone', normalized.from)
      .maybeSingle();

    if (!contact) {
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          phone: normalized.from,
          name: normalized.from,
          channel: { whatsapp: true, email: false },
        })
        .select()
        .single();

      if (contactError) {
        console.error('[WhatsApp Webhook] Error creating contact:', contactError);
        throw contactError;
      }
      contact = newContact;
    }

    // Find or create conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('contact_id', contact.id)
      .eq('channel', 'whatsapp')
      .in('status', ['open', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!conversation) {
      // Apply routing rules
      const { data: rules } = await supabase
        .from('sdr_routing_rules')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      let priority = 'medium';
      let slaMinutes = 60;
      let assignedTo = null;

      if (rules) {
        for (const rule of rules) {
          const conditions = rule.conditions as any;
          if (conditions.channel === 'whatsapp' || !conditions.channel) {
            if (conditions.contains && Array.isArray(conditions.contains)) {
              const bodyLower = normalized.body.toLowerCase();
              if (conditions.contains.some((keyword: string) => bodyLower.includes(keyword.toLowerCase()))) {
                priority = rule.priority || 'medium';
                slaMinutes = rule.sla_minutes || 60;
                assignedTo = rule.assign_to;
                break;
              }
            } else {
              priority = rule.priority || 'medium';
              slaMinutes = rule.sla_minutes || 60;
              assignedTo = rule.assign_to;
              break;
            }
          }
        }
      }

      const slaDueAt = new Date(Date.now() + slaMinutes * 60 * 1000).toISOString();

      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          contact_id: contact.id,
          channel: 'whatsapp',
          status: 'open',
          priority,
          sla_due_at: slaDueAt,
          assigned_to: assignedTo,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (convError) {
        console.error('[WhatsApp Webhook] Error creating conversation:', convError);
        throw convError;
      }
      conversation = newConversation;
    } else {
      // Update existing conversation
      await supabase
        .from('conversations')
        .update({
          status: 'open',
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversation.id);
    }

    // Create message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        direction: 'in',
        channel: 'whatsapp',
        from_id: normalized.from,
        to_id: normalized.to,
        body: normalized.body,
        provider_message_id: normalized.providerMessageId,
        status: 'delivered',
        raw: normalized.raw,
      });

    if (messageError) {
      console.error('[WhatsApp Webhook] Error creating message:', messageError);
      throw messageError;
    }

    // Log audit
    await supabase.from('sdr_audit').insert({
      entity: 'message',
      entity_id: conversation.id,
      action: 'received',
      payload: { channel: 'whatsapp', from: normalized.from },
    });

    console.log('[WhatsApp Webhook] Message processed successfully');
    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('[WhatsApp Webhook] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
