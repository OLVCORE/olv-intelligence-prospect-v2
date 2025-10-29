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

const JOB_PLATFORMS = [
  { name: 'LinkedIn', domain: 'linkedin.com/jobs', weight: 30 },
  { name: 'Indeed', domain: 'indeed.com.br', weight: 25 },
  { name: 'Catho', domain: 'catho.com.br', weight: 20 },
  { name: 'Vagas.com', domain: 'vagas.com.br', weight: 20 },
  { name: 'InfoJobs', domain: 'infojobs.com.br', weight: 15 },
  { name: 'GeekHunter', domain: 'geekhunter.com.br', weight: 15 },
  { name: 'Revelo', domain: 'revelo.com.br', weight: 15 },
  { name: 'Programathor', domain: 'programathor.com.br', weight: 10 },
  { name: 'Trampos.co', domain: 'trampos.co', weight: 10 },
  { name: 'APinfo', domain: 'apinfo.com', weight: 10 }
];

const TOTVS_PRODUCTS = [
  'Protheus', 'RM TOTVS', 'Datasul', 'Fluig', 'TOTVS Backoffice',
  'TOTVS Manufatura', 'TOTVS Gestão', 'TOTVS ERP', 'Linha Protheus',
  'Linha RM', 'Microsiga'
];

