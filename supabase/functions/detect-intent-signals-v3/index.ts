// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type IntentSignal = {
  type: string;
  score: number;
  title: string;
  description: string;
  url: string;
  timestamp: string;
  confidence: string;
  reason: string;
};

type ScoreBreakdown = {
  source: string;
  points_awarded: number;
  max_points: number;
  reason: string;
  search_url?: string;
};

type CompanyMatch = {
  name: string;
  matchScore: number;
  confidence: 'high' | 'medium' | 'low';
  matchReasons: string[];
  sources: string[];
  signals: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
};

type Methodology = {
  total_sources_checked: number;
  sources_with_results: string[];
  sources_without_results: string[];
  score_breakdown: ScoreBreakdown[];
  calculation_formula: string;
  threshold_applied: {
    cold_if_below: number;
    warm_if_between: [number, number];
    hot_if_above: number;
  };
};

function normalizeName(raw: string): string {
  return raw
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
  if (tokens.length >= 4) variants.push(tokens.slice(0, 4).join(" "));
  return variants;
}

function digitsOnly(s: string): string {
  return (s || '').replace(/\D/g, '');
}

async function serperSearch(query: string, num: number = 5) {
  const apiKey = Deno.env.get('SERPER_API_KEY');
  if (!apiKey) {
    console.warn('[detect-intent-v3] SERPER_API_KEY não configurada');
    return [] as Array<{ title: string; link: string; snippet: string }>;
  }
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({ q: query, gl: 'br', hl: 'pt-BR', num }),
  });
  if (!res.ok) {
    console.warn('[detect-intent-v3] Serper falhou', await res.text());
    return [];
  }
  const data = await res.json();
  const organic = data.organic || [];
  return organic.map((it: any) => ({
    title: it.title,
    link: it.link,
    snippet: it.snippet || it.description || '',
  }));
}

// Palavras-chave negativas fortes (legal/financeiro)
const negativeKeywords = [
  'recuperacao judicial',
  'em recuperacao judicial',
  'falencia',
  'protesto',
  'execucao fiscal',
  'plano de recuperacao',
  'massa falida'
];

function calculateMatchScore(searchText: string, companyName: string): number {
  const normalizedSearch = normalizeName(searchText);
  const normalizedCompany = normalizeName(companyName);
  const companyTokens = normalizedCompany.split(" ").filter(w => w.length > 2);
  
  let matchedTokens = 0;
  for (const token of companyTokens) {
    if (normalizedSearch.includes(token)) {
      matchedTokens++;
    }
  }
  
  return Math.round((matchedTokens / companyTokens.length) * 100);
}

function extractCompanyNames(text: string): string[] {
  const names: string[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    // Padrões comuns de nomes de empresas
    const patterns = [
      /([A-Z][A-Za-z\s]+(?:LTDA|SA|S\.A\.|ME|EPP|EIRELI))/g,
      /(?:Empresa|Company|Corporation):\s*([A-Z][A-Za-z\s]+)/gi
    ];
    
    for (const pattern of patterns) {
      const matches = line.match(pattern);
      if (matches) {
        names.push(...matches);
      }
    }
  }
  
  return names;
}

