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
    const { leadId } = await req.json()
    
    if (!leadId) {
      return new Response(
        JSON.stringify({ error: 'leadId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: lead, error: fetchError } = await supabase
      .from('leads_quarantine')
      .select('*')
      .eq('id', leadId)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!lead) throw new Error('Lead não encontrado')

    console.log(`[VALIDATION] Iniciando validação para: ${lead.name}`)

    await supabase
      .from('leads_quarantine')
      .update({ validation_status: 'validating' })
      .eq('id', leadId)

    const result: any = {
      cnpj_valid: false,
      website_active: false,
      website_ssl: false,
      has_linkedin: false,
      has_email: false,
      email_verified: false,
      auto_score: 0,
      validation_score: 0,
      data_quality_score: 0,
      enriched_data: {}
    }

    // 1. VALIDAÇÃO DE CNPJ
    if (lead.cnpj) {
      try {
        const cnpjClean = lead.cnpj.replace(/\D/g, '')
        const cnpjResponse = await fetch(
          `https://www.receitaws.com.br/v1/cnpj/${cnpjClean}`,
          { signal: AbortSignal.timeout(10000) }
        )
        
        if (cnpjResponse.ok) {
          const cnpjData = await cnpjResponse.json()
          
          if (cnpjData.status === 'OK') {
            result.cnpj_valid = true
            result.cnpj_status = cnpjData.situacao
            result.validation_score += 25
            
            result.enriched_data.receita_federal = {
              nome: cnpjData.nome,
              fantasia: cnpjData.fantasia,
              atividade_principal: cnpjData.atividade_principal,
              porte: cnpjData.porte,
              situacao: cnpjData.situacao
            }
            
            console.log(`[CNPJ] ✅ Válido: ${cnpjData.nome}`)
          }
        }
      } catch (error) {
        console.error('[CNPJ] Erro:', error)
      }
    }

    // 2. VALIDAÇÃO DE WEBSITE
    if (lead.website) {
      try {
        let websiteUrl = lead.website
        if (!websiteUrl.startsWith('http')) {
          websiteUrl = `https://${websiteUrl}`
        }
        
        const websiteResponse = await fetch(websiteUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(10000),
          redirect: 'follow'
        })
        
        if (websiteResponse.ok) {
          result.website_active = true
          result.validation_score += 15
          
          if (websiteUrl.startsWith('https://')) {
            result.website_ssl = true
            result.validation_score += 5
          }
          
          console.log(`[WEBSITE] ✅ Ativo`)
        }
      } catch (error) {
        console.error('[WEBSITE] Erro:', error)
      }
    }

    // 3. BUSCA NO LINKEDIN
    if (lead.name) {
      try {
        const serperApiKey = Deno.env.get('SERPER_API_KEY')
        
        if (serperApiKey) {
          const searchQuery = `site:linkedin.com/company "${lead.name}"`
          
          const serperResponse = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': serperApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: searchQuery,
              num: 3,
              gl: 'br',
              hl: 'pt-br'
            }),
            signal: AbortSignal.timeout(10000)
          })
          
          if (serperResponse.ok) {
            const serperData = await serperResponse.json()
            
            if (serperData.organic && serperData.organic.length > 0) {
              result.has_linkedin = true
              result.validation_score += 10
              
              result.enriched_data.linkedin = {
                url: serperData.organic[0].link,
                title: serperData.organic[0].title
              }
              
              console.log(`[LINKEDIN] ✅ Encontrado`)
            }
          }
        }
      } catch (error) {
        console.error('[LINKEDIN] Erro:', error)
      }
    }

    // 4. VALIDAÇÃO DE EMAIL
    if (lead.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (emailRegex.test(lead.email)) {
        result.has_email = true
        result.validation_score += 5
        result.email_verified = true
        result.validation_score += 5
        console.log(`[EMAIL] ✅ Válido`)
      }
    }

    // 5. SCORE POR ORIGEM
    const { data: source } = await supabase
      .from('leads_sources')
      .select('source_name')
      .eq('id', lead.source_id)
      .maybeSingle()
    
    if (source) {
      const sourceScores: Record<string, number> = {
        'indicacao_website': 20,
        'indicacao_parceiro': 20,
        'lookalike_ai': 15,
        'apollo_io': 15,
        'linkedin_sales_navigator': 12,
        'empresas_aqui': 10,
        'google_search': 8,
        'upload_manual': 10
      }
      
      result.auto_score += sourceScores[source.source_name] || 5
    }

    // 6. SCORE DE QUALIDADE
    const dataFields = [
      lead.name, lead.cnpj, lead.website, lead.email,
      lead.phone, lead.sector, lead.state, lead.city, lead.employees
    ]
    
    const completeness = dataFields.filter(Boolean).length
    result.data_quality_score = Math.round((completeness / dataFields.length) * 100)
    result.auto_score += Math.round(result.data_quality_score * 0.15)

    // 7. SCORE FINAL
    result.auto_score += result.validation_score
    
    let newStatus = 'pending'
    if (result.auto_score >= 70) {
      newStatus = 'approved'
    } else if (result.auto_score < 30) {
      newStatus = 'rejected'
    }

    // 8. ATUALIZAR LEAD
    const { error: updateError } = await supabase
      .from('leads_quarantine')
      .update({
        cnpj_valid: result.cnpj_valid,
        cnpj_status: result.cnpj_status,
        website_active: result.website_active,
        website_ssl: result.website_ssl,
        has_linkedin: result.has_linkedin,
        has_email: result.has_email,
        email_verified: result.email_verified,
        auto_score: result.auto_score,
        validation_score: result.validation_score,
        data_quality_score: result.data_quality_score,
        enriched_data: result.enriched_data,
        validation_status: newStatus,
        validated_at: new Date().toISOString()
      })
      .eq('id', leadId)

    if (updateError) throw updateError

    console.log(`[VALIDATION] ✅ Concluída: ${lead.name}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        leadId,
        result,
        newStatus
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[VALIDATION] ❌ Erro:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
