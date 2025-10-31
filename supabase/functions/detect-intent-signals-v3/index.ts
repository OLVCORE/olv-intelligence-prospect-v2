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
    const companyMatches: Map<string, CompanyMatch> = new Map();
    const variants = tokenVariants(searchCompanyName);
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
      { name: 'B3', url: 'https://www.b3.com.br/pt_br/', points: 20 },
      { name: 'Imprensa Nacional', url: 'https://www.in.gov.br/', points: 15 },
      { name: 'B3 Empresas Net', url: 'https://www.b3.com.br/pt_br/produtos-e-servicos/solucoes-para-emissores/sistema-empresas-net/', points: 15 },
      { name: 'B3 Investidor', url: 'https://www.investidor.b3.com.br/', points: 15 }
    ];

    for (const source of officialSources) {
      platformsScanned.push(source.name);
      let sourcePoints = 0;
      
      try {
        const query = `"${variants[0]}" site:${new URL(source.url).hostname}`;
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(query)}&num=3&dateRestrict=y1`;
        
        const res = await fetch(searchUrl);
        if (res.ok) {
          const data = await res.json();
          const items = data.items || [];
          
          for (const item of items) {
            const fullText = `${item.title || ''} ${item.snippet || ''}`;
            const names = extractCompanyNames(fullText);
            
            for (const foundName of names) {
              const matchScore = calculateMatchScore(foundName, searchCompanyName);
              
              if (matchScore >= 60) {
                if (!companyMatches.has(foundName)) {
                  companyMatches.set(foundName, {
                    name: foundName,
                    matchScore,
                    confidence: matchScore >= 80 ? 'high' : matchScore >= 65 ? 'medium' : 'low',
                    matchReasons: [`Encontrado em ${source.name}`, `Score de match: ${matchScore}%`],
                    sources: [source.name],
                    signals: { positive: [], negative: [], neutral: [] }
                  });
                } else {
                  const match = companyMatches.get(foundName)!;
                  match.sources.push(source.name);
                  match.matchScore = Math.max(match.matchScore, matchScore);
                }
              }
              
              if (validateMention(fullText, searchCompanyName)) {
                sourcePoints = source.points;
                signals.push({
                  type: 'official_record',
                  score: source.points,
                  title: item.title,
                  description: item.snippet || '',
                  url: item.link,
                  timestamp: new Date().toISOString(),
                  confidence: 'high',
                  reason: `Menção oficial em ${source.name}`
                });
                
                const match = companyMatches.get(foundName);
                if (match) {
                  match.signals.positive.push(`Menção oficial em ${source.name}`);
                }
                break;
              }
            }
          }
          
          scoreBreakdown.push({
            source: source.name,
            points_awarded: sourcePoints,
            max_points: source.points,
            reason: sourcePoints > 0 ? `Menção encontrada em ${source.name}` : 'Nenhuma menção encontrada',
            search_url: searchUrl
          });
        }
      } catch (e) {
        console.error(`[detect-intent-v3] Erro ${source.name}:`, e);
      }
    }

    // FONTES DE NOTÍCIAS E ANÁLISES (15 pontos cada, max 75)
    const newsSources = [
      { name: 'Valor Econômico', url: 'https://valor.globo.com/', points: 15 },
      { name: 'Exame', url: 'https://exame.com/', points: 15 },
      { name: 'Folha de S.Paulo', url: 'https://www.folha.uol.com.br/', points: 15 },
      { name: 'Estadão', url: 'https://www.estadao.com.br/economia-negocios/', points: 15 },
      { name: 'InfoMoney', url: 'https://www.infomoney.com.br/', points: 15 }
    ];

    for (const source of newsSources) {
      platformsScanned.push(source.name);
      let sourcePoints = 0;
      
      try {
        const keywords = ['investimento', 'expansão', 'tecnologia', 'digital', 'transformação'];
        const query = `"${variants[0]}" (${keywords.join(' OR ')}) site:${new URL(source.url).hostname}`;
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(query)}&num=3&dateRestrict=m6`;
        
        const res = await fetch(searchUrl);
        if (res.ok) {
          const data = await res.json();
          const items = data.items || [];
          
          for (const item of items) {
            const fullText = `${item.title || ''} ${item.snippet || ''}`;
            const names = extractCompanyNames(fullText);
            
            for (const foundName of names) {
              const matchScore = calculateMatchScore(foundName, searchCompanyName);
              
              if (matchScore >= 60) {
                if (!companyMatches.has(foundName)) {
                  companyMatches.set(foundName, {
                    name: foundName,
                    matchScore,
                    confidence: matchScore >= 80 ? 'high' : matchScore >= 65 ? 'medium' : 'low',
                    matchReasons: [`Encontrado em ${source.name}`, `Score de match: ${matchScore}%`],
                    sources: [source.name],
                    signals: { positive: [], negative: [], neutral: [] }
                  });
                } else {
                  const match = companyMatches.get(foundName)!;
                  match.sources.push(source.name);
                  match.matchScore = Math.max(match.matchScore, matchScore);
                }
              }
              
              if (validateMention(fullText, searchCompanyName)) {
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
                
                const match = companyMatches.get(foundName);
                if (match) {
                  match.signals.positive.push(`Notícia positiva em ${source.name}`);
                }
                break;
              }
            }
          }
          
          scoreBreakdown.push({
            source: source.name,
            points_awarded: sourcePoints,
            max_points: source.points,
            reason: sourcePoints > 0 ? `Notícia relevante encontrada em ${source.name}` : 'Nenhuma notícia relevante',
            search_url: searchUrl
          });
        }
      } catch (e) {
        console.error(`[detect-intent-v3] Erro ${source.name}:`, e);
      }
    }

    // JOB POSTINGS (LinkedIn Jobs) - 30 pontos
    const jobKeywords = [
      'CIO', 'Diretor TI', 'Gerente TI', 'Analista Sistemas', 
      'ERP', 'Transformação Digital', 'Diretor Tecnologia',
      'VP Technology', 'Head TI', 'Coordenador TI'
    ];
    const jobQuery = `"${variants[0]}" AND (${jobKeywords.map(k => `"${k}"`).join(' OR ')}) site:linkedin.com/jobs`;
    const jobUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(jobQuery)}&num=5&dateRestrict=y1`;
    
    platformsScanned.push('LinkedIn Jobs');
    let jobPoints = 0;
    
    try {
      const res = await fetch(jobUrl);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        
        for (const item of items) {
          const title = item.title || '';
          const snippet = item.snippet || '';
          const fullText = `${title} ${snippet}`;
          const names = extractCompanyNames(fullText);
          
          for (const foundName of names) {
            const matchScore = calculateMatchScore(foundName, searchCompanyName);
            
            if (matchScore >= 60) {
              if (!companyMatches.has(foundName)) {
                companyMatches.set(foundName, {
                  name: foundName,
                  matchScore,
                  confidence: matchScore >= 80 ? 'high' : matchScore >= 65 ? 'medium' : 'low',
                  matchReasons: [`Encontrado no LinkedIn Jobs`, `Score de match: ${matchScore}%`],
                  sources: ['LinkedIn Jobs'],
                  signals: { positive: [], negative: [], neutral: [] }
                });
              } else {
                const match = companyMatches.get(foundName)!;
                if (!match.sources.includes('LinkedIn Jobs')) {
                  match.sources.push('LinkedIn Jobs');
                }
                match.matchScore = Math.max(match.matchScore, matchScore);
              }
            }
          }
          
          if (validateMention(fullText, searchCompanyName)) {
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
            
            for (const match of companyMatches.values()) {
              if (validateMention(fullText, match.name)) {
                match.signals.positive.push('Vaga estratégica em TI');
              }
            }
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
      }
    } catch (e) {
      console.error('[detect-intent-v3] Erro Job Postings:', e);
    }

    // Se encontramos múltiplas empresas e não foi feita uma seleção ainda
    const matchesArray = Array.from(companyMatches.values())
      .sort((a, b) => b.matchScore - a.matchScore);
    
    if (!selected_company_name && matchesArray.length > 1) {
      console.log(`[detect-intent-v3] 🔍 Múltiplas empresas encontradas: ${matchesArray.length}`);
      return new Response(
        JSON.stringify({
          multiple_matches: true,
          matches: matchesArray,
          original_company_name: company_name
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
    await sb.from('intent_signals_v3_detections').delete().eq('company_id', company_id);
    
    await sb.from('intent_signals_v3_detections').insert({
      company_id,
      score: totalScore,
      temperature,
      confidence,
      signals,
      methodology,
      checked_at: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        success: true,
        company_id,
        company_name,
        score: totalScore,
        temperature,
        confidence,
        signals_count: signals.length,
        methodology
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
