import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TechnologyDetection {
  has_totvs: boolean
  totvs_products: string[]
  competitor_erp: string | null
  technologies_detected: Array<{
    name: string
    category: string
    confidence: number
    evidence: string[]
  }>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { leadId, website } = await req.json()
    
    if (!leadId || !website) {
      return new Response(
        JSON.stringify({ error: 'leadId e website são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`[TECH DETECTION] Iniciando para: ${website}`)

    const result: TechnologyDetection = {
      has_totvs: false,
      totvs_products: [],
      competitor_erp: null,
      technologies_detected: []
    }

    // ============================================
    // 1. BUSCAR CONTEÚDO DO WEBSITE
    // ============================================
    let websiteContent = ''
    
    try {
      let websiteUrl = website
      if (!websiteUrl.startsWith('http')) {
        websiteUrl = `https://${websiteUrl}`
      }
      
      const response = await fetch(websiteUrl, {
        signal: AbortSignal.timeout(15000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      if (response.ok) {
        websiteContent = await response.text()
        console.log(`[TECH DETECTION] ✅ Conteúdo obtido (${websiteContent.length} chars)`)
      } else {
        console.log(`[TECH DETECTION] ❌ Falha ao obter conteúdo`)
        throw new Error('Falha ao obter conteúdo do website')
      }
    } catch (error) {
      console.error('[TECH DETECTION] Erro ao buscar website:', error)
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Não foi possível acessar o website',
          result
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ============================================
    // 2. DETECÇÃO DE TOTVS
    // ============================================
    const totvsPatterns = [
      { pattern: /totvs/gi, product: 'TOTVS' },
      { pattern: /protheus/gi, product: 'TOTVS Protheus' },
      { pattern: /datasul/gi, product: 'TOTVS Datasul' },
      { pattern: /rm\s+totvs/gi, product: 'TOTVS RM' },
      { pattern: /fluig/gi, product: 'TOTVS Fluig' },
      { pattern: /winthor/gi, product: 'TOTVS Winthor' },
      { pattern: /techfin/gi, product: 'TOTVS Techfin' },
      { pattern: /carol/gi, product: 'TOTVS Carol' }
    ]

    const totvsEvidence: string[] = []
    
    for (const { pattern, product } of totvsPatterns) {
      const matches = websiteContent.match(pattern)
      if (matches && matches.length > 0) {
        result.has_totvs = true
        if (!result.totvs_products.includes(product)) {
          result.totvs_products.push(product)
        }
        totvsEvidence.push(`Encontrado "${matches[0]}" no conteúdo`)
      }
    }

    if (result.has_totvs) {
      result.technologies_detected.push({
        name: 'TOTVS',
        category: 'ERP',
        confidence: 0.95,
        evidence: totvsEvidence
      })
      
      console.log(`[TECH DETECTION] 🎯 TOTVS DETECTADO: ${result.totvs_products.join(', ')}`)
    } else {
      console.log(`[TECH DETECTION] ℹ️ TOTVS não detectado (OPORTUNIDADE!)`)
    }

    // ============================================
    // 3. DETECÇÃO DE ERPs CONCORRENTES
    // ============================================
    const competitorERPs = [
      { name: 'SAP', patterns: [/\bsap\b/gi, /sap\s+business/gi, /sap\s+hana/gi] },
      { name: 'Oracle', patterns: [/oracle/gi, /netsuite/gi, /peoplesoft/gi] },
      { name: 'Microsoft Dynamics', patterns: [/dynamics/gi, /dynamics\s+365/gi, /nav/gi, /ax/gi] },
      { name: 'Senior', patterns: [/senior\s+sistemas/gi, /senior\s+x/gi] },
      { name: 'Sankhya', patterns: [/sankhya/gi] },
      { name: 'Linx', patterns: [/linx/gi, /microvix/gi] },
      { name: 'Omie', patterns: [/omie/gi] },
      { name: 'Bling', patterns: [/bling/gi] },
      { name: 'Tiny ERP', patterns: [/tiny\s+erp/gi] },
      { name: 'Sage', patterns: [/sage/gi, /sage\s+x3/gi] }
    ]

    for (const competitor of competitorERPs) {
      for (const pattern of competitor.patterns) {
        const matches = websiteContent.match(pattern)
        if (matches && matches.length > 0) {
          result.competitor_erp = competitor.name
          
          result.technologies_detected.push({
            name: competitor.name,
            category: 'ERP Concorrente',
            confidence: 0.85,
            evidence: [`Encontrado "${matches[0]}" no conteúdo`]
          })
          
          console.log(`[TECH DETECTION] 🎯 ERP CONCORRENTE: ${competitor.name}`)
          break
        }
      }
      if (result.competitor_erp) break
    }

    // ============================================
    // 4. DETECÇÃO DE OUTRAS TECNOLOGIAS
    // ============================================
    const otherTechnologies = [
      { name: 'Salesforce', category: 'CRM', patterns: [/salesforce/gi] },
      { name: 'HubSpot', category: 'CRM', patterns: [/hubspot/gi] },
      { name: 'RD Station', category: 'Marketing', patterns: [/rd\s+station/gi, /resultados\s+digitais/gi] },
      { name: 'Google Analytics', category: 'Analytics', patterns: [/google-analytics\.com/gi, /gtag/gi] },
      { name: 'WordPress', category: 'CMS', patterns: [/wp-content/gi, /wordpress/gi] },
      { name: 'Shopify', category: 'E-commerce', patterns: [/shopify/gi, /myshopify\.com/gi] },
      { name: 'Magento', category: 'E-commerce', patterns: [/magento/gi] },
      { name: 'VTEX', category: 'E-commerce', patterns: [/vtex/gi, /vteximg/gi] }
    ]

    for (const tech of otherTechnologies) {
      for (const pattern of tech.patterns) {
        const matches = websiteContent.match(pattern)
        if (matches && matches.length > 0) {
          result.technologies_detected.push({
            name: tech.name,
            category: tech.category,
            confidence: 0.80,
            evidence: [`Encontrado "${matches[0]}" no conteúdo`]
          })
          
          console.log(`[TECH DETECTION] 📦 Tecnologia: ${tech.name} (${tech.category})`)
          break
        }
      }
    }

    // ============================================
    // 5. ATUALIZAR LEAD
    // ============================================
    const { error: updateError } = await supabase
      .from('leads_quarantine')
      .update({
        has_totvs: result.has_totvs,
        totvs_products: result.totvs_products.length > 0 ? result.totvs_products : null,
        competitor_erp: result.competitor_erp,
        technologies_detected: result.technologies_detected
      })
      .eq('id', leadId)

    if (updateError) throw updateError

    console.log(`[TECH DETECTION] ✅ Concluída`)

    return new Response(
      JSON.stringify({ 
        success: true,
        leadId,
        result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[TECH DETECTION] ❌ Erro:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
