import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token',
};

interface InboundEmailPayload {
  to?: string | string[];
  from?: string;
  subject?: string;
  text?: string;
  html?: string;
  messageId?: string;
  headers?: Record<string, string> | string;
}

function parseAddresses(value?: string | string[]): string[] {
  if (!value) return [];
  const str = Array.isArray(value) ? value.join(',') : value;
  return str
    .split(',')
    .map((s) => s.trim())
    .map((s) => {
      const match = s.match(/<([^>]+)>/);
      return match ? match[1] : s;
    })
    .filter(Boolean);
}

function extractPlainBody(payload: InboundEmailPayload): string {
  if (payload.html) return payload.html; // keep HTML if available (render is sanitized client-side)
  if (payload.text) return payload.text.replace(/\n/g, '<br/>');
  return '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Accept JSON or form-data (common from inbound providers)
    let payload: InboundEmailPayload = {};
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      payload = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = await req.formData();
      payload = {
        to: form.get('to')?.toString(),
        from: form.get('from')?.toString() || undefined,
        subject: form.get('subject')?.toString() || undefined,
        text: form.get('text')?.toString() || undefined,
        html: form.get('html')?.toString() || undefined,
        messageId: form.get('Message-Id')?.toString() || form.get('messageId')?.toString() || undefined,
      };
    } else {
      // Try best-effort JSON
      try { payload = await req.json(); } catch { payload = {}; }
    }

    const toAddresses = parseAddresses(payload.to);
    const fromAddress = parseAddresses(payload.from)[0] || payload.from || '';

    if (toAddresses.length === 0 || !fromAddress) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload: missing to/from' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Load active email integrations and match by recipient address
    const { data: integrations, error: intError } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('channel', 'email')
      .eq('provider', 'imap_smtp')
      .eq('status', 'active');

    if (intError) throw intError;

    const match = (integrations || []).find((i: any) => {
      const imapUser = i.credentials?.['imap.user']?.toLowerCase?.();
      const smtpUser = i.credentials?.['smtp.user']?.toLowerCase?.();
      return toAddresses.some((addr) => {
        const a = addr.toLowerCase();
        return a === imapUser || a === smtpUser;
      });
    });

    if (!match) {
      console.log('[Inbound Email] No integration matched recipients', toAddresses);
      return new Response(
        JSON.stringify({ success: false, error: 'Recipient not configured' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = match.user_id;
    const channel = 'email';

    // Find or create contact by sender email
    let { data: contact, error: contactErr } = await supabase
      .from('contacts')
      .select('*')
      .eq('email', fromAddress)
      .maybeSingle();

    if (contactErr) throw contactErr;

    if (!contact) {
      const { data: newContact, error: newContactErr } = await supabase
        .from('contacts')
        .insert({
          email: fromAddress,
          name: fromAddress,
          channel: { email: true },
        })
        .select()
        .single();
      if (newContactErr) throw newContactErr;
      contact = newContact;
    }

    // Find open conversation for this contact on email
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('*')
      .eq('contact_id', contact.id)
      .eq('channel', channel)
      .in('status', ['open', 'pending'])
      .order('last_message_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let conversationId = existingConv?.id;

    if (!conversationId) {
      const { data: newConv, error: convErr } = await supabase
        .from('conversations')
        .insert({
          contact_id: contact.id,
          channel,
          status: 'open',
          priority: 'medium',
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (convErr) throw convErr;
      conversationId = newConv.id;
    } else {
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    }

    // Insert inbound message
    const body = extractPlainBody(payload);

    const { data: message, error: msgErr } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        channel,
        direction: 'in',
        from_id: fromAddress,
        to_id: toAddresses[0],
        body,
        status: 'received',
        provider_message_id: payload.messageId || undefined,
        metadata: { subject: payload.subject || '' },
      })
      .select()
      .single();

    if (msgErr) throw msgErr;

    console.log('[Inbound Email] Stored message', message.id);

    return new Response(
      JSON.stringify({ success: true, conversationId, messageId: message.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('[Inbound Email] Error', e);
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});