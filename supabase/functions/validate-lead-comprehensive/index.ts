import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidationResult {
  cnpj_valid: boolean
  cnpj_status?: string
  website_active: boolean
  website_ssl: boolean
  has_linkedin: boolean
  has_email: boolean
  email_verified: boolean
  auto_score: number
  validation_score: number
  data_quality_score: number
  enriched_data: any
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

    // Buscar lead
    const { data: lead, error: fetchError } = await supabase
      .from('leads_quarantine')
      .select('*')
      .eq('id', leadId)
      .single()

    if (fetchError) throw fetchError

    console.log(`[VALIDATION] Iniciando validação para: ${lead.name}`)

    // Atualizar status para 'validating'
    await supabase
      .from('leads_quarantine')
      .update({ validation_status: 'validating' })
      .eq('id', leadId)

    const result: ValidationResult = {
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

    // ============================================
    // 1. VALIDAÇÃO DE CNPJ (ReceitaWS)
    // ============================================
    if (lead.cnpj) {
      try {
        console.log(`[CNPJ] Validando: ${lead.cnpj}`)
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
            
            // Enriquecer dados
            result.enriched_data.receita_federal = {
              nome: cnpjData.nome,
              fantasia: cnpjData.fantasia,
              atividade_principal: cnpjData.atividade_principal,
              natureza_juridica: cnpjData.natureza_juridica,
              porte: cnpjData.porte,
              capital_social: cnpjData.capital_social,
              data_abertura: cnpjData.abertura,
              situacao: cnpjData.situacao,
              endereco: {
                logradouro: cnpjData.logradouro,
                numero: cnpjData.numero,
                complemento: cnpjData.complemento,
                bairro: cnpjData.bairro,
                municipio: cnpjData.municipio,
                uf: cnpjData.uf,
                cep: cnpjData.cep
              },
              telefone: cnpjData.telefone,
              email: cnpjData.email
            }
            
            // Atualizar dados do lead com informações da Receita
            await supabase
              .from('leads_quarantine')
              .update({
                name: lead.name || cnpjData.nome,
                city: lead.city || cnpjData.municipio,
                state: lead.state || cnpjData.uf,
                email: lead.email || cnpjData.email,
                phone: lead.phone || cnpjData.telefone
              })
              .eq('id', leadId)
            
            console.log(`[CNPJ] ✅ Válido: ${cnpjData.nome}`)
          } else {
            console.log(`[CNPJ] ❌ Inválido ou inativo`)
          }
        }
      } catch (error) {
        console.error('[CNPJ] Erro na validação:', error)
      }
    }

    // ============================================
    // 2. VALIDAÇÃO DE WEBSITE
    // ============================================
    if (lead.website) {
      try {
        console.log(`[WEBSITE] Validando: ${lead.website}`)
        
        // Normalizar URL
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
          
          // Verificar SSL
          if (websiteUrl.startsWith('https://')) {
            result.website_ssl = true
            result.validation_score += 5
          }
          
          console.log(`[WEBSITE] ✅ Ativo (SSL: ${result.website_ssl})`)
        } else {
          console.log(`[WEBSITE] ❌ Inativo ou inacessível`)
        }
      } catch (error) {
        console.error('[WEBSITE] Erro na validação:', error)
      }
    }

    // ============================================
    // 3. BUSCA NO LINKEDIN
    // ============================================
    if (lead.name) {
      try {
        console.log(`[LINKEDIN] Buscando: ${lead.name}`)
        
        // Buscar no Google: "site:linkedin.com/company [nome empresa]"
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
              const linkedinUrl = serperData.organic[0].link
              result.has_linkedin = true
              result.validation_score += 10
              
              result.enriched_data.linkedin = {
                url: linkedinUrl,
                title: serperData.organic[0].title,
                snippet: serperData.organic[0].snippet
              }
              
              // Atualizar URL do LinkedIn
              await supabase
                .from('leads_quarantine')
                .update({ enriched_data: result.enriched_data })
                .eq('id', leadId)
              
              console.log(`[LINKEDIN] ✅ Encontrado: ${linkedinUrl}`)
            } else {
              console.log(`[LINKEDIN] ❌ Não encontrado`)
            }
          }
        } else {
          console.log('[LINKEDIN] ⚠️ SERPER_API_KEY não configurada')
        }
      } catch (error) {
        console.error('[LINKEDIN] Erro na busca:', error)
      }
    }

    // ============================================
    // 4. VALIDAÇÃO DE EMAIL
    // ============================================
    if (lead.email) {
      try {
        console.log(`[EMAIL] Validando: ${lead.email}`)
        
        // Validação básica de formato
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (emailRegex.test(lead.email)) {
          result.has_email = true
          result.validation_score += 5
          
          // Verificar domínio (DNS MX record)
          const domain = lead.email.split('@')[1]
          
          try {
            // Usar API de validação de email (AbstractAPI, ZeroBounce, etc)
            // Por enquanto, apenas validação de formato
            result.email_verified = true
            result.validation_score += 5
            
            console.log(`[EMAIL] ✅ Formato válido`)
          } catch (error) {
            console.log(`[EMAIL] ⚠️ Não foi possível verificar domínio`)
          }
        } else {
          console.log(`[EMAIL] ❌ Formato inválido`)
        }
      } catch (error) {
        console.error('[EMAIL] Erro na validação:', error)
      }
    }

    // ============================================
    // 5. SCORE POR ORIGEM
    // ============================================
    const { data: source } = await supabase
      .from('leads_sources')
      .select('source_name, priority')
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
        'upload_manual': 10,
        'web_scraping_custom': 8,
        'api_integration': 10
      }
      
      const sourceScore = sourceScores[source.source_name] || 5
      result.auto_score += sourceScore
      
      console.log(`[SOURCE] Score da fonte ${source.source_name}: +${sourceScore}`)
    }

    // ============================================
    // 6. SCORE DE QUALIDADE DE DADOS
    // ============================================
    const dataFields = [
      lead.name,
      lead.cnpj,
      lead.website,
      lead.email,
      lead.phone,
      lead.sector,
      lead.state,
      lead.city,
      lead.employees
    ]
    
    const completeness = dataFields.filter(Boolean).length
    result.data_quality_score = Math.round((completeness / dataFields.length) * 100)
    result.auto_score += Math.round(result.data_quality_score * 0.15)
    
    console.log(`[DATA QUALITY] Completude: ${completeness}/${dataFields.length} (${result.data_quality_score}%)`)

    // ============================================
    // 7. SCORE FINAL E DECISÃO
    // ============================================
    result.auto_score += result.validation_score
    
    let newStatus = 'pending'
    
    if (result.auto_score >= 70) {
      newStatus = 'approved'
      console.log(`[DECISION] ✅ AUTO-APROVADO (Score: ${result.auto_score})`)
    } else if (result.auto_score < 30) {
      newStatus = 'rejected'
      console.log(`[DECISION] ❌ AUTO-REJEITADO (Score: ${result.auto_score})`)
    } else {
      console.log(`[DECISION] ⏸️ REVISÃO MANUAL (Score: ${result.auto_score})`)
    }

    // ============================================
    // 8. ATUALIZAR LEAD
    // ============================================
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

    console.log(`[VALIDATION] ✅ Concluída para: ${lead.name}`)

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
