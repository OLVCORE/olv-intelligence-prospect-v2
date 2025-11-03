import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ====== FUNÇÕES DE NORMALIZAÇÃO (idênticas ao detect-totvs-usage) ======
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
  return [...new Set(variants)];
}

// ====== VALIDAÇÃO STC RIGOROSA ======
function validateSTCMatch(
  text: string, 
  companyName: string, 
  competitorName: string
): { isValid: boolean; matchType: 'triple' | 'double' | 'none'; confidence: number } {
  
  const normalized = normalizeName(text);
  const companyVariants = tokenVariants(companyName);
  const competitorNorm = competitorName.toLowerCase();
  
  // 1. OBRIGATÓRIO: Empresa mencionada
  const hasCompany = companyVariants.some(v => normalized.includes(v));
  if (!hasCompany) {
    return { isValid: false, matchType: 'none', confidence: 0 };
  }
  
  // 2. OBRIGATÓRIO: Concorrente mencionado
  const hasCompetitor = normalized.includes(competitorNorm);
  if (!hasCompetitor) {
    return { isValid: false, matchType: 'none', confidence: 0 };
  }
  
  // 3. CONTEXTO: Palavras que indicam USO/COMPETIÇÃO (MUITO RIGOROSO)
  const strongContexts = [
    /\b(usa|utiliza|implementou|migrou|adotou|contratou|cliente)\b/i,
    /\b(sistema|software|plataforma|solução)\s+(ERP|de\s+gestão)/i,
    /\b(substituir|trocar|migração|implementação)\b/i,
  ];
  
  const mediumContexts = [
    /\b(integração|módulo|licença|contrato)\b/i,
    /\b(erp|gestão\s+empresarial|sistema\s+integrado)\b/i,
  ];
  
  let strongMatches = 0;
  let mediumMatches = 0;
  
  for (const pattern of strongContexts) {
    if (pattern.test(text)) strongMatches++;
  }
  
  for (const pattern of mediumContexts) {
    if (pattern.test(text)) mediumMatches++;
  }
  
  // TRIPLE MATCH: Empresa + Concorrente + 2+ contextos fortes OU 1 forte + 2 médios
  if (strongMatches >= 2 || (strongMatches >= 1 && mediumMatches >= 2)) {
    return { isValid: true, matchType: 'triple', confidence: 90 };
  }
  
  // DOUBLE MATCH: Empresa + Concorrente + 1 contexto forte OU 2 médios
  if (strongMatches >= 1 || mediumMatches >= 2) {
    return { isValid: true, matchType: 'double', confidence: 70 };
  }
  
  // Sem contexto suficiente = REJEITAR
  return { isValid: false, matchType: 'none', confidence: 0 };
}

