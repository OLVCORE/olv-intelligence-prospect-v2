import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  event: string
  data: any
  timestamp: string
}

async function sendWebhook(url: string, payload: WebhookPayload, secret?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (secret) {
    headers['X-Webhook-Secret'] = secret
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    return {
      success: response.ok,
      status: response.status,
      body: await response.text(),
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      error: errorMessage,
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { event, data } = await req.json()

    console.log(`[Webhook Dispatcher] Processing event: ${event}`)

    // Get all active webhooks for this event
    const { data: webhooks, error: webhooksError } = await supabase
      .from('sdr_webhooks')
      .select('*')
      .eq('event_type', event)
      .eq('is_active', true)

    if (webhooksError) throw webhooksError

    if (!webhooks || webhooks.length === 0) {
      console.log(`[Webhook Dispatcher] No active webhooks for event: ${event}`)
      return new Response(
        JSON.stringify({ message: 'No webhooks configured', event }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date().toISOString(),
    }

    // Send to all registered webhooks
    const results = await Promise.all(
      webhooks.map(async (webhook) => {
        const result = await sendWebhook(webhook.url, payload, webhook.secret)
        
        // Log delivery attempt
        await supabase.from('sdr_webhook_logs').insert({
          webhook_id: webhook.id,
          event_type: event,
          payload,
          status_code: result.status,
          success: result.success,
          response_body: result.body || result.error,
        })

        return {
          webhook_id: webhook.id,
          url: webhook.url,
          success: result.success,
        }
      })
    )

    return new Response(
      JSON.stringify({ 
        message: 'Webhooks dispatched',
        results,
        total: results.length,
        successful: results.filter(r => r.success).length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Webhook Dispatcher] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})