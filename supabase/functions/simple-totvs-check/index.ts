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

// Catálogo COMPLETO de produtos TOTVS (extraído do catálogo da plataforma)
const TOTVS_PRODUCTS = [
  // Marca e termos gerais
  'TOTVS', 'Microsiga',
  
  // ERPs principais
  'Protheus', 'Datasul', 'RM', 'Logix', 'Winthor', 'Backoffice',
  
  // Plataformas e Cloud
  'Fluig', 'Carol', 'Carol AI', 'TOTVS Cloud',
  
  // Financeiro e Crédito
  'Techfin', 'TOTVS Techfin', 'TOTVS Pay',
  
  // CRM e Vendas
  'TOTVS CRM', 'SFA', 'Sales Force',
  
  // RH
  'TOTVS RH', 'Folha de Pagamento', 'Ponto Eletrônico',
  
  // Analytics e BI
  'TOTVS BI', 'Advanced Analytics', 'Data Platform',
  
  // Outros produtos
  'TOTVS iPaaS', 'TOTVS Atende', 'RD Station', 'Assinatura Eletrônica'
];

// Produtos TOTVS que PODEM aparecer isolados (não ambíguos)
const TOTVS_SAFE_PRODUCTS = [
  'TOTVS', 'Microsiga', 'Protheus', 'Datasul', 'Fluig', 'Winthor', 
  'Logix', 'Backoffice', 'Carol', 'Carol AI', 'Techfin', 'TOTVS Pay',
  'TOTVS CRM', 'TOTVS RH', 'TOTVS BI', 'TOTVS Cloud', 'TOTVS Atende'
];

// Produtos AMBÍGUOS que precisam de contexto TOTVS junto
const TOTVS_AMBIGUOUS_PRODUCTS = [
  'RM', 'SFA', 'BPM', 'ECM', 'Workflow', 'PIX', 'Gateway de Pagamentos'
];

// Termos de marca TOTVS (obrigatório para produtos ambíguos)
const TOTVS_BRAND_TERMS = ['TOTVS', 'Microsiga'];

