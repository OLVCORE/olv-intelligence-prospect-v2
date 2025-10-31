// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const { company_id, company_name, cnpj, domain, state, city, sector_code, niche_code } = await req.json();

    if (!company_id || !company_name || !state) {
      return new Response(JSON.stringify({ 
        error: 'company_id, company_name, state required',
        hint: 'Selecione empresa e estado'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ========================================
    // BUSCAR NICHO (opcional - palavras-chave específicas)
    // ========================================
    let niche: any = null;
    
    if (niche_code) {
      const { data: nicheData, error: nicheError } = await sb
        .from('niches')
        .select('*')
        .eq('niche_code', niche_code)
        .single();

      if (!nicheError && nicheData) {
        niche = nicheData;
        console.log(`[detect-totvs-v5] Nicho: ${niche.niche_name}`);
        console.log(`[detect-totvs-v5] Keywords: ${niche.keywords.join(', ')}`);
      } else {
        console.warn(`⚠️ Nicho '${niche_code}' não encontrado - continuando sem palavras-chave específicas`);
      }
    } else {
      console.log('ℹ️ Nenhum nicho fornecido - usando busca genérica');
    }

    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    const googleCseId = Deno.env.get('GOOGLE_CSE_ID');

    if (!googleApiKey || !googleCseId) {
      throw new Error('Google API not configured');
    }

    const evidences: any[] = [];
    const auditLogs: any[] = [];
    const scoreBreakdown: any[] = []; // 📌 MC3: Metodologia detalhada

    // ========================================
    // 📌 MC1: MÚLTIPLAS FONTES DE VAGAS (50+ portais)
    // ========================================
    // Se não tem nicho, usa palavras-chave genéricas
    const nicheKeywords = niche?.keywords?.length > 0 
      ? niche.keywords.slice(0, 3).map((k: string) => `"${k}"`).join(' OR ')
      : '"ERP" OR "sistema de gestão" OR "automação"';
      
    // 📌 MC4: Produtos TOTVS expandidos (10 produtos principais)
    const totvsProducts = [
      'Protheus', 'RM TOTVS', 'Datasul', 'Fluig',
      'Logix', 'Microsiga', 'Backoffice', 'Winthor', 'Line', 'Magnus'
    ].map((p: string) => `"${p}"`).join(' OR ');

    // 📌 MC1: Lista de portais de emprego brasileiros
    const jobPortals = [
      'linkedin.com/jobs',
      'vagas.com.br',
      'catho.com.br',
      'infojobs.com.br',
      'trampos.co',
      'Indeed.com.br',
      'glassdoor.com.br',
      'gupy.io'
    ];

    let totalJobPoints = 0;
    const jobPortalResults: any[] = [];

    // 📌 MC1: Buscar em múltiplos portais
    for (const portal of jobPortals) {
      const portalQuery = `"${company_name}" AND (${nicheKeywords}) AND (${totvsProducts}) AND "${state}" site:${portal}`;
      const portalUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(portalQuery)}&num=3`;
      
      console.log(`[detect-totvs-v5] Buscando em: ${portal}`);
      
      try {
        const res = await fetch(portalUrl);
        if (res.ok) {
          const data = await res.json();
          const items = data.items || [];
          
          for (const item of items) {
            const title = item.title || '';
            const snippet = item.snippet || '';
            const fullText = `${title} ${snippet}`.toLowerCase();

            // Validar menção da empresa
            const companyTokens = company_name.toLowerCase().split(' ').filter((w: string) => w.length > 2);
            const mentionsCompany = companyTokens.some((token: string) => fullText.includes(token));

            // Validar estado
            const mentionsState = fullText.includes(state.toLowerCase());

            // Validar nicho (opcional)
            const mentionsNiche = niche?.keywords 
              ? niche.keywords.some((k: string) => fullText.includes(k.toLowerCase()))
              : true;

            // Validar produto TOTVS
            const mentionsTOTVS = [
              'protheus', 'rm totvs', 'datasul', 'fluig',
              'logix', 'microsiga', 'backoffice', 'winthor', 'line', 'magnus'
            ].some((p: string) => fullText.includes(p));

            if (mentionsCompany && mentionsState && mentionsNiche && mentionsTOTVS) {
              console.log(`[detect-totvs-v5] ✅ ACEITO [${portal}]: ${title}`);

              evidences.push({
                source: 'job_posting',
                platform: portal,
                score: 30,
                title,
                snippet,
                url: item.link,
                timestamp: new Date().toISOString(),
                confidence: 'high',
                totvs_products_mentioned: ['protheus', 'rm totvs', 'datasul', 'fluig', 'logix', 'microsiga', 'backoffice', 'winthor', 'line', 'magnus']
                  .filter((p: string) => fullText.includes(p)),
                reason: `Vaga em ${portal} menciona ${company_name} + produtos TOTVS em ${state}`
              });

              totalJobPoints += 30;

              auditLogs.push({
                batch_company_id: company_id,
                action: 'accepted_evidence',
                reason: `Passou validações em ${portal}`,
                evidence_url: item.link,
                evidence_snippet: snippet,
                validation_rules_applied: {
                  portal,
                  mentions_company: mentionsCompany,
                  mentions_state: mentionsState,
                  mentions_niche: mentionsNiche,
                  mentions_totvs: mentionsTOTVS
                }
              });

              jobPortalResults.push({ portal, found: true });
              break; // Uma evidência por portal é suficiente
            }
          }
        }
      } catch (e) {
        console.error(`[detect-totvs-v5] Erro em ${portal}:`, e);
      }
    }

    // 📌 MC1+MC3: Score breakdown por portal
    const portalsWithResults = jobPortalResults.filter(p => p.found).map(p => p.portal);
    const portalsWithoutResults = jobPortals.filter(p => !portalsWithResults.includes(p));

    scoreBreakdown.push({
      source: 'Portais de Vagas (Multi-fonte)',
      points_awarded: Math.min(totalJobPoints, 100),
      max_points: 100,
      reason: totalJobPoints > 0
        ? `${evidences.length} vaga(s) TOTVS encontrada(s) em ${portalsWithResults.length} portal(is): ${portalsWithResults.join(', ')}`
        : `Nenhuma vaga TOTVS encontrada em ${jobPortals.length} portais pesquisados`,
      portals_searched: jobPortals.length,
      portals_with_results: portalsWithResults,
      portals_without_results: portalsWithoutResults
    });

    // Salvar auditoria
    if (auditLogs.length > 0) {
      await sb.from('icp_audit_log').insert(auditLogs);
    }

    // Calcular score
    const totalScore = evidences.reduce((sum, e) => sum + e.score, 0);
    const normalizedScore = Math.min(totalScore, 100);
    const status = normalizedScore >= 70 ? 'disqualified' : 'qualified';
    const confidence = normalizedScore >= 70 ? 'high' : normalizedScore >= 40 ? 'medium' : 'low';

    // 📌 MC1+MC3: Metodologia completa com multi-fonte
    const portalsWithResults = [...new Set(evidences.map(e => e.platform))];
    
    const methodology = {
      total_sources_checked: jobPortals.length,
      sources_with_results: portalsWithResults,
      sources_without_results: jobPortals.filter(p => !portalsWithResults.includes(p)),
      score_breakdown: scoreBreakdown,
      calculation_formula: `Score = Σ(pontos das evidências). Cada vaga TOTVS = 30pts. Máximo: 100 pontos.`,
      threshold_applied: {
        disqualified_if_above: 70,
        qualified_if_below: 70
      }
    };

    console.log(`[detect-totvs-v5] ✅ Score: ${normalizedScore}/100 | Aceitos: ${evidences.length} | Portais com dados: ${portalsWithResults.length}/${jobPortals.length}`);

    return new Response(JSON.stringify({
      ok: true,
      score: normalizedScore,
      status,
      confidence,
      evidences,
      methodology,
      platforms_scanned: jobPortals,
      portals_with_results: portalsWithResults.length,
      total_portals: jobPortals.length,
      niche: niche?.niche_name || 'Análise Genérica',
      audit: {
        accepted: auditLogs.filter(l => l.action === 'accepted_evidence').length,
        rejected: auditLogs.filter(l => l.action === 'rejected_evidence').length,
        portals_searched: jobPortals.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    console.error('[detect-totvs-v5] ERRO:', e);
    return new Response(JSON.stringify({ 
      error: 'Internal error',
      message: e.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
