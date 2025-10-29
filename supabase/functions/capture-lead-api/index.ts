import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const leadData: any = await req.json()
    
    if (!leadData.name || leadData.name.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: 'Nome é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!leadData.email && !leadData.phone) {
      return new Response(
        JSON.stringify({ error: 'Email ou telefone é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const sourceName = leadData.source === 'partner_referral' 
      ? 'indicacao_parceiro' 
      : 'indicacao_website'

    const { data: source } = await supabase
      .from('leads_sources')
      .select('id')
      .eq('source_name', sourceName)
      .maybeSingle()

    if (!source) {
      throw new Error(`Fonte "${sourceName}" não encontrada`)
    }

    const lead = {
      name: leadData.name.trim(),
      email: leadData.email?.trim(),
      phone: leadData.phone?.trim(),
      cnpj: leadData.cnpj?.replace(/\D/g, ''),
      website: leadData.website?.trim(),
      sector: leadData.sector?.trim(),
      state: leadData.state?.toUpperCase().substring(0, 2),
      city: leadData.city?.trim(),
      source_id: source.id,
      source_metadata: {
        message: leadData.message,
        referrer: leadData.referrer,
        captured_via: 'api'
      },
      validation_status: 'pending'
    }

    if (lead.email || lead.cnpj) {
      const orConditions = []
      if (lead.email) orConditions.push(`email.eq.${lead.email}`)
      if (lead.cnpj) orConditions.push(`cnpj.eq.${lead.cnpj}`)
      
      const { data: existing } = await supabase
        .from('leads_quarantine')
        .select('id')
        .or(orConditions.join(','))
        .maybeSingle()

      if (existing) {
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Lead já existe',
            lead_id: existing.id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const { data: insertedLead, error: insertError } = await supabase
      .from('leads_quarantine')
      .insert(lead)
      .select('id, name')
      .single()

    if (insertError) throw insertError

    const { data: currentSource } = await supabase
      .from('leads_sources')
      .select('total_captured')
      .eq('id', source.id)
      .single()

    await supabase
      .from('leads_sources')
      .update({
        total_captured: (currentSource?.total_captured || 0) + 1
      })
      .eq('id', source.id)

    fetch(`${supabaseUrl}/functions/v1/validate-lead-comprehensive`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ leadId: insertedLead.id })
    }).catch(err => console.error('Erro ao validar:', err))

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Lead capturado com sucesso!',
        lead_id: insertedLead.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[API CAPTURE] ❌ Erro:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar lead',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
