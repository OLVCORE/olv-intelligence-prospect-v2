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
    const { website, companyName } = await req.json()
    
    console.log('[ENRICH] Enriquecendo:', companyName, website)
    
    const enrichedData: any = {
      name: companyName,
      website,
      cnpj: null,
      employees: null,
      revenue: null,
      sector: null,
      state: null,
      city: null,
      linkedin_url: null,
      phone: null,
      email: null
    }
    
    // ESTRATÉGIA 1: Scraping da página inicial
    if (website) {
      try {
        const response = await fetch(website, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          signal: AbortSignal.timeout(10000)
        })
        
        if (response.ok) {
          const html = await response.text()
          
          // Extrair CNPJ
          const cnpjRegex = /\b\d{2}\.?\d{3}\.?\d{3}[\/\-]?\d{4}[\-]?\d{2}\b/g
          const cnpjMatch = html.match(cnpjRegex)
          if (cnpjMatch) {
            enrichedData.cnpj = cnpjMatch[0].replace(/\D/g, '')
            console.log('[ENRICH] CNPJ encontrado:', enrichedData.cnpj)
          }
          
          // Extrair LinkedIn
          const linkedinRegex = /linkedin\.com\/company\/([a-zA-Z0-9\-]+)/
          const linkedinMatch = html.match(linkedinRegex)
          if (linkedinMatch) {
            enrichedData.linkedin_url = `https://www.linkedin.com/company/${linkedinMatch[1]}`
            console.log('[ENRICH] LinkedIn encontrado:', enrichedData.linkedin_url)
          }
          
          // Extrair estado
          const stateRegex = /\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/g
          const stateMatch = html.match(stateRegex)
          if (stateMatch) {
            enrichedData.state = stateMatch[0].toUpperCase()
            console.log('[ENRICH] Estado encontrado:', enrichedData.state)
          }
          
          // Extrair telefone
          const phoneRegex = /\(?\d{2}\)?\s?\d{4,5}[\-\s]?\d{4}/g
          const phoneMatch = html.match(phoneRegex)
          if (phoneMatch) {
            enrichedData.phone = phoneMatch[0]
            console.log('[ENRICH] Telefone encontrado:', enrichedData.phone)
          }
          
          // Extrair email
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
          const emailMatch = html.match(emailRegex)
          if (emailMatch) {
            const validEmails = emailMatch.filter(e => 
              !e.includes('example.com') && 
              !e.includes('sentry.io') &&
              !e.includes('google.com')
            )
            if (validEmails.length > 0) {
              enrichedData.email = validEmails[0]
              console.log('[ENRICH] Email encontrado:', enrichedData.email)
            }
          }
        }
      } catch (error) {
        console.error('[ENRICH] Erro ao fazer scraping:', error)
      }
    }
    
    // ESTRATÉGIA 2: Se encontrou CNPJ, buscar na Receita Federal
    if (enrichedData.cnpj) {
      try {
        const receitaResponse = await fetch(
          `https://brasilapi.com.br/api/cnpj/v1/${enrichedData.cnpj}`,
          { signal: AbortSignal.timeout(8000) }
        )
        
        if (receitaResponse.ok) {
          const receitaData = await receitaResponse.json()
          
          enrichedData.razao_social = receitaData.razao_social
          enrichedData.nome_fantasia = receitaData.nome_fantasia
          enrichedData.cnae = receitaData.cnae_fiscal
          enrichedData.porte = receitaData.porte
          enrichedData.capital_social = receitaData.capital_social
          enrichedData.situacao = receitaData.descricao_situacao_cadastral
          enrichedData.state = receitaData.uf
          enrichedData.city = receitaData.municipio
          enrichedData.phone = receitaData.ddd_telefone_1
          
          console.log('[ENRICH] Dados da Receita Federal obtidos')
        }
      } catch (error) {
        console.error('[ENRICH] Erro Receita Federal:', error)
      }
    }
    
    // Calcular score de enriquecimento
    const fields = Object.values(enrichedData).filter(v => v !== null && v !== undefined)
    const enrichmentScore = Math.round((fields.length / 13) * 100)
    
    console.log('[ENRICH] Enriquecimento concluído:', enrichmentScore, '%')
    
    return new Response(
      JSON.stringify({ 
        success: true,
        data: enrichedData,
        enrichment_score: enrichmentScore,
        fields_found: fields.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error: any) {
    console.error('[ENRICH] Erro:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
