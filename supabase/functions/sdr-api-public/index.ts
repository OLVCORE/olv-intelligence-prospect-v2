import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify API key
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('sdr_api_keys')
      .select('*')
      .eq('key', apiKey)
      .eq('is_active', true)
      .single()

    if (apiKeyError || !apiKeyData) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    // GET /deals - List deals
    if (req.method === 'GET' && path === 'deals') {
      const { data: deals, error } = await supabase
        .from('sdr_deals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      // Update API key last_used_at
      await supabase
        .from('sdr_api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', apiKeyData.id)

      return new Response(
        JSON.stringify({ data: deals }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /deals - Create deal
    if (req.method === 'POST' && path === 'deals') {
      const body = await req.json()
      
      const { data: deal, error } = await supabase
        .from('sdr_deals')
        .insert({
          title: body.title,
          company_id: body.company_id,
          stage: body.stage || 'lead',
          value: body.value || 0,
          probability: body.probability || 0,
          expected_close_date: body.expected_close_date,
          description: body.description,
          assigned_to: apiKeyData.user_id
        })
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('sdr_api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', apiKeyData.id)

      return new Response(
        JSON.stringify({ data: deal }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /deal/:id - Get deal
    if (req.method === 'GET' && url.pathname.includes('/deal/')) {
      const dealId = url.pathname.split('/').pop()
      
      const { data: deal, error } = await supabase
        .from('sdr_deals')
        .select('*')
        .eq('id', dealId)
        .single()

      if (error) throw error

      await supabase
        .from('sdr_api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', apiKeyData.id)

      return new Response(
        JSON.stringify({ data: deal }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PATCH /deal/:id - Update deal
    if (req.method === 'PATCH' && url.pathname.includes('/deal/')) {
      const dealId = url.pathname.split('/').pop()
      const body = await req.json()
      
      const { data: deal, error } = await supabase
        .from('sdr_deals')
        .update(body)
        .eq('id', dealId)
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('sdr_api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', apiKeyData.id)

      return new Response(
        JSON.stringify({ data: deal }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('API Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})