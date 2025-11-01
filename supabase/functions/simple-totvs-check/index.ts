import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Evidence {
  source: string;
  category: 'vagas' | 'noticias' | 'docs_oficiais';
  title: string;
  url: string;
  snippet: string;
  timestamp: string;
  totvs_products: string[];
  match_type?: 'triple' | 'double';
  weight?: number;
}

interface CheckResult {
  status: 'go' | 'no-go' | 'revisar';
  detected_totvs: boolean;
  confidence: 'high' | 'medium' | 'low';
  total_evidences: number;
  evidences_by_category: {
    vagas: Evidence[];
    noticias: Evidence[];
    docs_oficiais: Evidence[];
  };
  reasoning: string;
  checked_at: string;
}

// Sistema de Pesos por Fonte
const SOURCE_WEIGHTS = {
  apollo_tech_stack: 100,
  cvm_ri_docs: 90,
  judicial: 85,
  premium_news: 80,
  linkedin_jobs: 70,
  google_news: 60,
  google_search: 40
};

// Produtos TOTVS seguros (não ambíguos)
const TOTVS_SAFE_PRODUCTS = [
  'TOTVS', 'Microsiga', 'Protheus', 'Datasul', 'Fluig', 'Winthor', 
  'Logix', 'Backoffice', 'Carol', 'Carol AI', 'Techfin', 'TOTVS Pay',
  'TOTVS CRM', 'TOTVS RH', 'TOTVS BI', 'TOTVS Cloud', 'TOTVS Atende'
];

// Produtos ambíguos (precisam de contexto TOTVS)
const TOTVS_AMBIGUOUS_PRODUCTS = [
  'RM', 'SFA', 'BPM', 'ECM', 'Workflow'
];

const TOTVS_BRAND_TERMS = ['TOTVS', 'Microsiga'];

// ============= FUNÇÕES UTILITÁRIAS =============