// Funções utilitárias para normalização e correlação (Empresa + TOTVS + Produto/Módulo)
function normalizeCompany(name: string) {
  return name
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\b(s\.?a\.?|ltda|eireli|me|sa|epp|empresa|grupo)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Detecta se é um perfil pessoal (nomes próprios comuns antes de sobrenome)
function isPersonalProfile(text: string): boolean {
  const t = (text || '').toLowerCase();
  // Padrões comuns de perfis pessoais: menciona cargo/função
  const jobTitles = [
    'analista', 'desenvolvedor', 'gerente', 'coordenador', 'diretor', 
    'consultor', 'especialista', 'engenheiro', 'arquiteto', 'programador',
    'supervisor', 'assistente', 'técnico', 'líder', 'estagiário'
  ];
  return jobTitles.some(job => t.includes(job));
}

function proximityCompanyAndTotvs(text: string, companyName: string, maxDistance = 60) {
  const t = (text || '').toLowerCase();
  const companyNorm = normalizeCompany(companyName);

  // tokens relevantes do nome da empresa (>= 3 chars)
  const companyTokens = companyNorm.split(' ').filter(w => w.length >= 3);

  // índices de ocorrências
  const findAll = (needle: string) => {
    const idxs: number[] = [];
    let start = 0;
    while (true) {
      const i = t.indexOf(needle.toLowerCase(), start);
      if (i === -1) break;
      idxs.push(i);
      start = i + needle.length;
    }
    return idxs;
  };

  const totvsTerms = ['totvs','microsiga','protheus','datasul','rm','logix','winthor','fluig','backoffice'];
  const totvsIdx: number[] = [];
  for (const term of totvsTerms) totvsIdx.push(...findAll(term));
  if (totvsIdx.length === 0) return false;

  const companyIdx: number[] = [];
  for (const token of companyTokens) companyIdx.push(...findAll(token));
  if (companyIdx.length === 0) return false;

  // menor distância entre qualquer termo TOTVS e qualquer token da empresa
  let minDist = Infinity;
  for (const ti of totvsIdx) {
    for (const ci of companyIdx) {
      minDist = Math.min(minDist, Math.abs(ti - ci));
      if (minDist <= maxDistance) return true;
    }
  }
  return minDist <= maxDistance;
}

function companyAndTotvsSameSentence(text: string, companyName: string): boolean {
  const sentences = (text || '').split(/[\.|!|\?|\u00B7|\u2022|\n]+/);
  const cNorm = normalizeCompany(companyName);
  const totvsRegex = /(totvs|microsiga|protheus|datasul|rm|logix|winthor|fluig|backoffice)/i;
  return sentences.some(s => {
    const t = s.toLowerCase();
    const hasCompany = t.includes(cNorm) || cNorm.split(' ').some(w => w.length >= 3 && t.includes(w));
    return hasCompany && totvsRegex.test(t);
  });
}

function isValidTOTVSProduct(text: string): boolean {
  const t = (text || '').toLowerCase();
  const hasBrand = TOTVS_BRAND_TERMS.some(term => t.includes(term.toLowerCase()));
  
  // Produtos seguros podem aparecer sozinhos
  const hasSafeProduct = TOTVS_SAFE_PRODUCTS.some(term => t.includes(term.toLowerCase()));
  
  // Produtos ambíguos PRECISAM de contexto de marca TOTVS
  const hasAmbiguous = TOTVS_AMBIGUOUS_PRODUCTS.some(term => {
    const needle = term.toLowerCase();
    // Para "RM", verificar se é "TOTVS RM" ou contexto próximo
    if (needle === 'rm') {
      return t.includes('totvs rm') || t.includes('sistema rm') || 
             (t.includes(' rm ') && hasBrand && Math.abs(t.indexOf(' rm ') - t.indexOf('totvs')) < 50);
    }
    return t.includes(needle) && hasBrand;
  });
  
  return hasSafeProduct || hasAmbiguous;
}

function crossMatch(text: string, companyName: string, isLinkedInProfile = false): { matched: boolean; detectedProducts: string[] } {
  const t = (text || '').toLowerCase();
  const companyNorm = normalizeCompany(companyName);
  
  // Se for perfil pessoal detectado, não aceitar match de token único
  const isPerson = isPersonalProfile(text);
  
  let hasCompany = false;
  
  if (companyNorm.length > 0) {
    // Tenta match do nome completo (mais confiável)
    if (t.includes(companyNorm)) {
      hasCompany = true;
    } else {
      // Match por tokens individuais
      const tokens = companyNorm.split(' ').filter(p => p.length > 3);
      
      if (isPerson || isLinkedInProfile) {
        // REGRA RIGOROSA: Para perfis pessoais/LinkedIn, exige 2+ tokens ou nome completo
        const matchedTokens = tokens.filter(token => t.includes(token));
        hasCompany = matchedTokens.length >= 2;
      } else {
        // Para outras fontes, aceita 1 token (comportamento original)
        hasCompany = tokens.some(p => t.includes(p));
      }
    }
  }
  
  const hasValidProduct = isValidTOTVSProduct(t);
  const matched = hasCompany && hasValidProduct;

  // Detectar produtos mencionados
  const detectedProducts: string[] = [];
  if (matched) {
    for (const term of [...TOTVS_SAFE_PRODUCTS, ...TOTVS_AMBIGUOUS_PRODUCTS]) {
      if (term.toLowerCase() === 'rm') {
        // Só adiciona RM se tiver contexto TOTVS próximo
        if (t.includes('totvs rm') || t.includes('sistema totvs rm')) {
          detectedProducts.push(term);
        }
      } else if (t.includes(term.toLowerCase())) {
        detectedProducts.push(term);
      }
    }
  }

  return { matched, detectedProducts: Array.from(new Set(detectedProducts)) };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { company_id, company_name, cnpj, domain } = await req.json();

    if (!company_id || !company_name) {
      throw new Error('company_id e company_name são obrigatórios');
    }

    console.log(`[Simple TOTVS Check] Iniciando para: ${company_name}`);

    const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');
    if (!SERPER_API_KEY) {
      throw new Error('SERPER_API_KEY não configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const evidencesByCategory: CheckResult['evidences_by_category'] = {
      vagas: [],
      noticias: [],
      docs_oficiais: []
    };

    // 1. VAGAS (LinkedIn, Infojobs, Catho)
    // Busca focada em produtos TOTVS não-ambíguos
    const vagasQuery = `"${company_name}" ("TOTVS Protheus" OR "TOTVS Datasul" OR "TOTVS RM" OR "TOTVS Fluig" OR "TOTVS Winthor" OR "sistema TOTVS" OR "ERP TOTVS") (vaga OR requisito OR conhecimento OR experiência) (site:linkedin.com OR site:infojobs.com.br OR site:catho.com.br)`;
    console.log('[Vagas] Query:', vagasQuery);
    
    const vagasResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: vagasQuery,
        num: 10,
        gl: 'br',
        hl: 'pt-br'
      }),
    });

    if (vagasResponse.ok) {
      const vagasData = await vagasResponse.json();
      if (vagasData.organic) {
        for (const item of vagasData.organic) {
          const text = `${item.title || ''} ${item.snippet || ''}`;
          const isLinkedInProfile = /linkedin\.com\/in\//.test(item.link || '');
          
          // Aplica correlação com proximidade contextual (mesma frase OU perto)
          const isRelevant = companyAndTotvsSameSentence(text, company_name) || proximityCompanyAndTotvs(text, company_name);
          const { matched, detectedProducts } = crossMatch(text, company_name, isLinkedInProfile);

          // Regras:
          // - Perfil pessoal do LinkedIn (/in/): EXIGE proximidade Empresa ↔ TOTVS E match rigoroso (2+ tokens)
          // - Demais fontes: aceita correlação flexível padrão
          const shouldAdd = (isLinkedInProfile && isRelevant && matched) || (!isLinkedInProfile && matched);

          if (shouldAdd) {
            evidencesByCategory.vagas.push({
              source: new URL(item.link).hostname,
              category: 'vagas',
              title: item.title,
              url: item.link,
              snippet: item.snippet,
              timestamp: new Date().toISOString(),
              totvs_products: detectedProducts
            });
          }
        }
      }
    }

    // 2. NOTÍCIAS (InfoMoney, Valor, Exame)
    // Busca com produtos TOTVS específicos e contexto
    const noticiasQuery = `"${company_name}" ("adota TOTVS" OR "implementa TOTVS" OR "cliente TOTVS" OR "parceiro TOTVS" OR "sistema TOTVS" OR "ERP TOTVS" OR "Protheus" OR "Datasul" OR "Fluig") (site:infomoney.com.br OR site:valor.globo.com OR site:exame.com OR site:bloomberglinea.com.br)`;
    console.log('[Notícias] Query:', noticiasQuery);
    
    const noticiasResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: noticiasQuery,
        num: 10,
        gl: 'br',
        hl: 'pt-br'
      }),
    });

    if (noticiasResponse.ok) {
      const noticiasData = await noticiasResponse.json();
      if (noticiasData.organic) {
        for (const item of noticiasData.organic) {
          const text = `${item.title || ''} ${item.snippet || ''}`;

          // Aplica correlação com proximidade contextual
          const isRelevant = proximityCompanyAndTotvs(text, company_name);
          const { matched, detectedProducts } = crossMatch(text, company_name);

          // Só considera se há proximidade contextual OU correlação direta
          if (isRelevant || matched) {
            evidencesByCategory.noticias.push({
              source: new URL(item.link).hostname,
              category: 'noticias',
              title: item.title,
              url: item.link,
              snippet: item.snippet,
              timestamp: new Date().toISOString(),
              totvs_products: detectedProducts
            });
          }
        }
      }
    }

    // 3. DOCS OFICIAIS (CVM, B3, site da empresa)
    // Busca em documentos oficiais com produtos específicos
    const docsQuery = `"${company_name}" ("fornecedor TOTVS" OR "cliente TOTVS" OR "sistema TOTVS" OR "Protheus" OR "Datasul" OR "software de gestão") site:rad.cvm.gov.br OR site:bovespa.com.br OR site:b3.com.br${domain ? ` OR site:${domain}` : ''}`;
    console.log('[Docs Oficiais] Query:', docsQuery);
    
    const docsResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: docsQuery,
        num: 10,
        gl: 'br',
        hl: 'pt-br'
      }),
    });

    if (docsResponse.ok) {
      const docsData = await docsResponse.json();
      if (docsData.organic) {
        for (const item of docsData.organic) {
          const text = `${item.title || ''} ${item.snippet || ''}`;

          // Aplica correlação com proximidade contextual
          const isRelevant = proximityCompanyAndTotvs(text, company_name);
          const { matched, detectedProducts } = crossMatch(text, company_name);

          // Só considera se há proximidade contextual OU correlação direta
          if (isRelevant || matched) {
            evidencesByCategory.docs_oficiais.push({
              source: new URL(item.link).hostname,
              category: 'docs_oficiais',
              title: item.title,
              url: item.link,
              snippet: item.snippet,
              timestamp: new Date().toISOString(),
              totvs_products: detectedProducts
            });
          }
        }
      }
    }

    // Calcular resultado
    const totalEvidences = 
      evidencesByCategory.vagas.length +
      evidencesByCategory.noticias.length +
      evidencesByCategory.docs_oficiais.length;

    let status: CheckResult['status'] = 'revisar';
    let confidence: CheckResult['confidence'] = 'low';
    let reasoning = '';

    if (totalEvidences === 0) {
      status = 'go';
      confidence = 'medium';
      reasoning = 'Nenhuma evidência de uso de TOTVS encontrada nas principais fontes (vagas, notícias, documentos oficiais).';
    } else if (totalEvidences >= 5) {
      status = 'no-go';
      confidence = 'high';
      reasoning = `Empresa JÁ USA TOTVS - ${totalEvidences} evidências fortes encontradas em múltiplas fontes.`;
    } else if (totalEvidences >= 2) {
      status = 'no-go';
      confidence = 'medium';
      reasoning = `Empresa provavelmente usa TOTVS - ${totalEvidences} evidências encontradas.`;
    } else {
      status = 'revisar';
      confidence = 'low';
      reasoning = `Apenas ${totalEvidences} evidência encontrada. Requer validação manual.`;
    }

    const result: CheckResult = {
      status,
      detected_totvs: totalEvidences > 0,
      confidence,
      total_evidences: totalEvidences,
      evidences_by_category: evidencesByCategory,
      reasoning,
      checked_at: new Date().toISOString()
    };

    // Salvar no banco
    const { error: insertError } = await supabase
      .from('simple_totvs_checks')
      .insert({
        company_id,
        status: result.status,
        detected_totvs: result.detected_totvs,
        confidence: result.confidence,
        total_evidences: result.total_evidences,
        evidences: result.evidences_by_category,
        reasoning: result.reasoning,
        checked_at: result.checked_at
      });

    if (insertError) {
      console.error('Erro ao salvar resultado:', insertError);
    }

    console.log(`[Simple TOTVS Check] Resultado: ${status} (${totalEvidences} evidências)`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro em simple-totvs-check:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
