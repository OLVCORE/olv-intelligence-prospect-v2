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

    console.log(`[ICP SCORE] Calculando para lead: ${leadId}`)

    // Buscar lead
    const { data: lead, error: fetchError } = await supabase
      .from('leads_quarantine')
      .select('*')
      .eq('id', leadId)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!lead) throw new Error('Lead não encontrado')

    // Inicializar scoring
    let icpScore = 0
    const scoreBreakdown: any = {
      sector_score: 0,
      size_score: 0,
      region_score: 0,
      totvs_status_score: 0,
      competitor_score: 0,
      data_quality_score: 0,
      intent_signals_score: 0
    }
    const painPoints: any[] = []
    const recommendedProducts: string[] = []

    // 1. SCORE POR SETOR (0-30 pts)
    const sectorScores: Record<string, number> = {
      'Agro': 30,
      'Cooperativas': 30,
      'Construção': 28,
      'Distribuição': 26,
      'Atacado': 26,
      'Varejo': 24,
      'Indústria': 22,
      'Logística': 20,
      'Serviços': 18
    }
    
    if (lead.sector) {
      scoreBreakdown.sector_score = sectorScores[lead.sector] || 10
      icpScore += scoreBreakdown.sector_score
      
      if (scoreBreakdown.sector_score >= 24) {
        painPoints.push({
          category: 'Setor Prioritário',
          description: `Setor ${lead.sector} tem alta demanda por soluções ERP especializadas`,
          severity: 'high'
        })
      }

      // Recomendar produtos por setor
      if (['Agro', 'Cooperativas'].includes(lead.sector)) {
        recommendedProducts.push('TOTVS Agro', 'Protheus (módulo Agro)')
      } else if (lead.sector === 'Construção') {
        recommendedProducts.push('TOTVS Construção e Projetos', 'RM (módulo Obras)')
      } else if (['Varejo', 'Distribuição', 'Atacado'].includes(lead.sector)) {
        recommendedProducts.push('TOTVS Varejo', 'Winthor')
      } else if (lead.sector === 'Indústria') {
        recommendedProducts.push('TOTVS Protheus', 'Datasul')
      } else {
        recommendedProducts.push('TOTVS Protheus', 'RM')
      }
      recommendedProducts.push('TOTVS Fluig')
    }

    // 2. SCORE POR PORTE (0-25 pts)
    if (lead.employees) {
      if (lead.employees >= 50 && lead.employees <= 500) {
        scoreBreakdown.size_score = 25
        painPoints.push({
          category: 'Sweet Spot',
          description: 'Empresa no porte ideal para TOTVS (50-500 funcionários)',
          severity: 'high'
        })
      } else if (lead.employees >= 20 && lead.employees < 50) {
        scoreBreakdown.size_score = 18
      } else if (lead.employees > 500 && lead.employees <= 1000) {
        scoreBreakdown.size_score = 15
      } else if (lead.employees > 1000) {
        scoreBreakdown.size_score = 10
      } else {
        scoreBreakdown.size_score = 8
      }
      icpScore += scoreBreakdown.size_score
    }

    // 3. SCORE POR REGIÃO (0-20 pts)
    const regionScores: Record<string, number> = {
      'SP': 20,
      'MG': 18,
      'RS': 18,
      'PR': 18,
      'SC': 18,
      'GO': 16,
      'MT': 16,
      'MS': 16,
      'BA': 14,
      'ES': 14,
      'RJ': 12
    }
    
    if (lead.state) {
      scoreBreakdown.region_score = regionScores[lead.state] || 8
      icpScore += scoreBreakdown.region_score
      
      if (scoreBreakdown.region_score >= 18) {
        painPoints.push({
          category: 'Localização Estratégica',
          description: 'Região facilita suporte e implementação',
          severity: 'medium'
        })
      }
    }

    // 4. SCORE POR STATUS TOTVS (0-20 pts)
    // Verificar se usa TOTVS (isso seria feito em outro enriquecimento)
    const usesTotvs = lead.enriched_data?.competitor_erp?.toLowerCase().includes('totvs')
    
    if (usesTotvs === false || !lead.enriched_data?.competitor_erp) {
      scoreBreakdown.totvs_status_score = 20
      icpScore += 20
      painPoints.push({
        category: 'Oportunidade TOTVS',
        description: 'Empresa não utiliza TOTVS atualmente',
        severity: 'high'
      })
    } else if (usesTotvs) {
      scoreBreakdown.totvs_status_score = -30
      icpScore -= 30
    } else {
      scoreBreakdown.totvs_status_score = 10
      icpScore += 10
    }

    // 5. SCORE POR CONCORRENTE (0-15 pts)
    const competitorScores: Record<string, number> = {
      'SAP': 15,
      'Oracle': 15,
      'Microsoft Dynamics': 14,
      'Senior': 13,
      'Sankhya': 12,
      'Linx': 11,
      'Omie': 10,
      'Bling': 8,
      'Tiny': 8
    }
    
    const competitorErp = lead.enriched_data?.competitor_erp
    if (competitorErp) {
      for (const [competitor, score] of Object.entries(competitorScores)) {
        if (competitorErp.toLowerCase().includes(competitor.toLowerCase())) {
          scoreBreakdown.competitor_score = score
          icpScore += score
          painPoints.push({
            category: 'Concorrente Identificado',
            description: `Usa ${competitor} - possível insatisfação com custos ou complexidade`,
            severity: 'high'
          })
          break
        }
      }
    }

    // 6. SCORE POR QUALIDADE DE DADOS (0-10 pts)
    scoreBreakdown.data_quality_score = Math.round((lead.data_quality_score || 0) * 0.1)
    icpScore += scoreBreakdown.data_quality_score

    // 7. SCORE POR SINAIS DE INTENÇÃO (0-10 pts)
    const intentSignals = [
      lead.has_linkedin,
      lead.website_active,
      lead.email_verified,
      lead.cnpj_valid
    ].filter(Boolean).length
    
    scoreBreakdown.intent_signals_score = Math.min(intentSignals * 3, 10)
    icpScore += scoreBreakdown.intent_signals_score

    // Garantir score entre 0-100
    icpScore = Math.max(0, Math.min(100, icpScore))

    // Determinar temperatura
    let temperature = 'cold'
    let temperatureLabel = '🔵 COLD - Nutrir'
    
    if (icpScore >= 80) {
      temperature = 'hot'
      temperatureLabel = '🔥 HOT - ABORDAR HOJE!'
    } else if (icpScore >= 60) {
      temperature = 'warm'
      temperatureLabel = '🟡 WARM - Abordar esta semana'
    }

    // Pain point genérico se não usa ERP
    if (!competitorErp) {
      painPoints.push({
        category: 'Sem ERP Detectado',
        description: 'Possível uso de planilhas ou sistema legado',
        severity: 'high'
      })
    }

    // Salvar análise ICP no histórico
    const { error: historyError } = await supabase
      .from('icp_analysis_history')
      .insert({
        company_id: null, // Será vinculado quando lead virar company
        lead_id: leadId,
        icp_score: icpScore,
        fit_temperature: temperature,
        pain_points: painPoints,
        recommended_products: recommendedProducts,
        score_breakdown: scoreBreakdown,
        analyzed_by: null
      })

    if (historyError) {
      console.error('[ICP SCORE] Erro ao salvar histórico:', historyError)
    }

    console.log(`[ICP SCORE] ✅ Calculado: ${icpScore}/100 (${temperature})`)

    return new Response(
      JSON.stringify({
        success: true,
        leadId,
        icp_score: icpScore,
        temperature,
        temperature_label: temperatureLabel,
        score_breakdown: scoreBreakdown,
        pain_points: painPoints,
        recommended_products: recommendedProducts
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[ICP SCORE] ❌ Erro:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