function normalizeCompany(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\b(s\.?a\.?|ltda|eireli|me|sa|epp|empresa|grupo)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isPersonalProfile(text: string): boolean {
  const t = (text || '').toLowerCase();
  const personalIndicators = [
    'analista', 'desenvolvedor', 'gerente', 'coordenador', 'diretor', 
    'consultor', 'especialista', 'engenheiro', 'arquiteto', 'programador',
    'supervisor', 'assistente', 'técnico', 'líder', 'estagiário',
    'experiência anterior', 'trabalhou na', 'ex-funcionário', 'atuou em'
  ];
  return personalIndicators.some(term => t.includes(term));
}

// Validação rigorosa de vaga LinkedIn (apenas vagas ATUAIS da empresa)
function isValidLinkedInJobPosting(snippet: string, companyName: string): boolean {
  const text = snippet.toLowerCase();
  
  // Rejeitar históricos profissionais
  const rejectedTerms = [
    'experiência anterior', 'trabalhou na', 'ex-funcionário', 'atuou em',
    'passou pela', 'ex-', 'anterior', 'trabalhou como'
  ];
  
  if (rejectedTerms.some(term => text.includes(term))) {
    return false;
  }
  
  // Deve mencionar empresa, TOTVS e produto no mesmo trecho (100 chars)
  const companyNorm = normalizeCompany(companyName);
  const hasCompany = text.includes(companyNorm);
  const hasTotvs = TOTVS_BRAND_TERMS.some(t => text.includes(t.toLowerCase()));
  const hasProduct = [...TOTVS_SAFE_PRODUCTS, ...TOTVS_AMBIGUOUS_PRODUCTS]
    .some(p => text.includes(p.toLowerCase()));
  
  return hasCompany && hasTotvs && hasProduct;
}

// Triple Match: Empresa + TOTVS + Produto (mesmos 80 caracteres)
function tripleMatch(text: string, companyName: string): { matched: boolean; detectedProducts: string[] } {
  const t = text.toLowerCase();
  const companyNorm = normalizeCompany(companyName);
  
  // Dividir em chunks de 80 caracteres
  const chunks: string[] = [];
  for (let i = 0; i < t.length; i += 40) {
    chunks.push(t.substring(i, i + 80));
  }
  
  const detectedProducts: string[] = [];
  
  for (const chunk of chunks) {
    const hasCompany = chunk.includes(companyNorm) || 
      companyNorm.split(' ').filter(w => w.length >= 3).some(token => chunk.includes(token));
    
    const hasTotvs = TOTVS_BRAND_TERMS.some(term => chunk.includes(term.toLowerCase()));
    
    if (hasCompany && hasTotvs) {
      // Detectar produtos no chunk
      for (const product of TOTVS_SAFE_PRODUCTS) {
        if (chunk.includes(product.toLowerCase())) {
          detectedProducts.push(product);
        }
      }
      
      // Produtos ambíguos (só com contexto TOTVS)
      for (const product of TOTVS_AMBIGUOUS_PRODUCTS) {
        if (chunk.includes(product.toLowerCase()) && hasTotvs) {
          detectedProducts.push(product);
        }
      }
    }
  }
  
  return {
    matched: detectedProducts.length > 0,
    detectedProducts: Array.from(new Set(detectedProducts))
  };
}

// Double Match: Empresa + TOTVS OU Empresa + Produto (mesmos 60 caracteres)
function doubleMatch(text: string, companyName: string): { matched: boolean; detectedProducts: string[] } {
  const t = text.toLowerCase();
  const companyNorm = normalizeCompany(companyName);
  
  const chunks: string[] = [];
  for (let i = 0; i < t.length; i += 30) {
    chunks.push(t.substring(i, i + 60));
  }
  
  const detectedProducts: string[] = [];
  
  for (const chunk of chunks) {
    const hasCompany = chunk.includes(companyNorm) || 
      companyNorm.split(' ').filter(w => w.length >= 3).some(token => chunk.includes(token));
    
    if (!hasCompany) continue;
    
    // Empresa + TOTVS
    const hasTotvs = TOTVS_BRAND_TERMS.some(term => chunk.includes(term.toLowerCase()));
    if (hasTotvs) {
      detectedProducts.push('TOTVS');
    }
    
    // Empresa + Produto TOTVS
    for (const product of TOTVS_SAFE_PRODUCTS) {
      if (chunk.includes(product.toLowerCase())) {
        detectedProducts.push(product);
      }
    }
  }
  
  return {
    matched: detectedProducts.length > 0,
    detectedProducts: Array.from(new Set(detectedProducts))
  };
}

// Apollo.io Tech Stack Check
async function checkApolloTechStack(domain: string, apiKey: string): Promise<Evidence[]> {
  if (!domain) return [];
  
  console.log(`[APOLLO] Verificando tech stack para: ${domain}`);
  
  try {
    const response = await fetch('https://api.apollo.io/v1/organizations/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify({
        domain: domain,
        reveal_personal_emails: false
      })
    });
    
    if (!response.ok) {
      console.error('[APOLLO] Erro na API:', response.status);
      return [];
    }
    
    const data = await response.json();
    const org = data?.organizations?.[0];
    
    if (!org?.technologies) {
      console.log('[APOLLO] Nenhuma tech stack encontrada');
      return [];
    }
    
    const totvsKeywords = ['totvs', 'protheus', 'datasul', 'rm', 'fluig', 'winthor', 'microsiga'];
    const detectedProducts: string[] = [];
    
    for (const tech of org.technologies) {
      const techName = (tech.name || '').toLowerCase();
      if (totvsKeywords.some(keyword => techName.includes(keyword))) {
        detectedProducts.push(tech.name);
      }
    }
    
    if (detectedProducts.length > 0) {
      console.log(`[APOLLO] ✅ Tech stack TOTVS detectado:`, detectedProducts);
      return [{
        source: 'apollo.io',
        category: 'docs_oficiais',
        title: `Tech Stack: ${detectedProducts.join(', ')}`,
        url: `https://apollo.io/companies/${domain}`,
        snippet: `Tecnologias TOTVS detectadas no stack da empresa: ${detectedProducts.join(', ')}`,
        timestamp: new Date().toISOString(),
        totvs_products: detectedProducts,
        match_type: 'triple',
        weight: SOURCE_WEIGHTS.apollo_tech_stack
      }];
    }
    
    console.log('[APOLLO] Nenhum produto TOTVS detectado no tech stack');
    return [];
  } catch (error) {
    console.error('[APOLLO] Erro:', error);
    return [];
  }
}

