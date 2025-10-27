import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lastMessage, companyName, contactName, conversationId } = await req.json();

    if (!lastMessage) {
      throw new Error('lastMessage is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get conversation history for better context
    let conversationHistory = '';
    if (conversationId) {
      const { data: messages } = await supabase
        .from('messages')
        .select('body, direction')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (messages && messages.length > 0) {
        conversationHistory = messages
          .reverse()
          .map((m: any) => `${m.direction === 'in' ? 'Cliente' : 'Você'}: ${m.body}`)
          .join('\n');
      }
    }

    // Build context-aware prompt
    const contextParts = [];
    if (companyName) contextParts.push(`Empresa: ${companyName}`);
    if (contactName) contextParts.push(`Contato: ${contactName}`);
    
    const contextStr = contextParts.length > 0 ? contextParts.join(' | ') : '';
    
    const prompt = `Você é um assistente comercial B2B profissional. Analise a última mensagem recebida e sugira 3 respostas curtas, profissionais e contextualizadas.

${contextStr ? `Contexto: ${contextStr}\n` : ''}
${conversationHistory ? `Histórico da conversa:\n${conversationHistory}\n\n` : ''}
Última mensagem recebida: "${lastMessage}"

Crie 3 sugestões de resposta:
1. Uma resposta empática e consultiva
2. Uma resposta direta e objetiva
3. Uma resposta que avança a conversa para próximo passo

Regras:
- Máximo 2-3 linhas por sugestão
- Tom profissional mas amigável
- Adequado ao contexto B2B brasileiro
- Sem formalidade excessiva
- Use primeira pessoa (eu/nós)

Retorne apenas as 3 sugestões, uma por linha, sem numeração ou marcadores.`;

    console.log('Generating AI suggestions with prompt:', prompt);

    // Call Lovable AI
    const { data: aiData, error: aiError } = await supabase.functions.invoke('lovable-ai', {
      body: {
        model: 'openai/gpt-5-mini',
        prompt,
        max_tokens: 500,
        temperature: 0.7,
      }
    });

    if (aiError) {
      console.error('Lovable AI error:', aiError);
      throw aiError;
    }

    console.log('AI response:', aiData);

    // Parse the AI response
    const suggestions = (aiData.response || '')
      .split('\n')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 10)
      .slice(0, 3);

    if (suggestions.length === 0) {
      throw new Error('No valid suggestions generated');
    }

    return new Response(
      JSON.stringify({ suggestions }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in ai-suggest-replies:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
