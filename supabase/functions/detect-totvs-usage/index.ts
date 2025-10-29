// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

type Evidence = {
  source: 'linkedin_jobs' | 'financial_docs' | 'google_news' | 'reclame_aqui' | 'website';
  score: number;
  title: string;
  snippet: string;
  url: string;
  timestamp: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
};

function normalizeName(raw: string): string {
  return raw
    .replace(/\b(LTDA|Ltda|ME|EPP|EIRELI|S\.?A\.?|SA|CIA|HOLDING|PARTICIPA(C|Ç)OES|GRUPO)\b\.?/gi, " ")
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
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const { company_id, company_name, domain } = await req.json();

    if (!company_id) {
      return new Response(JSON.stringify({ 
        error: 'company_id required',
        hint: 'Selecione uma empresa primeiro'
      }), { 
        status: 400, 
        headers 
      });
    }

    if (!company_name) {
      return new Response(JSON.stringify({ 
        error: 'company_name required',
        hint: 'Nome da empresa não encontrado'
      }), { 
        status: 400, 
        headers 
      });
    }

    console.log(`[detect-totvs-usage] Analisando empresa: ${company_name} (${company_id})`);

    const evidences: Evidence[] = [];
    const variants = tokenVariants(company_name);
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    const googleCseId = Deno.env.get('GOOGLE_CSE_ID');

    if (!googleApiKey || !googleCseId) {
      return new Response(JSON.stringify({ 
        error: 'Google API not configured',
        hint: 'Configure GOOGLE_API_KEY and GOOGLE_CSE_ID no Supabase'
      }), { 
        status: 500, 
        headers 
      });
    }

    console.log(`[detect-totvs-usage] Tokens de busca: ${variants.join(', ')}`);

    // ========================================
    // 1. LINKEDIN JOBS (30 pts)
    // ========================================
    const linkedinQuery = `"${variants[0]}" AND (Protheus OR "RM TOTVS" OR Datasul OR Fluig OR "TOTVS Backoffice") site:linkedin.com/jobs`;
    const linkedinUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(linkedinQuery)}&num=5`;
    
    console.log(`[detect-totvs-usage] Buscando LinkedIn Jobs...`);
    try {
      const linkedinRes = await fetch(linkedinUrl);
      if (linkedinRes.ok) {
        const linkedinData = await linkedinRes.json();
        const items = linkedinData.items || [];
        console.log(`[detect-totvs-usage] LinkedIn Jobs: ${items.length} resultados`);
        
        for (const item of items) {
          const title = item.title || '';
          const snippet = item.snippet || '';
          const fullText = `${title} ${snippet}`;
          
          if (validateMention(fullText, company_name)) {
            console.log(`[detect-totvs-usage] ✅ LinkedIn Jobs: Evidência encontrada - ${title}`);
            evidences.push({
              source: 'linkedin_jobs',
              score: 30,
              title,
              snippet,
              url: item.link,
              timestamp: new Date().toISOString(),
              confidence: 'high',
              reason: `Vaga menciona ${company_name} + produto TOTVS`
            });
          } else {
            console.log(`[detect-totvs-usage] ❌ LinkedIn Jobs: Resultado descartado (não menciona empresa)`);
          }
        }
      }
    } catch (e) {
      console.error('[detect-totvs-usage] Erro LinkedIn Jobs:', e);
    }

    // ========================================
    // 2. FINANCIAL DOCS (25 pts)
    // ========================================
    const financialQuery = `"${variants[0]}" AND (balanço OR DRE OR "demonstração financeira") AND (TOTVS OR Protheus OR Datasul) filetype:pdf`;
    const financialUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(financialQuery)}&num=5`;
    
    console.log(`[detect-totvs-usage] Buscando Documentos Financeiros...`);
    try {
      const financialRes = await fetch(financialUrl);
      if (financialRes.ok) {
        const financialData = await financialRes.json();
        const items = financialData.items || [];
        console.log(`[detect-totvs-usage] Financial Docs: ${items.length} resultados`);
        
        for (const item of items) {
          const title = item.title || '';
          const snippet = item.snippet || '';
          const fullText = `${title} ${snippet}`;
          
          if (validateMention(fullText, company_name)) {
            console.log(`[detect-totvs-usage] ✅ Financial Docs: Evidência encontrada - ${title}`);
            evidences.push({
              source: 'financial_docs',
              score: 25,
              title,
              snippet,
              url: item.link,
              timestamp: new Date().toISOString(),
              confidence: 'high',
              reason: `Documento financeiro menciona ${company_name} + TOTVS`
            });
          } else {
            console.log(`[detect-totvs-usage] ❌ Financial Docs: Resultado descartado (não menciona empresa)`);
          }
        }
      }
    } catch (e) {
      console.error('[detect-totvs-usage] Erro Financial Docs:', e);
    }

    // ========================================
    // 3. GOOGLE NEWS (20 pts)
    // ========================================
    const newsQuery = `"${variants[0]}" AND ("usa TOTVS" OR "cliente TOTVS" OR "implementou Protheus" OR "adotou Datasul")`;
    const newsUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(newsQuery)}&num=5&dateRestrict=y1`;
    
    console.log(`[detect-totvs-usage] Buscando Google News...`);
    try {
      const newsRes = await fetch(newsUrl);
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        const items = newsData.items || [];
        console.log(`[detect-totvs-usage] Google News: ${items.length} resultados`);
        
        for (const item of items) {
          const title = item.title || '';
          const snippet = item.snippet || '';
          const fullText = `${title} ${snippet}`;
          
          if (validateMention(fullText, company_name)) {
            console.log(`[detect-totvs-usage] ✅ Google News: Evidência encontrada - ${title}`);
            evidences.push({
              source: 'google_news',
              score: 20,
              title,
              snippet,
              url: item.link,
              timestamp: new Date().toISOString(),
              confidence: 'medium',
              reason: `Notícia menciona ${company_name} usando TOTVS`
            });
          } else {
            console.log(`[detect-totvs-usage] ❌ Google News: Resultado descartado (não menciona empresa)`);
          }
        }
      }
    } catch (e) {
      console.error('[detect-totvs-usage] Erro Google News:', e);
    }

    // ========================================
    // 4. RECLAME AQUI (15 pts)
    // ========================================
    const reclameQuery = `"${variants[0]}" AND TOTVS site:reclameaqui.com.br`;
    const reclameUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(reclameQuery)}&num=5`;
    
    console.log(`[detect-totvs-usage] Buscando Reclame Aqui...`);
    try {
      const reclameRes = await fetch(reclameUrl);
      if (reclameRes.ok) {
        const reclameData = await reclameRes.json();
        const items = reclameData.items || [];
        console.log(`[detect-totvs-usage] Reclame Aqui: ${items.length} resultados`);
        
        for (const item of items) {
          const title = item.title || '';
          const snippet = item.snippet || '';
          const fullText = `${title} ${snippet}`;
          
          if (validateMention(fullText, company_name)) {
            console.log(`[detect-totvs-usage] ✅ Reclame Aqui: Evidência encontrada - ${title}`);
            evidences.push({
              source: 'reclame_aqui',
              score: 15,
              title,
              snippet,
              url: item.link,
              timestamp: new Date().toISOString(),
              confidence: 'medium',
              reason: `Reclamação menciona ${company_name} + TOTVS`
            });
          } else {
            console.log(`[detect-totvs-usage] ❌ Reclame Aqui: Resultado descartado (não menciona empresa)`);
          }
        }
      }
    } catch (e) {
      console.error('[detect-totvs-usage] Erro Reclame Aqui:', e);
    }

    // ========================================
    // 5. WEBSITE (10 pts)
    // ========================================
    if (domain) {
      const websiteQuery = `site:${domain} AND (TOTVS OR Protheus OR Datasul OR "RM TOTVS")`;
      const websiteUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(websiteQuery)}&num=5`;
      
      console.log(`[detect-totvs-usage] Buscando Website (${domain})...`);
      try {
        const websiteRes = await fetch(websiteUrl);
        if (websiteRes.ok) {
          const websiteData = await websiteRes.json();
          const items = websiteData.items || [];
          console.log(`[detect-totvs-usage] Website: ${items.length} resultados`);
          
          for (const item of items) {
            console.log(`[detect-totvs-usage] ✅ Website: Evidência encontrada - ${item.title}`);
            evidences.push({
              source: 'website',
              score: 10,
              title: item.title || '',
              snippet: item.snippet || '',
              url: item.link,
              timestamp: new Date().toISOString(),
              confidence: 'low',
              reason: `Site da empresa menciona TOTVS`
            });
          }
        }
      } catch (e) {
        console.error('[detect-totvs-usage] Erro Website:', e);
      }
    } else {
      console.log(`[detect-totvs-usage] ⚠️ Website: Domínio não fornecido, pulando busca`);
    }

    // ========================================
    // CALCULAR SCORE TOTAL
    // ========================================
    const totalScore = evidences.reduce((sum, e) => sum + e.score, 0);
    const maxScore = 100;
    const normalizedScore = Math.min(totalScore, maxScore);

    const status = normalizedScore >= 70 ? 'disqualified' : 'qualified';

    console.log(`[detect-totvs-usage] Score final: ${normalizedScore}/100 (${evidences.length} evidências)`);
    console.log(`[detect-totvs-usage] Status: ${status}`);

    // ========================================
    // SALVAR NO BANCO
    // ========================================
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await sb.from('totvs_usage_detection').insert({
      company_id,
      company_name,
      score: normalizedScore,
      status,
      evidences: evidences,
      sources_checked: 5,
      checked_at: new Date().toISOString()
    });

    console.log(`[detect-totvs-usage] ✅ Análise salva no banco`);

    return new Response(JSON.stringify({
      ok: true,
      score: normalizedScore,
      status,
      evidences,
      sources_checked: 5,
      message: status === 'disqualified' 
        ? `⚠️ Empresa já usa TOTVS (score: ${normalizedScore}/100)`
        : `✅ Empresa não usa TOTVS (score: ${normalizedScore}/100)`
    }), {
      headers
    });

  } catch (e: any) {
    console.error('[detect-totvs-usage] ERRO FATAL:', e);
    return new Response(JSON.stringify({ 
      error: 'Internal error',
      message: e.message 
    }), { 
      status: 500, 
      headers 
    });
  }
});
