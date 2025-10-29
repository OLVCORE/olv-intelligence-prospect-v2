import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LeadCapture {
  name: string
  email?: string
  phone?: string
  cnpj?: string
  website?: string
  sector?: string
  state?: string
  city?: string
  message?: string
  source?: string // 'website_form', 'partner_referral', etc
  referrer?: string // Quem indicou
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const leadData: LeadCapture = await req.json()
    
    // Validações
    if (!leadData.name || leadData.name.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: 'Nome é obrigatório (mínimo 3 caracteres)' }),
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

    console.log(`[API CAPTURE] Nova lead: ${leadData.name}`)

    // Determinar fonte
    const sourceName = leadData.source === 'partner_referral' 
      ? 'indicacao_parceiro' 
      : 'indicacao_website'

    // Buscar ID da fonte
    const { data: source } = await supabase
      .from('leads_sources')
      .select('id')
      .eq('source_name', sourceName)
      .maybeSingle()

    if (!source) {
      throw new Error(`Fonte "${sourceName}" não encontrada`)
    }

    // Preparar dados do lead
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
        captured_via: 'api',
        captured_at: new Date().toISOString(),
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      },
      validation_status: 'pending'
    }

    // Verificar duplicata por email ou CNPJ
    if (lead.email || lead.cnpj) {
      const orConditions = []
      if (lead.email) orConditions.push(`email.eq.${lead.email}`)
      if (lead.cnpj) orConditions.push(`cnpj.eq.${lead.cnpj}`)
      
      const { data: existing } = await supabase
        .from('leads_quarantine')
        .select('id, name, validation_status')
        .or(orConditions.join(','))
        .maybeSingle()

      if (existing) {
        console.log(`[API CAPTURE] ⚠️ Lead duplicado: ${existing.name}`)
        
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Lead já existe em nossa base',
            lead_id: existing.id,
            status: existing.validation_status
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Inserir lead
    const { data: insertedLead, error: insertError } = await supabase
      .from('leads_quarantine')
      .insert(lead)
      .select('id, name')
      .single()

    if (insertError) throw insertError

    console.log(`[API CAPTURE] ✅ Lead capturado: ${insertedLead.name} (ID: ${insertedLead.id})`)

    // Atualizar estatísticas da fonte
    await supabase
      .from('leads_sources')
      .update({
        total_captured: supabase.sql`total_captured + 1`
      })
      .eq('id', source.id)

    // Disparar validação automática (fire and forget)
    fetch(`${supabaseUrl}/functions/v1/validate-lead-comprehensive`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ leadId: insertedLead.id })
    }).catch(err => console.error(`[API CAPTURE] Erro ao validar:`, err))

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Lead capturado com sucesso! Entraremos em contato em breve.',
        lead_id: insertedLead.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[API CAPTURE] ❌ Erro:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar lead. Tente novamente.',
        details: error.message,
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
