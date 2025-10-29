import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FALLBACK_TEMPLATE = (lead: any, icpScore: number, temperature: string, painPoints: any[], recommendedProducts: string[]) => `
# Proposta de Valor para ${lead.name}

## Sobre Sua Empresa
${lead.name} é uma empresa do setor de **${lead.sector || 'não especificado'}** com **${lead.employees || 'N/A'} funcionários**, localizada em ${lead.city || ''}, ${lead.state || ''}.

## Desafios Identificados
${painPoints.map(p => `- **${p.category}**: ${p.description}`).join('\n')}

## Solução TOTVS Recomendada
Baseado na análise do seu perfil, recomendamos:

${recommendedProducts.map(p => `- ✅ **${p}**`).join('\n')}

### Benefícios Imediatos:
- ✅ **Integração completa** de todos os processos da empresa
- ✅ **Redução de custos operacionais** em até 30%
- ✅ **Aumento de produtividade** em até 40%
- ✅ **Suporte especializado** no setor ${lead.sector || 'da sua empresa'}
- ✅ **Compliance fiscal** 100% atualizado

## Por Que TOTVS?
- 🏆 **Líder de mercado** em ERP no Brasil há mais de 30 anos
- 📊 **35% do mercado brasileiro** de ERP
- 🎯 **Soluções específicas** para ${lead.sector || 'diversos setores'}
- 🤝 **Suporte local** e especializado
- 💡 **Inovação constante** com tecnologia de ponta

## Próximos Passos
Vamos agendar uma **reunião de 30 minutos** para:

1. ✅ Entender melhor seus desafios atuais
2. ✅ Apresentar casos de sucesso no setor ${lead.sector || 'da sua empresa'}
3. ✅ Demonstrar como TOTVS pode transformar sua operação
4. ✅ Calcular ROI específico para sua empresa

## ROI Estimado
Baseado em empresas similares do setor ${lead.sector || 'da sua empresa'}, estimamos:

**Investimento:** R$ ${(lead.employees || 100) * 150} - R$ ${(lead.employees || 100) * 300}/mês

**Retorno Esperado (12-24 meses):**
- 💰 Redução de 20-30% em custos operacionais
- 📈 Aumento de 30-40% em produtividade
- ⚡ Redução de 50% em retrabalho
- 📊 Melhor tomada de decisão baseada em dados em tempo real

**Payback:** 12-18 meses
`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { leadId, icpScore, temperature, painPoints, recommendedProducts } = await req.json()
    
    if (!leadId) {
      return new Response(
        JSON.stringify({ error: 'leadId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`[VALUE PROP] Gerando para lead: ${leadId}`)

    // Buscar lead
    const { data: lead, error: fetchError } = await supabase
      .from('leads_quarantine')
      .select('*')
      .eq('id', leadId)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!lead) throw new Error('Lead não encontrado')

    let valueProposition: string
    let scriptAbordagem: string
    let roiEstimado: string
    let usedAI = false

    // Tentar gerar com Lovable AI
    if (lovableApiKey) {
      try {
        const prompt = `Você é um especialista em vendas B2B de soluções ERP TOTVS.

CONTEXTO DA EMPRESA:
- Nome: ${lead.name}
- Setor: ${lead.sector || 'Não especificado'}
- Porte: ${lead.employees || 'Não especificado'} funcionários
- Localização: ${lead.city || ''}, ${lead.state || ''}
- ERP Atual: ${lead.enriched_data?.competitor_erp || 'Não detectado'}
- Score ICP: ${icpScore}/100 (${temperature})

PAIN POINTS IDENTIFICADOS:
${painPoints.map((p: any) => `- ${p.description}`).join('\n')}

PRODUTOS RECOMENDADOS:
${recommendedProducts.join(', ')}

TAREFA:
Gere uma proposta de valor personalizada em Markdown com:

1. ABERTURA (2-3 linhas): Mencione o setor e crie conexão
2. DORES IDENTIFICADAS (3-4 bullets): Problemas específicos do setor
3. SOLUÇÃO TOTVS (3-4 bullets): Como resolver as dores
4. DIFERENCIAL COMPETITIVO (2-3 bullets): Por que TOTVS é melhor
5. PRÓXIMOS PASSOS (2-3 linhas): Call-to-action claro
6. ROI ESTIMADO: Retorno em 12-24 meses

Tom profissional mas acessível, máximo 500 palavras.`

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{
              role: 'user',
              content: prompt
            }],
            max_tokens: 2000
          }),
          signal: AbortSignal.timeout(30000)
        })

        if (!response.ok) {
          throw new Error(`AI API error: ${response.status}`)
        }

        const data = await response.json()
        valueProposition = data.choices[0].message.content
        usedAI = true

        // Gerar script de abordagem
        const scriptPrompt = `Baseado na proposta de valor abaixo, crie um script comercial de primeira ligação.

PROPOSTA:
${valueProposition}

SCRIPT DEVE TER:
1. Apresentação (15s)
2. Quebra-gelo (pergunta sobre desafio)
3. Pitch (30s)
4. Pergunta de qualificação
5. Agendamento

Formato conversacional, máximo 200 palavras.`

        const scriptResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{
              role: 'user',
              content: scriptPrompt
            }],
            max_tokens: 1000
          }),
          signal: AbortSignal.timeout(20000)
        })

        if (scriptResponse.ok) {
          const scriptData = await scriptResponse.json()
          scriptAbordagem = scriptData.choices[0].message.content
        } else {
          scriptAbordagem = `**Apresentação:**
Olá, meu nome é [NOME] da OLV Internacional, parceiro TOTVS. Estou ligando para ${lead.name}.

**Quebra-gelo:**
Percebi que vocês atuam no setor de ${lead.sector}. Como vocês estão gerenciando [processo crítico] atualmente?

**Pitch:**
Trabalhamos com empresas como a sua para otimizar processos através de soluções TOTVS. Nossos clientes no setor de ${lead.sector} conseguiram reduzir custos em até 30% e aumentar produtividade em 40%.

**Qualificação:**
Vocês utilizam algum sistema ERP atualmente?

**Agendamento:**
Que tal agendarmos 30 minutos na próxima semana para eu mostrar casos de sucesso específicos do seu setor?`
        }

        roiEstimado = `Baseado em empresas similares no setor de ${lead.sector} com ${lead.employees} funcionários:

**Investimento:** R$ ${(lead.employees || 100) * 150} - R$ ${(lead.employees || 100) * 300}/mês

**Retorno Esperado (12 meses):**
- Redução de 20-30% em custos operacionais
- Aumento de 30-40% em produtividade
- Redução de 50% em retrabalho
- ROI: 12-18 meses

**Payback:** 12-18 meses`

        console.log('[VALUE PROP] ✅ Gerado com Lovable AI')

      } catch (error) {
        console.error('[VALUE PROP] ⚠️ Erro ao usar AI, usando fallback:', error)
        valueProposition = FALLBACK_TEMPLATE(lead, icpScore, temperature, painPoints, recommendedProducts)
        scriptAbordagem = `Script não disponível (erro na IA). Use a proposta de valor acima como base.`
        roiEstimado = `ROI estimado: 12-18 meses (baseado em empresas similares)`
        usedAI = false
      }
    } else {
      console.log('[VALUE PROP] ⚠️ LOVABLE_API_KEY não configurada, usando fallback')
      valueProposition = FALLBACK_TEMPLATE(lead, icpScore, temperature, painPoints, recommendedProducts)
      scriptAbordagem = `**Script de Abordagem:**

Olá, meu nome é [NOME] da OLV Internacional, parceiro TOTVS.

Estou ligando para ${lead.name}. Percebi que vocês atuam no setor de ${lead.sector || 'sua área'}.

Como vocês gerenciam seus processos atualmente? Utilizam algum sistema ERP?

Trabalhamos com empresas similares e conseguimos reduzir custos em até 30%. 

Posso agendar 30 minutos para mostrar casos de sucesso?`
      roiEstimado = `ROI estimado: 12-18 meses (baseado em empresas similares do setor ${lead.sector || 'da sua empresa'})`
      usedAI = false
    }

    // Atualizar histórico ICP
    const { error: updateError } = await supabase
      .from('icp_analysis_history')
      .update({
        value_proposition: valueProposition,
        estimated_roi: roiEstimado
      })
      .eq('lead_id', leadId)
      .order('analyzed_at', { ascending: false })
      .limit(1)

    if (updateError) {
      console.error('[VALUE PROP] Erro ao atualizar histórico:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        leadId,
        value_proposition: valueProposition,
        script_abordagem: scriptAbordagem,
        roi_estimado: roiEstimado,
        used_ai: usedAI
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[VALUE PROP] ❌ Erro:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
