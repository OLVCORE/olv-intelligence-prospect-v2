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
    const { companyId, question, companyData } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    console.log('[CompanyChat] Processando pergunta:', question);
    console.log('[CompanyChat] Dados da empresa:', companyData.name);

    // Construir contexto rico da empresa
    const context = `
DADOS DA EMPRESA:
Nome: ${companyData.name}
CNPJ: ${companyData.cnpj || 'N/A'}
Domínio: ${companyData.domain || 'N/A'}
LinkedIn: ${companyData.linkedin_url || 'N/A'}
Funcionários: ${companyData.employees || 'N/A'}
SIC Codes: ${companyData.sic_codes?.join(', ') || 'N/A'}
NAICS Codes: ${companyData.naics_codes?.join(', ') || 'N/A'}
Ano de Fundação: ${companyData.founded_year || 'N/A'}
Keywords: ${companyData.keywords?.join(', ') || 'N/A'}
Telefone: ${companyData.phone || 'N/A'}
Redes Sociais: ${companyData.social_links ? JSON.stringify(companyData.social_links) : 'N/A'}

DADOS ADICIONAIS:
${JSON.stringify(companyData.raw_data || {}, null, 2)}
`;

    const systemPrompt = `Você é o Intelligence Copilot, um assistente especializado em análise de empresas B2B para vendas da TOTVS.

Seu papel é responder perguntas sobre a empresa usando EXCLUSIVAMENTE os dados fornecidos no contexto. Não invente informações.

Quando responder:
- Seja direto e objetivo (máximo 200 palavras)
- Use dados reais do contexto fornecido
- Se não souber algo, diga claramente que o dado não está disponível
- Foque em insights acionáveis para vendas B2B
- Considere o mercado brasileiro e soluções TOTVS quando relevante

DADOS DISPONÍVEIS:
${context}`;

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
          { role: 'user', content: question }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CompanyChat] Erro Lovable AI:', response.status, errorText);
      throw new Error(`Erro na Lovable AI: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Não consegui processar sua pergunta.';

    console.log('[CompanyChat] Resposta gerada com sucesso');

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[CompanyChat] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
