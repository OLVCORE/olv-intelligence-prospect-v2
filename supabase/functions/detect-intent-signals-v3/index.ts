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
  return variants;
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
    const { company_id, company_name, cnpj, domain, region, sector, niche } = await req.json();

    if (!company_id || !company_name) {
      return new Response(JSON.stringify({ 
        error: 'company_id and company_name required',
        hint: 'Selecione uma empresa primeiro'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[detect-intent-v3] 🔍 Analisando: ${company_name}`);

    const signals: IntentSignal[] = [];
    const platformsScanned: string[] = [];
    const scoreBreakdown: ScoreBreakdown[] = [];
    const variants = tokenVariants(company_name);
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

    // ========================================
    // JOB POSTINGS (LinkedIn Jobs)
    // ========================================
    const jobKeywords = ['CIO', 'Diretor TI', 'Gerente TI', 'Analista Sistemas', 'ERP', 'Transformação Digital'];
    const jobQuery = `"${variants[0]}" AND (${jobKeywords.map(k => `"${k}"`).join(' OR ')}) site:linkedin.com/jobs`;
    const jobUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(jobQuery)}&num=5&dateRestrict=m3`;
    
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
          
          if (validateMention(fullText, company_name)) {
            const matchedKeyword = jobKeywords.find(k => fullText.toLowerCase().includes(k.toLowerCase()));
            
            signals.push({
              type: 'job_posting',
              score: 30,
              title,
              description: snippet,
              url: item.link,
              timestamp: new Date().toISOString(),
              confidence: 'high',
              reason: `Vaga para ${matchedKeyword} indica investimento em TI`
            });
            
            jobPoints = 30;
            break;
          }
        }
      }
    } catch (e) {
      console.error('[detect-intent-v3] ❌ Erro Job Postings:', e);
    }
    
    scoreBreakdown.push({
      source: 'LinkedIn Jobs',
      points_awarded: jobPoints,
      max_points: 30,
      reason: jobPoints > 0
        ? `Vaga de TI encontrada - empresa está investindo em tecnologia`
        : `Nenhuma vaga de TI encontrada nos últimos 3 meses`
    });

    // ========================================
    // GOOGLE NEWS
    // ========================================
    const newsKeywords = ['expansão', 'IPO', 'transformação digital', 'investimento', 'modernização', 'crescimento'];
    const newsQuery = `"${variants[0]}" AND (${newsKeywords.map(k => `"${k}"`).join(' OR ')})`;
    const newsUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(newsQuery)}&num=5&dateRestrict=m6`;
    
    platformsScanned.push('Google News');
    let newsPoints = 0;
    
    try {
      const res = await fetch(newsUrl);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        
        for (const item of items) {
          const title = item.title || '';
          const snippet = item.snippet || '';
          const fullText = `${title} ${snippet}`;
          
          if (validateMention(fullText, company_name)) {
            const matchedKeyword = newsKeywords.find(k => fullText.toLowerCase().includes(k.toLowerCase()));
            
            signals.push({
              type: 'news',
              score: 25,
              title,
              description: snippet,
              url: item.link,
              timestamp: new Date().toISOString(),
              confidence: 'high',
              reason: `Notícia sobre ${matchedKeyword} indica momento de investimento`
            });
            
            newsPoints = 25;
            break;
          }
        }
      }
    } catch (e) {
      console.error('[detect-intent-v3] ❌ Erro News:', e);
    }
    
    scoreBreakdown.push({
      source: 'Google News',
      points_awarded: newsPoints,
      max_points: 25,
      reason: newsPoints > 0
        ? `Notícia recente indica momento favorável para investimento`
        : `Nenhuma notícia relevante encontrada nos últimos 6 meses`
    });

    // ========================================
    // LINKEDIN ACTIVITY
    // ========================================
    const linkedinQuery = `"${variants[0]}" site:linkedin.com/posts AND (contratando OR hiring OR vagas OR oportunidades)`;
    const linkedinUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(linkedinQuery)}&num=5&dateRestrict=m3`;
    
    platformsScanned.push('LinkedIn Activity');
    let linkedinPoints = 0;
    
    try {
      const res = await fetch(linkedinUrl);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        
        for (const item of items) {
          const title = item.title || '';
          const snippet = item.snippet || '';
          const fullText = `${title} ${snippet}`;
          
          if (validateMention(fullText, company_name)) {
            signals.push({
              type: 'linkedin_activity',
              score: 20,
              title,
              description: snippet,
              url: item.link,
              timestamp: new Date().toISOString(),
              confidence: 'medium',
              reason: `Atividade no LinkedIn indica crescimento da empresa`
            });
            
            linkedinPoints = 20;
            break;
          }
        }
      }
    } catch (e) {
      console.error('[detect-intent-v3] ❌ Erro LinkedIn Activity:', e);
    }
    
    scoreBreakdown.push({
      source: 'LinkedIn Activity',
      points_awarded: linkedinPoints,
      max_points: 20,
      reason: linkedinPoints > 0
        ? `Atividade recente no LinkedIn indica crescimento`
        : `Pouca atividade no LinkedIn nos últimos 3 meses`
    });

    // ========================================
    // CALCULAR SCORE TOTAL
    // ========================================
    const totalScore = signals.reduce((sum, s) => sum + s.score, 0);
    const normalizedScore = Math.min(totalScore, 100);
    
    let temperature: 'cold' | 'warm' | 'hot';
    if (normalizedScore >= 70) {
      temperature = 'hot';
    } else if (normalizedScore >= 40) {
      temperature = 'warm';
    } else {
      temperature = 'cold';
    }
    
    const confidence = normalizedScore >= 70 ? 'high' : normalizedScore >= 40 ? 'medium' : 'low';

    // ========================================
    // METODOLOGIA (COMO CHEGOU NO SCORE)
    // ========================================
    const sourcesWithResults = signals.map(s => s.type);
    const sourcesWithoutResults = platformsScanned.filter(p => !signals.some(s => s.title.includes(p)));

    const methodology: Methodology = {
      total_sources_checked: platformsScanned.length,
      sources_with_results: [...new Set(sourcesWithResults)],
      sources_without_results: sourcesWithoutResults,
      score_breakdown: scoreBreakdown,
      calculation_formula: `Score = Σ(pontos de cada fonte com sinal detectado). Máximo: 100 pontos.`,
      threshold_applied: {
        cold_if_below: 40,
        warm_if_between: [40, 69],
        hot_if_above: 70
      }
    };

    // ========================================
    // SALVAR NO BANCO
    // ========================================
    await sb.from('intent_signals_detection').insert({
      company_id,
      company_name,
      score: normalizedScore,
      temperature,
      confidence,
      signals: signals,
      methodology: methodology,
      sources_checked: platformsScanned.length,
      platforms_scanned: platformsScanned,
      checked_at: new Date().toISOString()
    });

    console.log(`[detect-intent-v3] ✅ Score: ${normalizedScore}/100 | Temperatura: ${temperature}`);

    return new Response(JSON.stringify({
      ok: true,
      score: normalizedScore,
      temperature,
      confidence,
      signals,
      methodology,
      sources_checked: platformsScanned.length,
      platforms_scanned: platformsScanned,
      message: temperature === 'hot' 
        ? `🔥 HOT LEAD! Score: ${normalizedScore}/100`
        : temperature === 'warm'
        ? `🌡️ WARM LEAD. Score: ${normalizedScore}/100`
        : `❄️ COLD LEAD. Score: ${normalizedScore}/100`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    console.error('[detect-intent-v3] ❌ ERRO:', e);
    return new Response(JSON.stringify({ 
      error: 'Internal error',
      message: e.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
