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

    // SOURCE 1: LinkedIn Jobs (30 points)
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
            num: 10,
          }),
        });

        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json();
          
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
              confidence: 30,
              evidence: `Vaga encontrada mencionando TOTVS: "${evidence.title}"`,
              url: evidence.link,
              detected_at: new Date().toISOString(),
            });
            totalScore += 30;
            console.log('[TOTVS Detection] ✅ LinkedIn Jobs: TOTVS mention found (30 pts)');
          }
        }
      }
    } catch (error) {
      console.error('[TOTVS Detection] Error checking jobs:', error);
    }

    // SOURCE 2: Documentos Financeiros & Relações com Investidores (25 points)
    console.log('[TOTVS Detection] Checking financial documents...');
    try {
      if (serperApiKey) {
        const financialQuery = `"${company_name}" ("TOTVS" OR "TOTVS S.A") (balancete OR balanço OR demonstrativo OR DRE OR "contas a pagar" OR credores OR fornecedores OR "relação com investidores" OR RI)`;
        const financialResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: financialQuery,
            num: 10,
          }),
        });

        if (financialResponse.ok) {
          const financialData = await financialResponse.json();
          
          const totvsOwnDomains = ['totvs.com', 'produtos.totvs.com', 'blog.totvs.com'];
          const validResults = financialData.organic?.filter((result: any) => {
            const url = result.link?.toLowerCase() || '';
            return !totvsOwnDomains.some(domain => url.includes(domain));
          });
          
          const hasFinancialMention = validResults?.some((result: any) => {
            const text = `${result.snippet || ''} ${result.title || ''}`.toLowerCase();
            return (text.includes('totvs') || text.includes('totvs s.a')) &&
                   (text.includes('credores') || text.includes('contas a pagar') || 
                    text.includes('fornecedores') || text.includes('balancete') ||
                    text.includes('balanço') || text.includes('demonstrativo'));
          });

          if (hasFinancialMention) {
            const evidence = validResults[0];
            sources.push({
              source: 'financial_documents',
              confidence: 25,
              evidence: `Documento financeiro encontrado com TOTVS como credora/fornecedora: "${evidence.title}"`,
              url: evidence.link,
              detected_at: new Date().toISOString(),
            });
            totalScore += 25;
            console.log('[TOTVS Detection] ✅ Financial Docs: TOTVS found as creditor/supplier (25 pts)');
          }
        }
      }
    } catch (error) {
      console.error('[TOTVS Detection] Error checking financial documents:', error);
    }

    // SOURCE 3: Google News (20 points)
    console.log('[TOTVS Detection] Checking Google News...');
    try {
      if (serperApiKey) {
        const newsQuery = `"${company_name}" ("TOTVS" OR "Protheus" OR "RM TOTVS")`;
        const newsResponse = await fetch('https://google.serper.dev/news', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: newsQuery,
            num: 10,
          }),
        });

        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          
          const totvsOwnDomains = ['totvs.com', 'produtos.totvs.com', 'blog.totvs.com'];
          const validNews = newsData.news?.filter((article: any) => {
            const url = article.link?.toLowerCase() || '';
            return !totvsOwnDomains.some(domain => url.includes(domain));
          });
          
          const hasNewsMention = validNews?.length > 0;

          if (hasNewsMention) {
            const evidence = validNews[0];
            sources.push({
              source: 'google_news',
              confidence: 20,
              evidence: `Notícia encontrada: "${evidence.title}"`,
              url: evidence.link,
              detected_at: new Date().toISOString(),
            });
            totalScore += 20;
            console.log('[TOTVS Detection] ✅ Google News: TOTVS mention found (20 pts)');
          }
        }
      }
    } catch (error) {
      console.error('[TOTVS Detection] Error checking news:', error);
    }

    // SOURCE 4: Reclame Aqui (15 points)
    console.log('[TOTVS Detection] Checking Reclame Aqui...');
    try {
      if (serperApiKey) {
        const reclameQuery = `site:reclameaqui.com.br "${company_name}" TOTVS`;
        const reclameResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: reclameQuery,
            num: 5,
          }),
        });

        if (reclameResponse.ok) {
          const reclameData = await reclameResponse.json();
          
          const hasReclameAquiMention = reclameData.organic?.some((result: any) => 
            result.link?.includes('reclameaqui.com.br') &&
            (result.snippet?.toLowerCase().includes('totvs') || result.title?.toLowerCase().includes('totvs'))
          );

          if (hasReclameAquiMention) {
            const evidence = reclameData.organic[0];
            sources.push({
              source: 'reclame_aqui',
              confidence: 15,
              evidence: `Reclamação/menção sobre TOTVS encontrada no Reclame Aqui: "${evidence.title}"`,
              url: evidence.link,
              detected_at: new Date().toISOString(),
            });
            totalScore += 15;
            console.log('[TOTVS Detection] ✅ Reclame Aqui: TOTVS complaint/mention found (15 pts)');
          }
        }
      }
    } catch (error) {
      console.error('[TOTVS Detection] Error checking Reclame Aqui:', error);
    }

    // SOURCE 5: Grupo Econômico via CNPJ (10 points)
    console.log('[TOTVS Detection] Checking economic group...');
    try {
      if (company_domain && serperApiKey) {
        // Buscar CNPJ da empresa principal
        const cnpjQuery = `"${company_name}" CNPJ`;
        const cnpjResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: cnpjQuery,
            num: 5,
          }),
        });

        if (cnpjResponse.ok) {
          const cnpjData = await cnpjResponse.json();
          
          // Procurar por empresas relacionadas + TOTVS
          const groupQuery = `"${company_name}" (holding OR controladora OR subsidiária OR grupo) TOTVS`;
          const groupResponse = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': serperApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: groupQuery,
              num: 5,
            }),
          });

          if (groupResponse.ok) {
            const groupData = await groupResponse.json();
            
            const totvsOwnDomains = ['totvs.com', 'produtos.totvs.com', 'blog.totvs.com'];
            const validResults = groupData.organic?.filter((result: any) => {
              const url = result.link?.toLowerCase() || '';
              return !totvsOwnDomains.some(domain => url.includes(domain));
            });
            
            const hasGroupMention = validResults?.some((result: any) => {
              const text = `${result.snippet || ''} ${result.title || ''}`.toLowerCase();
              return text.includes('totvs') && 
                     (text.includes('grupo') || text.includes('holding') || 
                      text.includes('subsidiária') || text.includes('controladora'));
            });

            if (hasGroupMention) {
              const evidence = validResults[0];
              sources.push({
                source: 'economic_group',
                confidence: 10,
                evidence: `Empresa relacionada ao grupo econômico usa TOTVS: "${evidence.title}"`,
                url: evidence.link,
                detected_at: new Date().toISOString(),
              });
              totalScore += 10;
              console.log('[TOTVS Detection] ✅ Economic Group: Related company uses TOTVS (10 pts)');
            }
          }
        }
      }
    } catch (error) {
      console.error('[TOTVS Detection] Error checking economic group:', error);
    }

    // SOURCE 6: Website Scraping (10 points)
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
              confidence: 10,
              evidence: 'Menção a TOTVS encontrada no site da empresa',
              url: `https://${company_domain}`,
              detected_at: new Date().toISOString(),
            });
            totalScore += 10;
            console.log('[TOTVS Detection] ✅ Website: TOTVS mention found (10 pts)');
          }
        }
      }
    } catch (error) {
      console.error('[TOTVS Detection] Error checking website:', error);
    }

    // Calculate final result - CRITÉRIO ABSOLUTO: Qualquer evidência de TOTVS desqualifica
    const shouldDisqualify = totalScore > 0;
    const result: TOTVSDetectionResult = {
      total_score: totalScore,
      sources,
      should_disqualify: shouldDisqualify,
      reasoning: shouldDisqualify 
        ? `⛔ EMPRESA DESCARTADA - Detectado uso de produtos TOTVS (Score: ${totalScore}/100). OLV não pode ofertar para clientes TOTVS existentes. Lead bloqueado automaticamente.`
        : `✅ Lead qualificado - Sem evidências de uso TOTVS. Empresa pode ser prospectada.`,
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
        disqualification_reason: shouldDisqualify ? `⛔ Cliente TOTVS - Empresa já possui produtos TOTVS embarcados em sua tecnologia. OLV não pode prospectar clientes TOTVS existentes. (Score: ${totalScore}/100)` : null,
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
