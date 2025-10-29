import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ICPScoreResult {
  icp_score: number
  temperature: 'hot' | 'warm' | 'cold'
  score_breakdown: {
    sector: number
    size: number
    region: number
    totvs_status: number
    competitor: number
    data_quality: number
    buying_signals: number
  }
  reasons: string[]
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

    console.log(`[ICP SCORE] Calculando para: ${lead.name}`)

    const result: ICPScoreResult = {
      icp_score: 0,
      temperature: 'cold',
      score_breakdown: {
        sector: 0,
        size: 0,
        region: 0,
        totvs_status: 0,
        competitor: 0,
        data_quality: 0,
        buying_signals: 0
      },
      reasons: []
    }

    // ============================================
    // 1. SCORE POR SETOR (0-30 pontos)
    // ============================================
    const prioritySectors = {
      'Agro': 30,
      'Agronegócio': 30,
      'Cooperativa': 30,
      'Cooperativas': 30,
      'Construção': 28,
      'Construção Civil': 28,
      'Distribuição': 26,
      'Atacado': 26,
      'Varejo': 24,
      'Indústria': 22,
      'Logística': 20,
      'Serviços': 18
    }

    if (lead.sector) {
      for (const [sector, points] of Object.entries(prioritySectors)) {
        if (lead.sector.toLowerCase().includes(sector.toLowerCase())) {
          result.score_breakdown.sector = points
          result.reasons.push(`✅ Setor prioritário: ${lead.sector} (+${points} pts)`)
          break
        }
      }
    }

    if (result.score_breakdown.sector === 0 && lead.sector) {
      result.score_breakdown.sector = 10
      result.reasons.push(`⚠️ Setor: ${lead.sector} (+10 pts)`)
    }

    // ============================================
    // 2. SCORE POR PORTE (0-25 pontos)
    // ============================================
    if (lead.employees) {
      if (lead.employees >= 50 && lead.employees <= 500) {
        result.score_breakdown.size = 25
        result.reasons.push(`✅ Porte ideal: ${lead.employees} funcionários (+25 pts)`)
      } else if (lead.employees >= 20 && lead.employees < 50) {
        result.score_breakdown.size = 18
        result.reasons.push(`⚠️ Porte aceitável: ${lead.employees} funcionários (+18 pts)`)
      } else if (lead.employees > 500 && lead.employees <= 1000) {
        result.score_breakdown.size = 15
        result.reasons.push(`⚠️ Empresa grande: ${lead.employees} funcionários (+15 pts)`)
      } else if (lead.employees > 1000) {
        result.score_breakdown.size = 10
        result.reasons.push(`⚠️ Empresa muito grande: ${lead.employees} funcionários (+10 pts)`)
      } else {
        result.score_breakdown.size = 8
        result.reasons.push(`⚠️ Empresa pequena: ${lead.employees} funcionários (+8 pts)`)
      }
    }

    // ============================================
    // 3. SCORE POR REGIÃO (0-20 pontos)
    // ============================================
    const priorityStates = {
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
      const stateUpper = lead.state.toUpperCase()
      if (priorityStates[stateUpper]) {
        result.score_breakdown.region = priorityStates[stateUpper]
        result.reasons.push(`✅ Região prioritária: ${lead.state} (+${priorityStates[stateUpper]} pts)`)
      } else {
        result.score_breakdown.region = 8
        result.reasons.push(`⚠️ Região: ${lead.state} (+8 pts)`)
      }
    }

    // ============================================
    // 4. SCORE POR STATUS TOTVS (0-20 pontos)
    // ============================================
    if (lead.has_totvs === false) {
      result.score_breakdown.totvs_status = 20
      result.reasons.push(`🎯 NÃO usa TOTVS - OPORTUNIDADE! (+20 pts)`)
    } else if (lead.has_totvs === true) {
      result.score_breakdown.totvs_status = -30
      result.reasons.push(`❌ JÁ usa TOTVS - não é oportunidade (-30 pts)`)
    } else {
      result.score_breakdown.totvs_status = 10
      result.reasons.push(`⚠️ Status TOTVS desconhecido (+10 pts)`)
    }

    // ============================================
    // 5. SCORE POR CONCORRENTE (0-15 pontos)
    // ============================================
    if (lead.competitor_erp) {
      const competitorScores: Record<string, number> = {
        'SAP': 15,
        'Oracle': 15,
        'Microsoft Dynamics': 14,
        'Senior': 13,
        'Sankhya': 12,
        'Linx': 11,
        'Omie': 10,
        'Bling': 8,
        'Tiny ERP': 8
      }
      
      const score = competitorScores[lead.competitor_erp] || 10
      result.score_breakdown.competitor = score
      result.reasons.push(`🎯 Usa ${lead.competitor_erp} - oportunidade de migração (+${score} pts)`)
    }

    // ============================================
    // 6. SCORE POR QUALIDADE DE DADOS (0-10 pontos)
    // ============================================
    result.score_breakdown.data_quality = Math.round(lead.data_quality_score * 0.1)
    if (result.score_breakdown.data_quality >= 8) {
      result.reasons.push(`✅ Dados completos (+${result.score_breakdown.data_quality} pts)`)
    } else if (result.score_breakdown.data_quality >= 5) {
      result.reasons.push(`⚠️ Dados parciais (+${result.score_breakdown.data_quality} pts)`)
    }

    // ============================================
    // 7. SCORE POR SINAIS DE INTENÇÃO (0-10 pontos)
    // ============================================
    if (lead.buying_signals && Array.isArray(lead.buying_signals) && lead.buying_signals.length > 0) {
      result.score_breakdown.buying_signals = Math.min(lead.buying_signals.length * 3, 10)
      result.reasons.push(`🔥 ${lead.buying_signals.length} sinais de intenção detectados (+${result.score_breakdown.buying_signals} pts)`)
    }

    // ============================================
    // 8. CALCULAR SCORE FINAL
    // ============================================
    result.icp_score = Object.values(result.score_breakdown).reduce((sum, val) => sum + val, 0)
    
    // Garantir que o score está entre 0-100
    result.icp_score = Math.max(0, Math.min(100, result.icp_score))

    // ============================================
    // 9. DETERMINAR TEMPERATURA
    // ============================================
    if (result.icp_score >= 80) {
      result.temperature = 'hot'
      result.reasons.unshift('🔥 LEAD QUENTE - ABORDAR HOJE!')
    } else if (result.icp_score >= 60) {
      result.temperature = 'warm'
      result.reasons.unshift('🟡 LEAD MORNO - ABORDAR ESTA SEMANA')
    } else {
      result.temperature = 'cold'
      result.reasons.unshift('🔵 LEAD FRIO - NUTRIR')
    }

    console.log(`[ICP SCORE] ✅ Score calculado: ${result.icp_score} (${result.temperature})`)

    // ============================================
    // 10. ATUALIZAR LEAD
    // ============================================
    const { error: updateError } = await supabase
      .from('leads_quarantine')
      .update({
        intent_score: result.icp_score
      })
      .eq('id', leadId)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ 
        success: true,
        leadId,
        result
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
