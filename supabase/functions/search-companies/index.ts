import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';
import { companySearchSchema } from '../_shared/validation.ts';
import { createErrorResponse } from '../_shared/errors.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função auxiliar para buscar dados da ReceitaWS
async function fetchReceitaWSData(cnpj: string) {
  const token = Deno.env.get('RECEITAWS_API_TOKEN');
  if (!token) return null;

  try {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('[ReceitaWS] Erro:', error);
    return null;
  }
}

// Função auxiliar para buscar dados do Apollo.io
async function fetchApolloData(companyName: string, domain?: string) {
  const apiKey = Deno.env.get('APOLLO_API_KEY');
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      q_organization_name: companyName,
      ...(domain && { q_organization_domains: domain })
    });

    const response = await fetch(`https://api.apollo.io/v1/organizations/search?${params}`);
    if (!response.ok) return null;

    const data = await response.json();
    return data.organizations?.[0] || null;
  } catch (error) {
    console.error('[Apollo] Erro:', error);
    return null;
  }
}

// Função auxiliar para buscar decisores no Apollo
async function fetchDecisionMakers(companyName: string) {
  const apiKey = Deno.env.get('APOLLO_API_KEY');
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      q_organization_name: companyName,
      per_page: '10',
      person_titles: 'CEO,CTO,CFO,Director,VP,Head'
    });

    const response = await fetch(`https://api.apollo.io/v1/people/search?${params}`);
    if (!response.ok) return [];

    const data = await response.json();
    return data.people || [];
  } catch (error) {
    console.error('[Apollo People] Erro:', error);
    return [];
  }
}

