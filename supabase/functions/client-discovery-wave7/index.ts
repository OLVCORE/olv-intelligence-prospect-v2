import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClientDiscoveryRequest {
  companyId: string;
  companyName: string;
  domain?: string;
}

// Extrair nomes de empresas de texto
function extractCompanyNames(text: string): string[] {
  const companies = new Set<string>();

  // Padrões de empresas brasileiras
  const patterns = [
    /([A-ZÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÇ][a-zàáâãäåèéêëìíîïòóôõöùúûüç\s]+(?:Ltda|S\.A\.|EIRELI|ME|EPP)\.?)/g,
    /(?:Cliente|Case|Parceiro):\s*([A-ZÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÇ][a-zàáâãäåèéêëìíîïòóôõöùúûüç\s]+)/g,
  ];

  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const company = match[1]?.trim();
      if (company && company.length > 3 && company.length < 100) {
        companies.add(company);
      }
    }
  });

  return Array.from(companies);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body: ClientDiscoveryRequest = await req.json();
    const { companyName, domain } = body;

    console.log('[CLIENT-DISCOVERY] Descobrindo clientes de:', companyName);

    const discoveredClients: string[] = [];
    const jinaKey = Deno.env.get('VITE_JINA_API_KEY');
    const serperKey = Deno.env.get('VITE_SERPER_API_KEY');

    // ESTRATÉGIA 1: Scraping de páginas de clientes (Jina AI)
    if (domain && jinaKey) {
      console.log('[CLIENT-DISCOVERY] Etapa 1: Scraping com Jina');
      
      const clientPages = [
        '/clientes',
        '/clientes-e-cases',
        '/cases',
        '/portfolio',
        '/parceiros',
        '/cases-de-sucesso'
      ];

      for (const page of clientPages) {
        try {
          const url = `https://${domain}${page}`;
          const jinaResponse = await fetch(`https://r.jina.ai/${url}`, {
            headers: {
              'Authorization': `Bearer ${jinaKey}`,
              'Accept': 'text/plain'
            }
          });

          if (jinaResponse.ok) {
            const content = await jinaResponse.text();
            const companies = extractCompanyNames(content);
            discoveredClients.push(...companies);
            console.log('[CLIENT-DISCOVERY] Jina encontrou:', companies.length, 'empresas em', page);
          }
        } catch (error) {
          console.log('[CLIENT-DISCOVERY] Erro Jina:', error);
        }
      }
    }

    // ESTRATÉGIA 2: Press releases e notícias (Serper)
    if (serperKey) {
      console.log('[CLIENT-DISCOVERY] Etapa 2: Press releases (Serper)');
      
      try {
        const serperResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            q: `"${companyName}" "cliente" OR "case study" OR "parceiro"`,
            num: 20
          })
        });

        if (serperResponse.ok) {
          const serperData = await serperResponse.json();
          const results = serperData.organic || [];
          
          results.forEach((result: any) => {
            const text = `${result.title} ${result.snippet}`;
            const companies = extractCompanyNames(text);
            discoveredClients.push(...companies);
          });

          console.log('[CLIENT-DISCOVERY] Serper encontrou empresas em', results.length, 'resultados');
        }
      } catch (error) {
        console.log('[CLIENT-DISCOVERY] Erro Serper:', error);
      }
    }

    // ESTRATÉGIA 3: LinkedIn customers (Serper)
    if (serperKey) {
      console.log('[CLIENT-DISCOVERY] Etapa 3: LinkedIn customers');
      
      try {
        const linkedinResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            q: `site:linkedin.com/company "${companyName}/customers"`,
            num: 10
          })
        });

        if (linkedinResponse.ok) {
          const linkedinData = await linkedinResponse.json();
          const results = linkedinData.organic || [];
          
          results.forEach((result: any) => {
            const text = `${result.title} ${result.snippet}`;
            const companies = extractCompanyNames(text);
            discoveredClients.push(...companies);
          });

          console.log('[CLIENT-DISCOVERY] LinkedIn encontrou empresas');
        }
      } catch (error) {
        console.log('[CLIENT-DISCOVERY] Erro LinkedIn:', error);
      }
    }

    // Deduplicate
    const uniqueClients = Array.from(new Set(discoveredClients));
    console.log('[CLIENT-DISCOVERY] Total único:', uniqueClients.length, 'clientes');

    // ETAPA 4: Filtrar clientes TOTVS (verificar cada um)
    console.log('[CLIENT-DISCOVERY] Etapa 4: Filtrando clientes TOTVS');
    
    const qualifiedClients = [];
    
    for (const clientName of uniqueClients.slice(0, 20)) { // Limitar a 20 para performance
      try {
        // Verificar se é cliente TOTVS
        const { data: stcCheck } = await supabaseClient.functions.invoke(
          'simple-totvs-check',
          {
            body: {
              companyName: clientName,
              domain: null
            }
          }
        );

        const isTotvsClient = stcCheck?.status === 'no-go' || stcCheck?.confidence >= 70;

        if (!isTotvsClient) {
          qualifiedClients.push({
            name: clientName,
            source: 'client_discovery_wave7',
            discovery_method: 'website_scraping',
            is_totvs_client: false,
            stc_confidence: stcCheck?.confidence || 0,
            relationship: 'Cliente do cliente',
            discovered_at: new Date().toISOString()
          });
        } else {
          console.log('[CLIENT-DISCOVERY] Descartado (TOTVS):', clientName);
        }
      } catch (error) {
        console.log('[CLIENT-DISCOVERY] Erro ao verificar:', clientName, error);
      }
    }

    console.log('[CLIENT-DISCOVERY] Clientes qualificados:', qualifiedClients.length);

    // ETAPA 5: Enriquecer dados básicos (CNPJ via busca)
    console.log('[CLIENT-DISCOVERY] Etapa 5: Enriquecendo dados');
    
    for (const client of qualifiedClients) {
      try {
        // Buscar CNPJ via Serper
        if (serperKey) {
          const cnpjSearch = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': serperKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              q: `"${client.name}" CNPJ`,
              num: 3
            })
          });

          if (cnpjSearch.ok) {
            const cnpjData = await cnpjSearch.json();
            const snippet = cnpjData.organic?.[0]?.snippet || '';
            const cnpjMatch = snippet.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
            
            if (cnpjMatch) {
              client.cnpj = cnpjMatch[0];
            }
          }
        }
      } catch (error) {
        console.log('[CLIENT-DISCOVERY] Erro ao enriquecer:', client.name);
      }
    }

    // ETAPA 6: Calcular expansão exponencial (estimativa)
    const expansionFactor = 3.5;
    const potentialLevel2 = Math.floor(qualifiedClients.length * expansionFactor);

    const response = {
      success: true,
      discovered_clients: qualifiedClients,
      statistics: {
        total_discovered: uniqueClients.length,
        qualified_leads: qualifiedClients.length,
        totvs_clients_filtered: uniqueClients.length - qualifiedClients.length,
        potential_level_2: potentialLevel2
      },
      insights: [
        `Descobertos ${uniqueClients.length} clientes através de múltiplas fontes`,
        `${qualifiedClients.length} clientes qualificados (não-TOTVS)`,
        `${uniqueClients.length - qualifiedClients.length} clientes TOTVS descartados`,
        `Expansão Nível 2 estimada: ~${potentialLevel2} empresas (fator 3.5x)`
      ],
      expansion_strategy: {
        level_1: qualifiedClients.length,
        level_2_potential: potentialLevel2,
        expansion_factor: expansionFactor,
        methodology: 'Descoberta dos clientes dos clientes atuais'
      },
      generated_at: new Date().toISOString()
    };

    console.log('[CLIENT-DISCOVERY] Sucesso! Retornando', qualifiedClients.length, 'clientes');

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('[CLIENT-DISCOVERY] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao descobrir clientes'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
