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
    const { leads, source_name = 'upload_manual' } = await req.json()
    
    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Array de leads é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`[UPLOAD CSV] Processando ${leads.length} leads`)

    let sourceId: string
    
    const { data: source } = await supabase
      .from('leads_sources')
      .select('id')
      .eq('source_name', source_name)
      .maybeSingle()

    if (!source) {
      const { data: newSource, error: createError } = await supabase
        .from('leads_sources')
        .insert({
          source_name,
          is_active: true,
          priority: 10
        })
        .select('id')
        .single()

      if (createError) throw createError
      sourceId = newSource.id
    } else {
      sourceId = source.id
    }

    const processedLeads: any[] = []
    const errors: any[] = []
    const duplicates: string[] = []

    for (let i = 0; i < leads.length; i++) {
      const lead: any = leads[i]
      
      try {
        const normalizedLead = {
          name: lead.name || lead.empresa || lead.razao_social,
          cnpj: (lead.cnpj || '').replace(/\D/g, ''),
          website: lead.website || lead.site,
          email: lead.email,
          phone: lead.phone || lead.telefone,
          sector: lead.sector || lead.setor,
          state: (lead.state || lead.estado || lead.uf || '').toUpperCase().substring(0, 2),
          city: lead.city || lead.cidade,
          employees: parseInt(String(lead.employees || lead.funcionarios || 0)) || null,
          source_id: sourceId,
          source_metadata: {
            original_data: lead,
            row_number: i + 1
          },
          validation_status: 'pending'
        }

        if (!normalizedLead.name || normalizedLead.name.trim().length < 3) {
          errors.push({
            row: i + 1,
            error: 'Nome inválido'
          })
          continue
        }

        if (normalizedLead.cnpj && normalizedLead.cnpj.length === 14) {
          const { data: existing } = await supabase
            .from('leads_quarantine')
            .select('id')
            .eq('cnpj', normalizedLead.cnpj)
            .maybeSingle()

          if (existing) {
            duplicates.push(normalizedLead.name)
            continue
          }
        }

        processedLeads.push(normalizedLead)

      } catch (error) {
        errors.push({
          row: i + 1,
          error: error.message
        })
      }
    }

    let insertedLeads: any[] = []
    
    if (processedLeads.length > 0) {
      const { data, error: insertError } = await supabase
        .from('leads_quarantine')
        .insert(processedLeads)
        .select('id, name')

      if (insertError) throw insertError
      insertedLeads = data || []

      const { data: currentSource } = await supabase
        .from('leads_sources')
        .select('total_captured')
        .eq('id', sourceId)
        .single()

      await supabase
        .from('leads_sources')
        .update({
          total_captured: (currentSource?.total_captured || 0) + insertedLeads.length
        })
        .eq('id', sourceId)

      console.log(`[UPLOAD CSV] ✅ ${insertedLeads.length} inseridos`)

      for (const lead of insertedLeads) {
        fetch(`${supabaseUrl}/functions/v1/validate-lead-comprehensive`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ leadId: lead.id })
        }).catch(err => console.error(`Erro ao validar:`, err))
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        summary: {
          total_received: leads.length,
          inserted: insertedLeads.length,
          errors: errors.length,
          duplicates: duplicates.length
        },
        inserted_leads: insertedLeads
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[UPLOAD CSV] ❌ Erro:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