function validateMention(text: string, companyName: string): boolean {
  const normalized = normalizeName(text);
  const variants = tokenVariants(companyName);
  return variants.some(v => normalized.includes(v));
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { company_id, company_name, cnpj, domain, region, sector, niche, selected_company_name } = await req.json();

    if (!company_id || !company_name) {
      return new Response(JSON.stringify({ 
        error: 'company_id and company_name required',
        hint: 'Selecione uma empresa primeiro'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const searchCompanyName = selected_company_name || company_name;
    console.log(`[detect-intent-v3] 🔍 Analisando: ${searchCompanyName}`);

    const signals: IntentSignal[] = [];
    const platformsScanned: string[] = [];
    const scoreBreakdown: ScoreBreakdown[] = [];
    const variants = tokenVariants(searchCompanyName);
    const cnpjDigits = cnpj ? cnpj.replace(/\D/g, '') : '';
    const cnpjQuoted = cnpj ? `"${cnpj}"` : '';
    const cnpjDigitsQuoted = cnpjDigits ? `"${cnpjDigits}"` : '';
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    const googleCseId = Deno.env.get('GOOGLE_CSE_ID');

    if (!googleApiKey || !googleCseId) {
      return new Response(JSON.stringify({ 
        error: 'Google API not configured'
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // FONTES OFICIAIS E REGULATÓRIAS (20 pontos cada, max 100)
    const officialSources = [
      { name: 'CVM', url: 'https://www.gov.br/cvm/pt-br', points: 20 },
      { name: 'CVM RAD', url: 'https://rad.cvm.gov.br/', points: 20 },
      { name: 'B3', url: 'https://www.b3.com.br/pt_br/', points: 20 },
      { name: 'Imprensa Nacional', url: 'https://www.in.gov.br/', points: 15 },
      { name: 'B3 Empresas Net', url: 'https://www.b3.com.br/pt_br/produtos-e-servicos/solucoes-para-emissores/sistema-empresas-net/', points: 15 },
      { name: 'B3 Investidor', url: 'https://www.investidor.b3.com.br/', points: 15 }
    ];

    for (const source of officialSources) {
      platformsScanned.push(source.name);
      let sourcePoints = 0;
      let searchUrl = '';
      
      try {
        const host = new URL(source.url).hostname;
        const baseTerm = variants[0] || searchCompanyName;
        const query = `${[cnpjQuoted, cnpjDigitsQuoted, `"${baseTerm}"`].filter(Boolean).join(' OR ')} site:${host}`;
        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        const items = await serperSearch(query, 5);
          
        // Se encontrou resultados, é uma menção válida
        if (items.length > 0) {
          for (const item of items) {
            const fullText = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
            const normalizedText = normalizeName(fullText);
            
            // Verificar se contém o nome da empresa (mais flexível)
            const companyMentioned = variants.some(v => normalizedText.includes(v)) || (cnpjDigits && digitsOnly(fullText).includes(cnpjDigits));
            
            if (companyMentioned) {
              // Detectar sinais negativos
              const isNegative = negativeKeywords.some(k => normalizedText.includes(k));
              
              if (isNegative) {
                sourcePoints = -source.points;
                signals.push({
                  type: 'legal_negative',
                  score: sourcePoints,
                  title: `⚠️ ALERTA: ${item.title}`,
                  description: item.snippet || '',
                  url: item.link,
                  timestamp: new Date().toISOString(),
                  confidence: 'high',
                  reason: `🚨 SINAL NEGATIVO em ${source.name}: Recuperação judicial, falência ou protesto detectado`
                });
                console.log(`[NEGATIVO] ${source.name}: ${item.title}`);
              } else {
                sourcePoints = source.points;
                signals.push({
                  type: 'official_record',
                  score: sourcePoints,
                  title: item.title,
                  description: item.snippet || '',
                  url: item.link,
                  timestamp: new Date().toISOString(),
                  confidence: 'high',
                  reason: `Menção oficial em ${source.name}`
                });
              }
              break; // Encontrou uma menção válida, não precisa continuar
            }
          }
        }
      } catch (e) {
        console.error(`[detect-intent-v3] Erro ${source.name}:`, e);
      }
      
      scoreBreakdown.push({
        source: source.name,
        points_awarded: sourcePoints,
        max_points: source.points,
        reason: sourcePoints < 0 ? `🚨 SINAL NEGATIVO: Recuperação judicial ou problema legal` : sourcePoints > 0 ? `Menção encontrada em ${source.name}` : 'Nenhuma menção encontrada',
        search_url: searchUrl
      });
    }

    // FONTES DE NOTÍCIAS E ANÁLISES (15 pontos cada, max 75)
    const newsSources = [
      { name: 'Valor Econômico', url: 'https://valor.globo.com/', points: 15 },
      { name: 'Exame', url: 'https://exame.com/', points: 15 },
      { name: 'Folha de S.Paulo', url: 'https://www.folha.uol.com.br/', points: 15 },
      { name: 'Estadão', url: 'https://www.estadao.com.br/economia-negocios/', points: 15 },
      { name: 'InfoMoney', url: 'https://www.infomoney.com.br/', points: 15 }
    ];

    // FONTES DE INOVAÇÃO E TECNOLOGIA (15 pontos)
    const innovationSources = [
      { name: 'StartSE', url: 'https://www.startse.com/', points: 15 }
    ];

    // FONTES JUDICIAIS E LEGAIS (10 pontos cada, max 30)
    const legalSources = [
      { name: 'TJSP', url: 'https://esaj.tjsp.jus.br/', points: 10 },
      { name: 'TJRJ', url: 'https://www.tjrj.jus.br/', points: 10 },
      { name: 'CNJ', url: 'https://www.cnj.jus.br/', points: 10 },
      { name: 'Imprensa Oficial SP', url: 'https://www.imprensaoficial.com.br/', points: 10 },
      { name: 'PJe Comunica', url: 'https://comunica.pje.jus.br/', points: 10 }
    ];

    // FONTES OPEN WEB - Públicas e acessíveis (10 pontos cada)
    const openWebSources = [
      { name: 'CVM RAD', url: 'https://www.rad.cvm.gov.br/', points: 10 },
      { name: 'B3 BVMF', url: 'https://bvmf.bmfbovespa.com.br/', points: 10 },
      { name: 'Serasa Experian', url: 'https://empresas.serasaexperian.com.br/', points: 10 },
      { name: 'ADVFN Brasil', url: 'https://br.advfn.com/', points: 10 },
      { name: 'Investidor10', url: 'https://investidor10.com.br/', points: 10 },
      { name: 'Banco Central', url: 'https://aprendervalor.bcb.gov.br/', points: 10 },
      { name: 'Jusbrasil', url: 'https://www.jusbrasil.com.br/', points: 10 },
      { name: 'IstoÉ Dinheiro', url: 'https://istoedinheiro.com.br/', points: 10 },
      { name: 'Alta Administração', url: 'https://altaadmjudicial.com/', points: 10 },
      { name: 'Public Now', url: 'https://docs.publicnow.com/', points: 10 },
      { name: 'B3 Site Empresas', url: 'http://siteempresas.bovespa.com.br/', points: 10 },
      { name: 'Reclame Aqui', url: 'https://www.reclameaqui.com.br/', points: 10 },
      { name: 'TMA Brasil', url: 'https://www.tmabrasil.org/', points: 10 }
    ];

    for (const source of newsSources) {
      platformsScanned.push(source.name);
      let sourcePoints = 0;
      let searchUrl = '';
      
      try {
        const keywords = ['investimento', 'aporte', 'captação', 'expansão', 'tecnologia', 'digital', 'transformação', 'aumento de capital'];
        const baseTerm = variants[0] || searchCompanyName;
        const host = new URL(source.url).hostname;
        const left = [cnpjQuoted, cnpjDigitsQuoted, `"${baseTerm}"`].filter(Boolean).join(' OR ');
        const query = `${left} (${keywords.map(k => `"${k}"`).join(' OR ')}) site:${host}`;
        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        const items = await serperSearch(query, 3);
        
        for (const item of items) {
          const fullText = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
          const normalizedText = normalizeName(fullText);
          
          if (variants.some(v => normalizedText.includes(v)) || (cnpjDigits && digitsOnly(fullText).includes(cnpjDigits))) {
            sourcePoints = source.points;
            signals.push({
              type: 'news_mention',
              score: source.points,
              title: item.title,
              description: item.snippet || '',
              url: item.link,
              timestamp: new Date().toISOString(),
              confidence: 'medium',
              reason: `Notícia sobre investimento/expansão em ${source.name}`
            });
            break;
          }
        }
      } catch (e) {
        console.error(`[detect-intent-v3] Erro ${source.name}:`, e);
      }
      
      scoreBreakdown.push({
        source: source.name,
        points_awarded: sourcePoints,
        max_points: source.points,
        reason: sourcePoints > 0 ? `Notícia relevante encontrada em ${source.name}` : 'Nenhuma notícia relevante',
        search_url: searchUrl
      });
    }

    // FONTES DE INOVAÇÃO E TECNOLOGIA - 15 pontos
    for (const source of innovationSources) {
      platformsScanned.push(source.name);
      let sourcePoints = 0;
      let searchUrl = '';
      
      try {
        const keywords = ['startup', 'inovação', 'tecnologia', 'transformação digital', 'investimento', 'aporte', 'captação'];
        const baseTerm = variants[0] || searchCompanyName;
        const host = new URL(source.url).hostname;
        const left = [cnpjQuoted, cnpjDigitsQuoted, `"${baseTerm}"`].filter(Boolean).join(' OR ');
        const query = `${left} (${keywords.map(k => `"${k}"`).join(' OR ')}) site:${host}`;
        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        const items = await serperSearch(query, 3);
        
        for (const item of items) {
          const fullText = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
          const normalizedText = normalizeName(fullText);
          
          if (variants.some(v => normalizedText.includes(v)) || (cnpjDigits && digitsOnly(fullText).includes(cnpjDigits))) {
            sourcePoints = source.points;
            signals.push({
              type: 'innovation_mention',
              score: source.points,
              title: item.title,
              description: item.snippet || '',
              url: item.link,
              timestamp: new Date().toISOString(),
              confidence: 'medium',
              reason: `Menção em portal de inovação (${source.name})`
            });
            break;
          }
        }
      } catch (e) {
        console.error(`[detect-intent-v3] Erro ${source.name}:`, e);
      }
      
      scoreBreakdown.push({
        source: source.name,
        points_awarded: sourcePoints,
        max_points: source.points,
        reason: sourcePoints > 0 ? `Menção em ${source.name}` : 'Nenhuma menção relevante',
        search_url: searchUrl
      });
    }

    // FONTES JUDICIAIS E LEGAIS - 10 pontos cada
    for (const source of legalSources) {
      platformsScanned.push(source.name);
      let sourcePoints = 0;
      let searchUrl = '';
      
      try {
        const host = new URL(source.url).hostname;
        const baseTerm = variants[0] || searchCompanyName;
        const query = `${[cnpjQuoted, cnpjDigitsQuoted, `"${baseTerm}"`].filter(Boolean).join(' OR ')} site:${host}`;
        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        const items = await serperSearch(query, 3);
        
        for (const item of items) {
          const fullText = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
          const normalizedText = normalizeName(fullText);
          
          if (variants.some(v => normalizedText.includes(v)) || (cnpjDigits && digitsOnly(fullText).includes(cnpjDigits))) {
            const isNegative = negativeKeywords.some(k => normalizedText.includes(k));
            sourcePoints = isNegative ? -source.points : source.points;
            signals.push({
              type: isNegative ? 'legal_negative' : 'legal_record',
              score: sourcePoints,
              title: isNegative ? `⚠️ ALERTA LEGAL: ${item.title}` : item.title,
              description: item.snippet || '',
              url: item.link,
              timestamp: new Date().toISOString(),
              confidence: 'high',
              reason: isNegative ? `🚨 SINAL NEGATIVO (${source.name}): Recuperação judicial/falência/protesto` : `Registro em fonte judicial/legal (${source.name})`
            });
            break;
          }
        }
      } catch (e) {
        console.error(`[detect-intent-v3] Erro ${source.name}:`, e);
      }
      
      scoreBreakdown.push({
        source: source.name,
        points_awarded: sourcePoints,
        max_points: source.points,
        reason: sourcePoints < 0 ? `🚨 SINAL NEGATIVO: Problema judicial/legal` : sourcePoints > 0 ? `Registro encontrado em ${source.name}` : 'Nenhum registro encontrado',
        search_url: searchUrl
      });
    }

    // FONTES OPEN WEB - 10 pontos cada
    for (const source of openWebSources) {
      platformsScanned.push(source.name);
      let sourcePoints = 0;
      let searchUrl = '';
      
      try {
        const host = new URL(source.url).hostname;
        const baseTerm = variants[0] || searchCompanyName;
        const query = `${[cnpjQuoted, cnpjDigitsQuoted, `"${baseTerm}"`].filter(Boolean).join(' OR ')} site:${host}`;
        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        const items = await serperSearch(query, 5);
        
        for (const item of items) {
          const fullText = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
          const normalizedText = normalizeName(fullText);
          
          if (variants.some(v => normalizedText.includes(v)) || (cnpjDigits && digitsOnly(fullText).includes(cnpjDigits))) {
            const isNegative = negativeKeywords.some(k => normalizedText.includes(k));
            
            if (isNegative) {
              sourcePoints = -source.points;
              signals.push({
                type: 'legal_negative',
                score: sourcePoints,
                title: `⚠️ ALERTA (${source.name}): ${item.title}`,
                description: item.snippet || '',
                url: item.link,
                timestamp: new Date().toISOString(),
                confidence: 'high',
                reason: `🚨 SINAL NEGATIVO encontrado em fonte pública`
              });
            } else {
              sourcePoints = source.points;
              signals.push({
                type: 'open_web_mention',
                score: sourcePoints,
                title: item.title,
                description: item.snippet || '',
                url: item.link,
                timestamp: new Date().toISOString(),
                confidence: 'medium',
                reason: `Menção encontrada em fonte pública (${source.name})`
              });
            }
            break;
          }
        }
      } catch (e) {
        console.error(`[detect-intent-v3] Erro ${source.name}:`, e);
      }
      
      scoreBreakdown.push({
        source: source.name,
        points_awarded: sourcePoints,
        max_points: source.points,
        reason: sourcePoints < 0 ? `🚨 SINAL NEGATIVO encontrado` : sourcePoints > 0 ? `Menção encontrada em ${source.name}` : 'Nenhuma menção encontrada',
        search_url: searchUrl
      });
    }

    // JOB POSTINGS (LinkedIn Jobs) - 30 pontos
    const jobKeywords = [
      'CIO', 'Diretor TI', 'Gerente TI', 'Analista Sistemas', 
      'ERP', 'Transformação Digital', 'Diretor Tecnologia',
      'VP Technology', 'Head TI', 'Coordenador TI'
    ];
    const baseTerm = variants[0] || searchCompanyName;
    const left = [cnpjQuoted, cnpjDigitsQuoted, `"${baseTerm}"`].filter(Boolean).join(' OR ');
    const jobQuery = `${left} AND (${jobKeywords.map(k => `"${k}"`).join(' OR ')}) site:linkedin.com/jobs`;
    const jobUrl = `https://www.google.com/search?q=${encodeURIComponent(jobQuery)}`;
    
    platformsScanned.push('LinkedIn Jobs');
    let jobPoints = 0;
    
    try {
      const items = await serperSearch(jobQuery, 5);
      
      for (const item of items) {
        const title = item.title || '';
        const snippet = item.snippet || '';
        const fullText = `${title} ${snippet}`.toLowerCase();
        const normalizedText = normalizeName(fullText);
        
        if (variants.some(v => normalizedText.includes(v)) || (cnpjDigits && digitsOnly(fullText).includes(cnpjDigits))) {
          jobPoints = 30;
          signals.push({
            type: 'job_posting',
            score: 30,
            title,
            description: snippet,
            url: item.link,
            timestamp: new Date().toISOString(),
            confidence: 'high',
            reason: 'Vaga estratégica em TI indica investimento'
          });
          break;
        }
      }
      
      scoreBreakdown.push({
        source: 'LinkedIn Jobs',
        points_awarded: jobPoints,
        max_points: 30,
        reason: jobPoints > 0 ? 'Vagas estratégicas encontradas' : 'Nenhuma vaga encontrada',
        search_url: jobUrl
      });
    } catch (e) {
      console.error('[detect-intent-v3] Erro Job Postings:', e);
    }

    // Calcular score total e temperatura
    const totalScore = scoreBreakdown.reduce((sum, b) => sum + b.points_awarded, 0);
    let temperature: 'hot' | 'warm' | 'cold';
    let confidence: 'high' | 'medium' | 'low';
    
    if (totalScore >= 70) {
      temperature = 'hot';
      confidence = 'high';
    } else if (totalScore >= 40) {
      temperature = 'warm';
      confidence = 'medium';
    } else {
      temperature = 'cold';
      confidence = 'low';
    }

    const methodology: Methodology = {
      total_sources_checked: platformsScanned.length,
      sources_with_results: scoreBreakdown.filter(s => s.points_awarded > 0).map(s => s.source),
      sources_without_results: scoreBreakdown.filter(s => s.points_awarded === 0).map(s => s.source),
      score_breakdown: scoreBreakdown,
      calculation_formula: 'Σ(pontos_fonte × peso_fonte) / max_pontos_possíveis × 100',
      threshold_applied: {
        cold_if_below: 40,
        warm_if_between: [40, 69],
        hot_if_above: 70
      }
    };

    // Salvar no banco
    await sb.from('intent_signals_detection').delete().eq('company_id', company_id);
    
    await sb.from('intent_signals_detection').insert({
      company_id,
      company_name: searchCompanyName,
      score: totalScore,
      temperature,
      confidence,
      signals,
      methodology,
      sources_checked: platformsScanned.length,
      platforms_scanned: platformsScanned,
      checked_at: new Date().toISOString(),
      cnpj,
      region,
      sector
    });

    return new Response(
      JSON.stringify({
        ok: true,
        score: totalScore,
        temperature,
        confidence,
        signals,
        methodology,
        sources_checked: platformsScanned.length,
        platforms_scanned: platformsScanned,
        message: `${temperature === 'hot' ? '🔥' : temperature === 'warm' ? '🌡️' : '❄️'} ${temperature.toUpperCase()} LEAD. Score: ${totalScore}/100`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[detect-intent-v3] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
