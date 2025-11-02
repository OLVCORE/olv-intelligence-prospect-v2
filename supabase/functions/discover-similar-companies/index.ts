import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { companyId, companyName, cnpj, sector, state, size } = await req.json();

    console.log('[SIMILAR] Iniciando busca para:', { companyId, companyName, sector, state, size });

    // BUSCAR DADOS COMPLETOS DA EMPRESA ALVO
    const { data: targetCompany, error: targetError } = await supabaseClient
      .from('quarantine_companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (targetError || !targetCompany) {
      console.error('[SIMILAR] Empresa alvo não encontrada:', targetError);
      throw new Error('Empresa não encontrada no banco');
    }

    console.log('[SIMILAR] Empresa alvo:', {
      name: targetCompany.name,
      setor: targetCompany.setor,
      uf: targetCompany.uf,
      employees: targetCompany.employees
    });

    // CRITÉRIOS PROFISSIONAIS (Apollo, ZoomInfo, SimilarWeb)
    // 1. Setor OBRIGATÓRIO
    // 2. Range de funcionários: -50% a +100%
    // 3. Estado: preferencial (se não encontrar, busca nacional)

    const employeeRange = targetCompany.employees ? {
      min: Math.floor(targetCompany.employees * 0.5),
      max: Math.ceil(targetCompany.employees * 2)
    } : null;

    console.log('[SIMILAR] Range de funcionários:', employeeRange);

    // BUSCA 1: Tentar com SETOR + ESTADO + RANGE DE FUNCIONÁRIOS
    let query = supabaseClient
      .from('quarantine_companies')
      .select('*')
      .neq('id', companyId)
      .eq('is_disqualified', false);

    if (targetCompany.setor) {
      query = query.eq('setor', targetCompany.setor);
    }

    if (targetCompany.uf) {
      query = query.eq('uf', targetCompany.uf);
    }

    if (employeeRange) {
      query = query
        .gte('employees', employeeRange.min)
        .lte('employees', employeeRange.max);
    }

    let { data: similarCompanies, error: queryError } = await query.limit(50);

    if (queryError) {
      console.error('[SIMILAR] Erro na query:', queryError);
      throw queryError;
    }

    // BUSCA 2: Se não encontrou nada, buscar sem filtro de estado
    if (!similarCompanies || similarCompanies.length === 0) {
      console.log('[SIMILAR] Nenhuma empresa encontrada. Tentando busca mais ampla...');
      
      let widerQuery = supabaseClient
        .from('quarantine_companies')
        .select('*')
        .neq('id', companyId)
        .eq('is_disqualified', false);

      if (targetCompany.setor) {
        widerQuery = widerQuery.eq('setor', targetCompany.setor);
      }

      const { data: widerResults } = await widerQuery.limit(50);

      if (!widerResults || widerResults.length === 0) {
        console.log('[SIMILAR] Nenhuma empresa similar encontrada');
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              similar_companies: [],
              statistics: { total: 0, using_totvs: 0, percentage_totvs: 0, not_using_totvs: 0 },
              insights: [
                '⚠️ Nenhuma empresa similar encontrada no banco de dados.',
                '💡 Considere ampliar os critérios de busca ou adicionar mais empresas.'
              ],
              search_criteria: { sector: targetCompany.setor, state: targetCompany.uf, size }
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      similarCompanies = widerResults;
    }

    console.log('[SIMILAR] Empresas encontradas:', similarCompanies.length);

    // CALCULAR SCORE DE SIMILARIDADE (0-100)
    const scoredCompanies = similarCompanies.map(company => {
      let similarityScore = 0;

      // SETOR IGUAL = +40 pontos
      if (company.setor === targetCompany.setor) {
        similarityScore += 40;
      }

      // ESTADO IGUAL = +20 pontos
      if (company.uf === targetCompany.uf) {
        similarityScore += 20;
      }

      // TAMANHO SIMILAR (funcionários) = +20 pontos
      if (company.employees && targetCompany.employees) {
        const diff = Math.abs(company.employees - targetCompany.employees);
        const percentDiff = diff / targetCompany.employees;
        if (percentDiff <= 0.3) similarityScore += 20; // ±30%
        else if (percentDiff <= 0.5) similarityScore += 15; // ±50%
        else if (percentDiff <= 1) similarityScore += 10; // ±100%
      }

      // RECEITA SIMILAR = +20 pontos
      if (company.revenue && targetCompany.revenue) {
        const revTarget = parseFloat(String(targetCompany.revenue).replace(/[^0-9.]/g, '')) || 0;
        const revCompany = parseFloat(String(company.revenue).replace(/[^0-9.]/g, '')) || 0;
        if (revTarget > 0 && revCompany > 0) {
          const diff = Math.abs(revCompany - revTarget);
          const percentDiff = diff / revTarget;
          if (percentDiff <= 0.5) similarityScore += 20; // ±50%
          else if (percentDiff <= 1) similarityScore += 15; // ±100%
          else if (percentDiff <= 2) similarityScore += 10; // ±200%
        }
      }

      return { ...company, similarity_score: similarityScore };
    });

    // ORDENAR POR SCORE (maior primeiro)
    scoredCompanies.sort((a, b) => b.similarity_score - a.similarity_score);

    // TOP 10 MAIS SIMILARES
    const topSimilar = scoredCompanies.slice(0, 10);

    console.log('[SIMILAR] Top 10:', topSimilar.map(c => ({ name: c.name, score: c.similarity_score })));

    // ENRIQUECER COM STATUS TOTVS
    const enrichedCompanies = await Promise.all(
      topSimilar.map(async (company) => {
        const { data: totvsReport } = await supabaseClient
          .from('totvs_detection_reports')
          .select('detection_status, confidence, score')
          .eq('company_id', company.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const usesTotvs = totvsReport?.detection_status === 'no-go' || 
                          (totvsReport?.score && totvsReport.score >= 70);

        return {
          id: company.id,
          name: company.name,
          cnpj: company.cnpj,
          setor: company.setor,
          uf: company.uf,
          employees: company.employees,
          revenue: company.revenue,
          totvs_status: totvsReport?.detection_status || 'desconhecido',
          totvs_confidence: totvsReport?.confidence || 'baixa',
          totvs_score: totvsReport?.score || 0,
          uses_totvs: usesTotvs
        };
      })
    );

    // ESTATÍSTICAS
    const totalSimilar = enrichedCompanies.length;
    const usingTotvs = enrichedCompanies.filter(c => c.uses_totvs).length;
    const percentageTotvs = totalSimilar > 0 ? (usingTotvs / totalSimilar * 100) : 0;

    // INSIGHTS COM VISÃO DE NEGÓCIO
    const insights = [];

    if (percentageTotvs >= 60) {
      insights.push(`🔥 OPORTUNIDADE QUENTE! ${percentageTotvs.toFixed(0)}% dos concorrentes JÁ USAM TOTVS. Empresa fora do padrão!`);
      insights.push(`💰 Argumento: "${usingTotvs} dos seus principais concorrentes já modernizaram. Você está perdendo competitividade."`);
    } else if (percentageTotvs >= 40) {
      insights.push(`⚡ PENETRAÇÃO MODERADA: ${percentageTotvs.toFixed(0)}% do mercado usa TOTVS. Janela de oportunidade ABERTA!`);
      insights.push(`🎯 Abordagem: "Metade do setor já adotou TOTVS. Não fique para trás."`);
    } else if (percentageTotvs >= 20) {
      insights.push(`💡 MERCADO EM EXPANSÃO: ${percentageTotvs.toFixed(0)}% já usa TOTVS. Momento ideal para EARLY ADOPTER!`);
      insights.push(`🚀 Pitch: "Seja pioneiro e ganhe vantagem competitiva."`);
    } else {
      insights.push(`🆕 OCEANO AZUL! Apenas ${percentageTotvs.toFixed(0)}% usa TOTVS. Oportunidade de ser PRIMEIRO!`);
      insights.push(`💎 Estratégia: "Mercado inexplorado. Quem modernizar primeiro vira referência."`);
    }

    if (usingTotvs > 0) {
      const clientNames = enrichedCompanies
        .filter(c => c.uses_totvs)
        .slice(0, 3)
        .map(c => c.name)
        .join(', ');
      insights.push(`📊 PROVA SOCIAL: ${clientNames}${usingTotvs > 3 ? ` e mais ${usingTotvs - 3}` : ''} já são clientes.`);
    }

    if (enrichedCompanies.length >= 3) {
      const top3 = enrichedCompanies.slice(0, 3).map(c => c.name).join(', ');
      insights.push(`🎯 EMPRESAS-ESPELHO (use como referência): ${top3}`);
    }

    console.log('[SIMILAR] Análise concluída:', {
      total: totalSimilar,
      using_totvs: usingTotvs,
      percentage: percentageTotvs.toFixed(1)
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          similar_companies: enrichedCompanies,
          statistics: {
            total: totalSimilar,
            using_totvs: usingTotvs,
            percentage_totvs: parseFloat(percentageTotvs.toFixed(1)),
            not_using_totvs: totalSimilar - usingTotvs
          },
          insights,
          search_criteria: {
            sector: targetCompany.setor,
            state: targetCompany.uf,
            size
          }
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[SIMILAR] Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});