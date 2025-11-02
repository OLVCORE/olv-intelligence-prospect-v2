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
    const { website, apiKey, provider = 'similarweb' } = await req.json()
    
    console.log('[SEO-COMPETITORS] Analisando:', website, 'Provider:', provider)
    
    let competitors: any[] = []
    const domain = website.replace(/^https?:\/\//, '').split('/')[0]

    // OPÇÃO 1: SimilarWeb API
    if (provider === 'similarweb' && apiKey) {
      try {
        const response = await fetch(
          `https://api.similarweb.com/v1/website/${domain}/similar-sites?api_key=${apiKey}`,
          { headers: { 'Content-Type': 'application/json' } }
        )
        
        if (response.ok) {
          const data = await response.json()
          competitors = data.similar_sites?.map((site: any) => ({
            domain: site.site,
            affinity: site.rank,
            score: Math.round((1 / site.rank) * 100)
          })) || []
          
          console.log('[SEO-COMPETITORS] SimilarWeb encontrou:', competitors.length)
        }
      } catch (error) {
        console.error('[SEO-COMPETITORS] Erro SimilarWeb:', error)
      }
    }
    
    // OPÇÃO 2: SEMrush API
    else if (provider === 'semrush' && apiKey) {
      try {
        const response = await fetch(
          `https://api.semrush.com/?type=domain_organic_organic&key=${apiKey}&display_limit=20&export_columns=Dn,Np,Or&domain=${domain}&database=br`
        )
        
        if (response.ok) {
          const text = await response.text()
          const lines = text.split('\n').slice(1)
          
          competitors = lines
            .filter(line => line.trim())
            .map(line => {
              const [domain, keywords, traffic] = line.split(';')
              return {
                domain: domain?.trim(),
                keywords: parseInt(keywords) || 0,
                traffic: parseInt(traffic) || 0,
                score: Math.min(95, Math.round((parseInt(keywords) || 0) / 10))
              }
            })
            .filter(c => c.domain && c.domain !== domain)
          
          console.log('[SEO-COMPETITORS] SEMrush encontrou:', competitors.length)
        }
      } catch (error) {
        console.error('[SEO-COMPETITORS] Erro SEMrush:', error)
      }
    }
    
    // OPÇÃO 3: Scraping alternativo
    else {
      console.log('[SEO-COMPETITORS] Modo fallback (sem API key)')
      competitors = []
    }

    return new Response(
      JSON.stringify({
        success: true,
        competitors,
        total: competitors.length,
        provider,
        domain
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error: any) {
    console.error('[SEO-COMPETITORS] Erro:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
