import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { companyId, companyData, decisionMakers } = await req.json()
    
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiKey) {
      throw new Error('OpenAI API Key não configurada nas Edge Functions secrets')
    }

    // Construct strategy prompt
    const decisionMakersList = decisionMakers && decisionMakers.length > 0
      ? decisionMakers.map((d: any) => `${d.full_name} - ${d.position || 'Cargo não informado'}`).join(', ')
      : 'Decisores não identificados ainda'

    const prompt = `Gere uma estratégia completa de Account-Based Selling (ABS) para:

DADOS DA EMPRESA:
- Nome: ${companyData.company_name}
- Setor: ${companyData.main_activity}
- Porte: ${companyData.company_size}
- Localização: ${companyData.city}, ${companyData.state}
- Funcionários: ${companyData.employee_count || 'N/A'}
- Receita Anual: R$ ${companyData.annual_revenue ? companyData.annual_revenue.toLocaleString('pt-BR') : 'N/A'}
- Website: ${companyData.website || 'N/A'}

DECISORES IDENTIFICADOS:
${decisionMakersList}

Forneça em JSON estruturado:
{
  "executive_summary": "resumo executivo da oportunidade (2-3 parágrafos)",
  "key_stakeholders": [
    {
      "name": "nome do decisor",
      "role": "cargo",
      "influence_level": "Alto/Médio/Baixo",
      "engagement_approach": "abordagem específica para este stakeholder",
      "recommended_content": "tipo de conteúdo a enviar"
    }
  ],
  "value_proposition": "proposta de valor específica para esta empresa",
  "pain_points_addressed": ["dor 1", "dor 2", "dor 3"],
  "competitive_advantages": ["vantagem 1", "vantagem 2"],
  "next_actions": [
    {
      "action": "descrição da ação",
      "responsible": "SDR/BDR/AE",
      "timeline": "prazo",
      "priority": "Alta/Média/Baixa"
    }
  ],
  "content_strategy": {
    "first_touch": "tipo de primeiro contato",
    "nurture_sequence": ["conteúdo 1", "conteúdo 2", "conteúdo 3"],
    "meeting_preparation": "pontos chave para reunião"
  },
  "success_metrics": ["métrica 1", "métrica 2", "métrica 3"],
  "estimated_timeline": "prazo estimado para fechamento",
  "risk_factors": ["risco 1", "risco 2"]
}

Seja específico e prático. Foque em ações concretas.`

    // Call OpenAI API with GPT-4
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em estratégias de vendas B2B e Account-Based Selling. Responda sempre em JSON válido e estruturado.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 2000
      }),
    })

    if (!response.ok) {
      // Fallback to GPT-3.5 if GPT-4 fails
      const fallbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { 
              role: 'system', 
              content: 'Você é um especialista em estratégias de vendas B2B. Responda em JSON válido.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8,
          max_tokens: 1500
        }),
      })
      
      if (!fallbackResponse.ok) {
        const errorData = await fallbackResponse.json()
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
      }
      
      const result = await fallbackResponse.json()
      const strategyText = result.choices[0].message.content
      
      let strategy
      try {
        strategy = JSON.parse(strategyText)
      } catch (parseError) {
        strategy = {
          executive_summary: strategyText,
          key_stakeholders: [],
          value_proposition: 'Análise manual necessária',
          next_actions: [],
          estimated_timeline: '3-6 meses'
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          strategy,
          company_id: companyId,
          generated_at: new Date().toISOString(),
          model_used: 'gpt-3.5-turbo'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    const result = await response.json()
    const strategyText = result.choices[0].message.content
    
    // Parse JSON response
    let strategy
    try {
      strategy = JSON.parse(strategyText)
    } catch (parseError) {
      strategy = {
        executive_summary: strategyText,
        key_stakeholders: [],
        value_proposition: 'Análise manual necessária',
        next_actions: [],
        estimated_timeline: '3-6 meses'
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        strategy,
        company_id: companyId,
        generated_at: new Date().toISOString(),
        model_used: 'gpt-4'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
