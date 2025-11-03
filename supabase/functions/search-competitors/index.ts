import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalização de nome (mesma função do detect-totvs-usage)
function normalizeName(raw: string): string {
  return raw
    .replace(/\b(LTDA|Ltda|ME|EPP|EIRELI|S\.?A\.?|SA|CIA|HOLDING|PARTICIPA(C|Ç)OES|GRUPO)\b\.?/gi, " ")
    .replace(/[^\w\s]/g, " ")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function tokenVariants(name: string): string[] {
  const tokens = normalizeName(name).split(" ").filter(w => w.length > 2);
  const variants: string[] = [];
  if (tokens.length >= 1) variants.push(tokens[0]);
  if (tokens.length >= 2) variants.push(tokens.slice(0, 2).join(" "));
  if (tokens.length >= 3) variants.push(tokens.slice(0, 3).join(" "));
  return variants;
}

function validateMention(text: string, companyName: string): boolean {
  const normalized = normalizeName(text);
  const variants = tokenVariants(companyName);
  return variants.some(v => normalized.includes(v));
}

// Lista de concorrentes ERP conhecidos (excluindo TOTVS)
const KNOWN_COMPETITORS = [
  // ERP Nacionais
  'Senior', 'Sankhya', 'Linx', 'Omie', 'Bling', 'Conta Azul', 'Tiny', 
  'vhsys', 'eGestor', 'Jiva', 'Procfy', 'Mastermaq', 'WebMais', 'Mysoft', 'Wolken',
  // ERP Internacionais
  'SAP', 'Oracle', 'Microsoft Dynamics', 'Infor', 'Epicor', 'IFS', 'Sage',
  'NetSuite', 'Acumatica', 'Syspro', 'Workday', 'Unit4',
  // CRM
  'Salesforce', 'Pipedrive', 'HubSpot', 'Zoho', 'RD Station',
  // Contabilidade
  'QuickBooks', 'Xero', 'Nibo', 'FreshBooks',
  // Gestão
  'Monday.com', 'Asana', 'Trello', 'Jira', 'Pipefy',
  // Específicos TOTVS
  'Protheus', 'RM', 'Datasul', 'Logix', 'Microsiga'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_name } = await req.json();
    const serperApiKey = Deno.env.get('SERPER_API_KEY');

    if (!serperApiKey) {
      throw new Error('SERPER_API_KEY não configurada');
    }

    if (!company_name) {
      throw new Error('company_name é obrigatório');
    }

    console.log('[🎯 STC Competitors] Iniciando busca para:', company_name);

    const variants = tokenVariants(company_name);
    console.log('[🎯 STC Competitors] Variantes:', variants.join(', '));

    const detectedCompetitors = new Map<string, any>();
    let totalQueries = 0;
    let totalResults = 0;

    // Para cada concorrente conhecido, buscar menções com a empresa
    for (const competitor of KNOWN_COMPETITORS) {
      try {
        // Queries STC: Empresa + Concorrente + Contexto
        const queries = [
          `"${variants[0]}" "${competitor}" (usa OR utiliza OR implementou OR migrou)`,
          `"${company_name}" "${competitor}" ERP sistema`,
          `"${variants[0]}" "cliente ${competitor}"`,
        ];

        for (const query of queries) {
          totalQueries++;
          
          const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': serperApiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              q: query,
              num: 5,
              gl: 'br',
              hl: 'pt-br'
            })
          });

          if (!response.ok) continue;

          const data = await response.json();
          const results = data.organic || [];
          totalResults += results.length;

          for (const result of results) {
            const fullText = `${result.title} ${result.snippet}`.toLowerCase();
            
            // VALIDAÇÃO STC: Empresa + Concorrente + Contexto
            const hasCompany = validateMention(fullText, company_name);
            const hasCompetitor = fullText.includes(competitor.toLowerCase());
            
            // Contextos que indicam uso/competição
            const contexts = [
              /usa|utiliza|implementou|migrou|adotou/i,
              /sistema|software|erp|plataforma/i,
              /cliente|contrato|parceiro/i,
            ];
            
            let matchCount = 0;
            if (hasCompany) matchCount++;
            if (hasCompetitor) matchCount++;
            for (const context of contexts) {
              if (context.test(fullText)) matchCount++;
            }

            // Double Match (2) ou Triple Match (3+)
            if (matchCount >= 2 && hasCompany && hasCompetitor) {
              const isTripleMatch = matchCount >= 3;
              const confidence = isTripleMatch ? 85 : 65;
              
              if (!detectedCompetitors.has(competitor)) {
                detectedCompetitors.set(competitor, {
                  name: competitor,
                  mentions: 0,
                  comparison_links: [],
                  portals: new Set(),
                  match_type: isTripleMatch ? 'triple_match' : 'double_match',
                  relevance_score: confidence,
                  avg_position: 0
                });
              }

              const comp = detectedCompetitors.get(competitor);
              comp.mentions++;
              comp.comparison_links.push({
                portal: new URL(result.link).hostname,
                title: result.title,
                url: result.link,
                snippet: result.snippet,
              });
              comp.portals.add(new URL(result.link).hostname);

              console.log(`[✅ ${isTripleMatch ? 'TRIPLE' : 'DOUBLE'} MATCH] ${competitor} - ${confidence}%`);
            }
          }
        }
      } catch (error) {
        console.error(`[❌ Error] ${competitor}:`, error);
      }
    }

    // Converter para array e ordenar por relevância
    const competitors = Array.from(detectedCompetitors.values()).map(comp => ({
      ...comp,
      portals: Array.from(comp.portals),
      avg_position: comp.comparison_links.length > 0 
        ? comp.comparison_links.reduce((sum: number, link: any) => sum + (link.position || 1), 0) / comp.comparison_links.length 
        : 0
    })).sort((a, b) => b.relevance_score - a.relevance_score);

    console.log(`[✅ STC Competitors] ${competitors.length} concorrentes encontrados`);
    console.log(`[📊 Stats] ${totalQueries} queries executadas, ${totalResults} resultados processados`);

    return new Response(
      JSON.stringify({
        success: true,
        competitors,
        total_comparisons_found: competitors.reduce((sum, c) => sum + c.mentions, 0),
        portals_searched: new Set(competitors.flatMap(c => c.portals)).size,
        total_portals: new Set(competitors.flatMap(c => c.portals)).size,
        search_date: new Date().toISOString(),
        product_searched: 'Concorrentes ERP (metodologia STC)'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[❌ STC Competitors] Erro:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