// Busca Serper com matching
async function searchSerper(
  query: string,
  apiKey: string,
  companyName: string,
  category: Evidence['category'],
  weight: number
): Promise<Evidence[]> {
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: query,
        num: 10,
        gl: 'br',
        hl: 'pt-br'
      })
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const evidences: Evidence[] = [];
    
    if (data.organic) {
      for (const item of data.organic) {
        const text = `${item.title || ''} ${item.snippet || ''}`;
        
        // Validação especial para LinkedIn
        if (category === 'vagas' && /linkedin\.com/.test(item.link)) {
          if (!isValidLinkedInJobPosting(text, companyName)) {
            continue;
          }
        }
        
        // Primeira onda: Triple Match
        const tripleResult = tripleMatch(text, companyName);
        
        if (tripleResult.matched) {
          evidences.push({
            source: new URL(item.link).hostname,
            category,
            title: item.title,
            url: item.link,
            snippet: item.snippet,
            timestamp: new Date().toISOString(),
            totvs_products: tripleResult.detectedProducts,
            match_type: 'triple',
            weight
          });
          continue;
        }
        
        // Segunda onda: Double Match
        const doubleResult = doubleMatch(text, companyName);
        
        if (doubleResult.matched) {
          evidences.push({
            source: new URL(item.link).hostname,
            category,
            title: item.title,
            url: item.link,
            snippet: item.snippet,
            timestamp: new Date().toISOString(),
            totvs_products: doubleResult.detectedProducts,
            match_type: 'double',
            weight: Math.floor(weight * 0.8) // Peso reduzido para double match
          });
        }
      }
    }
    
    return evidences;
  } catch (error) {
    console.error(`[SERPER] Erro na busca:`, error);
    return [];
  }
}

