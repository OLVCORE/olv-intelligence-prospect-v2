// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Evidence = {
  source: string;
  platform: string;
  score: number;
  title: string;
  snippet: string;
  url: string;
  timestamp: string;
  confidence: string;
  reason: string;
  totvs_products_mentioned?: string[];
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
    qualified_if_below: number;
    disqualified_if_above: number;
  };
};

const JOB_PLATFORMS = [
  { name: 'LinkedIn', domain: 'linkedin.com/jobs', weight: 30 },
  { name: 'Indeed', domain: 'indeed.com.br', weight: 25 },
  { name: 'Catho', domain: 'catho.com.br', weight: 20 },
  { name: 'Vagas.com', domain: 'vagas.com.br', weight: 20 },
  { name: 'InfoJobs', domain: 'infojobs.com.br', weight: 15 }
];

const TOTVS_PRODUCTS = [
  'Protheus', 'RM TOTVS', 'Datasul', 'Fluig', 'TOTVS Backoffice',
  'TOTVS Manufatura', 'TOTVS Gestão', 'TOTVS ERP', 'Linha Protheus',
  'Linha RM', 'Microsiga'
];

const TOTVS_KEYWORDS = [
  'TOTVS', 'Protheus', 'Datasul', 'RM TOTVS', 'Fluig', 'Microsiga'
];

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

