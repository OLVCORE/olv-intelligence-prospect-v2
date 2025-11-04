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
function extractCompanyNames(content: string): string[] {
  const companies: Set<string> = new Set();

  // Padrões para encontrar empresas
  const patterns = [
    /([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+){1,5})\s+(?:LTDA|S\.A\.|S\/A|SA|EPP|ME|EIRELI)/gi,
    /Cliente:\s*([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+){1,5})/gi,
    /Case\s+(?:Study|de\s+Sucesso):\s*([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+){1,5})/gi,
    /"([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+){1,4})"\s+é\s+(?:cliente|parceiro|usuário)/gi
  ];

  patterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 3) {
        companies.add(match[1].trim());
      }
    }
  });

  return Array.from(companies);
}

// Validar nome de empresa
function isValidCompanyName(name: string): boolean {
  if (name.length < 3) return false;
  if (/^\d+$/.test(name)) return false;
  if (!/[a-zA-ZÀ-ÿ]/.test(name)) return false;

  const invalidWords = [
    'página', 'site', 'web', 'internet', 'online', 'digital',
    'contato', 'telefone', 'email', 'endereço', 'localização',
    'nossos', 'nossa', 'empresa', 'clientes', 'serviços'
  ];

  const nameLower = name.toLowerCase();
  return !invalidWords.some(word => nameLower.includes(word));
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const body: ClientDiscoveryRequest = await req.json();
    const { companyId, companyName, domain } = body;

    console.log('[CLIENT-DISCOVERY] Descobrindo clientes de:', companyName);

    const discoveredClients: any[] = [];
    const jinaKey = Deno.env.get('VITE_JINA_API_KEY');
    const serperKey = Deno.env.get('VITE_SERPER_API_KEY');

    // ESTRATÉGIA 1: Scraping de páginas de clientes (Jina AI)
    if (domain && jinaKey) {
      console.log('[CLIENT-DISCOVERY] Estratégia 1: Scraping com Jina');
      
      const pagesToScrape = [
        `${domain}/clientes`,
        `${domain}/clientes-e-cases`,
        `${domain}/portfolio`,
        `${domain}/cases`,
        `${domain}/cases-de-sucesso`,
        `${domain}/parceiros`,
        `${domain}/nossos-clientes`
      ];

      for (const pageUrl of pagesToScrape) {
        try {
          console.log('[CLIENT-DISCOVERY] Scraping:', pageUrl);
          
          const jinaResponse = await fetch(`https://r.jina.ai/${pageUrl}`, {
            headers: {
              'Authorization': `Bearer ${jinaKey}`,
              'Accept': 'text/plain',
              'X-Return-Format': 'text'
            }
          });

          if (jinaResponse.ok) {
            const content = await jinaResponse.text();
            console.log('[CLIENT-DISCOVERY] Jina OK:', pageUrl, content.length, 'chars');

            // Extrair nomes de empresas
            const companies = extractCompanyNames(content);
            console.log('[CLIENT-DISCOVERY] Empresas encontradas:', companies.length);

            companies.forEach(companyName => {
              if (isValidCompanyName(companyName)) {
                discoveredClients.push({
                  name: companyName,
                  source: pageUrl,
                  discovery_method: 'jina_scraping',
                  discovered_at: new Date().toISOString()
                });
              }
            });
          } else {
            console.log('[CLIENT-DISCOVERY] Jina falhou:', pageUrl, jinaResponse.status);
          }
        } catch (error) {
          console.error('[CLIENT-DISCOVERY] Erro Jina:', pageUrl, error);
        }
      }
    }

    // ESTRATÉGIA 2: Press releases e notícias (Serper)
    if (serperKey) {
      console.log('[CLIENT-DISCOVERY] Estratégia 2: Press Releases via Serper');
      
      try {
        const serperResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            q: domain 
              ? `site:${domain} "cliente" OR "case study"` 
              : `"${companyName}" cliente case study`,
            num: 20,
            gl: 'br',
            hl: 'pt-br'
          })
        });

        if (serperResponse.ok) {
          const serperData = await serperResponse.json();
          console.log('[CLIENT-DISCOVERY] Serper OK:', serperData.organic?.length || 0, 'resultados');

          (serperData.organic || []).forEach((result: any) => {
            const text = `${result.title} ${result.snippet}`;
            const companies = extractCompanyNames(text);

            companies.forEach(companyName => {
              if (isValidCompanyName(companyName)) {
                discoveredClients.push({
                  name: companyName,
                  source: result.link,
                  discovery_method: 'serper_news',
                  snippet: result.snippet,
                  discovered_at: new Date().toISOString()
                });
              }
            });
          });
        } else {
          console.log('[CLIENT-DISCOVERY] Serper falhou:', serperResponse.status);
        }
      } catch (error) {
        console.error('[CLIENT-DISCOVERY] Erro Serper:', error);
      }
    }

    // ESTRATÉGIA 3: LinkedIn customers
    if (serperKey) {
      console.log('[CLIENT-DISCOVERY] Estratégia 3: LinkedIn via Serper');
      
      try {
        const linkedinResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            q: `site:linkedin.com/company "${companyName}/customers" OR "${companyName} clientes"`,
            num: 10,
            gl: 'br',
            hl: 'pt-br'
          })
        });

        if (linkedinResponse.ok) {
          const linkedinData = await linkedinResponse.json();
          console.log('[CLIENT-DISCOVERY] LinkedIn OK:', linkedinData.organic?.length || 0, 'resultados');

          (linkedinData.organic || []).forEach((result: any) => {
            const text = `${result.title} ${result.snippet}`;
            const companies = extractCompanyNames(text);

            companies.forEach(companyName => {
              if (isValidCompanyName(companyName)) {
                discoveredClients.push({
                  name: companyName,
                  source: result.link,
                  discovery_method: 'linkedin',
                  snippet: result.snippet,
                  discovered_at: new Date().toISOString()
                });
              }
            });
          });
        }
      } catch (error) {
        console.error('[CLIENT-DISCOVERY] Erro LinkedIn:', error);
      }
    }

    // Deduplicate por nome
    const uniqueClients = new Map<string, any>();
    discoveredClients.forEach(client => {
      const key = client.name.toLowerCase().trim();
      if (!uniqueClients.has(key)) {
        uniqueClients.set(key, client);
      }
    });

    const finalClients = Array.from(uniqueClients.values());

    console.log('[CLIENT-DISCOVERY] Total descoberto:', finalClients.length, 'clientes únicos');

    // Salvar no banco (tabela similar_companies ou nova tabela discovered_clients)
    if (finalClients.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('discovered_clients')
        .insert(
          finalClients.map(client => ({
            company_id: companyId,
            discovered_company_name: client.name,
            source: client.source,
            discovery_method: client.discovery_method,
            snippet: client.snippet,
            discovered_at: client.discovered_at
          }))
        );

      if (insertError) {
        console.error('[CLIENT-DISCOVERY] Erro ao salvar:', insertError);
        // Não falhar, apenas logar
      }
    }

    // Calcular expansão exponencial (3.5x)
    const potentialIndirectClients = Math.floor(finalClients.length * 3.5);

    return new Response(
      JSON.stringify({
        success: true,
        discovered_clients: finalClients,
        statistics: {
          total_discovered: finalClients.length,
          unique_companies: uniqueClients.size,
          potential_indirect: potentialIndirectClients,
          by_method: {
            jina_scraping: finalClients.filter(c => c.discovery_method === 'jina_scraping').length,
            serper_news: finalClients.filter(c => c.discovery_method === 'serper_news').length,
            linkedin: finalClients.filter(c => c.discovery_method === 'linkedin').length
          }
        },
        message: `${finalClients.length} clientes descobertos`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

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

