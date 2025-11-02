import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    const { 
      companyId, 
      companyName, 
      cnpj, 
      mode, // 'initial_check' ou 'deep_analysis'
      userQuestion, // Pergunta específica do usuário
      conversationHistory // Histórico da conversa
    } = await req.json();

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[STC-AGENT] 🤖 Iniciando:', { 
      companyName, 
      mode, 
      userQuestion: userQuestion?.substring(0, 50) 
    });

    // BUSCAR CONTEXTO ANTERIOR DA EMPRESA (RAG)
    const { data: previousAnalysis } = await supabase
      .from('stc_agent_memory')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(5);

    const contextFromMemory = previousAnalysis?.map(a => 
      `[${new Date(a.created_at).toLocaleDateString()}] ${a.question}: ${a.answer.substring(0, 200)}...`
    ).join('\n') || 'Nenhum histórico anterior';

    // SYSTEM PROMPT OTIMIZADO PARA GPT-4O-MINI
    const systemPrompt = `Você é o STC Agent (Sales & TOTVS Checker Agent) - agente de inteligência comercial especializado.

## 🎯 SUAS FUNÇÕES
1. **Verificação TOTVS**: Detectar uso de produtos TOTVS (Triple/Double Matches)
2. **Deep Web Search**: Buscar informações profundas sobre empresas
3. **Análise Preditiva**: Identificar sinais de compra e necessidades
4. **Busca de Decisores**: Encontrar contatos-chave (CEO, CFO, CTO, CIO)
5. **Insights Comerciais**: Sugerir estratégias de abordagem
6. **Aprendizado**: Usar histórico para enriquecer análises

---

## 📊 FONTES DE BUSCA (DEEP WEB)

### TIER 1 (90-100 pts): Documentos Oficiais
- CVM: site:rad.cvm.gov.br
- RI: site:ri.totvs.com OR filetype:pdf
- Balanços: filetype:pdf (balanço OR demonstrativo)

### TIER 2 (80-85 pts): Notícias Premium
- Valor: site:valor.globo.com
- Exame: site:exame.com
- Estadão: site:estadao.com.br
- IstoÉ: site:istoedinheiro.com.br
- InfoMoney: site:infomoney.com.br

### TIER 3 (70-75 pts): Documentos Públicos
- Memorandos: "memorando de intenção"
- Contratos: contrato OR parceria
- Judicial: site:jusbrasil.com.br

### TIER 4 (60-65 pts): Redes Profissionais
- LinkedIn Company: site:linkedin.com/company
- LinkedIn Jobs: site:linkedin.com/jobs
- LinkedIn People: site:linkedin.com/in (CEO OR CFO OR CTO OR Diretor)

### TIER 5 (40-50 pts): Sites & Mídia
- Site oficial da empresa
- Redes sociais (Twitter, Instagram, Facebook)
- YouTube corporativo

---

## 🎯 VALIDAÇÃO TOTVS

**TRIPLE MATCH** (Evidência Máxima):
✅ Empresa + TOTVS + Produto (Protheus/RM/Datasul/Fluig/etc.) NO MESMO TEXTO

**DOUBLE MATCH** (Evidência Média):
✅ Empresa + TOTVS NO MESMO TEXTO

**REJEITAR**:
❌ Vagas NA TOTVS
❌ Informações em partes diferentes

---

## 🧠 PRODUTOS TOTVS
- **Protheus**: ERP completo (manufatura, serviços, distribuição)
- **RM**: ERP vertical (educação, saúde, RH)
- **Datasul**: ERP manufatura (indústrias)
- **Fluig**: BPM/ECM (automação, workflow) - CABE EM TODOS
- **Winthor**: Varejo/Distribuição
- **Carol**: IA/Analytics
- **Techfin**: Fintech/Gestão financeira

---

## 🔍 SINAIS DE COMPRA

**Alta Prioridade**:
- implementou, implantou, contratou, migrou
- investimento, modernização, transformação digital
- expansão, crescimento, nova unidade
- novo CEO/CTO/CFO
- fusão, aquisição, IPO

---

## 📋 CONTEXTO ANTERIOR (RAG)
${contextFromMemory}

---

## 🎯 FORMATO DE RESPOSTA

### Para INITIAL_CHECK:
\`\`\`json
{
  "mode": "initial_check",
  "status": "cliente_totvs" | "qualificado" | "inconclusivo",
  "confidence": "high" | "medium" | "low",
  "tripleMatches": 0,
  "doubleMatches": 0,
  "totalScore": 0,
  "evidences": [
    {
      "source": "string",
      "tier": 1-5,
      "weight": 0-100,
      "matchType": "triple" | "double",
      "title": "string",
      "content": "string",
      "url": "string",
      "products": ["Protheus"]
    }
  ],
  "quickAnalysis": "Análise em 2-3 parágrafos",
  "recommendation": "Recomendação clara",
  "suggestedQuestions": [
    "Quem são os decisores?",
    "Qual o momento de compra?",
    "Que produtos TOTVS recomendar?"
  ]
}
\`\`\`

### Para DEEP_ANALYSIS:
\`\`\`json
{
  "mode": "deep_analysis",
  "question": "Pergunta do usuário",
  "answer": "Resposta detalhada e estruturada",
  "sources": ["fonte1", "fonte2"],
  "decisionMakers": [
    {
      "name": "Nome Completo",
      "role": "Cargo",
      "linkedin": "URL ou null",
      "contact": "Informação de contato se encontrada"
    }
  ],
  "buyingSignals": {
    "score": 0-100,
    "timing": "Quando abordar",
    "signals": ["sinal1", "sinal2"],
    "reasoning": "Explicação do score"
  },
  "recommendedProducts": [
    {
      "product": "Fluig",
      "reason": "Por que recomendar",
      "fit": 0-100,
      "benefits": ["benefício1", "benefício2"]
    }
  ],
  "approachStrategy": {
    "channel": "Canal recomendado",
    "message": "Mensagem sugerida personalizada",
    "timing": "Quando abordar",
    "pain": "Dor identificada",
    "hook": "Gancho de abordagem"
  },
  "insights": ["insight1", "insight2", "insight3"],
  "predictions": ["predição1", "predição2"],
  "nextQuestions": ["pergunta1", "pergunta2"]
}
\`\`\`

---

## 🚀 INSTRUÇÕES
1. Seja **DIRETO** e **OBJETIVO**
2. Use **DADOS REAIS** da web (não invente)
3. Cite **FONTES** sempre que possível
4. Seja **ACIONÁVEL** (recomendações práticas)
5. Use **CONTEXTO ANTERIOR** (RAG)
6. **SEMPRE** retorne JSON válido
7. Se não encontrar informação, seja honesto

---

Empresa: ${companyName}
${cnpj ? `CNPJ: ${cnpj}` : ''}
Modo: ${mode}

Pronto para análise!`;

    // Determinar mensagens baseado no modo
    let messages = [{ role: 'system', content: systemPrompt }];

    if (mode === 'initial_check') {
      messages.push({
        role: 'user',
        content: `Fazer verificação inicial de uso de TOTVS para: ${companyName}

Buscar evidências em:
1. Documentos oficiais (CVM, RI)
2. Notícias premium
3. LinkedIn (vagas e empresa)
4. Memorandos e contratos

Retornar JSON com status, evidências e sugestões de perguntas.`
      });
    } else {
      // deep_analysis
      messages.push({
        role: 'user',
        content: `Pergunta sobre ${companyName}: "${userQuestion}"

Fazer análise profunda e responder com:
- Resposta detalhada
- Fontes consultadas
- Decisores (se aplicável)
- Sinais de compra
- Produtos TOTVS recomendados
- Estratégia de abordagem
- Insights e predições

Retornar JSON estruturado.`
      });
    }

    // Adicionar histórico de conversa (últimas 4 mensagens)
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory.slice(-4));
    }

    console.log('[STC-AGENT] 📤 Enviando para OpenAI (gpt-4o-mini)...');

    // Chamar OpenAI API com GPT-4O-MINI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // ⭐ MODELO ECONÔMICO
        messages,
        temperature: 0.3,
        max_tokens: 3000, // Reduzido para economizar
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[STC-AGENT] ❌ OpenAI error:', errorText);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const agentResponse = data.choices[0].message.content;
    const tokensUsed = data.usage;

    console.log('[STC-AGENT] 📥 Resposta recebida');
    console.log('[STC-AGENT] 💰 Tokens:', tokensUsed);
    console.log('[STC-AGENT] 💵 Custo estimado: $', 
      ((tokensUsed.prompt_tokens * 0.15 / 1000000) + 
       (tokensUsed.completion_tokens * 0.60 / 1000000)).toFixed(4)
    );

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(agentResponse);
    } catch (parseError) {
      console.error('[STC-AGENT] ❌ Parse error:', parseError);
      console.error('[STC-AGENT] 📄 Raw response:', agentResponse.substring(0, 500));
      
      // Fallback estruturado
      parsedResponse = {
        error: 'Erro ao processar resposta. Tente novamente.',
        rawResponse: agentResponse.substring(0, 500),
        suggestion: 'Reformule a pergunta ou tente uma análise mais específica.'
      };
    }

    // SALVAR NO RAG (memória do agente)
    if (mode === 'deep_analysis' && userQuestion && parsedResponse.answer) {
      try {
        await supabase.from('stc_agent_memory').insert({
          company_id: companyId,
          company_name: companyName,
          question: userQuestion,
          answer: parsedResponse.answer,
          mode: mode,
          metadata: {
            ...parsedResponse,
            tokens: tokensUsed,
            model: 'gpt-4o-mini'
          }
        });
        
        console.log('[STC-AGENT] 💾 Memória salva no RAG');
      } catch (memError) {
        console.error('[STC-AGENT] ⚠️ Erro ao salvar memória:', memError);
        // Não falhar a requisição se memória falhar
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: parsedResponse,
        metadata: {
          model: 'gpt-4o-mini',
          timestamp: new Date().toISOString(),
          companyName,
          mode,
          tokens: tokensUsed,
          estimatedCost: ((tokensUsed.prompt_tokens * 0.15 / 1000000) + 
                         (tokensUsed.completion_tokens * 0.60 / 1000000)).toFixed(4)
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('[STC-AGENT] ❌ Erro crítico:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