// Lista de concorrentes ERP (EXCLUINDO produtos TOTVS)
const KNOWN_COMPETITORS = [
  // ERP Nacionais
  'Senior', 'Sankhya', 'Linx', 'Omie', 'Bling', 'Conta Azul', 'Tiny', 
  'vhsys', 'eGestor', 'Jiva', 'Procfy', 'Mastermaq', 'WebMais', 
  // ERP Internacionais
  'SAP', 'Oracle', 'Microsoft Dynamics', 'Infor', 'Epicor', 'IFS', 'Sage',
  'NetSuite', 'Acumatica', 'Syspro', 'Workday', 'Unit4',
  // CRM que competem
  'Salesforce', 'Pipedrive', 'HubSpot', 'Zoho', 
  // Contabilidade
  'QuickBooks', 'Xero', 'Nibo',
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

    console.log('[🎯 STC Competitors] Empresa:', company_name);

    const variants = tokenVariants(company_name);
    console.log('[🎯 STC] Variantes:', variants);

    const detectedCompetitors = new Map<string, any>();
    let totalQueries = 0;
    let totalValidated = 0;
    let totalRejected = 0;

    // Para cada concorrente, buscar APENAS evidências diretas de uso
    for (const competitor of KNOWN_COMPETITORS) {
      try {
        // Queries MUITO específicas: Empresa + Concorrente + Contexto de USO
        const queries = [
          `"${variants[0]}" "${competitor}" (usa OR utiliza OR cliente OR implementou)`,
          `"${company_name}" "cliente ${competitor}"`,
          `"${variants[0]}" "migrou para ${competitor}"`,
        ];

        for (const query of queries.slice(0, 2)) { // Máximo 2 queries por concorrente
          totalQueries++;
          
          const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': serperApiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              q: query,
              num: 3, // REDUZIDO: apenas 3 resultados por query
              gl: 'br',
              hl: 'pt-br'
            })
          });

          if (!response.ok) continue;

          const data = await response.json();
          const results = data.organic || [];

          for (const result of results) {
            const fullText = `${result.title} ${result.snippet}`;
            
            // ====== VALIDAÇÃO STC RIGOROSA ======
            const validation = validateSTCMatch(fullText, company_name, competitor);
            
            if (!validation.isValid) {
              totalRejected++;
              console.log(`[❌ REJEITADO] ${competitor} - Sem contexto suficiente`);
              continue;
            }
            
            totalValidated++;
            
            // Adicionar ou atualizar concorrente
            if (!detectedCompetitors.has(competitor)) {
              detectedCompetitors.set(competitor, {
                name: competitor,
                mentions: 0,
                comparison_links: [],
                portals: new Set(),
                match_type: validation.matchType,
                relevance_score: validation.confidence,
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
              match_type: validation.matchType,
              confidence: validation.confidence
            });
            comp.portals.add(new URL(result.link).hostname);
            
            // Atualizar score baseado no melhor match
            comp.relevance_score = Math.max(comp.relevance_score, validation.confidence);

            console.log(`[✅ ${validation.matchType.toUpperCase()} MATCH] ${competitor} - ${validation.confidence}% - ${result.title.substring(0, 60)}...`);
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(`[❌ Error] ${competitor}:`, error);
      }
    }

    // Converter para array e ordenar
    const competitors = Array.from(detectedCompetitors.values())
      .map(comp => ({
        ...comp,
        portals: Array.from(comp.portals),
        avg_position: comp.comparison_links.length > 0 
          ? comp.comparison_links.reduce((sum: number, _: any, idx: number) => sum + idx + 1, 0) / comp.comparison_links.length 
          : 0
      }))
      .sort((a, b) => {
        // Priorizar triple matches e scores altos
        if (a.match_type === 'triple' && b.match_type !== 'triple') return -1;
        if (b.match_type === 'triple' && a.match_type !== 'triple') return 1;
        return b.relevance_score - a.relevance_score;
      });

    console.log(`[✅ STC Competitors FINAL] ${competitors.length} concorrentes validados`);
    console.log(`[📊 Stats] ${totalQueries} queries | ${totalValidated} validados | ${totalRejected} rejeitados`);

    // ====== FILTRO FINAL: APENAS ALTA CONFIANÇA ======
    const highConfidenceCompetitors = competitors.filter(c => 
      c.relevance_score >= 70 && c.mentions >= 1
    );

    return new Response(
      JSON.stringify({
        success: true,
        competitors: highConfidenceCompetitors,
        total_comparisons_found: highConfidenceCompetitors.reduce((sum, c) => sum + c.mentions, 0),
        portals_searched: new Set(highConfidenceCompetitors.flatMap(c => c.portals)).size,
        total_portals: new Set(highConfidenceCompetitors.flatMap(c => c.portals)).size,
        search_date: new Date().toISOString(),
        product_searched: 'Concorrentes ERP (metodologia STC rigorosa)',
        stats: {
          total_queries: totalQueries,
          validated: totalValidated,
          rejected: totalRejected,
          final_count: highConfidenceCompetitors.length
        }
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
