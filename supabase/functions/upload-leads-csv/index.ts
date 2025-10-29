import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LeadInput {
  name?: string
  empresa?: string
  razao_social?: string
  cnpj?: string
  website?: string
  site?: string
  email?: string
  phone?: string
  telefone?: string
  sector?: string
  setor?: string
  state?: string
  estado?: string
  uf?: string
  city?: string
  cidade?: string
  employees?: number
  funcionarios?: number
  revenue?: number
  faturamento?: number
  [key: string]: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { leads, source_name = 'upload_manual' } = await req.json()
    
    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Array de leads é obrigatório e não pode estar vazio' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`[UPLOAD CSV] Processando ${leads.length} leads`)

    // Buscar ID da fonte
    let sourceId: string
    const { data: source, error: sourceError } = await supabase
      .from('leads_sources')
      .select('id')
      .eq('source_name', source_name)
      .maybeSingle()

    if (!source) {
      console.log('[UPLOAD CSV] Fonte não encontrada, criando...')
      
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

    // Normalizar e processar leads
    const processedLeads: any[] = []
    const errors: any[] = []
    const duplicates: string[] = []

    for (let i = 0; i < leads.length; i++) {
      const lead: LeadInput = leads[i]
      
      try {
        // Normalizar campos (aceitar múltiplos nomes de colunas)
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
          revenue: parseFloat(String(lead.revenue || lead.faturamento || 0)) || null,
          source_id: sourceId,
          source_metadata: {
            original_data: lead,
            row_number: i + 1,
            uploaded_at: new Date().toISOString()
          },
          validation_status: 'pending'
        }

        // Validações básicas
        if (!normalizedLead.name || normalizedLead.name.trim().length < 3) {
          errors.push({
            row: i + 1,
            error: 'Nome da empresa é obrigatório (mínimo 3 caracteres)',
            data: lead
          })
          continue
        }

        // Verificar duplicata por CNPJ
        if (normalizedLead.cnpj && normalizedLead.cnpj.length === 14) {
          const { data: existing } = await supabase
            .from('leads_quarantine')
            .select('id, name')
            .eq('cnpj', normalizedLead.cnpj)
            .maybeSingle()

          if (existing) {
            duplicates.push(`${normalizedLead.name} (CNPJ: ${normalizedLead.cnpj})`)
            continue
          }
        }

        // Determinar região
        if (normalizedLead.state) {
          const regioes: Record<string, string> = {
            'AC': 'Norte', 'AP': 'Norte', 'AM': 'Norte', 'PA': 'Norte', 'RO': 'Norte', 'RR': 'Norte', 'TO': 'Norte',
            'AL': 'Nordeste', 'BA': 'Nordeste', 'CE': 'Nordeste', 'MA': 'Nordeste', 'PB': 'Nordeste', 'PE': 'Nordeste', 'PI': 'Nordeste', 'RN': 'Nordeste', 'SE': 'Nordeste',
            'DF': 'Centro-Oeste', 'GO': 'Centro-Oeste', 'MT': 'Centro-Oeste', 'MS': 'Centro-Oeste',
            'ES': 'Sudeste', 'MG': 'Sudeste', 'RJ': 'Sudeste', 'SP': 'Sudeste',
            'PR': 'Sul', 'RS': 'Sul', 'SC': 'Sul'
          }
          normalizedLead.region = regioes[normalizedLead.state] || null
        }

        // Determinar porte da empresa
        if (normalizedLead.employees) {
          if (normalizedLead.employees < 10) {
            normalizedLead.company_size = 'micro'
          } else if (normalizedLead.employees < 50) {
            normalizedLead.company_size = 'pequena'
          } else if (normalizedLead.employees < 500) {
            normalizedLead.company_size = 'media'
          } else {
            normalizedLead.company_size = 'grande'
          }
        }

        processedLeads.push(normalizedLead)

      } catch (error) {
        errors.push({
          row: i + 1,
          error: error.message,
          data: lead
        })
      }
    }

    console.log(`[UPLOAD CSV] Processados: ${processedLeads.length}, Erros: ${errors.length}, Duplicatas: ${duplicates.length}`)

    // Inserir leads em lote
    let insertedLeads: any[] = []
    
    if (processedLeads.length > 0) {
      const { data, error: insertError } = await supabase
        .from('leads_quarantine')
        .insert(processedLeads)
        .select('id, name, cnpj')

      if (insertError) {
        console.error('[UPLOAD CSV] Erro ao inserir:', insertError)
        throw insertError
      }

      insertedLeads = data || []

      // Atualizar estatísticas da fonte
      await supabase
        .from('leads_sources')
        .update({
          total_captured: supabase.sql`total_captured + ${insertedLeads.length}`
        })
        .eq('id', sourceId)

      console.log(`[UPLOAD CSV] ✅ ${insertedLeads.length} leads inseridos`)

      // Disparar validação automática para cada lead (em background)
      for (const lead of insertedLeads) {
        // Chamar edge function de validação (fire and forget)
        fetch(`${supabaseUrl}/functions/v1/validate-lead-comprehensive`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ leadId: lead.id })
        }).catch(err => console.error(`[UPLOAD CSV] Erro ao validar lead ${lead.id}:`, err))
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
        inserted_leads: insertedLeads,
        errors: errors.length > 0 ? errors : undefined,
        duplicates: duplicates.length > 0 ? duplicates : undefined
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
