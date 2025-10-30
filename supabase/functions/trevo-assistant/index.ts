import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[TREVO] 🚀 Iniciando processamento...');

  try {
    // 1. VERIFICAR API KEY DA OPENAI
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    console.log('[TREVO] 🔑 API Key presente?', !!OPENAI_API_KEY);

    if (!OPENAI_API_KEY) {
      console.error('[TREVO] ❌ OPENAI_API_KEY não encontrada nos Secrets');
      return new Response(
        JSON.stringify({
          error: 'Configuração inválida',
          message: 'OPENAI_API_KEY não configurada. Configure nos Secrets do Supabase.',
          debug: {
            timestamp: new Date().toISOString()
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 2. PARSEAR BODY DA REQUISIÇÃO
    let body;
    try {
      body = await req.json();
      console.log('[TREVO] 📥 Body recebido:', {
        has_message: !!body.message,
        has_context: !!body.context,
      });
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

    const { message, messages: incomingMessages, context } = body;

    // 3. VALIDAR MENSAGEM (aceita 'message' ou histórico 'messages')
    let userMessageStr: string | null = null;
    if (typeof message === 'string' && message.trim().length > 0) {
      userMessageStr = message.trim();
    } else if (Array.isArray(incomingMessages)) {
      const lastUser = [...incomingMessages].reverse().find((m: any) => m?.role === 'user' && typeof m.content === 'string');
      userMessageStr = lastUser?.content || null;
    }

    if (!userMessageStr) {
      console.error('[TREVO] ❌ Mensagem inválida ou vazia');
      return new Response(
        JSON.stringify({
          error: 'Mensagem obrigatória',
          message: 'Por favor, envie uma mensagem válida'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[TREVO] ✅ Mensagem válida recebida:', (userMessageStr || '').substring(0, 100) + '...');

    // 4. PREPARAR PROMPT DO SISTEMA
    const systemPrompt = `Você é o TREVO, assistente inteligente de vendas da plataforma STRATEVO.

**Seu papel:**
- Ajudar usuários a navegar pela plataforma
- Explicar funcionalidades e fluxos de trabalho
- Fornecer insights sobre vendas e ICP
- Ser proativo, claro e objetivo
- Responder SEMPRE em português brasileiro

**Fluxo oficial da plataforma STRATEVO:**
1. **CAPTURA** - Upload CSV, scraping ou API pública
2. **VALIDAÇÃO** - CNPJ, website, LinkedIn, email (automática)
3. **QUARENTENA** - Revisão e aprovação manual
4. **QUALIFICAÇÃO ICP** - Score 0-100 + Proposta IA
5. **SALES WORKSPACE** - Centro de comando (11 abas)
6. **FECHAMENTO** - Deal fechado!

**Contexto adicional:**
${context ? JSON.stringify(context, null, 2) : 'Nenhum contexto adicional'}

**Instruções:**
- Seja direto e objetivo
- Use emojis quando apropriado
- Forneça exemplos práticos
- Sugira próximos passos`;

    // 5. CONFIGURAR CHAMADA OPENAI
    const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
    const OPENAI_MODEL = 'gpt-4o-mini';

    // Montar mensagens para a OpenAI preservando histórico quando enviado pelo cliente
    const openaiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...(Array.isArray(incomingMessages) && incomingMessages.length > 0
        ? incomingMessages
            .filter((m: any) => m && typeof m.content === 'string' && m.role !== 'system')
            .map((m: any) => ({ role: m.role, content: m.content }))
        : [{ role: 'user', content: userMessageStr! }])
    ];

    const requestBody = {
      model: OPENAI_MODEL,
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 1500,
    };

    console.log('[TREVO] 🤖 Chamando OpenAI...', {
      endpoint: OPENAI_ENDPOINT,
      model: OPENAI_MODEL,
      message_length: (userMessageStr?.length ?? 0),
      has_history: Array.isArray(incomingMessages),
      history_count: Array.isArray(incomingMessages) ? incomingMessages.length : 0
    });

    // 6. CHAMAR OPENAI COM TIMEOUT
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

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
        console.error('[TREVO] ⏱️ Timeout na chamada OpenAI');
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
      
      console.error('[TREVO] ❌ Erro ao conectar OpenAI:', fetchError);
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

    console.log('[TREVO] 📡 OpenAI respondeu:', {
      status: openaiResponse.status,
      statusText: openaiResponse.statusText
    });

    // 7. TRATAR ERROS DA OPENAI
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
          errorMessage = '🔑 API Key da OpenAI inválida ou expirada. Verifique a configuração nos Secrets.';
          break;
        case 429:
          errorMessage = '⏳ Limite de requisições atingido. Aguarde alguns segundos e tente novamente.';
          break;
        case 500:
        case 502:
        case 503:
          errorMessage = '🔧 Serviço da OpenAI temporariamente indisponível. Tente novamente em alguns instantes.';
          break;
        default:
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          details: errorData,
          status: openaiResponse.status,
          provider: 'OpenAI',
          model: OPENAI_MODEL
        }),
        {
          status: openaiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 8. PROCESSAR RESPOSTA DA OPENAI
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

    console.log('[TREVO] ✅ Resposta gerada com sucesso:', {
      response_length: aiResponse.length,
      model: OPENAI_MODEL,
      tokens_used: data.usage
    });

    // 9. RETORNAR RESPOSTA
    return new Response(
      JSON.stringify({
        response: aiResponse,
        message: aiResponse,
        provider: 'OpenAI',
        model: OPENAI_MODEL,
        usage: data.usage,
        timestamp: new Date().toISOString()
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
        message: 'Ocorreu um erro inesperado ao processar sua mensagem',
        details: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