const TOTVS_KEYWORDS = [
  'TOTVS', 'Protheus', 'Datasul', 'RM TOTVS', 'Fluig', 'Microsiga',
  'TOTVS Backoffice', 'TOTVS Manufatura', 'TOTVS Gestão', 'TOTVS ERP'
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
    const { company_id, company_name, cnpj, domain, region, sector } = await req.json();

    if (!company_id || !company_name) {
      return new Response(JSON.stringify({ 
        error: 'company_id and company_name required',
        hint: 'Selecione uma empresa primeiro'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[detect-totvs-v2] Analisando: ${company_name} (${company_id})`);

    const evidences: Evidence[] = [];
    const platformsScanned: string[] = [];
    const variants = tokenVariants(company_name);
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    const googleCseId = Deno.env.get('GOOGLE_CSE_ID');

    if (!googleApiKey || !googleCseId) {
      return new Response(JSON.stringify({ 
        error: 'Google API not configured',
        hint: 'Configure GOOGLE_API_KEY e GOOGLE_CSE_ID'
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log(`[detect-totvs-v2] Buscando vagas em ${JOB_PLATFORMS.length} plataformas...`);
    
    for (const platform of JOB_PLATFORMS) {
      const query = `"${variants[0]}" AND (${TOTVS_KEYWORDS.slice(0, 3).join(' OR ')}) site:${platform.domain}`;
      const url = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(query)}&num=3`;
      
      platformsScanned.push(platform.name);
      
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const items = data.items || [];
          console.log(`[detect-totvs-v2] ${platform.name}: ${items.length} resultados`);
          
          for (const item of items) {
            const title = item.title || '';
            const snippet = item.snippet || '';
            const fullText = `${title} ${snippet}`;
            
            if (validateMention(fullText, company_name)) {
              const products = detectTotvsProducts(fullText);
              
              console.log(`[detect-totvs-v2] ✅ ${platform.name}: ${title}`);
              
              evidences.push({
                source: 'job_posting',
                platform: platform.name,
                score: platform.weight,
                title,
                snippet,
                url: item.link,
                timestamp: new Date().toISOString(),
                confidence: 'high',
                reason: `Vaga em ${platform.name} menciona ${company_name} + ${products.join(', ') || 'TOTVS'}`,
                totvs_products_mentioned: products
              });
              
              await sb.from('job_postings_detected').insert({
                company_id,
                company_name,
                platform: platform.name,
                job_title: title,
                job_description: snippet,
                job_url: item.link,
                required_skills: [],
                totvs_products_mentioned: products,
                posted_at: new Date().toISOString()
              });
            }
          }
        }
      } catch (e) {
        console.error(`[detect-totvs-v2] Erro ${platform.name}:`, e);
      }
    }

    console.log(`[detect-totvs-v2] Buscando documentos financeiros...`);
    
    const financialQuery = `"${variants[0]}" AND (balanço OR DRE OR "demonstração financeira") AND TOTVS filetype:pdf`;
    const financialUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(financialQuery)}&num=5`;
    
    platformsScanned.push('Financial Docs');
    
    try {
      const res = await fetch(financialUrl);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        console.log(`[detect-totvs-v2] Financial Docs: ${items.length} resultados`);
        
        for (const item of items) {
          const title = item.title || '';
          const snippet = item.snippet || '';
          const fullText = `${title} ${snippet}`;
          
          if (validateMention(fullText, company_name)) {
            const isTotvsCreditor = fullText.toLowerCase().includes('credora') || 
                                  fullText.toLowerCase().includes('fornecedor') ||
                                  fullText.toLowerCase().includes('pagamento');
            
            console.log(`[detect-totvs-v2] ✅ Financial Doc: ${title}`);
            
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
                ? `TOTVS como CREDORA no balanço - DESQUALIFICAR!`
                : `Documento menciona ${company_name} + TOTVS`
            });
            
            await sb.from('financial_docs_detected').insert({
              company_id,
              company_name,
              doc_type: 'balanço',
              doc_url: item.link,
              totvs_mentioned: true,
              totvs_as_creditor: isTotvsCreditor,
              excerpt: snippet
            });
          }
        }
      }
    } catch (e) {
      console.error('[detect-totvs-v2] Erro Financial Docs:', e);
    }

    console.log(`[detect-totvs-v2] Buscando notícias...`);
    
    const newsQuery = `"${variants[0]}" AND ("usa TOTVS" OR "cliente TOTVS" OR "implementou Protheus")`;
    const newsUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(newsQuery)}&num=5&dateRestrict=y1`;
    
    platformsScanned.push('Google News');
    
    try {
      const res = await fetch(newsUrl);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        console.log(`[detect-totvs-v2] Google News: ${items.length} resultados`);
        
        for (const item of items) {
          const title = item.title || '';
          const snippet = item.snippet || '';
          const fullText = `${title} ${snippet}`;
          
          if (validateMention(fullText, company_name)) {
            const products = detectTotvsProducts(fullText);
            
            evidences.push({
              source: 'google_news',
              platform: 'Google News',
              score: 20,
              title,
              snippet,
              url: item.link,
              timestamp: new Date().toISOString(),
              confidence: 'medium',
              reason: `Notícia sobre ${company_name} usando ${products.join(', ') || 'TOTVS'}`,
              totvs_products_mentioned: products
            });
          }
        }
      }
    } catch (e) {
      console.error('[detect-totvs-v2] Erro Google News:', e);
    }

    const totalScore = evidences.reduce((sum, e) => sum + e.score, 0);
    const normalizedScore = Math.min(totalScore, 100);
    const status = normalizedScore >= 70 ? 'disqualified' : 'qualified';
    const confidence = normalizedScore >= 70 ? 'high' : normalizedScore >= 40 ? 'medium' : 'low';
    
    let disqualificationReason = null;
    if (status === 'disqualified') {
      const highestEvidence = evidences.reduce((max, e) => e.score > max.score ? e : max, evidences[0]);
      disqualificationReason = highestEvidence?.reason || 'Score alto de uso TOTVS';
    }

    console.log(`[detect-totvs-v2] Score: ${normalizedScore}/100 | Status: ${status}`);
    console.log(`[detect-totvs-v2] Plataformas: ${platformsScanned.join(', ')}`);

    await sb.from('totvs_usage_detection').insert({
      company_id,
      company_name,
      cnpj,
      region,
      sector,
      score: normalizedScore,
      status,
      confidence,
      disqualification_reason: disqualificationReason,
      evidences: evidences,
      sources_checked: platformsScanned.length,
      platforms_scanned: platformsScanned,
      checked_at: new Date().toISOString()
    });

    console.log(`[detect-totvs-v2] ✅ Análise salva`);

    return new Response(JSON.stringify({
      ok: true,
      score: normalizedScore,
      status,
      confidence,
      disqualification_reason: disqualificationReason,
      evidences,
      sources_checked: platformsScanned.length,
      platforms_scanned: platformsScanned,
      message: status === 'disqualified' 
        ? `⚠️ DESQUALIFICAR: ${disqualificationReason}`
        : `✅ QUALIFICADO: Prospectar!`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    console.error('[detect-totvs-v2] ERRO:', e);
    return new Response(JSON.stringify({ 
      error: 'Internal error',
      message: e.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
