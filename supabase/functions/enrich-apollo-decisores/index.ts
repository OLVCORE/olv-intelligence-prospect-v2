import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichApolloRequest {
  companyId: string;
  companyName: string;
  domain?: string;
}

// Classificar poder de decisão baseado no título
function classifyBuyingPower(title: string): 'decision-maker' | 'influencer' | 'user' {
  const titleLower = title.toLowerCase();
  
  // Decision makers (CEO, CFO, CIO, Diretores)
  if (
    titleLower.includes('ceo') ||
    titleLower.includes('cfo') ||
    titleLower.includes('cio') ||
    titleLower.includes('cto') ||
    titleLower.includes('presidente') ||
    titleLower.includes('diretor') ||
    titleLower.includes('sócio') ||
    titleLower.includes('owner') ||
    titleLower.includes('founder')
  ) {
    return 'decision-maker';
  }
  
  // Influencers (Gerentes, Coordenadores)
  if (
    titleLower.includes('gerente') ||
    titleLower.includes('coordenador') ||
    titleLower.includes('supervisor') ||
    titleLower.includes('manager') ||
    titleLower.includes('head')
  ) {
    return 'influencer';
  }
  
  // Users (demais)
  return 'user';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const body: EnrichApolloRequest = await req.json();
    const { companyId, companyName, domain } = body;

    console.log('[ENRICH-APOLLO] Buscando decisores para:', companyName);

    const apolloKey = Deno.env.get('VITE_APOLLO_API_KEY');
    
    if (!apolloKey) {
      throw new Error('APOLLO_API_KEY não configurada');
    }

    // Buscar pessoas (decisores) na empresa
    const searchPayload: any = {
      page: 1,
      per_page: 25,
      person_titles: [
        'CEO',
        'CFO',
        'CIO',
        'CTO',
        'COO',
        'Diretor',
        'Gerente',
        'Presidente',
        'Sócio',
        'Owner'
      ]
    };

    // Usar domínio se disponível, senão usar nome da empresa
    if (domain) {
      searchPayload.q_organization_domains = domain;
    } else {
      searchPayload.organization_names = [companyName];
    }

    console.log('[ENRICH-APOLLO] Payload:', JSON.stringify(searchPayload));

    const apolloResponse = await fetch(
      'https://api.apollo.io/v1/mixed_people/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apolloKey
        },
        body: JSON.stringify(searchPayload)
      }
    );

    if (!apolloResponse.ok) {
      const errorText = await apolloResponse.text();
      console.error('[ENRICH-APOLLO] Apollo API error:', errorText);
      throw new Error(`Apollo API falhou: ${apolloResponse.status}`);
    }

    const apolloData = await apolloResponse.json();

    console.log('[ENRICH-APOLLO] Pessoas encontradas:', apolloData.people?.length || 0);

    const decisores = (apolloData.people || []).map((person: any) => ({
      name: person.name || `${person.first_name} ${person.last_name}`,
      first_name: person.first_name,
      last_name: person.last_name,
      title: person.title,
      email: person.email,
      linkedin_url: person.linkedin_url,
      phone: person.phone_numbers?.[0]?.sanitized_number || null,
      buying_power: classifyBuyingPower(person.title || ''),
      seniority: person.seniority,
      departments: person.departments || [],
      city: person.city,
      state: person.state,
      country: person.country
    }));

    // Separar por poder de decisão
    const decisionMakers = decisores.filter(d => d.buying_power === 'decision-maker');
    const influencers = decisores.filter(d => d.buying_power === 'influencer');
    const users = decisores.filter(d => d.buying_power === 'user');

    console.log('[ENRICH-APOLLO] Decision makers:', decisionMakers.length);
    console.log('[ENRICH-APOLLO] Influencers:', influencers.length);
    console.log('[ENRICH-APOLLO] Users:', users.length);

    // Atualizar empresa no banco
    const updateData = {
      decisores: decisores,
      decision_makers_count: decisionMakers.length,
      influencers_count: influencers.length,
      apollo_enriched_at: new Date().toISOString()
    };

    const { error: updateError } = await supabaseClient
      .from('suggested_companies')
      .update(updateData)
      .eq('id', companyId);

    if (updateError) {
      console.error('[ENRICH-APOLLO] Erro ao atualizar banco:', updateError);
      throw updateError;
    }

    // Se encontrou CEO/CFO/CIO, salvar email principal
    const mainDecisionMaker = decisionMakers.find(d => 
      d.title?.toLowerCase().includes('ceo') ||
      d.title?.toLowerCase().includes('cfo') ||
      d.title?.toLowerCase().includes('cio')
    );

    if (mainDecisionMaker?.email) {
      await supabaseClient
        .from('suggested_companies')
        .update({ email: mainDecisionMaker.email })
        .eq('id', companyId);
    }

    console.log('[ENRICH-APOLLO] Empresa atualizada com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        decisores,
        statistics: {
          total: decisores.length,
          decision_makers: decisionMakers.length,
          influencers: influencers.length,
          users: users.length
        },
        main_decision_maker: mainDecisionMaker || null,
        message: `${decisores.length} decisores encontrados`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('[ENRICH-APOLLO] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao buscar decisores no Apollo'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

