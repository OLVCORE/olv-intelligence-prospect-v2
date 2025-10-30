import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[TREVO] Iniciando processamento...');

  try {
    // 1. VERIFICAR API KEY
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    console.log('[TREVO] API Key presente?', !!OPENAI_API_KEY);

    if (!OPENAI_API_KEY) {
      console.error('[TREVO] ❌ OPENAI_API_KEY não encontrada nos Secrets');
      return new Response(
        JSON.stringify({
          error: 'API Key não configurada',
          message: 'OPENAI_API_KEY não encontrada. Configure nos Secrets.'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 2. PARSEAR BODY
    let body;
    try {
      body = await req.json();
      console.log('[TREVO] Body recebido:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('[TREVO] ❌ Erro ao parsear JSON:', parseError);
      return new Response(
        JSON.stringify({
          error: 'JSON inválido',
          message: 'Não foi possível processar o corpo da requisição',
          details: parseError.message
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { messages, context } = body;

    if (!messages || messages.length === 0) {
      console.error('[TREVO] ❌ Mensagens não fornecidas');
      return new Response(
        JSON.stringify({
          error: 'Mensagens obrigatórias',
          message: 'Por favor, envie mensagens'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[TREVO] ✓ Mensagens recebidas:', messages.length);

    // 3. BUSCAR CONTEXTO ADICIONAL
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let additionalContext = '';

    if (context?.userId) {
      // Buscar dados do usuário
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', context.userId)
        .single();

      if (profile) {
        additionalContext += `\n\nPerfil do usuário: ${profile.full_name || 'Usuário'}, Papel: ${profile.role || 'SDR'}`;
      }

      // Buscar estatísticas do usuário
      if (context.currentPage?.includes('/sdr/workspace')) {
        const { data: deals } = await supabaseClient
          .from('sdr_deals')
          .select('stage, value, probability')
          .eq('owner_id', context.userId);

        if (deals && deals.length > 0) {
          const totalValue = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
          const avgProbability = deals.reduce((sum, d) => sum + (Number(d.probability) || 0), 0) / deals.length;
          let formattedTotal = String(totalValue);
          try {
            formattedTotal = totalValue.toLocaleString('pt-BR');
          } catch (_) {
            formattedTotal = totalValue.toLocaleString();
          }
          additionalContext += `\n\nDeals ativos: ${deals.length}, Valor total: R$ ${formattedTotal}, Probabilidade média: ${avgProbability.toFixed(0)}%`;
        }

        const { data: tasks } = await supabaseClient
          .from('sdr_tasks')
          .select('status, priority')
          .eq('assigned_to', context.userId)
          .eq('status', 'pending');

        if (tasks && tasks.length > 0) {
          const urgentTasks = tasks.filter(t => t.priority === 'urgent').length;
          additionalContext += `\n\nTarefas pendentes: ${tasks.length}${urgentTasks > 0 ? ` (${urgentTasks} urgentes)` : ''}`;
        }
      }

      if (context.currentPage?.includes('/companies') && context.companyId) {
        const { data: company } = await supabaseClient
          .from('enriched_companies')
          .select('*, tech_stack')
          .eq('id', context.companyId)
          .single();

        if (company) {
          additionalContext += `\n\nEmpresa em visualização: ${company.name}, Segmento: ${company.segment || 'N/A'}, Fit Score: ${company.fit_score || 'N/A'}`;
          if (company.tech_stack) {
            const techStackStr = Array.isArray(company.tech_stack)
              ? company.tech_stack.join(', ')
              : (typeof company.tech_stack === 'string' ? company.tech_stack : '');
            if (techStackStr) {
              additionalContext += `\n\nTech Stack: ${techStackStr}`;
            }
          }
        }
      }
    }

    // 4. PREPARAR SYSTEM PROMPT
    const systemPrompt = `Você é o TREVO, assistente inteligente de vendas da plataforma STRATEVO.

Seu papel:
- Ajudar usuários a navegar pela plataforma
- Explicar funcionalidades e fluxos de trabalho
- Fornecer insights sobre vendas e ICP
- Ser proativo, claro e objetivo

Fluxo oficial da plataforma:
1. CAPTURA - Upload CSV, scraping ou API pública
2. VALIDAÇÃO - CNPJ, website, LinkedIn, email (automática)
3. QUARENTENA - Revisão e aprovação manual
4. QUALIFICAÇÃO ICP - Score 0-100 + Proposta IA
5. SALES WORKSPACE - Centro de comando (11 abas)
6. FECHAMENTO - Deal fechado

Contexto adicional:
${additionalContext || 'Nenhum contexto adicional fornecido'}

Responda de forma clara, objetiva e profissional em português.`;

    // 5. CHAMAR OPENAI
    const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
    const OPENAI_MODEL = 'gpt-4o-mini';

    console.log('[TREVO] Chamando OpenAI:', {
      endpoint: OPENAI_ENDPOINT,
      model: OPENAI_MODEL,
      messages_count: messages.length
    });

    const requestBody = {
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1500,
    };

    // Timeout de 25 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let openaiResponse;
    try {
      openaiResponse = await fetch(OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[TREVO] ❌ Timeout na chamada OpenAI');
        return new Response(
          JSON.stringify({
            error: 'Timeout',
            message: 'A requisição para a OpenAI demorou muito. Tente novamente.'
          }),
          {
            status: 504,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      console.error('[TREVO] ❌ Erro ao chamar OpenAI:', fetchError);
      return new Response(
        JSON.stringify({
          error: 'Erro de conexão',
          message: 'Não foi possível conectar à OpenAI',
          details: fetchError.message
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    clearTimeout(timeoutId);

    console.log('[TREVO] OpenAI respondeu:', {
      status: openaiResponse.status,
      statusText: openaiResponse.statusText
    });

    // 6. TRATAR RESPOSTA OPENAI
    if (!openaiResponse.ok) {
      let errorData;
      try {
        errorData = await openaiResponse.json();
      } catch {
        errorData = { error: { message: 'Erro desconhecido' } };
      }

      console.error('[TREVO] ❌ Erro OpenAI:', {
        status: openaiResponse.status,
        error: errorData
      });

      let errorMessage = 'Erro ao processar sua mensagem';

      switch (openaiResponse.status) {
        case 401:
          errorMessage = 'API Key da OpenAI inválida. Verifique a configuração.';
          break;
        case 429:
          errorMessage = 'Limite de requisições atingido. Aguarde alguns segundos.';
          break;
        case 500:
        case 502:
        case 503:
          errorMessage = 'Serviço da OpenAI temporariamente indisponível.';
          break;
        default:
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          details: errorData,
          status: openaiResponse.status,
          provider: 'OpenAI'
        }),
        {
          status: openaiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 7. PROCESSAR RESPOSTA
    let data;
    try {
      data = await openaiResponse.json();
    } catch (parseError) {
      console.error('[TREVO] ❌ Erro ao parsear resposta OpenAI:', parseError);
      return new Response(
        JSON.stringify({
          error: 'Erro ao processar resposta',
          message: 'Resposta da OpenAI inválida',
          details: parseError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const aiResponse = data.choices?.[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.';

    console.log('[TREVO] ✓ Resposta gerada:', {
      response_length: aiResponse.length,
      tokens_used: data.usage
    });

    return new Response(
      JSON.stringify({
        message: aiResponse,
        provider: 'OpenAI',
        model: OPENAI_MODEL,
        usage: data.usage
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[TREVO] ❌ Erro geral não tratado:', error);
    console.error('[TREVO] Stack trace:', error.stack);

    return new Response(
      JSON.stringify({
        error: 'Erro interno do servidor',
        message: 'Ocorreu um erro inesperado',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
