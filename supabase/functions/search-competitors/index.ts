import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Portais de comparação obrigatórios para busca
const COMPARISON_PORTALS = [
  'g2.com',
  'capterra.com',
  'capterra.com.br',
  'b2bstack.com.br',
  'melhores.com.br',
  'gartner.com',
  'forrester.com',
  'trustradius.com',
  'softwareadvice.com',
  'getapp.com',
  'crozdesk.com',
  'indeed.com',
  'linkedin.com',
  'tecnoblog.net',
  'olhardigital.com.br',
  'tiinside.com.br',
  'baguete.com.br',
  'portalerp.com.br'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_name, sector, productCategory, keywords, totvs_product } = await req.json();
    const serperApiKey = Deno.env.get('SERPER_API_KEY');

    if (!serperApiKey) {
      throw new Error('SERPER_API_KEY não configurada');
    }

    console.log('[Search Competitors] Iniciando busca em portais de comparação:', { 
      company_name, 
      sector, 
      productCategory,
      totvs_product 
    });

    const allComparisons: any[] = [];
    const uniqueLinks = new Set<string>();

    // Buscar em cada portal de comparação
    const searchPromises = COMPARISON_PORTALS.map(async (portal) => {
      try {
        // Query específica para cada tipo de busca
        const queries = [
          `site:${portal} TOTVS vs ${sector || 'ERP'}`,
          `site:${portal} ${totvs_product || 'TOTVS Protheus'} alternativas`,
          `site:${portal} ${totvs_product || 'TOTVS'} comparação concorrentes`,
          `site:${portal} ERP PME Brasil ${keywords || ''}`
        ];

        for (const query of queries) {
          const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': serperApiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              q: query,
              num: 10,
              gl: 'br',
              hl: 'pt-br'
            })
          });

          if (!response.ok) continue;

          const data = await response.json();
          
          for (const result of data.organic || []) {
            // Evitar duplicatas de links
            if (uniqueLinks.has(result.link)) continue;
            uniqueLinks.add(result.link);

            // Extrair nomes de concorrentes mencionados
            const text = `${result.title} ${result.snippet}`.toLowerCase();
            const competitorNames: string[] = [];
            
            // Lista de concorrentes conhecidos para detectar
            const knownCompetitors = [
              'Bling', 'Conta Azul', 'Omie', 'Tiny', 'vhsys',
              'Senior', 'Sankhya', 'eGestor', 'SAP', 'Oracle',
              'Jiva', 'Procfy', 'Mastermaq', 'WebMais', 'Mysoft',
              'Wolken', 'RD Station', 'HubSpot', 'Zoho', 'Salesforce'
            ];

            for (const competitor of knownCompetitors) {
              if (text.includes(competitor.toLowerCase())) {
                competitorNames.push(competitor);
              }
            }

            if (competitorNames.length > 0) {
              allComparisons.push({
                portal: portal,
                title: result.title,
                snippet: result.snippet,
                url: result.link,
                competitors_mentioned: competitorNames,
                search_position: result.position,
                relevance_score: 100 - (result.position * 5) // Score baseado na posição
              });
            }
          }
        }
      } catch (error) {
        console.error(`[Search Competitors] Erro ao buscar em ${portal}:`, error);
      }
    });

    // Executar todas as buscas em paralelo
    await Promise.all(searchPromises);

    console.log('[Search Competitors] Total de comparações encontradas:', allComparisons.length);

    // Ordenar por relevância
    allComparisons.sort((a, b) => b.relevance_score - a.relevance_score);

    // Agrupar por concorrente
    const competitorMap = new Map<string, any>();
    
    for (const comparison of allComparisons) {
      for (const competitor of comparison.competitors_mentioned) {
        if (!competitorMap.has(competitor)) {
          competitorMap.set(competitor, {
            name: competitor,
            mentions: 0,
            comparison_links: [],
            portals: new Set(),
            avg_position: 0,
            relevance_score: 0
          });
        }

        const comp = competitorMap.get(competitor);
        comp.mentions++;
        comp.comparison_links.push({
          portal: comparison.portal,
          title: comparison.title,
          url: comparison.url,
          snippet: comparison.snippet
        });
        comp.portals.add(comparison.portal);
        comp.avg_position += comparison.search_position;
        comp.relevance_score += comparison.relevance_score;
      }
    }

    // Converter para array e calcular médias
    const competitors = Array.from(competitorMap.values()).map(comp => ({
      ...comp,
      portals: Array.from(comp.portals),
      avg_position: comp.avg_position / comp.mentions,
      relevance_score: Math.round(comp.relevance_score / comp.mentions)
    }));

    // Ordenar por número de menções e relevância
    competitors.sort((a, b) => {
      if (b.mentions !== a.mentions) return b.mentions - a.mentions;
      return b.relevance_score - a.relevance_score;
    });

    // Retornar top 15
    const topCompetitors = competitors.slice(0, 15);

    console.log('[Search Competitors] Top concorrentes:', topCompetitors.length);

    return new Response(
      JSON.stringify({
        success: true,
        competitors: topCompetitors,
        total_comparisons_found: allComparisons.length,
        portals_searched: COMPARISON_PORTALS.length,
        search_date: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('[Search Competitors] Erro:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
