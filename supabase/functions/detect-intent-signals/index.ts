import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IntentSignal {
  signal_type: 'job_posting' | 'news' | 'growth' | 'linkedin_activity' | 'search_activity';
  signal_source: string;
  signal_title: string;
  signal_description: string;
  signal_url?: string;
  confidence_score: number;
  metadata: any;
  expires_at?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id, company_name, company_domain, cnpj } = await req.json();

    if (!company_id || !company_name) {
      throw new Error('company_id and company_name are required');
    }

    console.log(`[Intent Signals] Starting detection for: ${company_name}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serperApiKey = Deno.env.get('SERPER_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const signals: IntentSignal[] = [];

    // SIGNAL 1: Job Postings (30 points weight)
    console.log('[Intent Signals] Checking job postings...');
    try {
      if (serperApiKey) {
        const jobQuery = `"${company_name}" ("Analista ERP" OR "Gerente TI" OR "Diretor Tecnologia" OR "CIO" OR "Coordenador TI")`;
        const jobResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: jobQuery,
            num: 3,
          }),
        });

        if (jobResponse.ok) {
          const jobData = await jobResponse.json();
          jobData.organic?.forEach((result: any) => {
            if (result.snippet?.toLowerCase().includes('vaga') || 
                result.snippet?.toLowerCase().includes('contrata')) {
              signals.push({
                signal_type: 'job_posting',
                signal_source: 'linkedin',
                signal_title: `Vaga aberta: ${result.title}`,
                signal_description: result.snippet,
                signal_url: result.link,
                confidence_score: 30,
                metadata: { position: result.position },
                expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
              });
              console.log('[Intent Signals] ✅ Found job posting (30 pts)');
            }
          });
        }
      }
    } catch (error) {
      console.error('[Intent Signals] Error checking jobs:', error);
    }

    // SIGNAL 2: News (25 points weight)
    console.log('[Intent Signals] Checking news...');
    try {
      if (serperApiKey) {
        const newsQuery = `"${company_name}" ("expansão" OR "IPO" OR "transformação digital" OR "investimento" OR "crescimento")`;
        const newsResponse = await fetch('https://google.serper.dev/news', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: newsQuery,
            num: 3,
          }),
        });

        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          newsData.news?.slice(0, 2).forEach((article: any) => {
            signals.push({
              signal_type: 'news',
              signal_source: 'google_news',
              signal_title: article.title,
              signal_description: article.snippet || '',
              signal_url: article.link,
              confidence_score: 25,
              metadata: { date: article.date },
            });
            console.log('[Intent Signals] ✅ Found news article (25 pts)');
          });
        }
      }
    } catch (error) {
      console.error('[Intent Signals] Error checking news:', error);
    }

    // SIGNAL 3: Growth Indicators (10 points weight) - from Econodata
    console.log('[Intent Signals] Checking growth indicators...');
    try {
      const { data: enrichment } = await supabase
        .from('company_enrichment')
        .select('data')
        .eq('company_id', company_id)
        .eq('source', 'econodata')
        .single();

      if (enrichment?.data) {
        const revenueGrowth = enrichment.data.revenue_growth;
        const employeeGrowth = enrichment.data.employee_growth;

        if (revenueGrowth && revenueGrowth > 20) {
          signals.push({
            signal_type: 'growth',
            signal_source: 'econodata',
            signal_title: 'Crescimento de receita detectado',
            signal_description: `Receita cresceu ${revenueGrowth}% no último período`,
            confidence_score: 10,
            metadata: { growth_rate: revenueGrowth },
          });
          console.log('[Intent Signals] ✅ Found revenue growth (10 pts)');
        }

        if (employeeGrowth && employeeGrowth > 50) {
          signals.push({
            signal_type: 'growth',
            signal_source: 'econodata',
            signal_title: 'Crescimento de quadro de funcionários',
            signal_description: `Empresa contratou ${employeeGrowth}+ funcionários recentemente`,
            confidence_score: 10,
            metadata: { employee_increase: employeeGrowth },
          });
          console.log('[Intent Signals] ✅ Found employee growth (10 pts)');
        }
      }
    } catch (error) {
      console.error('[Intent Signals] Error checking growth:', error);
    }

    // SIGNAL 4: LinkedIn Activity (15 points weight)
    console.log('[Intent Signals] Checking LinkedIn activity...');
    try {
      if (serperApiKey) {
        const linkedinQuery = `site:linkedin.com/company "${company_name}" ("modernização" OR "transformação" OR "investimento em TI" OR "tecnologia")`;
        const linkedinResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: linkedinQuery,
            num: 2,
          }),
        });

        if (linkedinResponse.ok) {
          const linkedinData = await linkedinResponse.json();
          linkedinData.organic?.slice(0, 1).forEach((result: any) => {
            signals.push({
              signal_type: 'linkedin_activity',
              signal_source: 'linkedin',
              signal_title: 'Atividade no LinkedIn detectada',
              signal_description: result.snippet,
              signal_url: result.link,
              confidence_score: 15,
              metadata: {},
            });
            console.log('[Intent Signals] ✅ Found LinkedIn activity (15 pts)');
          });
        }
      }
    } catch (error) {
      console.error('[Intent Signals] Error checking LinkedIn:', error);
    }

    // SIGNAL 5: Search Activity (20 points weight) - Google Trends approximation
    console.log('[Intent Signals] Checking search activity...');
    try {
      if (serperApiKey) {
        const searchQuery = `"${company_name}" ("software gestão" OR "alternativas SAP" OR "ERP" OR "sistema integrado")`;
        const searchResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: searchQuery,
            num: 2,
          }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.organic?.length > 0) {
            signals.push({
              signal_type: 'search_activity',
              signal_source: 'serper',
              signal_title: 'Empresa pesquisando sobre soluções ERP',
              signal_description: `Atividade de pesquisa detectada sobre sistemas de gestão`,
              confidence_score: 20,
              metadata: { results_count: searchData.organic.length },
            });
            console.log('[Intent Signals] ✅ Found search activity (20 pts)');
          }
        }
      }
    } catch (error) {
      console.error('[Intent Signals] Error checking search activity:', error);
    }

    // Insert all signals into database
    if (signals.length > 0) {
      const { error: insertError } = await supabase
        .from('intent_signals')
        .insert(
          signals.map(signal => ({
            company_id,
            ...signal,
          }))
        );

      if (insertError) {
        console.error('[Intent Signals] Error inserting signals:', insertError);
      } else {
        console.log(`[Intent Signals] ✅ Inserted ${signals.length} signals`);
      }
    }

    // Calculate intent score
    const intentScore = signals.length > 0 
      ? Math.min(100, Math.round(signals.reduce((sum, s) => sum + s.confidence_score, 0) / signals.length))
      : 0;

    console.log(`[Intent Signals] Final intent score: ${intentScore}/100, Signals: ${signals.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        intent_score: intentScore,
        signals_detected: signals.length,
        signals,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Intent Signals] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
