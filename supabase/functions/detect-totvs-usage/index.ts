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
        // Busca específica por vagas no LinkedIn
        const jobsQuery = `site:linkedin.com/jobs "${company_name}" (TOTVS OR Protheus OR "RM TOTVS" OR "Linha Protheus" OR "Consultor TOTVS")`;
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
          
          // Lista de termos TOTVS que DEVEM aparecer no conteúdo
          const totvsKeywords = ['totvs', 'protheus', 'rm totvs', 'linha protheus', 'datasul', 'logix', 'winthor'];
          
          // Filtrar APENAS resultados do LinkedIn Jobs que mencionem TOTVS explicitamente
          const validResults = jobsData.organic?.filter((result: any) => {
            const url = result.link?.toLowerCase() || '';
            const snippet = result.snippet?.toLowerCase() || '';
            const title = result.title?.toLowerCase() || '';
            const fullText = `${snippet} ${title}`;
            
            // Deve ser uma vaga real do LinkedIn
            const isLinkedInJob = url.includes('linkedin.com/jobs');
            
            // Não deve ser domínio TOTVS
            const totvsOwnDomains = ['totvs.com', 'produtos.totvs.com', 'blog.totvs.com', 'loja.totvs.com'];
            const notTOTVSDomain = !totvsOwnDomains.some(domain => url.includes(domain));
            
            // DEVE mencionar EXPLICITAMENTE algum termo TOTVS no texto
            const mentionsTOTVS = totvsKeywords.some(keyword => fullText.includes(keyword));
            
            // Deve mencionar a empresa
            const mentionsCompany = fullText.includes(company_name.toLowerCase());
            
            // Não deve ser PDF ou arquivo
            const notFile = !url.includes('.pdf') && !url.includes('.doc');
            
            console.log(`[TOTVS Detection] Job check: ${title}`);
            console.log(`  - isLinkedInJob: ${isLinkedInJob}`);
            console.log(`  - notTOTVSDomain: ${notTOTVSDomain}`);
            console.log(`  - mentionsTOTVS: ${mentionsTOTVS}`);
            console.log(`  - mentionsCompany: ${mentionsCompany}`);
            
            return isLinkedInJob && notTOTVSDomain && mentionsTOTVS && mentionsCompany && notFile;
          });
          
          if (validResults && validResults.length > 0) {
            const evidence = validResults[0];
            sources.push({
              source: 'linkedin_jobs',
              confidence: 40,
              evidence: `Vaga no LinkedIn encontrada: "${evidence.title}"`,
              url: evidence.link,
              detected_at: new Date().toISOString(),
            });
            totalScore += 40;
            console.log('[TOTVS Detection] ✅ Found TOTVS mention in LinkedIn jobs (40 pts)');
          } else {
            console.log('[TOTVS Detection] ❌ No valid LinkedIn jobs found mentioning TOTVS');
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
        // Busca específica por notícias sobre uso de TOTVS pela empresa
        const newsQuery = `"${company_name}" ("usa TOTVS" OR "cliente TOTVS" OR "implementou TOTVS" OR "case de sucesso TOTVS" OR "migrou para TOTVS")`;
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
          
          // Lista de termos TOTVS que DEVEM aparecer no conteúdo
          const totvsKeywords = ['totvs', 'protheus', 'rm totvs', 'datasul', 'logix', 'winthor'];
          
          // Validação rigorosa de notícias
          const validNews = newsData.news?.filter((article: any) => {
            const url = article.link?.toLowerCase() || '';
            const snippet = article.snippet?.toLowerCase() || '';
            const title = article.title?.toLowerCase() || '';
            const fullText = `${snippet} ${title}`;
            
            // Não deve ser domínio TOTVS
            const totvsOwnDomains = ['totvs.com', 'produtos.totvs.com', 'blog.totvs.com', 'loja.totvs.com'];
            const notTOTVSDomain = !totvsOwnDomains.some(domain => url.includes(domain));
            
            // DEVE mencionar EXPLICITAMENTE algum termo TOTVS no texto
            const mentionsTOTVS = totvsKeywords.some(keyword => fullText.includes(keyword));
            
            // Deve mencionar explicitamente uso/implementação
            const hasUsageKeywords = 
              fullText.includes('usa totvs') || 
              fullText.includes('cliente totvs') || 
              fullText.includes('implementou totvs') ||
              fullText.includes('case de sucesso') ||
              fullText.includes('migrou para totvs') ||
              fullText.includes('utiliza totvs') ||
              fullText.includes('sistema totvs');
            
            // Deve mencionar a empresa
            const mentionsCompany = fullText.includes(company_name.toLowerCase());
            
            // Não deve ser ranking genérico ou lista de empresas
            const notGenericList = !title.includes('ranking') && !title.includes('maiores empresas') && !title.includes('lista de');
            
            console.log(`[TOTVS Detection] News check: ${title}`);
            console.log(`  - notTOTVSDomain: ${notTOTVSDomain}`);
            console.log(`  - mentionsTOTVS: ${mentionsTOTVS}`);
            console.log(`  - hasUsageKeywords: ${hasUsageKeywords}`);
            console.log(`  - mentionsCompany: ${mentionsCompany}`);
            console.log(`  - notGenericList: ${notGenericList}`);
            
            return notTOTVSDomain && mentionsTOTVS && hasUsageKeywords && mentionsCompany && notGenericList;
          });
          
          if (validNews && validNews.length > 0) {
            const evidence = validNews[0];
            sources.push({
              source: 'google_news',
              confidence: 30,
              evidence: `Notícia confirmando uso de TOTVS: "${evidence.title}"`,
              url: evidence.link,
              detected_at: new Date().toISOString(),
            });
            totalScore += 30;
            console.log('[TOTVS Detection] ✅ Found TOTVS usage in news (30 pts)');
          } else {
            console.log('[TOTVS Detection] ❌ No valid news found mentioning TOTVS usage');
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
          
          // Lista de termos TOTVS
          const totvsKeywords = ['totvs', 'protheus', 'rm totvs', 'linha protheus', 'datasul', 'logix', 'winthor'];
          
          // Verificar se algum termo TOTVS aparece no HTML
          const hasTOTVSMention = totvsKeywords.some(keyword => lowerHtml.includes(keyword));

          if (hasTOTVSMention) {
            // Encontrar qual termo foi detectado para evidência
            const detectedTerm = totvsKeywords.find(keyword => lowerHtml.includes(keyword));
            
            sources.push({
              source: 'website_scraping',
              confidence: 20,
              evidence: `Menção a "${detectedTerm?.toUpperCase()}" encontrada no site da empresa`,
              url: `https://${company_domain}`,
              detected_at: new Date().toISOString(),
            });
            totalScore += 20;
            console.log(`[TOTVS Detection] ✅ Found ${detectedTerm} mention on website (20 pts)`);
          } else {
            console.log('[TOTVS Detection] ❌ No TOTVS mention found on website');
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
        // Busca específica por perfis de funcionários da empresa mencionando TOTVS
        const profileQuery = `site:linkedin.com/in "${company_name}" (TOTVS OR Protheus OR "RM TOTVS") -site:totvs.com`;
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
          
          // Lista de termos TOTVS que DEVEM aparecer no conteúdo
          const totvsKeywords = ['totvs', 'protheus', 'rm totvs', 'datasul', 'logix', 'winthor'];
          
          // Validação rigorosa de perfis
          const validResults = profileData.organic?.filter((result: any) => {
            const url = result.link?.toLowerCase() || '';
            const snippet = result.snippet?.toLowerCase() || '';
            const title = result.title?.toLowerCase() || '';
            const fullText = `${snippet} ${title}`;
            
            // Deve ser perfil pessoal do LinkedIn
            const isLinkedInProfile = url.includes('linkedin.com/in/');
            
            // Não deve ser funcionário da TOTVS
            const notTOTVSEmployee = !snippet.includes('totvs s.a') && !snippet.includes('trabalha na totvs') && !snippet.includes('totvs s/a');
            
            // DEVE mencionar EXPLICITAMENTE algum termo TOTVS no texto
            const mentionsTOTVS = totvsKeywords.some(keyword => fullText.includes(keyword));
            
            // Deve mencionar experiência com TOTVS na empresa específica
            const mentionsCompany = fullText.includes(company_name.toLowerCase());
            
            console.log(`[TOTVS Detection] Profile check: ${title}`);
            console.log(`  - isLinkedInProfile: ${isLinkedInProfile}`);
            console.log(`  - notTOTVSEmployee: ${notTOTVSEmployee}`);
            console.log(`  - mentionsTOTVS: ${mentionsTOTVS}`);
            console.log(`  - mentionsCompany: ${mentionsCompany}`);
            
            return isLinkedInProfile && notTOTVSEmployee && mentionsTOTVS && mentionsCompany;
          });
          
          if (validResults && validResults.length > 0) {
            sources.push({
              source: 'linkedin_profiles',
              confidence: 10,
              evidence: `Funcionário de ${company_name} lista experiência com TOTVS no LinkedIn`,
              url: validResults[0].link,
              detected_at: new Date().toISOString(),
            });
            totalScore += 10;
            console.log('[TOTVS Detection] ✅ Found TOTVS mention in employee profiles (10 pts)');
          } else {
            console.log('[TOTVS Detection] ❌ No valid LinkedIn profiles found mentioning TOTVS');
          }
        }
      }
    } catch (error) {
      console.error('[TOTVS Detection] Error checking LinkedIn profiles:', error);
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