// ============= SERVIDOR PRINCIPAL =============

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { company_id, company_name, cnpj, domain } = await req.json();

    if (!company_id || !company_name) {
      throw new Error('company_id e company_name são obrigatórios');
    }

    console.log(`[SIMPLE-TOTVS] ========================================`);
    console.log(`[SIMPLE-TOTVS] Iniciando busca NACIONAL para: ${company_name}`);
    console.log(`[SIMPLE-TOTVS] Domain: ${domain || 'N/A'} | CNPJ: ${cnpj || 'N/A'}`);
    console.log(`[SIMPLE-TOTVS] ========================================`);

    const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');
    const APOLLO_API_KEY = Deno.env.get('APOLLO_API_KEY');

    if (!SERPER_API_KEY) {
      throw new Error('SERPER_API_KEY não configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const allEvidences: Evidence[] = [];
    let queriesExecuted = 0;

    // ========== 1. APOLLO TECH STACK (Peso 100) ==========
    if (domain && APOLLO_API_KEY) {
      console.log(`[APOLLO] Verificando tech stack...`);
      const apolloEvidences = await checkApolloTechStack(domain, APOLLO_API_KEY);
      allEvidences.push(...apolloEvidences);
    }

    // ========== 2. VAGAS - LinkedIn, Infojobs, Catho (Peso 70) ==========
    console.log(`[VAGAS] Buscando vagas em portais nacionais...`);
    const vagasQuery = `"${company_name}" ("TOTVS Protheus" OR "TOTVS Datasul" OR "TOTVS RM" OR "TOTVS Fluig" OR "sistema TOTVS") (vaga OR requisito OR conhecimento) (site:linkedin.com OR site:infojobs.com.br OR site:catho.com.br)`;
    const vagasEvidences = await searchSerper(vagasQuery, SERPER_API_KEY, company_name, 'vagas', SOURCE_WEIGHTS.linkedin_jobs);
    allEvidences.push(...vagasEvidences);
    queriesExecuted++;
    console.log(`[VAGAS] ✅ Encontradas ${vagasEvidences.length} evidências`);

    // ========== 3. NOTÍCIAS PREMIUM (Peso 80) ==========
    console.log(`[NOTICIAS-PREMIUM] Buscando em veículos especializados...`);
    const noticiasQuery = `"${company_name}" ("cliente TOTVS" OR "implementa TOTVS" OR "adota TOTVS" OR "sistema TOTVS") (site:valor.globo.com OR site:exame.com OR site:infomoney.com.br OR site:bloomberglinea.com.br OR site:estadao.com.br/economia)`;
    const noticiasEvidences = await searchSerper(noticiasQuery, SERPER_API_KEY, company_name, 'noticias', SOURCE_WEIGHTS.premium_news);
    allEvidences.push(...noticiasEvidences);
    queriesExecuted++;
    console.log(`[NOTICIAS-PREMIUM] ✅ Encontradas ${noticiasEvidences.length} evidências`);

    // ========== 4. JUDICIAL (Peso 85) ==========
    console.log(`[JUDICIAL] Buscando processos e documentos judiciais...`);
    const judicialQuery = `"${company_name}" "TOTVS" (site:jusbrasil.com.br OR site:esaj.tjsp.jus.br OR site:rad.cvm.gov.br OR site:stf.jus.br OR site:pje.tjmg.jus.br)`;
    const judicialEvidences = await searchSerper(judicialQuery, SERPER_API_KEY, company_name, 'docs_oficiais', SOURCE_WEIGHTS.judicial);
    allEvidences.push(...judicialEvidences);
    queriesExecuted++;
    console.log(`[JUDICIAL] ✅ Encontradas ${judicialEvidences.length} evidências`);

    // ========== 5. RELAÇÕES COM INVESTIDORES / PDFs (Peso 90) ==========
    console.log(`[RI-DOCS] Buscando documentos de RI e balanços...`);
    const riQuery = `"${company_name}" ("TOTVS" OR "Protheus" OR "Datasul") filetype:pdf (site:rad.cvm.gov.br OR site:b3.com.br OR site:ri.totvs.com.br)`;
    const riEvidences = await searchSerper(riQuery, SERPER_API_KEY, company_name, 'docs_oficiais', SOURCE_WEIGHTS.cvm_ri_docs);
    allEvidences.push(...riEvidences);
    queriesExecuted++;
    console.log(`[RI-DOCS] ✅ Encontradas ${riEvidences.length} evidências`);

    // ========== 6. DOCUMENTOS OFICIAIS (Peso 60) ==========
    console.log(`[DOCS-OFICIAIS] Buscando em CVM, B3 e site da empresa...`);
    const docsQuery = `"${company_name}" ("sistema TOTVS" OR "Protheus" OR "Datasul") (site:rad.cvm.gov.br OR site:b3.com.br${domain ? ` OR site:${domain}` : ''})`;
    const docsEvidences = await searchSerper(docsQuery, SERPER_API_KEY, company_name, 'docs_oficiais', SOURCE_WEIGHTS.google_search);
    allEvidences.push(...docsEvidences);
    queriesExecuted++;
    console.log(`[DOCS-OFICIAIS] ✅ Encontradas ${docsEvidences.length} evidências`);

    // ========== ANÁLISE DE RESULTADOS ==========
    const tripleMatches = allEvidences.filter(e => e.match_type === 'triple');
    const doubleMatches = allEvidences.filter(e => e.match_type === 'double');
    const totalWeight = allEvidences.reduce((sum, e) => sum + (e.weight || 0), 0);

    console.log(`\n[RESULTADO] ========================================`);
    console.log(`[RESULTADO] Triple Matches: ${tripleMatches.length}`);
    console.log(`[RESULTADO] Double Matches: ${doubleMatches.length}`);
    console.log(`[RESULTADO] Total de Evidências: ${allEvidences.length}`);
    console.log(`[RESULTADO] Peso Total: ${totalWeight} pontos`);
    console.log(`[RESULTADO] ========================================\n`);

    // Classificação por peso acumulado
    let status: CheckResult['status'] = 'go';
    let confidence: CheckResult['confidence'] = 'low';
    let reasoning = '';

    if (totalWeight >= 250) {
      status = 'no-go';
      confidence = 'high';
      reasoning = `❌ NO-GO (Alta Confiança) - Empresa JÁ USA TOTVS. Peso total: ${totalWeight} pontos com ${allEvidences.length} evidências fortes em múltiplas fontes.`;
    } else if (totalWeight >= 150) {
      status = 'no-go';
      confidence = 'medium';
      reasoning = `⚠️ NO-GO (Média Confiança) - Empresa provavelmente usa TOTVS. Peso total: ${totalWeight} pontos com ${allEvidences.length} evidências.`;
    } else if (totalWeight >= 70) {
      status = 'revisar';
      confidence = 'medium';
      reasoning = `👁️ REVISAR - ${allEvidences.length} evidências encontradas (${tripleMatches.length} triple + ${doubleMatches.length} double). Peso: ${totalWeight}. Análise manual recomendada.`;
    } else if (allEvidences.length > 0) {
      status = 'revisar';
      confidence = 'low';
      reasoning = `👁️ REVISAR - Poucas evidências encontradas (${allEvidences.length}). Peso: ${totalWeight}. Validação manual necessária.`;
    } else {
      status = 'go';
      confidence = 'medium';
      reasoning = `✅ GO - Nenhuma evidência de uso de TOTVS encontrada nas fontes consultadas (vagas, notícias, judicial, RI, tech stack).`;
    }

    // Organizar evidências por categoria
    const evidencesByCategory: CheckResult['evidences_by_category'] = {
      vagas: allEvidences.filter(e => e.category === 'vagas'),
      noticias: allEvidences.filter(e => e.category === 'noticias'),
      docs_oficiais: allEvidences.filter(e => e.category === 'docs_oficiais')
    };

    const result: CheckResult = {
      status,
      detected_totvs: allEvidences.length > 0,
      confidence,
      total_evidences: allEvidences.length,
      evidences_by_category: evidencesByCategory,
      reasoning,
      checked_at: new Date().toISOString()
    };

    // Salvar no banco
    let companyIdToSave: string | null = company_id;
    if (company_id) {
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('id', company_id)
        .maybeSingle();
      if (!existingCompany) {
        companyIdToSave = null;
      }
    }

    const { error: insertError } = await supabase
      .from('simple_totvs_checks')
      .insert({
        company_id: companyIdToSave,
        status: result.status,
        detected_totvs: result.detected_totvs,
        confidence: result.confidence,
        total_evidences: result.total_evidences,
        evidences: result.evidences_by_category,
        reasoning: result.reasoning,
        checked_at: result.checked_at
      });

    if (insertError) {
      console.error('[SAVE] Erro ao salvar resultado:', insertError);
    } else {
      console.log('[SAVE] ✅ Resultado salvo com sucesso');
    }

    const executionTime = Date.now() - startTime;
    console.log(`[SIMPLE-TOTVS] Finalizado em ${executionTime}ms - Status: ${status}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ERROR] Erro em simple-totvs-check:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
