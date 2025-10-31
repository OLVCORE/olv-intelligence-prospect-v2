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

async function searchWithFallback(query: string, num: number = 5): Promise<any[]> {
  // Primeiro tenta Serper (mais confiável)
  const serperKey = Deno.env.get('SERPER_API_KEY');
  if (serperKey) {
    try {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': serperKey,
        },
        body: JSON.stringify({ q: query, gl: 'br', hl: 'pt-BR', num }),
      });
      if (res.ok) {
        const data = await res.json();
        const organic = data.organic || [];
        return organic.map((item: any) => ({
          title: item.title,
          snippet: item.snippet || item.description || '',
          link: item.link
        }));
      }
    } catch (e) {
      console.warn('[detect-intent-v2] Serper falhou, tentando Google CSE:', e);
    }
  }

  // Fallback: Google CSE (pode retornar 403)
  const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
  const googleCseId = Deno.env.get('GOOGLE_CSE_ID');
  
  if (googleApiKey && googleCseId) {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(query)}&num=${num}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return data.items || [];
      }
    } catch (e) {
      console.warn('[detect-intent-v2] Google CSE falhou:', e);
    }
  }

  return []; // Sem resultados
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { company_id, company_name, cnpj, region, sector } = await req.json();

    if (!company_id || !company_name) {
      return new Response(JSON.stringify({ 
        error: 'company_id and company_name required',
        hint: 'Selecione uma empresa primeiro'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[detect-intent-v2] Analisando: ${company_name} (${company_id})`);

    const signals: IntentSignal[] = [];
    const platformsScanned: string[] = [];
    const variants = tokenVariants(company_name);

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log(`[detect-intent-v2] Buscando Job Postings...`);
    
    const jobKeywords = ['CIO', 'Diretor TI', 'Gerente TI', 'Analista Sistemas', 'ERP', 'Transformação Digital'];
    const jobQuery = `"${variants[0]}" AND (${jobKeywords.map(k => `"${k}"`).join(' OR ')}) site:linkedin.com/jobs`;
    
    platformsScanned.push('LinkedIn Jobs');
    
    try {
      const items = await searchWithFallback(jobQuery, 5);
      console.log(`[detect-intent-v2] Job Postings: ${items.length} resultados`);
      
      for (const item of items) {
        const title = item.title || '';
        const snippet = item.snippet || '';
        const fullText = `${title} ${snippet}`;
        
        if (validateMention(fullText, company_name)) {
          const matchedKeyword = jobKeywords.find(k => fullText.toLowerCase().includes(k.toLowerCase()));
          console.log(`[detect-intent-v2] ✅ Job Posting: ${title}`);
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
        }
      }
    } catch (e) {
      console.error('[detect-intent-v2] Erro Job Postings:', e);
    }

    console.log(`[detect-intent-v2] Buscando News...`);
    
    const newsKeywords = ['expansão', 'IPO', 'transformação digital', 'investimento', 'modernização', 'crescimento'];
    const newsQuery = `"${variants[0]}" AND (${newsKeywords.map(k => `"${k}"`).join(' OR ')})`;
    
    platformsScanned.push('Google News');
    
    try {
      const items = await searchWithFallback(newsQuery, 5);
      console.log(`[detect-intent-v2] News: ${items.length} resultados`);
      
      for (const item of items) {
        const title = item.title || '';
        const snippet = item.snippet || '';
        const fullText = `${title} ${snippet}`;
        
        if (validateMention(fullText, company_name)) {
          const matchedKeyword = newsKeywords.find(k => fullText.toLowerCase().includes(k.toLowerCase()));
          console.log(`[detect-intent-v2] ✅ News: ${title}`);
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
        }
      }
    } catch (e) {
      console.error('[detect-intent-v2] Erro News:', e);
    }

    console.log(`[detect-intent-v2] Buscando LinkedIn Activity...`);
    
    const linkedinQuery = `"${variants[0]}" AND (modernização OR "investimento em TI" OR "transformação digital") site:linkedin.com/posts`;
    
    platformsScanned.push('LinkedIn Activity');
    
    try {
      const items = await searchWithFallback(linkedinQuery, 5);
      console.log(`[detect-intent-v2] LinkedIn Activity: ${items.length} resultados`);
      
      for (const item of items) {
        const title = item.title || '';
        const snippet = item.snippet || '';
        const fullText = `${title} ${snippet}`;
        
        if (validateMention(fullText, company_name)) {
          console.log(`[detect-intent-v2] ✅ LinkedIn Activity: ${title}`);
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
        }
      }
    } catch (e) {
      console.error('[detect-intent-v2] Erro LinkedIn Activity:', e);
    }

    const totalScore = signals.reduce((sum, s) => sum + s.score, 0);
    const normalizedScore = Math.min(totalScore, 100);
    const temperature = normalizedScore >= 70 ? 'hot' : normalizedScore >= 40 ? 'warm' : 'cold';
    const confidence = normalizedScore >= 70 ? 'high' : normalizedScore >= 40 ? 'medium' : 'low';

    console.log(`[detect-intent-v2] Score: ${normalizedScore}/100 | Temp: ${temperature}`);
    console.log(`[detect-intent-v2] Plataformas: ${platformsScanned.join(', ')}`);

    await sb.from('intent_signals_detection').insert({
      company_id,
      company_name,
      cnpj,
      region,
      sector,
      score: normalizedScore,
      temperature,
      confidence,
      signals: signals,
      sources_checked: platformsScanned.length,
      platforms_scanned: platformsScanned,
      checked_at: new Date().toISOString()
    });

    console.log(`[detect-intent-v2] ✅ Análise salva`);

    return new Response(JSON.stringify({
      ok: true,
      score: normalizedScore,
      temperature,
      confidence,
      signals,
      sources_checked: platformsScanned.length,
      platforms_scanned: platformsScanned,
      message: temperature === 'hot' 
        ? `🔥 HOT LEAD! Score: ${normalizedScore}/100 - Prospectar AGORA!`
        : temperature === 'warm'
        ? `🌡️ WARM LEAD. Score: ${normalizedScore}/100 - Monitorar de perto`
        : `❄️ COLD LEAD. Score: ${normalizedScore}/100 - Nutrir com conteúdo`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    console.error('[detect-intent-v2] ERRO:', e);
    return new Response(JSON.stringify({ 
      error: 'Internal error',
      message: e.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
