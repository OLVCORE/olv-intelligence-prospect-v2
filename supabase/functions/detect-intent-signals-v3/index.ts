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

    // JOB POSTINGS (LinkedIn Jobs)
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
          
          if (validateMention(fullText, company_name)) {
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
