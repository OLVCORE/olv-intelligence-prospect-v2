// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

type IntentSignal = {
  type: 'job_posting' | 'news' | 'linkedin_activity' | 'search_activity';
  score: number;
  title: string;
  description: string;
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
    const { company_id, company_name } = await req.json();

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

    console.log(`[detect-intent-signals] Analisando empresa: ${company_name} (${company_id})`);

    const signals: IntentSignal[] = [];
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

    console.log(`[detect-intent-signals] Tokens de busca: ${variants.join(', ')}`);

    // ========================================
    // 1. JOB POSTINGS (30 pts)
    // ========================================
    const jobKeywords = ['CIO', 'Diretor TI', 'Gerente TI', 'Analista Sistemas', 'ERP', 'Transformação Digital'];
    const jobQuery = `"${variants[0]}" AND (${jobKeywords.map(k => `"${k}"`).join(' OR ')}) site:linkedin.com/jobs`;
    const jobUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(jobQuery)}&num=5&dateRestrict=m3`;
    
    console.log(`[detect-intent-signals] Buscando Job Postings...`);
    try {
      const jobRes = await fetch(jobUrl);
      if (jobRes.ok) {
        const jobData = await jobRes.json();
        const items = jobData.items || [];
        console.log(`[detect-intent-signals] Job Postings: ${items.length} resultados`);
        
        for (const item of items) {
          const title = item.title || '';
          const snippet = item.snippet || '';
          const fullText = `${title} ${snippet}`;
          
          if (validateMention(fullText, company_name)) {
            const matchedKeyword = jobKeywords.find(k => fullText.toLowerCase().includes(k.toLowerCase()));
            console.log(`[detect-intent-signals] ✅ Job Posting: Sinal encontrado - ${title}`);
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
          } else {
            console.log(`[detect-intent-signals] ❌ Job Posting: Resultado descartado (não menciona empresa)`);
          }
        }
      }
    } catch (e) {
      console.error('[detect-intent-signals] Erro Job Postings:', e);
    }

    // ========================================
    // 2. NEWS (25 pts)
    // ========================================
    const newsKeywords = ['expansão', 'IPO', 'transformação digital', 'investimento', 'modernização', 'crescimento'];
    const newsQuery = `"${variants[0]}" AND (${newsKeywords.map(k => `"${k}"`).join(' OR ')})`;
    const newsUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(newsQuery)}&num=5&dateRestrict=m6`;
    
    console.log(`[detect-intent-signals] Buscando News...`);
    try {
      const newsRes = await fetch(newsUrl);
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        const items = newsData.items || [];
        console.log(`[detect-intent-signals] News: ${items.length} resultados`);
        
        for (const item of items) {
          const title = item.title || '';
          const snippet = item.snippet || '';
          const fullText = `${title} ${snippet}`;
          
          if (validateMention(fullText, company_name)) {
            const matchedKeyword = newsKeywords.find(k => fullText.toLowerCase().includes(k.toLowerCase()));
            console.log(`[detect-intent-signals] ✅ News: Sinal encontrado - ${title}`);
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
          } else {
            console.log(`[detect-intent-signals] ❌ News: Resultado descartado (não menciona empresa)`);
          }
        }
      }
    } catch (e) {
      console.error('[detect-intent-signals] Erro News:', e);
    }

    // ========================================
    // 3. LINKEDIN ACTIVITY (15 pts)
    // ========================================
    const linkedinQuery = `"${variants[0]}" AND (modernização OR "investimento em TI" OR "transformação digital") site:linkedin.com/posts`;
    const linkedinUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(linkedinQuery)}&num=5&dateRestrict=m3`;
    
    console.log(`[detect-intent-signals] Buscando LinkedIn Activity...`);
    try {
      const linkedinRes = await fetch(linkedinUrl);
      if (linkedinRes.ok) {
        const linkedinData = await linkedinRes.json();
        const items = linkedinData.items || [];
        console.log(`[detect-intent-signals] LinkedIn Activity: ${items.length} resultados`);
        
        for (const item of items) {
          const title = item.title || '';
          const snippet = item.snippet || '';
          const fullText = `${title} ${snippet}`;
          
          if (validateMention(fullText, company_name)) {
            console.log(`[detect-intent-signals] ✅ LinkedIn Activity: Sinal encontrado - ${title}`);
            signals.push({
              type: 'linkedin_activity',
              score: 15,
              title,
              description: snippet,
              url: item.link,
              timestamp: new Date().toISOString(),
              confidence: 'medium',
              reason: `Post no LinkedIn sobre investimento em tecnologia`
            });
          } else {
            console.log(`[detect-intent-signals] ❌ LinkedIn Activity: Resultado descartado (não menciona empresa)`);
          }
        }
      }
    } catch (e) {
      console.error('[detect-intent-signals] Erro LinkedIn Activity:', e);
    }

    // ========================================
    // 4. SEARCH ACTIVITY (20 pts)
    // ========================================
    const searchKeywords = ['software gestão', 'ERP', 'alternativas SAP', 'sistema integrado', 'gestão empresarial'];
    const searchQuery = `"${variants[0]}" AND (${searchKeywords.map(k => `"${k}"`).join(' OR ')})`;
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(searchQuery)}&num=5&dateRestrict=m1`;
    
    console.log(`[detect-intent-signals] Buscando Search Activity...`);
    try {
      const searchRes = await fetch(searchUrl);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const items = searchData.items || [];
        console.log(`[detect-intent-signals] Search Activity: ${items.length} resultados`);
        
        for (const item of items) {
          const title = item.title || '';
          const snippet = item.snippet || '';
          const fullText = `${title} ${snippet}`;
          
          if (validateMention(fullText, company_name)) {
            const matchedKeyword = searchKeywords.find(k => fullText.toLowerCase().includes(k.toLowerCase()));
            console.log(`[detect-intent-signals] ✅ Search Activity: Sinal encontrado - ${title}`);
            signals.push({
              type: 'search_activity',
              score: 20,
              title,
              description: snippet,
              url: item.link,
              timestamp: new Date().toISOString(),
              confidence: 'medium',
              reason: `Empresa pesquisando sobre ${matchedKeyword}`
            });
          } else {
            console.log(`[detect-intent-signals] ❌ Search Activity: Resultado descartado (não menciona empresa)`);
          }
        }
      }
    } catch (e) {
      console.error('[detect-intent-signals] Erro Search Activity:', e);
    }

    // ========================================
    // CALCULAR SCORE TOTAL
    // ========================================
    const totalScore = signals.reduce((sum, s) => sum + s.score, 0);
    const maxScore = 100;
    const normalizedScore = Math.min(totalScore, maxScore);

    console.log(`[detect-intent-signals] Score final: ${normalizedScore}/100 (${signals.length} sinais)`);

    // ========================================
    // SALVAR NO BANCO
    // ========================================
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await sb.from('intent_signals_detection').insert({
      company_id,
      company_name,
      score: normalizedScore,
      signals: signals,
      sources_checked: 4,
      checked_at: new Date().toISOString()
    });

    console.log(`[detect-intent-signals] ✅ Análise salva no banco`);

    const temperature = normalizedScore >= 70 ? 'hot' : normalizedScore >= 40 ? 'warm' : 'cold';

    return new Response(JSON.stringify({
      ok: true,
      score: normalizedScore,
      temperature,
      signals,
      sources_checked: 4,
      message: temperature === 'hot' 
        ? `🔥 HOT LEAD! Score: ${normalizedScore}/100 - Prospectar AGORA!`
        : temperature === 'warm'
        ? `🌡️ WARM LEAD. Score: ${normalizedScore}/100 - Monitorar de perto`
        : `❄️ COLD LEAD. Score: ${normalizedScore}/100 - Nutrir com conteúdo`
    }), {
      headers
    });

  } catch (e: any) {
    console.error('[detect-intent-signals] ERRO FATAL:', e);
    return new Response(JSON.stringify({ 
      error: 'Internal error',
      message: e.message 
    }), { 
      status: 500, 
      headers 
    });
  }
});
