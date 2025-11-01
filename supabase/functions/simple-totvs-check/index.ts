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
  total_weight: number;
  match_summary: {
    triple_matches: number;
    double_matches: number;
  };
  evidences_by_category: {
    vagas: Evidence[];
    noticias: Evidence[];
    docs_oficiais: Evidence[];
  };
  reasoning: string;
  checked_at: string;
  execution_time_ms: number;
  cache_hit: boolean;
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

// Setores Prioritários TOTVS (Manufatura, Logística, Serviços)
const PRIORITY_SECTORS = {
  manufatura: ['manufatura', 'industria', 'industrial', 'fabricação', 'produção'],
  logistica: ['logística', 'logistica', 'transporte', 'armazenagem', 'distribuição'],
  servicos: ['serviços', 'servicos', 'consultoria', 'terceirização', 'outsourcing']
};

// Produtos TOTVS por Setor (para boost de peso)
const SECTOR_PRODUCTS = {
  manufatura: ['Protheus', 'Datasul', 'Logix'],
  logistica: ['Winthor', 'Backoffice', 'TOTVS Cloud'],
  servicos: ['RM', 'Fluig', 'TOTVS CRM', 'TOTVS RH']
};

// Produtos TOTVS seguros
const TOTVS_SAFE_PRODUCTS = [
  'TOTVS', 'Microsiga', 'Protheus', 'Datasul', 'Fluig', 'Winthor', 
  'Logix', 'Backoffice', 'Carol', 'Carol AI', 'Techfin', 'TOTVS Pay',
  'TOTVS CRM', 'TOTVS RH', 'TOTVS BI', 'TOTVS Cloud', 'TOTVS Atende'
];

const TOTVS_AMBIGUOUS_PRODUCTS = ['RM', 'SFA', 'BPM', 'ECM', 'Workflow'];
const TOTVS_BRAND_TERMS = ['TOTVS', 'Microsiga'];

// Função retry com backoff exponencial
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status === 404) return response;
      
      if (attempt < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, attempt);
        console.log(`[RETRY] Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = 1000 * Math.pow(2, attempt);
      console.log(`[RETRY] Error on attempt ${attempt + 1}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries reached');
}

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

function isValidLinkedInJobPosting(snippet: string, companyName: string): boolean {
  const text = snippet.toLowerCase();
  const rejectedTerms = [
    'experiência anterior', 'trabalhou na', 'ex-funcionário', 'atuou em',
    'passou pela', 'ex-', 'anterior', 'trabalhou como'
  ];
  
  if (rejectedTerms.some(term => text.includes(term))) return false;
  
  const companyNorm = normalizeCompany(companyName);
  const hasCompany = text.includes(companyNorm);
  const hasTotvs = TOTVS_BRAND_TERMS.some(t => text.includes(t.toLowerCase()));
  const hasProduct = [...TOTVS_SAFE_PRODUCTS, ...TOTVS_AMBIGUOUS_PRODUCTS]
    .some(p => text.includes(p.toLowerCase()));
  
  return hasCompany && hasTotvs && hasProduct;
}

// Detectar setor prioritário
function detectPrioritySector(companyName: string, setor?: string): string | null {
  const text = `${companyName} ${setor || ''}`.toLowerCase();
  
  for (const [sector, keywords] of Object.entries(PRIORITY_SECTORS)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return sector;
    }
  }
  return null;
}