function detectTotvsProducts(text: string): string[] {
  const detected: string[] = [];
  const normalized = text.toLowerCase();
  
  for (const product of TOTVS_PRODUCTS) {
    if (normalized.includes(product.toLowerCase())) {
      detected.push(product);
    }
  }
  
  return [...new Set(detected)];
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

    console.log(`[detect-totvs-v3] 🔍 Analisando: ${company_name}`);

    const evidences: Evidence[] = [];
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
    // BUSCAR EM MÚLTIPLAS PLATAFORMAS
    // ========================================
    for (const platform of JOB_PLATFORMS) {
      const query = `"${variants[0]}" AND (${TOTVS_KEYWORDS.map(k => `"${k}"`).join(' OR ')}) site:${platform.domain}`;
      const url = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(query)}&num=5`;
      
      platformsScanned.push(platform.name);
      let pointsAwarded = 0;
      
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const items = data.items || [];
          
          for (const item of items) {
            const title = item.title || '';
            const snippet = item.snippet || '';
            const fullText = `${title} ${snippet}`;
            
            if (validateMention(fullText, company_name)) {
              const products = detectTotvsProducts(fullText);
              
              evidences.push({
                source: 'job_posting',
                platform: platform.name,
                score: platform.weight,
                title,
                snippet,
                url: item.link,
                timestamp: new Date().toISOString(),
                confidence: 'high',
                reason: `Vaga em ${platform.name} menciona ${company_name} + ${products.join(', ')}`,
                totvs_products_mentioned: products
              });
              
              pointsAwarded = platform.weight;
              break;
            }
          }
        }
      } catch (e) {
        console.error(`[detect-totvs-v3] ❌ Erro ${platform.name}:`, e);
      }
      
      scoreBreakdown.push({
        source: platform.name,
        points_awarded: pointsAwarded,
        max_points: platform.weight,
        reason: pointsAwarded > 0 
          ? `Vaga encontrada mencionando ${company_name} + produtos TOTVS`
          : `Nenhuma vaga encontrada mencionando ${company_name} + TOTVS`
      });
    }

    // ========================================
    // DOCUMENTOS FINANCEIROS
    // ========================================
    const financialQuery = `"${variants[0]}" AND (balanço OR DRE) AND (TOTVS OR Protheus OR Datasul) filetype:pdf`;
    const financialUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(financialQuery)}&num=10`;
    
    platformsScanned.push('Financial Docs');
    let financialPoints = 0;
    
    try {
      const res = await fetch(financialUrl);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        
        for (const item of items) {
          const title = item.title || '';
          const snippet = item.snippet || '';
          const fullText = `${title} ${snippet}`;
          
          if (validateMention(fullText, company_name)) {
            const isTotvsCreditor = fullText.toLowerCase().includes('credora') || 
                                   fullText.toLowerCase().includes('fornecedor');
            
            evidences.push({
              source: 'financial_doc',
              platform: 'Financial Docs',
              score: isTotvsCreditor ? 50 : 25,
              title,
              snippet,
              url: item.link,
              timestamp: new Date().toISOString(),
              confidence: isTotvsCreditor ? 'high' : 'medium',
              reason: isTotvsCreditor 
                ? `TOTVS aparece como CREDORA no balanço - empresa JÁ COMPROU software TOTVS`
                : `Documento financeiro menciona TOTVS`
            });
            
            financialPoints = isTotvsCreditor ? 50 : 25;
            break;
          }
        }
      }
    } catch (e) {
      console.error('[detect-totvs-v3] ❌ Erro Financial Docs:', e);
    }
    
    scoreBreakdown.push({
      source: 'Financial Docs',
      points_awarded: financialPoints,
      max_points: 50,
      reason: financialPoints === 50 
        ? `TOTVS como credora em balanço - empresa JÁ É CLIENTE`
        : financialPoints === 25
        ? `Documento menciona TOTVS mas não como credora`
        : `Nenhum documento financeiro encontrado`
    });

    // ========================================
    // CALCULAR SCORE TOTAL
    // ========================================
    const totalScore = evidences.reduce((sum, e) => sum + e.score, 0);
    const normalizedScore = Math.min(totalScore, 100);
    const status = normalizedScore >= 70 ? 'disqualified' : 'qualified';
    const confidence = normalizedScore >= 70 ? 'high' : normalizedScore >= 40 ? 'medium' : 'low';
    
    let disqualificationReason = null;
    if (status === 'disqualified') {
      const highestScoreEvidence = evidences.reduce((max, e) => e.score > max.score ? e : max, evidences[0]);
      disqualificationReason = highestScoreEvidence?.reason || 'Empresa já usa TOTVS';
    }

    // ========================================
    // METODOLOGIA (COMO CHEGOU NO SCORE)
    // ========================================
    const sourcesWithResults = evidences.map(e => e.platform);
    const sourcesWithoutResults = platformsScanned.filter(p => !sourcesWithResults.includes(p));

    const methodology: Methodology = {
      total_sources_checked: platformsScanned.length,
      sources_with_results: [...new Set(sourcesWithResults)],
      sources_without_results: sourcesWithoutResults,
      score_breakdown: scoreBreakdown,
      calculation_formula: `Score = Σ(pontos de cada fonte com evidência válida). Máximo: 100 pontos.`,
      threshold_applied: {
        qualified_if_below: 70,
        disqualified_if_above: 70
      }
    };

    // ========================================
    // SALVAR NO BANCO
    // ========================================
    await sb.from('totvs_usage_detection').insert({
      company_id,
      company_name,
      score: normalizedScore,
      status,
      confidence,
      disqualification_reason: disqualificationReason,
      evidences: evidences,
      methodology: methodology,
      sources_checked: platformsScanned.length,
      platforms_scanned: platformsScanned,
      checked_at: new Date().toISOString()
    });

    console.log(`[detect-totvs-v3] ✅ Score: ${normalizedScore}/100 | Status: ${status}`);

    return new Response(JSON.stringify({
      ok: true,
      score: normalizedScore,
      status,
      confidence,
      disqualification_reason: disqualificationReason,
      evidences,
      methodology,
      sources_checked: platformsScanned.length,
      platforms_scanned: platformsScanned,
      message: status === 'disqualified' 
        ? `⚠️ DESQUALIFICAR: Empresa já usa TOTVS (score: ${normalizedScore}/100)`
        : `✅ QUALIFICADO: Empresa não usa TOTVS (score: ${normalizedScore}/100)`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    console.error('[detect-totvs-v3] ❌ ERRO:', e);
    return new Response(JSON.stringify({ 
      error: 'Internal error',
      message: e.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
