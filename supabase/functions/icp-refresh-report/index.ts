import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ids = [] } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify({ error: 'ids é obrigatório (array não vazio)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      throw new Error('Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes');
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    const results: Array<{ id: string; ok: boolean; reason?: string }> = [];

    for (const id of ids) {
      try {
        const { data: row, error } = await supabase
          .from('icp_analysis_results')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!row) {
          results.push({ id, ok: false, reason: 'not_found' });
          continue;
        }

        const query = row.razao_social || row.cnpj || '';
        let organic: any[] = [];
        let news: any[] = [];

        if (SERPER_API_KEY && query) {
          // Buscar resultados orgânicos
          const searchResp = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': SERPER_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ q: query, num: 5 })
          });
          if (searchResp.ok) {
            const data = await searchResp.json();
            organic = data.organic?.slice(0, 5) || [];
          }

          // Buscar notícias
          const newsResp = await fetch('https://google.serper.dev/news', {
            method: 'POST',
            headers: {
              'X-API-KEY': SERPER_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ q: query, num: 5 })
          });
          if (newsResp.ok) {
            const data = await newsResp.json();
            news = data.news?.slice(0, 5) || [];
          }
        }

        const newsCount = news.length;
        const webPresence = organic.length > 0;

        const updatedRaw = {
          ...(row.raw_analysis || {}),
          serper: {
            organic,
            news,
            fetched_at: new Date().toISOString(),
          },
        };

        const updatedBreakdown = {
          ...(row.breakdown || {}),
          tecnologia: row.breakdown?.tecnologia ?? 0,
          cnae: row.breakdown?.cnae ?? 0,
          porte: row.breakdown?.porte ?? 0,
          situacao: row.breakdown?.situacao ?? 0,
          localizacao: row.breakdown?.localizacao ?? 0,
          web_presence: webPresence ? 5 : 0,
          news: Math.min(10, newsCount * 2),
        } as Record<string, number>;

        // Recalcular score total
        const totalScore = Object.values(updatedBreakdown).reduce((sum, val) => sum + (val || 0), 0);
        
        // Recalcular temperatura
        let temperatura = 'cold';
        if (totalScore >= 70) temperatura = 'hot';
        else if (totalScore >= 40) temperatura = 'warm';

        const motivos = Array.isArray(row.motivos) ? [...row.motivos] : [];
        const newMotivos = [...motivos];
        if (webPresence && !newMotivos.includes('Presença web detectada')) {
          newMotivos.push('Presença web detectada');
        }
        if (newsCount > 0 && !newMotivos.some(m => m.includes('notícia'))) {
          newMotivos.push(`${newsCount} notícia(s) recente(s)`);
        }

        const { error: updateError } = await supabase
          .from('icp_analysis_results')
          .update({
            raw_analysis: updatedRaw,
            breakdown: updatedBreakdown,
            motivos: newMotivos,
            icp_score: totalScore,
            temperatura,
          })
          .eq('id', id);

        if (updateError) throw updateError;
        results.push({ id, ok: true });
      } catch (e) {
        console.error('Refresh failed for id', id, e);
        results.push({ id, ok: false, reason: e instanceof Error ? e.message : 'unknown' });
      }
    }

    const ok = results.filter(r => r.ok).length;
    const fail = results.length - ok;
    return new Response(JSON.stringify({ ok, fail, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ICP_REFRESH_REPORT Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});