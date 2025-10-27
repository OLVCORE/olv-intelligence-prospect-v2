import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TOTVSDetectionSource {
  source: string;
  confidence: number; // 0-100
  evidence: string;
  url?: string;
  detected_at: string;
}

interface TOTVSDetectionResult {
  total_score: number;
  sources: TOTVSDetectionSource[];
  should_disqualify: boolean;
  reasoning: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id, company_name, company_domain } = await req.json();

    if (!company_id || !company_name) {
      throw new Error('company_id and company_name are required');
    }

    console.log(`[TOTVS Detection] Starting detection for: ${company_name}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serperApiKey = Deno.env.get('SERPER_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const sources: TOTVSDetectionSource[] = [];
    let totalScore = 0;

    // SOURCE 1: LinkedIn Jobs (40 points)
    console.log('[TOTVS Detection] Checking LinkedIn Jobs...');
    try {
      if (serperApiKey) {
        const jobsQuery = `"${company_name}" (TOTVS OR Protheus OR "RM TOTVS" OR "Linha Protheus")`;
        const jobsResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: jobsQuery,
            num: 5,
          }),
        });

        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json();
          
          // Filtrar domínios da própria TOTVS
          const totvsOwnDomains = ['totvs.com', 'produtos.totvs.com', 'blog.totvs.com', 'loja.totvs.com'];
          const validResults = jobsData.organic?.filter((result: any) => {
            const url = result.link?.toLowerCase() || '';
            return !totvsOwnDomains.some(domain => url.includes(domain));
          });
          
          const hasJobsMention = validResults?.some((result: any) => 
            result.snippet?.toLowerCase().includes('totvs') ||
            result.snippet?.toLowerCase().includes('protheus') ||
            result.title?.toLowerCase().includes('totvs')
          );

          if (hasJobsMention) {
            const evidence = validResults[0];
            sources.push({
              source: 'linkedin_jobs',
              confidence: 40,
              evidence: `Vaga encontrada mencionando TOTVS: "${evidence.title}"`,
              url: evidence.link,
              detected_at: new Date().toISOString(),
            });
            totalScore += 40;
            console.log('[TOTVS Detection] ✅ Found TOTVS mention in jobs (40 pts)');
          }
        }
      }
    } catch (error) {
      console.error('[TOTVS Detection] Error checking jobs:', error);
    }

    // SOURCE 2: Google News/Search (30 points)
    console.log('[TOTVS Detection] Checking Google News/Search...');
    try {
      if (serperApiKey) {
        const newsQuery = `"${company_name}" ("usa TOTVS" OR "cliente TOTVS" OR "implementação TOTVS" OR "case TOTVS")`;
        const newsResponse = await fetch('https://google.serper.dev/news', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: newsQuery,
            num: 5,
          }),
        });

        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          
          // Filtrar domínios da própria TOTVS
          const totvsOwnDomains = ['totvs.com', 'produtos.totvs.com', 'blog.totvs.com', 'loja.totvs.com'];
          const validNews = newsData.news?.filter((article: any) => {
            const url = article.link?.toLowerCase() || '';
            return !totvsOwnDomains.some(domain => url.includes(domain));
          });
          
          const hasNewsMention = validNews?.length > 0;

          if (hasNewsMention) {
            const evidence = validNews[0];
            sources.push({
              source: 'google_news',
              confidence: 30,
              evidence: `Notícia encontrada: "${evidence.title}"`,
              url: evidence.link,
              detected_at: new Date().toISOString(),
            });
            totalScore += 30;
            console.log('[TOTVS Detection] ✅ Found TOTVS mention in news (30 pts)');
          }
        }
      }
    } catch (error) {
      console.error('[TOTVS Detection] Error checking news:', error);
    }

    // SOURCE 3: Website Scraping (20 points)
    console.log('[TOTVS Detection] Checking website...');
    try {
      if (company_domain) {
        const websiteResponse = await fetch(`https://${company_domain}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TOTVS-Detector/1.0)',
          },
        }).catch(() => null);

        if (websiteResponse?.ok) {
          const html = await websiteResponse.text();
          const lowerHtml = html.toLowerCase();
          
          const hasTOTVSMention = lowerHtml.includes('totvs') || 
                                   lowerHtml.includes('protheus') ||
                                   lowerHtml.includes('linha protheus');

          if (hasTOTVSMention) {
            sources.push({
              source: 'website_scraping',
              confidence: 20,
              evidence: 'Menção a TOTVS encontrada no site da empresa',
              url: `https://${company_domain}`,
              detected_at: new Date().toISOString(),
            });
            totalScore += 20;
            console.log('[TOTVS Detection] ✅ Found TOTVS mention on website (20 pts)');
          }
        }
      }
    } catch (error) {
      console.error('[TOTVS Detection] Error checking website:', error);
    }

    // SOURCE 4: LinkedIn Profiles (10 points)
    console.log('[TOTVS Detection] Checking LinkedIn profiles...');
    try {
      if (serperApiKey) {
        const profileQuery = `site:linkedin.com "${company_name}" TOTVS`;
        const profileResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: profileQuery,
            num: 5,
          }),
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          
          // Filtrar domínios da própria TOTVS
          const totvsOwnDomains = ['totvs.com', 'produtos.totvs.com', 'blog.totvs.com', 'loja.totvs.com'];
          const validResults = profileData.organic?.filter((result: any) => {
            const url = result.link?.toLowerCase() || '';
            return !totvsOwnDomains.some(domain => url.includes(domain));
          });
          
          const hasProfileMention = validResults?.some((result: any) => 
            result.snippet?.toLowerCase().includes('totvs')
          );

          if (hasProfileMention) {
            sources.push({
              source: 'linkedin_profiles',
              confidence: 10,
              evidence: 'Funcionário(s) listam TOTVS como skill/experiência no LinkedIn',
              url: validResults[0].link,
              detected_at: new Date().toISOString(),
            });
            totalScore += 10;
            console.log('[TOTVS Detection] ✅ Found TOTVS mention in LinkedIn profiles (10 pts)');
          }
        }
      }
    } catch (error) {
      console.error('[TOTVS Detection] Error checking LinkedIn profiles:', error);
    }

    // Calculate final result - CRITÉRIO RÍGIDO: >= 50 desqualifica
    const shouldDisqualify = totalScore >= 50;
    const result: TOTVSDetectionResult = {
      total_score: totalScore,
      sources,
      should_disqualify: shouldDisqualify,
      reasoning: shouldDisqualify 
        ? `Score: ${totalScore}/100 - Empresa utiliza produtos TOTVS. Lead descartado automaticamente.`
        : totalScore >= 30
        ? `Score: ${totalScore}/100 - Indícios de uso TOTVS. Validação manual obrigatória antes de prospectar.`
        : totalScore > 0
        ? `Score: ${totalScore}/100 - Sinais fracos de TOTVS. Pode prosseguir com cautela.`
        : `Score: 0/100 - Sem evidências de uso TOTVS. Lead qualificado para prospecção.`,
    };

    console.log(`[TOTVS Detection] Final score: ${totalScore}/100, Should disqualify: ${shouldDisqualify}`);

    // Update company record
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        totvs_detection_score: totalScore,
        totvs_detection_sources: sources,
        totvs_last_checked_at: new Date().toISOString(),
        is_disqualified: shouldDisqualify,
        disqualification_reason: shouldDisqualify ? `Empresa utiliza produtos TOTVS (Score: ${totalScore}/100)` : null,
      })
      .eq('id', company_id);

    if (updateError) {
      console.error('[TOTVS Detection] Error updating company:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[TOTVS Detection] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
