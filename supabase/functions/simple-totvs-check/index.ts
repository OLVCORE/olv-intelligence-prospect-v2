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

// Módulos e funcionalidades específicas (para detecção mais granular)
const TOTVS_MODULES = [
  // IA
  'Auditoria de Folha', 'Supervisão de Compras', 'Supervisão Financeira', 
  'Dilligence Check', 'Contract Chat', 'Target Talk', 'RoPA Legal',
  
  // ERP Módulos
  'Gestão Industrial', 'Financeiro', 'Compras e Suprimentos', 'Vendas', 
  'Estoque e Logística', 'Fiscal',
  
  // Fluig
  'BPM', 'ECM', 'Workflow', 'Portal Corporativo',
  
  // Analytics
  'Dashboards Executivos', 'KPIs e Indicadores',
  
  // Pagamentos
  'PIX', 'Gateway de Pagamentos', 'Conciliação Bancária',
  
  // RH
  'Recrutamento e Seleção', 'Treinamento e Desenvolvimento', 
  'Avaliação de Desempenho', 'Gestão de Benefícios',
  
  // SFA
  'Roteirização', 'Pedidos Mobile', 'Catálogo de Produtos',
  
  // Marketing
  'Email Marketing', 'Landing Pages', 'Marketing Automation'
];

// Combina produtos e módulos para busca completa
const ALL_TOTVS_TERMS = [...TOTVS_PRODUCTS, ...TOTVS_MODULES];

// Termos de marca TOTVS (obrigatório para correlação)
const TOTVS_BRAND_TERMS = ['TOTVS', 'Microsiga'];

// Funções utilitárias para normalização e correlação (Empresa + TOTVS + Produto/Módulo)
function normalizeCompany(name: string) {
  return name
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\b(s\.?a\.?|ltda|eireli|me|sa)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
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

function companyAndTotvsSameSentence(text: string, companyName: string) {
  const sentences = (text || '').split(/[\.|!|\?|\u00B7|\u2022|\n]+/);
  const cNorm = normalizeCompany(companyName);
  const totvsRegex = /(totvs|microsiga|protheus|datasul|rm|logix|winthor|fluig|backoffice)/i;
  return sentences.some(s => {
    const t = s.toLowerCase();
    const hasCompany = t.includes(cNorm) || cNorm.split(' ').some(w => w.length >= 3 && t.includes(w));
    return hasCompany && totvsRegex.test(t);
  });
}

function crossMatch(text: string, companyName: string) {
  const t = (text || '').toLowerCase();
  const companyNorm = normalizeCompany(companyName);

  const hasCompany = companyNorm.length > 0 && (t.includes(companyNorm) || companyNorm.split(' ').some(p => p.length > 3 && t.includes(p)));
  const brandHits = TOTVS_BRAND_TERMS.filter(term => t.includes(term.toLowerCase()));

  // Produtos TOTVS (desconsidera termos de marca pura para a contagem de "produto")
  const productHits = TOTVS_PRODUCTS.filter(term => t.includes(term.toLowerCase()))
    .filter(term => !TOTVS_BRAND_TERMS.map(s => s.toLowerCase()).includes(term.toLowerCase()));

  // Módulos somente contam se houver menção à marca/produto para evitar falsos positivos
  const moduleHits = TOTVS_MODULES.filter(term => t.includes(term.toLowerCase()));

  const hasProductOrModule = productHits.length > 0 || moduleHits.length > 0;
  
  // NOVA LÓGICA FLEXÍVEL: Aceita QUALQUER combinação de 2 elementos:
  // 1. Empresa + TOTVS (marca)
  // 2. Empresa + Produto/Módulo TOTVS
  // 3. TOTVS + Produto/Módulo (com menção à empresa)
  const matched = hasCompany && (brandHits.length > 0 || hasProductOrModule);

  const detected = Array.from(new Set([...brandHits, ...productHits, ...moduleHits]));

  return { matched, detectedProducts: detected };
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
    // Busca por principais produtos TOTVS em vagas
    const mainProducts = ['TOTVS', 'Protheus', 'Datasul', 'RM', 'Fluig', 'Winthor', 'Logix', 'Carol'];
    const vagasQuery = `"${company_name}" (TOTVS OR Microsiga OR Protheus OR Datasul OR RM OR Fluig OR Winthor OR Logix) (Protheus OR Datasul OR RM OR Fluig OR Winthor OR Logix OR "TOTVS CRM" OR "TOTVS RH" OR "TOTVS BI" OR Techfin) (vaga OR job OR requisito OR conhecimento OR experiência) (site:linkedin.com OR site:infojobs.com.br OR site:catho.com.br)`;
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
          const { matched, detectedProducts } = crossMatch(text, company_name);

          // Regras:
          // - Perfil pessoal do LinkedIn (/in/): EXIGE proximidade Empresa ↔ TOTVS
          // - Demais fontes: aceita correlação flexível padrão
          const shouldAdd = (isLinkedInProfile && isRelevant) || (!isLinkedInProfile && matched);

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
    // Busca ampliada com produtos específicos
    const noticiasQuery = `"${company_name}" (TOTVS OR Microsiga OR Protheus OR Datasul OR RM OR Fluig OR Winthor OR Logix OR "TOTVS CRM" OR "TOTVS RH" OR "TOTVS BI" OR Techfin) (site:infomoney.com.br OR site:valor.globo.com OR site:exame.com OR site:bloomberglinea.com.br)`;
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
    // Busca ampliada em documentos oficiais
    const docsQuery = `"${company_name}" (TOTVS OR Protheus OR Datasul OR "sistema de gestão" OR ERP) site:rad.cvm.gov.br OR site:bovespa.com.br OR site:b3.com.br${domain ? ` OR site:${domain}` : ''}`;
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
