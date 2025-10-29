import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, companyData } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const APOLLO_API_KEY = Deno.env.get('APOLLO_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    console.log('[CompanyDiagnostic] Gerando diagnóstico para:', companyData.name);

    // Buscar empresas similares no Apollo (se disponível)
    let similarCompanies: any[] = [];
    if (APOLLO_API_KEY && companyData.location) {
      try {
        const apolloSearchPayload = {
          api_key: APOLLO_API_KEY,
          q_organization_name: companyData.name,
          page: 1,
          per_page: 10,
          organization_locations: [companyData.location],
          organization_num_employees_ranges: companyData.employees_count 
            ? [`${Math.max(1, companyData.employees_count - 200)},${companyData.employees_count + 200}`]
            : undefined
        };

        const apolloResponse = await fetch('https://api.apollo.io/v1/mixed_companies/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify(apolloSearchPayload),
        });

        if (apolloResponse.ok) {
          const apolloData = await apolloResponse.json();
          const orgs = apolloData.organizations || [];
          similarCompanies = orgs
            .filter((org: any) => org.id !== companyData.apollo_organization_id)
            .slice(0, 10)
            .map((org: any) => ({
              name: org.name,
              domain: org.primary_domain,
              employees: org.estimated_num_employees,
              location: org.city && org.state ? `${org.city}, ${org.state}, ${org.country}` : null,
              apollo_url: `https://app.apollo.io/#/organizations/${org.id}`
            }));
          console.log('[CompanyDiagnostic] Encontradas', similarCompanies.length, 'empresas similares');
        }
      } catch (err) {
        console.warn('[CompanyDiagnostic] Erro ao buscar empresas similares:', err);
      }
    }

    // Construir contexto rico
    const context = `
DADOS DA EMPRESA:
Nome: ${companyData.name}
CNPJ: ${companyData.cnpj || 'N/A'}
Domínio: ${companyData.domain || 'N/A'}
LinkedIn: ${companyData.linkedin_url || 'N/A'}
Funcionários: ${companyData.employees_count || 'N/A'}
SIC Codes: ${companyData.sic_codes?.join(', ') || 'N/A'}
NAICS Codes: ${companyData.naics_codes?.join(', ') || 'N/A'}
Ano de Fundação: ${companyData.founded_year || 'N/A'}
Keywords: ${companyData.keywords?.join(', ') || 'N/A'}
Telefone: ${companyData.phone || 'N/A'}
Localização: ${companyData.location || 'N/A'}
Redes Sociais: ${companyData.social_links ? JSON.stringify(companyData.social_links) : 'N/A'}

DADOS ADICIONAIS:
${JSON.stringify(companyData.raw_data || {}, null, 2)}
`;

    const systemPrompt = `Você é um especialista em inteligência de mercado B2B para a TOTVS.

Sua tarefa é gerar um diagnóstico 360° COMPLETO e DETALHADO da empresa, considerando:
1. Segmentação e classificação de mercado
2. Perfil ideal de decisor para abordar
3. Estratégia de abordagem comercial
4. Produtos TOTVS mais adequados
5. Potencial de negócio
6. Riscos e oportunidades

Use TODOS os dados fornecidos no contexto. Seja específico, prático e acionável.

RESPONDA EM PORTUGUÊS BRASILEIRO usando EXCLUSIVAMENTE o formato JSON abaixo (sem markdown):

{
  "overview": "Visão geral da empresa em 3-4 parágrafos",
  "segment_analysis": "Análise detalhada do segmento, mercado e posicionamento",
  "ideal_buyer_persona": "Perfil detalhado do decisor ideal (cargo, dores, motivações)",
  "recommended_approach": "Estratégia de abordagem comercial específica",
  "totvs_products": ["Produto 1", "Produto 2", "Produto 3"],
  "business_potential": "Análise do potencial de receita e fit com TOTVS",
  "risks": ["Risco 1", "Risco 2", "Risco 3"],
  "opportunities": ["Oportunidade 1", "Oportunidade 2", "Oportunidade 3"]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analise esta empresa:\n\n${context}` }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CompanyDiagnostic] Erro Lovable AI:', response.status, errorText);
      throw new Error(`Erro na Lovable AI: ${response.status}`);
    }

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || '{}';

    // Limpar markdown se houver
    aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let diagnostic;
    try {
      diagnostic = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('[CompanyDiagnostic] Erro ao parsear JSON:', parseError);
      throw new Error('Erro ao processar resposta da IA');
    }

    // Adicionar empresas similares
    diagnostic.similar_companies = similarCompanies;

    console.log('[CompanyDiagnostic] Diagnóstico gerado com sucesso');

    return new Response(
      JSON.stringify(diagnostic),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[CompanyDiagnostic] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