// Triple Match
function tripleMatch(text: string, companyName: string): { matched: boolean; detectedProducts: string[] } {
  const t = text.toLowerCase();
  const companyNorm = normalizeCompany(companyName);
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
      for (const product of TOTVS_SAFE_PRODUCTS) {
        if (chunk.includes(product.toLowerCase())) {
          detectedProducts.push(product);
        }
      }
      
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

// Double Match
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
    
    const hasTotvs = TOTVS_BRAND_TERMS.some(term => chunk.includes(term.toLowerCase()));
    if (hasTotvs) detectedProducts.push('TOTVS');
    
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

// Apollo Tech Stack
async function checkApolloTechStack(domain: string, apiKey: string): Promise<Evidence[]> {
  if (!domain) return [];
  
  console.log(`[APOLLO] Verificando tech stack: ${domain}`);
  
  try {
    const response = await fetchWithRetry('https://api.apollo.io/v1/organizations/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify({ domain, reveal_personal_emails: false })
    });
    
    if (!response.ok) {
      console.error(`[APOLLO] API error: ${response.status}`);
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
      console.log(`[APOLLO] ✅ TOTVS detectado:`, detectedProducts);
      return [{
        source: 'apollo.io',
        category: 'docs_oficiais',
        title: `Tech Stack: ${detectedProducts.join(', ')}`,
        url: `https://apollo.io/companies/${domain}`,
        snippet: `Tecnologias TOTVS: ${detectedProducts.join(', ')}`,
        timestamp: new Date().toISOString(),
        totvs_products: detectedProducts,
        match_type: 'triple',
        weight: SOURCE_WEIGHTS.apollo_tech_stack
      }];
    }
    
    return [];
  } catch (error) {
    console.error('[APOLLO] Erro:', error);
    return [];
  }
}