// Função auxiliar para análise de maturidade digital via Serper
async function analyzeDigitalMaturity(companyName: string, domain: string) {
  const apiKey = Deno.env.get('SERPER_API_KEY');
  if (!apiKey) return null;

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: `${companyName} ${domain} tecnologia cloud digital transformation`,
        num: 10
      })
    });

    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Análise simples baseada em palavras-chave
    const text = JSON.stringify(data).toLowerCase();
    const scores = {
      infrastructure: text.includes('cloud') || text.includes('aws') || text.includes('azure') ? 8 : 4,
      systems: text.includes('erp') || text.includes('crm') || text.includes('software') ? 7 : 3,
      processes: text.includes('automation') || text.includes('digital') ? 7 : 4,
      security: text.includes('security') || text.includes('compliance') ? 6 : 3,
      innovation: text.includes('ai') || text.includes('innovation') ? 8 : 4
    };
    
    const overall = Object.values(scores).reduce((a, b) => a + b, 0) / 5;
    
    return { ...scores, overall, analysis_data: data };
  } catch (error) {
    console.error('[Serper] Erro:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const body = await req.json();
    const validated = companySearchSchema.parse(body);
    const { 
      query, 
      cnpj, 
      website, 
      instagram, 
      linkedin,
      produto,
      marca,
      linkProduto,
      cep,
      logradouro,
      bairro,
      municipio,
      estado,
      pais
    } = validated;
    
    console.log('[Search] Iniciando busca:', { 
      query, 
      cnpj,
      refinamentos: {
        presencaDigital: { website, instagram, linkedin },
        produtos: { produto, marca, linkProduto },
        localizacao: { cep, municipio, estado, pais, bairro, logradouro }
      }
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Buscar dados da ReceitaWS (se CNPJ fornecido)
    let receitaData = null;
    if (cnpj) {
      receitaData = await fetchReceitaWSData(cnpj);
      console.log('[Search] ReceitaWS:', receitaData ? '✅' : '❌');
    }

    // 2. Buscar dados do Apollo.io
    const companyName = query || receitaData?.nome || '';
    
    // Usar website fornecido ou extrair do email da ReceitaWS
    let domain = '';
    if (website) {
      // Extrair domínio do website fornecido
      try {
        domain = new URL(website).hostname.replace('www.', '');
      } catch {
        domain = website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      }
    } else {
      domain = receitaData?.email?.split('@')[1] || '';
    }
    
    const apolloData = await fetchApolloData(companyName, domain);
    console.log('[Search] Apollo:', apolloData ? '✅' : '❌');
    
    // Log de dados de refinamento usados
    if (instagram || linkedin || produto || marca || municipio) {
      console.log('[Search] Refinamentos aplicados:', {
        instagram: !!instagram,
        linkedin: !!linkedin,
        produto: !!produto,
        marca: !!marca,
        localizacao: !!municipio || !!estado || !!pais
      });
    }

    // 3. Salvar empresa no banco (com dados de refinamento)
    const companyPayload = {
      name: companyName,
      cnpj: cnpj || receitaData?.cnpj,
      domain: domain || apolloData?.primary_domain,
      website: website || apolloData?.website_url || receitaData?.fantasia,
      industry: apolloData?.industry || receitaData?.atividade_principal?.[0]?.text,
      employees: apolloData?.estimated_num_employees || 0,
      revenue: apolloData?.annual_revenue,
      location: {
        city: municipio || apolloData?.city || receitaData?.municipio,
        state: estado || apolloData?.state || receitaData?.uf,
        country: pais || apolloData?.country || 'Brasil',
        ...(cep && { cep }),
        ...(bairro && { bairro }),
        ...(logradouro && { logradouro })
      },
      linkedin_url: linkedin || apolloData?.linkedin_url,
      technologies: apolloData?.technologies || [],
      raw_data: { 
        receita: receitaData, 
        apollo: apolloData,
        refinamentos: {
          presencaDigital: { website, instagram, linkedin },
          produtos: { produto, marca, linkProduto },
          localizacao: { cep, logradouro, bairro, municipio, estado, pais }
        }
      }
    };

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .upsert(companyPayload, { onConflict: 'cnpj' })
      .select()
      .single();

    if (companyError) throw companyError;
    console.log('[Search] Empresa salva:', company.id);

    // 4. Buscar e salvar decisores
    const decisionMakers = await fetchDecisionMakers(companyName);
    console.log('[Search] Decisores encontrados:', decisionMakers.length);

    if (decisionMakers.length > 0) {
      const decisorsPayload = decisionMakers.map((person: any) => ({
        company_id: company.id,
        name: person.name,
        title: person.title,
        email: person.email,
        linkedin_url: person.linkedin_url,
        department: person.functions?.[0] || 'Não especificado',
        seniority: person.seniority || 'Não especificado',
        verified_email: person.email_status === 'verified',
        raw_data: person
      }));

      await supabase.from('decision_makers').insert(decisorsPayload);
    }

    // 5. Análise de maturidade digital
    let maturityData = null;
    if (domain) {
      maturityData = await analyzeDigitalMaturity(companyName, domain);
      console.log('[Search] Maturidade:', maturityData ? '✅' : '❌');

      if (maturityData) {
        await supabase.from('digital_maturity').insert({
          company_id: company.id,
          infrastructure_score: maturityData.infrastructure,
          systems_score: maturityData.systems,
          processes_score: maturityData.processes,
          security_score: maturityData.security,
          innovation_score: maturityData.innovation,
          overall_score: maturityData.overall,
          analysis_data: maturityData.analysis_data
        });

        // Atualizar score na empresa
        await supabase
          .from('companies')
          .update({ digital_maturity_score: maturityData.overall })
          .eq('id', company.id);
      }
    }

    // 6. Registrar no histórico (com filtros de refinamento)
    await supabase.from('search_history').insert({
      query: query || cnpj,
      filters: { 
        cnpj: !!cnpj,
        hasWebsite: !!website,
        hasInstagram: !!instagram,
        hasLinkedin: !!linkedin,
        hasProduto: !!produto,
        hasMarca: !!marca,
        hasLocalizacao: !!(municipio || estado || pais),
        hasCep: !!cep,
        refinamentos: {
          presencaDigital: { website, instagram, linkedin },
          produtos: { produto, marca, linkProduto },
          localizacao: { cep, logradouro, bairro, municipio, estado, pais }
        }
      },
      results_count: 1
    });

    // 7. Buscar dados completos para retornar
    const { data: fullCompany } = await supabase
      .from('companies')
      .select(`
        *,
        decision_makers (*),
        digital_maturity (*),
        buying_signals (*)
      `)
      .eq('id', company.id)
      .single();

    console.log('[Search] ✅ Busca concluída');

    return new Response(
      JSON.stringify({ 
        success: true,
        company: fullCompany,
        stats: {
          decisors: decisionMakers.length,
          hasMaturity: !!maturityData
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    // Handle validation errors with details
    if (error instanceof z.ZodError) {
      console.error('[Search] Validation error:', error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Dados inválidos',
          details: error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Use safe error mapping for all other errors
    return createErrorResponse(error, corsHeaders, 500);
  }
});
