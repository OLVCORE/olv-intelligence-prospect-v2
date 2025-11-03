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
    const { companyData } = await req.json()
    
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiKey) {
      throw new Error('OpenAI API Key não configurada nas Edge Functions secrets')
    }

    // Construct analysis prompt
    const prompt = `Analise a adequação desta empresa brasileira para soluções TOTVS ERP:

Empresa: ${companyData.company_name}
Nome Fantasia: ${companyData.fantasy_name || 'N/A'}
CNPJ: ${companyData.cnpj}
Atividade Principal: ${companyData.main_activity}
Porte: ${companyData.company_size}
Funcionários: ${companyData.employee_count || 'N/A'}
Receita Anual: R$ ${companyData.annual_revenue ? companyData.annual_revenue.toLocaleString('pt-BR') : 'N/A'}
Localização: ${companyData.city}, ${companyData.state}

Forneça uma análise estruturada em JSON com:
{
  "fit_score": 0-100,
  "recommended_products": ["produto1", "produto2", "produto3"],
  "pain_points": ["dor1", "dor2", "dor3"],
  "engagement_strategy": "estratégia detalhada de abordagem",
  "priority_level": "Alta/Média/Baixa",
  "estimated_deal_size": "valor estimado do negócio em R$"
}

Considere o perfil da empresa, setor de atuação e porte para a recomendação.`

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'Você é um especialista em análise de fit para soluções TOTVS ERP. Responda sempre em JSON válido.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    const result = await response.json()
    const analysisText = result.choices[0].message.content
    
    // Parse JSON response
    let analysis
    try {
      analysis = JSON.parse(analysisText)
    } catch (parseError) {
      // If not valid JSON, create structured response
      analysis = {
        fit_score: 50,
        recommended_products: ['TOTVS Protheus'],
        pain_points: ['Análise manual necessária'],
        engagement_strategy: analysisText,
        priority_level: 'Média',
        estimated_deal_size: 'A definir'
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        company_id: companyData.id,
        analyzed_at: new Date().toISOString()
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