// Busca Serper
async function searchSerper(
  query: string,
  apiKey: string,
  companyName: string,
  category: Evidence['category'],
  weight: number
): Promise<Evidence[]> {
  try {
    const response = await fetchWithRetry('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: query, num: 10, gl: 'br', hl: 'pt-br' })
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const evidences: Evidence[] = [];
    
    if (data.organic) {
      for (const item of data.organic) {
        const text = `${item.title || ''} ${item.snippet || ''}`;
        
        if (category === 'vagas' && /linkedin\.com/.test(item.link)) {
          if (!isValidLinkedInJobPosting(text, companyName)) continue;
        }
        
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
            weight: Math.floor(weight * 0.8)
          });
        }
      }
    }
    
    return evidences;
  } catch (error) {
    console.error(`[SERPER] Erro:`, error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { company_id, company_name, cnpj, domain, setor } = await req.json();

    if (!company_id || !company_name) {
      throw new Error('company_id e company_name são obrigatórios');
    }

    console.log(`[SIMPLE-TOTVS] ========================================`);
    console.log(`[SIMPLE-TOTVS] 🔍 Busca NACIONAL: ${company_name}`);
    console.log(`[SIMPLE-TOTVS] Domain: ${domain || 'N/A'} | Setor: ${setor || 'N/A'}`);

    const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');
    const APOLLO_API_KEY = Deno.env.get('APOLLO_API_KEY');

    if (!SERPER_API_KEY) {
      throw new Error('SERPER_API_KEY não configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ========== CACHE (24h) ==========
    const oneDayAgo = new Date(Date.now() - 24*60*60*1000).toISOString();
    const { data: cachedCheck } = await supabase
      .from('simple_totvs_checks')
      .select('*')
      .eq('company_id', company_id)
      .gte('checked_at', oneDayAgo)
      .order('checked_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cachedCheck) {
      console.log(`[CACHE] ✅ Cache hit - retornando resultado de ${cachedCheck.checked_at}`);
      return new Response(JSON.stringify({
        ...cachedCheck,
        cache_hit: true,
        execution_time_ms: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[CACHE] ❌ Cache miss - executando busca completa`);

    // Detectar setor prioritário
    const prioritySector = detectPrioritySector(company_name, setor);
    if (prioritySector) {
      console.log(`[SETOR] ⭐ Setor prioritário detectado: ${prioritySector.toUpperCase()}`);
    }

    // ========== PARALLELIZAÇÃO TOTAL ==========
    const queries = [
      // Vagas
      {
        query: `"${company_name}" ("TOTVS Protheus" OR "TOTVS Datasul" OR "TOTVS RM" OR "TOTVS Fluig" OR "sistema TOTVS") (vaga OR requisito) (site:linkedin.com OR site:infojobs.com.br OR site:catho.com.br)`,
        category: 'vagas' as const,
        weight: SOURCE_WEIGHTS.linkedin_jobs
      },
      // Notícias Premium
      {
        query: `"${company_name}" ("cliente TOTVS" OR "implementa TOTVS" OR "sistema TOTVS") (site:valor.globo.com OR site:exame.com OR site:infomoney.com.br OR site:bloomberglinea.com.br)`,
        category: 'noticias' as const,
        weight: SOURCE_WEIGHTS.premium_news
      },
      // Judicial
      {
        query: `"${company_name}" "TOTVS" (site:jusbrasil.com.br OR site:esaj.tjsp.jus.br OR site:rad.cvm.gov.br)`,
        category: 'docs_oficiais' as const,
        weight: SOURCE_WEIGHTS.judicial
      },
      // RI/PDFs
      {
        query: `"${company_name}" ("TOTVS" OR "Protheus" OR "Datasul") filetype:pdf (site:rad.cvm.gov.br OR site:b3.com.br)`,
        category: 'docs_oficiais' as const,
        weight: SOURCE_WEIGHTS.cvm_ri_docs
      },
      // Docs Oficiais
      {
        query: `"${company_name}" ("sistema TOTVS" OR "Protheus" OR "Datasul") (site:rad.cvm.gov.br OR site:b3.com.br${domain ? ` OR site:${domain}` : ''})`,
        category: 'docs_oficiais' as const,
        weight: SOURCE_WEIGHTS.google_search
      }
    ];

    console.log(`[PARALLEL] 🚀 Executando ${queries.length + 1} buscas em paralelo...`);

    const [apolloEv, ...serperResults] = await Promise.all([
      domain && APOLLO_API_KEY ? checkApolloTechStack(domain, APOLLO_API_KEY) : Promise.resolve([]),
      ...queries.map(q => searchSerper(q.query, SERPER_API_KEY, company_name, q.category, q.weight))
    ]);

    const allEvidences = [...apolloEv, ...serperResults.flat()];

    // Boost de peso para setores prioritários
    if (prioritySector) {
      const sectorProducts = SECTOR_PRODUCTS[prioritySector as keyof typeof SECTOR_PRODUCTS] || [];
      allEvidences.forEach(ev => {
        if (ev.totvs_products.some(p => sectorProducts.includes(p))) {
          ev.weight = Math.floor((ev.weight || 0) * 1.3); // +30% boost
          console.log(`[SETOR-BOOST] +30% peso para ${ev.totvs_products.join(', ')} (setor: ${prioritySector})`);
        }
      });
    }

    const tripleMatches = allEvidences.filter(e => e.match_type === 'triple');
    const doubleMatches = allEvidences.filter(e => e.match_type === 'double');
    const totalWeight = allEvidences.reduce((sum, e) => sum + (e.weight || 0), 0);

    console.log(`\n[RESULTADO] ========================================`);
    console.log(`[RESULTADO] Triple: ${tripleMatches.length} | Double: ${doubleMatches.length}`);
    console.log(`[RESULTADO] Total: ${allEvidences.length} | Peso: ${totalWeight}`);
    console.log(`[RESULTADO] ========================================\n`);

    let status: CheckResult['status'] = 'go';
    let confidence: CheckResult['confidence'] = 'low';
    let reasoning = '';

    // ========== DECISÃO UNIFICADA (4 pontos de entrada) ==========
    
    // Buscar dados da empresa para decisão mais inteligente
    // Tenta buscar de icp_analysis_results PRIMEIRO, depois companies como fallback
    interface CompanyDataUnified {
      icp_score: number | null;
      website: string | null;
      setor: string | null;
      porte: string | null;
      cnpj: string | null;
      nome_empresa: string | null;
    }
    
    let companyData: CompanyDataUnified | null = null;
    let dataSource = 'none';
    
    const { data: quarentenaData } = await supabase
      .from('icp_analysis_results')
      .select('icp_score, website, setor, porte, cnpj, nome_empresa')
      .eq('id', company_id)
      .maybeSingle();
    
    if (quarentenaData) {
      companyData = quarentenaData as CompanyDataUnified;
      dataSource = 'quarentena';
    } else {
      // Fallback: buscar em companies
      const { data: companiesData } = await supabase
        .from('companies')
        .select('icp_score, website, industry, headquarters_state, cnpj, name')
        .eq('id', company_id)
        .maybeSingle();
      
      if (companiesData) {
        companyData = {
          icp_score: companiesData.icp_score || null,
          website: companiesData.website || null,
          setor: companiesData.industry || null,
          porte: null, // companies não tem porte
          cnpj: companiesData.cnpj || null,
          nome_empresa: companiesData.name || null
        };
        dataSource = 'companies';
      }
    }
    
    console.log(`[DADOS] Fonte: ${dataSource} | ICP: ${companyData?.icp_score || 0} | Website: ${companyData?.website || 'N/A'}`);

    const icpScore = companyData?.icp_score || 0;
    const websiteRaw = companyData?.website || domain || '';
    const hasWebsite = !!websiteRaw && websiteRaw !== 'N/A' && websiteRaw.length > 3;
    const hasBasicData = !!(companyData?.setor || companyData?.cnpj);

    // ========== LÓGICA UNIFICADA DE CLASSIFICAÇÃO ==========
    
    // TRIPLE MATCHES = Alta confiança
    if (tripleMatches.length >= 5) {
      status = 'no-go';
      confidence = 'high';
      reasoning = `❌ NO-GO (Alta) - ${tripleMatches.length} evidências triplas confirmadas (Empresa + TOTVS + Produto). Peso: ${totalWeight}.`;
    } 
    else if (tripleMatches.length >= 3) {
      status = 'no-go';
      confidence = 'medium';
      reasoning = `⚠️ NO-GO (Média) - ${tripleMatches.length} evidências triplas (Empresa + TOTVS + Produto). Peso: ${totalWeight}.`;
    }
    else if (tripleMatches.length >= 2) {
      status = 'revisar';
      confidence = 'medium';
      reasoning = `👁️ REVISAR - ${tripleMatches.length} evidências triplas. SDR deve validar contexto. Peso: ${totalWeight}.`;
    }
    else if (tripleMatches.length === 1) {
      status = 'revisar';
      confidence = 'medium';
      reasoning = `👁️ REVISAR - 1 evidência tripla encontrada. Validação manual necessária. Peso: ${totalWeight}.`;
    }
    
    // DOUBLE MATCHES = Precisa análise
    else if (doubleMatches.length >= 5) {
      status = 'revisar';
      confidence = 'medium';
      reasoning = `📋 REVISAR - ${doubleMatches.length} evidências duplas (alto volume). SDR deve analisar. Peso: ${totalWeight}.`;
    }
    else if (doubleMatches.length >= 3) {
      status = 'revisar';
      confidence = 'low';
      reasoning = `👁️ REVISAR - ${doubleMatches.length} evidências duplas. Análise manual recomendada. Peso: ${totalWeight}.`;
    }
    else if (doubleMatches.length >= 2) {
      status = 'revisar';
      confidence = 'low';
      reasoning = `👁️ REVISAR - ${doubleMatches.length} evidências duplas. Verificar contexto. Peso: ${totalWeight}.`;
    }
    else if (doubleMatches.length === 1) {
      status = 'go';
      confidence = 'low';
      reasoning = `✅ GO - Apenas 1 evidência dupla (insuficiente). Peso: ${totalWeight}. ICP: ${icpScore}/100.`;
    }
    
    // SEM MATCHES = Decisão baseada em DADOS + PESO ACUMULADO
    else if (allEvidences.length === 0) {
      // NENHUMA evidência TOTVS encontrada
      
      // Se tem dados mínimos (website OU score > 30 OU CNPJ), aprovar
      if (hasWebsite || icpScore > 30 || hasBasicData) {
        status = 'go';
        confidence = hasWebsite && icpScore >= 50 ? 'high' : 'medium';
        reasoning = `✅ GO - Nenhuma evidência TOTVS encontrada. ICP: ${icpScore}/100${hasWebsite ? ', website OK' : ''}${hasBasicData ? ', dados básicos OK' : ''}.`;
        console.log(`[DECISÃO] GO aprovado (ICP: ${icpScore}, Website: ${hasWebsite}, BasicData: ${hasBasicData})`);
      } 
      // Empresa "fantasma" (sem nada) - marcar pra revisar
      else {
        status = 'revisar';
        confidence = 'low';
        reasoning = `⚠️ REVISAR - Sem evidências TOTVS, mas empresa sem presença digital (ICP: ${icpScore}, sem website, sem dados). Validar existência.`;
        console.log(`[DECISÃO] REVISAR por empresa sem presença digital`);
      }
    }

    const evidencesByCategory: CheckResult['evidences_by_category'] = {
      vagas: allEvidences.filter(e => e.category === 'vagas'),
      noticias: allEvidences.filter(e => e.category === 'noticias'),
      docs_oficiais: allEvidences.filter(e => e.category === 'docs_oficiais')
    };

    const executionTime = Date.now() - startTime;

    const result: CheckResult = {
      status,
      detected_totvs: allEvidences.length > 0,
      confidence,
      total_evidences: allEvidences.length,
      total_weight: totalWeight,
      match_summary: {
        triple_matches: tripleMatches.length,
        double_matches: doubleMatches.length
      },
      evidences_by_category: evidencesByCategory,
      reasoning,
      checked_at: new Date().toISOString(),
      execution_time_ms: executionTime,
      cache_hit: false
    };

    // Salvar resultados na QUARENTENA (icp_analysis_results)
    console.log(`[SAVE] 💾 Salvando em icp_analysis_results (QUARENTENA)`);
    console.log(`[SAVE] 📊 Status: ${result.status} | Weight: ${totalWeight} | Evidências: ${result.total_evidences}`);
    
    const { error: updateError } = await supabase
      .from('icp_analysis_results')
      .update({
        totvs_check_status: result.status,
        totvs_check_confidence: result.confidence,
        totvs_check_evidences: result.evidences_by_category,
        totvs_check_date: result.checked_at,
        totvs_check_total_weight: totalWeight,
        totvs_check_reasoning: result.reasoning,
        is_cliente_totvs: result.detected_totvs,
        totvs_evidences: result.evidences_by_category
      })
      .eq('id', company_id);

    if (updateError) {
      console.error('[SAVE] ⚠️ Erro ao atualizar QUARENTENA:', updateError.message);
    } else {
      console.log('[SAVE] ✅ Salvo na QUARENTENA com sucesso');
    }

    // Salvar snapshot no cache oficial (simple_totvs_checks)
    console.log('[SAVE] 🗂️ Gravando em simple_totvs_checks (cache oficial)');
    const { error: insertCacheError } = await supabase
      .from('simple_totvs_checks')
      .insert({
        company_id,
        status: result.status,
        confidence: result.confidence,
        detected_totvs: result.detected_totvs,
        total_evidences: result.total_evidences,
        evidences: result.evidences_by_category,
        reasoning: result.reasoning,
        checked_at: result.checked_at
      });

    if (insertCacheError) {
      console.warn('[SAVE] ⚠️ Falha ao gravar cache simple_totvs_checks:', insertCacheError.message);
    } else {
      console.log('[SAVE] ✅ Cache gravado em simple_totvs_checks');
    }

    console.log(`[SIMPLE-TOTVS] ⚡ Finalizado em ${executionTime}ms - ${status.toUpperCase()}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
