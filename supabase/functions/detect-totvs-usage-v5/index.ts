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
    return new Response(null, { status: 204, headers: corsHeaders });
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
    // QUERY CIRÚRGICA (nicho + estado + produtos TOTVS)
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
    
    const linkedinQuery = `"${company_name}" AND (${nicheKeywords}) AND (${totvsProducts}) AND "${state}" site:linkedin.com/jobs`;
    const linkedinUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(linkedinQuery)}&num=5`;

    console.log(`[detect-totvs-v5] Query: ${linkedinQuery}`);

    let linkedinPoints = 0;

    try {
      const res = await fetch(linkedinUrl);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        console.log(`[detect-totvs-v5] LinkedIn: ${items.length} resultados`);

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
            : true; // Se não tem nicho, não valida

          // 📌 MC4: Validar produto TOTVS (lista expandida)
          const mentionsTOTVS = [
            'protheus', 'rm totvs', 'datasul', 'fluig',
            'logix', 'microsiga', 'backoffice', 'winthor', 'line', 'magnus'
          ].some((p: string) => fullText.includes(p));

          if (mentionsCompany && mentionsState && mentionsNiche && mentionsTOTVS) {
            console.log(`[detect-totvs-v5] ✅ ACEITO: ${title}`);

            evidences.push({
              source: 'job_posting',
              platform: 'LinkedIn',
              score: 30,
              title,
              snippet,
              url: item.link,
              timestamp: new Date().toISOString(),
              confidence: 'high',
              totvs_products_mentioned: ['protheus', 'rm totvs', 'datasul', 'fluig', 'logix', 'microsiga', 'backoffice', 'winthor', 'line', 'magnus']
                .filter((p: string) => fullText.includes(p)),
              reason: `Vaga menciona ${company_name} + ${niche?.niche_name || 'critérios gerais'} + produtos TOTVS em ${state}`
            });

            linkedinPoints += 30; // Adiciona pontos

            auditLogs.push({
              batch_company_id: company_id,
              action: 'accepted_evidence',
              reason: 'Passou em todas as validações (empresa + estado + nicho + TOTVS)',
              evidence_url: item.link,
              evidence_snippet: snippet,
              validation_rules_applied: {
                mentions_company: mentionsCompany,
                mentions_state: mentionsState,
                mentions_niche: mentionsNiche,
                mentions_totvs: mentionsTOTVS
              }
            });
          } else {
            console.log(`[detect-totvs-v5] ❌ REJEITADO: ${title}`);
            console.log(`[detect-totvs-v5]    Empresa: ${mentionsCompany} | Estado: ${mentionsState} | Nicho: ${mentionsNiche} | TOTVS: ${mentionsTOTVS}`);

            auditLogs.push({
              batch_company_id: company_id,
              action: 'rejected_evidence',
              reason: `Falhou em validações: Empresa=${mentionsCompany}, Estado=${mentionsState}, Nicho=${mentionsNiche}, TOTVS=${mentionsTOTVS}`,
              evidence_url: item.link,
              evidence_snippet: snippet,
              validation_rules_applied: {
                mentions_company: mentionsCompany,
                mentions_state: mentionsState,
                mentions_niche: mentionsNiche,
                mentions_totvs: mentionsTOTVS
              }
            });
          }
        }
      }
    } catch (e) {
      console.error('[detect-totvs-v5] Erro LinkedIn:', e);
    }

    // 📌 MC3: Adicionar ao score breakdown
    scoreBreakdown.push({
      source: 'LinkedIn Jobs',
      points_awarded: linkedinPoints,
      max_points: 30,
      reason: linkedinPoints > 0
        ? `${linkedinPoints / 30} vaga(s) de TOTVS encontrada(s) - empresa já usa TOTVS`
        : `Nenhuma vaga mencionando TOTVS encontrada em ${state}`,
      search_url: linkedinUrl
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

    // 📌 MC3: Metodologia completa
    const methodology = {
      total_sources_checked: 1,
      sources_with_results: evidences.length > 0 ? ['LinkedIn Jobs'] : [],
      sources_without_results: evidences.length === 0 ? ['LinkedIn Jobs'] : [],
      score_breakdown: scoreBreakdown,
      calculation_formula: 'Score = Σ(pontos das evidências encontradas). Máximo: 100 pontos.',
      threshold_applied: {
        disqualified_if_above: 70,
        qualified_if_below: 70
      }
    };

    console.log(`[detect-totvs-v5] ✅ Score: ${normalizedScore}/100 | Aceitos: ${evidences.length} | Rejeitados: ${auditLogs.filter(l => l.action === 'rejected_evidence').length}`);

    return new Response(JSON.stringify({
      ok: true,
      score: normalizedScore,
      status,
      confidence,
      evidences,
      methodology, // 📌 MC3: Retornar metodologia
      platforms_scanned: ['LinkedIn Jobs'],
      niche: niche?.niche_name || 'Análise Genérica',
      audit: {
        accepted: auditLogs.filter(l => l.action === 'accepted_evidence').length,
        rejected: auditLogs.filter(l => l.action === 'rejected_evidence').length
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
