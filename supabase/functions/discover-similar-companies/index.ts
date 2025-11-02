import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, companyName, cnpj, sector, state, size } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[SIMILAR] Buscando empresas similares para:', companyName);

    // BUSCAR EMPRESAS SIMILARES NO BANCO
    let query = supabase
      .from('companies')
      .select('id, name, cnpj, setor, uf, employees, revenue')
      .neq('id', companyId) // Excluir a própria empresa
      .eq('is_disqualified', false) // Apenas empresas ativas
      .limit(10);

    // FILTROS DE SIMILARIDADE
    if (sector) {
      query = query.eq('setor', sector);
    }
    if (state) {
      query = query.eq('uf', state);
    }
    if (size) {
      // Filtrar por faixa de tamanho similar
      const sizeRanges: Record<string, [number, number]> = {
        'small': [1, 50],
        'medium': [51, 250],
        'large': [251, 999999]
      };
      const [min, max] = sizeRanges[size] || [1, 999999];
      query = query.gte('employees', min).lte('employees', max);
    }

    const { data: similarCompanies, error } = await query;

    if (error) {
      console.error('[SIMILAR] Erro ao buscar empresas:', error);
      throw error;
    }

    console.log(`[SIMILAR] Encontradas ${similarCompanies?.length || 0} empresas similares`);

    // PARA CADA EMPRESA SIMILAR, VERIFICAR SE USA TOTVS
    const enrichedCompanies = await Promise.all(
      (similarCompanies || []).map(async (company) => {
        // Buscar último resultado de detecção TOTVS
        const { data: totvsReport } = await supabase
          .from('totvs_detection_reports')
          .select('detection_status, confidence, score')
          .eq('company_id', company.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const usesTotvs = totvsReport?.detection_status === 'no-go' || 
                         (totvsReport?.score && totvsReport.score >= 70);

        return {
          ...company,
          totvs_status: totvsReport?.detection_status || 'unknown',
          totvs_confidence: totvsReport?.confidence || 'unknown',
          totvs_score: totvsReport?.score || 0,
          uses_totvs: usesTotvs
        };
      })
    );

    // CALCULAR ESTATÍSTICAS
    const totalSimilar = enrichedCompanies.length;
    const usingTotvs = enrichedCompanies.filter(c => c.uses_totvs).length;
    const percentageTotvs = totalSimilar > 0 ? (usingTotvs / totalSimilar * 100) : 0;

    // GERAR INSIGHTS
    const insights = [];
    
    if (percentageTotvs > 50) {
      insights.push(`🔥 Alta penetração TOTVS no setor (${percentageTotvs.toFixed(1)}%). Empresa está FORA DO PADRÃO se não usar TOTVS.`);
    } else if (percentageTotvs > 30) {
      insights.push(`⚠️ Penetração moderada TOTVS no setor (${percentageTotvs.toFixed(1)}%). Oportunidade viável.`);
    } else {
      insights.push(`✅ Baixa penetração TOTVS no setor (${percentageTotvs.toFixed(1)}%). Mercado ainda inexplorado.`);
    }

    if (usingTotvs > 0) {
      insights.push(`📊 ${usingTotvs} de ${totalSimilar} concorrentes diretos já usam TOTVS.`);
    } else if (totalSimilar > 0) {
      insights.push(`💡 Nenhum concorrente direto identificado como cliente TOTVS. Oportunidade de ser pioneiro no nicho.`);
    }

    if (totalSimilar < 3) {
      insights.push(`⚠️ Poucas empresas similares encontradas. Considere ampliar critérios de busca.`);
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
            sector,
            state,
            size
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[SIMILAR] Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
