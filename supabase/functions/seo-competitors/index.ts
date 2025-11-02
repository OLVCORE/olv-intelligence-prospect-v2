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
    const { website, companyName, sector } = await req.json()
    
    console.log('[SEO-DISCOVER] 🔍 Descobrindo concorrentes GRATUITO:', companyName, website)
    
    const competitors: any[] = []
    const domain = website.replace(/^https?:\/\//, '').split('/')[0]

    // ==================== ESTRATÉGIA 1: SCRAPING DO WEBSITE ====================
    // Descobrir links de parceiros, fornecedores, associações
    if (website) {
      try {
        console.log('[SEO-DISCOVER] Fazendo scraping de:', website)
        
        const response = await fetch(website, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          signal: AbortSignal.timeout(10000)
        })
        
        if (response.ok) {
          const html = await response.text()
          
          // Extrair todos os domínios .com.br mencionados
          const domainRegex = /https?:\/\/([a-zA-Z0-9\-]+\.com\.br)/gi
          const matches = html.matchAll(domainRegex)
          const domains = new Set<string>()
          
          for (const match of matches) {
            const foundDomain = match[1].toLowerCase()
            // Filtrar domínios comuns (Google, Facebook, etc.)
            if (!foundDomain.includes('google') && 
                !foundDomain.includes('facebook') && 
                !foundDomain.includes('youtube') &&
                !foundDomain.includes('instagram') &&
                !foundDomain.includes('twitter') &&
                foundDomain !== domain.toLowerCase()) {
              domains.add(foundDomain)
            }
          }
          
          console.log('[SEO-DISCOVER] Domínios encontrados no website:', domains.size)
          
          for (const foundDomain of Array.from(domains).slice(0, 10)) {
            competitors.push({
              website: `https://${foundDomain}`,
              name: foundDomain.split('.')[0].toUpperCase(),
              source: 'website_links',
              confidence: 70,
              discovery_method: 'website_scraping'
            })
          }
        }
      } catch (error) {
        console.error('[SEO-DISCOVER] Erro ao scraping:', error)
      }
    }
    
    // ==================== ESTRATÉGIA 2: BUSCAR NO GOOGLE ====================
    // Retornar queries para busca (serão executadas pela função web-search)
    const searchQueries = [
      `concorrentes ${companyName}`,
      `empresas similares ${companyName}`,
      `competitors ${companyName} Brasil`,
      sector ? `${sector} empresas Brasil` : null,
      sector ? `maiores empresas ${sector} Brasil` : null,
      sector ? `ranking ${sector} Brasil` : null,
      `site:linkedin.com/company ${sector || companyName} Brasil`,
      `${companyName} vs concorrentes`,
    ].filter(Boolean)
    
    console.log('[SEO-DISCOVER] Queries sugeridas:', searchQueries.length)
    
    // ==================== ESTRATÉGIA 3: DESCOBRIR ASSOCIAÇÕES ====================
    const associationQueries = sector ? [
      `associação ${sector} Brasil empresas`,
      `sindicato ${sector} Brasil filiados`,
      `federação ${sector} Brasil`,
    ] : []

    return new Response(
      JSON.stringify({
        success: true,
        competitors,
        total: competitors.length,
        suggested_queries: searchQueries,
        association_queries: associationQueries,
        method: 'free_discovery',
        domain
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error: any) {
    console.error('[SEO-DISCOVER] Erro:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
