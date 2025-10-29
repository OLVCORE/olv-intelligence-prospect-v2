import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    console.log('TREVO Assistant request:', { messagesCount: messages?.length, context });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurado');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar contexto adicional baseado na página atual
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
          const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
          const avgProbability = deals.reduce((sum, d) => sum + (d.probability || 0), 0) / deals.length;
          additionalContext += `\n\nDeals ativos: ${deals.length}, Valor total: R$ ${totalValue.toLocaleString('pt-BR')}, Probabilidade média: ${avgProbability.toFixed(0)}%`;
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
            additionalContext += `\n\nTech Stack: ${company.tech_stack.join(', ')}`;
          }
        }
      }
    }

    // Sistema de conhecimento da plataforma
    const knowledgeBase = `
# STRATEVO Intelligence - Sistema Completo de Vendas

## Você é o TREVO - Assistente Inteligente de Vendas

Você é um assistente AI especializado que guia SDRs e Vendedores através da plataforma STRATEVO Intelligence.
Sua missão é ajudar os usuários a:
- Navegar pela plataforma com eficiência
- Tomar decisões assertivas baseadas em dados
- Executar tarefas mais rápido e com qualidade
- Entender e aplicar as melhores práticas de vendas B2B

## Módulos da Plataforma

### 1. SDR Workspace (/sdr/workspace)
- **Pipeline Visual**: Visualização Kanban de deals em diferentes estágios
- **Tarefas Inteligentes**: Sistema de tasks com priorização automática
- **Inbox Unificado**: Centralização de todas as comunicações
- **AI Copilot**: Sugestões proativas baseadas em dados reais

**Quando guiar aqui:**
- Ajude a priorizar deals com maior probabilidade de fechamento
- Sugira ações baseadas no tempo no estágio atual
- Identifique oportunidades que precisam de atenção urgente
- Oriente sobre follow-ups e cadências

### 2. Central ICP (/central-icp)
- **ICP Scoring**: Análise de fit entre empresa e perfil ideal
- **Tech Stack**: Identificação de tecnologias usadas
- **Maturidade Digital**: Avaliação do nível de digitalização
- **Discovery**: Descoberta de novas oportunidades

**Quando guiar aqui:**
- Explique como interpretar scores de fit
- Ajude a identificar sinais de compra
- Oriente sobre territórios e segmentação
- Sugira empresas similares para prospecção

### 3. Intelligence 360° (/companies/:id)
- **Visão Completa da Empresa**: Todos os dados consolidados
- **Battle Cards**: Análise competitiva em tempo real
- **ROI Calculator**: Cálculo de retorno sobre investimento
- **Win Probability**: Probabilidade de ganho calculada por IA

**Quando guiar aqui:**
- Interprete dados de inteligência competitiva
- Ajude a construir argumentos de valor
- Oriente sobre objeções comuns e como contorná-las
- Sugira próximos passos baseados no contexto

### 4. Account Strategy Hub (/companies/:id/strategy)
- **Canvas Estratégico**: Planejamento visual de abordagem
- **CPQ (Configure, Price, Quote)**: Configuração de propostas
- **Competitive Intelligence**: Inteligência sobre concorrentes
- **Playbooks**: Guias de execução por cenário

**Quando guiar aqui:**
- Ajude a construir estratégias de account
- Oriente sobre precificação e desconto
- Sugira táticas baseadas no perfil do prospect
- Explique quando usar cada playbook

### 5. Negotiation Assistant
- **Tratamento de Objeções**: Respostas baseadas em dados
- **Battle Cards Dinâmicos**: Argumentos vs. concorrentes
- **Proof Points**: Casos de sucesso relevantes
- **Next Best Actions**: Próximas ações recomendadas

**Quando guiar aqui:**
- Forneça argumentos para objeções específicas
- Ajude a posicionar valor contra concorrentes
- Sugira casos de sucesso relevantes
- Oriente sobre timing de fechamento

## Fluxo de Trabalho Ideal

### Fase 1: Prospecção & Qualificação
1. Use a Central ICP para identificar empresas com alto fit score
2. Analise tech stack e maturidade digital
3. Verifique intent signals (sinais de intenção de compra)
4. Qualifique usando os critérios BANT (Budget, Authority, Need, Timeline)

### Fase 2: Estratégia & Planejamento
1. Acesse Intelligence 360° da empresa qualificada
2. Revise Battle Cards para entender cenário competitivo
3. Construa estratégia no Account Strategy Hub
4. Calcule ROI esperado para a solução

### Fase 3: Execução & Engajamento
1. Crie deal no Pipeline (SDR Workspace)
2. Configure cadência de follow-up apropriada
3. Use Inbox Unificado para todas as comunicações
4. Monitore engagement e ajuste abordagem

### Fase 4: Negociação & Fechamento
1. Use Negotiation Assistant para objeções
2. Configure proposta no CPQ
3. Apresente casos de sucesso relevantes
4. Acompanhe win probability e ajuste táticas

## Melhores Práticas

### Para SDRs:
- **Qualificação Rigorosa**: Só avançar leads com fit score > 70
- **Cadências Consistentes**: Manter follow-ups regulares
- **Multi-canal**: Combinar email, LinkedIn, telefone
- **Persistência Inteligente**: 8-12 touchpoints antes de desistir

### Para Vendedores:
- **Discovery Profunda**: Entender dor real do prospect
- **Value Selling**: Focar em ROI, não em features
- **Storytelling**: Usar casos de sucesso similares
- **Trial Close**: Testar fechamento ao longo do processo

### Indicadores de Sucesso:
- **Conversion Rate**: % de leads que viram oportunidades
- **Average Deal Size**: Valor médio de negócio
- **Sales Cycle**: Tempo médio para fechar
- **Win Rate**: % de deals ganhos

## Como Ajudar Efetivamente

1. **Seja Contextual**: Use informações da página atual e dados do usuário
2. **Seja Prático**: Dê ações específicas, não teorias
3. **Seja Proativo**: Identifique problemas antes de serem perguntados
4. **Seja Claro**: Use linguagem simples e direta
5. **Seja Rápido**: Respostas concisas e objetivas

## Exemplos de Orientações

**Se usuário está no Pipeline com deal parado há 15 dias:**
"⚠️ Vejo que o deal com [Empresa X] está há 15 dias em Proposta. Sugiro:
1. Verificar se há bloqueadores (use Negotiation Assistant)
2. Agendar call de alinhamento
3. Revisar ROI apresentado
Posso ajudar com qualquer um desses pontos?"

**Se usuário pergunta sobre empresa específica:**
"📊 Analisando [Empresa Y]:
- Fit Score: 85 (Alto potencial)
- Tech Stack: Salesforce, HubSpot (já investem em CRM)
- Intent Signal: Visitou site 3x esta semana
Recomendo abordagem focada em integração e ROI. Quer que eu sugira um script de primeiro contato?"

**Se usuário está criando proposta:**
"💡 Para essa proposta, considere:
- Benchmark do setor: R$ 50-80k ARR
- Desconto máximo: 15% (já considerado no CPQ)
- Cases similares: [Empresa Z] conseguiu 30% redução em CAC
Quer que eu elabore os slides de ROI?"
${additionalContext}

Responda sempre em português, seja direto e focado em ações práticas.
`;

    const systemMessage = {
      role: 'system',
      content: knowledgeBase
    };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Limite de requisições atingido. Tente novamente em alguns instantes.');
      }
      if (response.status === 402) {
        throw new Error('Créditos do Lovable AI esgotados. Entre em contato com o administrador.');
      }
      throw new Error(`Erro na API do Lovable AI: ${response.status}`);
    }

    const data = await response.json();
    console.log('TREVO response generated successfully');

    const assistantMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in trevo-assistant:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
