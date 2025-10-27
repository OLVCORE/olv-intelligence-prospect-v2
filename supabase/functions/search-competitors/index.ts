import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🎯 TODOS OS 41 PORTAIS OBRIGATÓRIOS PARA BUSCA DE CONCORRENTES
const COMPARISON_PORTALS = [
  // Portais Principais de Comparação
  'g2.com',
  'capterra.com',
  'capterra.com.br',
  'b2bstack.com.br',
  'melhores.com.br',
  'portalerp.com.br',
  'indeed.com',
  'trustradius.com',
  'softwareadvice.com',
  'getapp.com',
  'crozdesk.com',
  
  // Análise Profunda
  'gartner.com',
  'forrester.com',
  'idc.com',
  'deloitte.com',
  'pwc.com.br',
  'mckinsey.com',
  
  // Portais Brasileiros
  'tiinside.com.br',
  'baguete.com.br',
  'tecnoblog.net',
  'olhardigital.com.br',
  'abes.org.br',
  'assespro.org.br',
  'sebrae.com.br',
  'abimaq.org.br',
  
  // Consultorias Especializadas
  'conti.com.br',
  'qive.com.br',
  'simplevisionit.com.br',
  'accenture.com',
  'ibm.com',
  
  // Dados e Análise
  'statista.com',
  'mordorintelligence.com',
  'grandviewresearch.com',
  'alliedmarketresearch.com',
  
  // Redes Sociais e Comunidades
  'linkedin.com',
  'reddit.com',
  'stackoverflow.com',
  'github.com',
  
  // Educacionais
  'udemy.com',
  'coursera.org',
  
  // Vídeos e Tutoriais
  'youtube.com',
  
  // E-commerce e Reviews
  'nuvemshop.com.br',
  'trustpilot.com',
  'glassdoor.com'
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

    console.log('[Search Competitors] 🎯 Iniciando busca obrigatória em TODOS os 41 portais');
    console.log('[Search Competitors] 📦 Produto TOTVS:', totvs_product);
    console.log('[Search Competitors] 🏢 Categoria:', productCategory);
    console.log('[Search Competitors] 🔍 Empresa:', company_name);
    console.log('[Search Competitors] 🌐 Total de portais:', COMPARISON_PORTALS.length);

    const allComparisons: any[] = [];
    const uniqueLinks = new Set<string>();

    // Buscar em cada portal de comparação
    const searchPromises = COMPARISON_PORTALS.map(async (portal) => {
      try {
        // Queries otimizadas para encontrar comparações reais
        const productName = totvs_product || productCategory || 'TOTVS';
        const queries = [
          `site:${portal} "${productName}" vs alternativas comparação`,
          `site:${portal} "${productName}" melhor que versus`,
          `site:${portal} concorrentes "${productName}" ERP`,
          `site:${portal} "${productName}" review comparativo ${keywords || ''}`
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
            
            // Lista expandida de concorrentes conhecidos ERP/Software
            const knownCompetitors = [
              // ERP Nacionais
              'Bling', 'Conta Azul', 'Omie', 'Tiny', 'vhsys', 'Senior', 'Sankhya', 'eGestor',
              'Jiva', 'Procfy', 'Mastermaq', 'WebMais', 'Mysoft', 'Wolken', 'Linx',
              // ERP Internacionais
              'SAP', 'Oracle', 'Microsoft Dynamics', 'Infor', 'Epicor', 'IFS', 'Sage',
              'NetSuite', 'Acumatica', 'Syspro', 'Workday', 'Unit4',
              // CRM e Marketing
              'RD Station', 'HubSpot', 'Zoho', 'Salesforce', 'Pipedrive', 'Pipefy',
              'Monday.com', 'Asana', 'Trello', 'Jira',
              // Contabilidade e Financeiro
              'ContaAzul', 'Nibo', 'Conta Simples', 'QuickBooks', 'Xero', 'FreshBooks',
              // Varejo e E-commerce
              'Loja Integrada', 'Tray', 'Vtex', 'Shopify', 'Magento', 'WooCommerce',
              // Indústria
              'Datasul', 'Protheus', 'RM', 'Logix'
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

    // Retornar top 20 concorrentes
    const topCompetitors = competitors.slice(0, 20);

    console.log('[Search Competitors] ✅ Busca concluída!');
    console.log('[Search Competitors] 📊 Portais pesquisados:', COMPARISON_PORTALS.length);
    console.log('[Search Competitors] 📝 Total de comparações:', allComparisons.length);
    console.log('[Search Competitors] 🏆 Top concorrentes encontrados:', topCompetitors.length);

    return new Response(
      JSON.stringify({
        success: true,
        competitors: topCompetitors,
        total_comparisons_found: allComparisons.length,
        portals_searched: COMPARISON_PORTALS.length,
        total_portals: COMPARISON_PORTALS.length,
        product_searched: totvs_product || productCategory,
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
