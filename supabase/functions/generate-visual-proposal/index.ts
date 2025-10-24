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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { company_id, account_strategy_id, quote_id, scenario_id, title, template_id = 'standard' } = await req.json();

    console.log('📄 Gerando proposta visual...', { company_id, title });

    // Buscar dados
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single();

    const { data: strategy } = account_strategy_id ? await supabase
      .from('account_strategies')
      .select('*')
      .eq('id', account_strategy_id)
      .single() : { data: null };

    const { data: quote } = quote_id ? await supabase
      .from('quote_history')
      .select('*')
      .eq('id', quote_id)
      .single() : { data: null };

    const { data: scenario } = scenario_id ? await supabase
      .from('scenario_analysis')
      .select('*')
      .eq('id', scenario_id)
      .single() : { data: null };

    // Gerar número da proposta
    const proposalNumber = `PROP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Estruturar seções da proposta
    const sections = [
      {
        type: 'cover',
        title: title || `Proposta Comercial - ${company?.name}`,
        subtitle: 'Transformação Digital TOTVS',
        company_name: company?.name,
      },
      {
        type: 'executive_summary',
        content: strategy?.value_proposition || 'Resumo executivo da proposta de transformação digital.',
      },
      {
        type: 'situation',
        title: 'Situação Atual',
        challenges: strategy?.identified_gaps || [],
      },
      {
        type: 'solution',
        title: 'Solução Proposta',
        products: quote?.products || strategy?.recommended_products || [],
      },
      {
        type: 'investment',
        title: 'Investimento e ROI',
        investment: quote?.total_final_price || strategy?.investment_required || 0,
        roi: strategy?.projected_roi || 0,
        payback: strategy?.payback_period || '12-18 meses',
        scenarios: scenario ? {
          best: scenario.best_case,
          expected: scenario.expected_case,
          worst: scenario.worst_case,
        } : null,
      },
      {
        type: 'implementation',
        title: 'Roadmap de Implementação',
        phases: strategy?.transformation_roadmap || {},
        timeline: strategy?.expected_timeline || '6-12 meses',
      },
      {
        type: 'testimonials',
        title: 'Cases de Sucesso',
        testimonials: [
          {
            company: 'Empresa Similar',
            quote: 'A implementação TOTVS transformou nossa operação',
            result: '40% aumento de eficiência',
          },
        ],
      },
      {
        type: 'next_steps',
        title: 'Próximos Passos',
        steps: [
          'Aprovação da proposta',
          'Assinatura do contrato',
          'Kickoff do projeto',
          'Implementação fase 1',
        ],
      },
    ];

    // Salvar proposta
    const { data: proposal, error: proposalError } = await supabase
      .from('visual_proposals')
      .insert({
        company_id,
        account_strategy_id,
        quote_id,
        scenario_id,
        title: title || `Proposta - ${company?.name}`,
        proposal_number: proposalNumber,
        sections,
        template_id,
        status: 'draft',
      })
      .select()
      .single();

    if (proposalError) throw proposalError;

    console.log('✅ Proposta criada:', proposal.id);

    return new Response(JSON.stringify({
      success: true,
      proposal,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
