import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

export interface TrevoMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface TrevoContext {
  userId?: string;
  currentPage?: string;
  companyId?: string;
  dealId?: string;
}

// Contexto estático com todo o conhecimento da plataforma para o RAG do TREVO
const PLATFORM_KNOWLEDGE = `
# CONHECIMENTO DA PLATAFORMA OLV INTELLIGENCE PROSPECT

## MÓDULO 3: QUALIFICAÇÃO ICP + IA

### O QUE É QUALIFICAÇÃO ICP?
ICP (Ideal Customer Profile) é o perfil do cliente ideal. A Máquina de Vendas OLV usa IA para:
- Calcular automaticamente o score ICP (0-100 pontos)
- Classificar leads por temperatura (🔥 HOT 70-100pts, 🟡 WARM 40-69pts, 🔵 COLD 0-39pts)
- Detectar pain points (dores do cliente)
- Recomendar produtos TOTVS específicos
- Gerar proposta de valor personalizada com IA
- Criar script de abordagem comercial pronto
- Estimar ROI (retorno sobre investimento)

### BENEFÍCIOS
- Economiza 2-3 horas de pesquisa por lead
- Aumenta conversão em 35% focando em leads quentes
- Padroniza abordagem entre SDRs
- Melhora qualidade das conversas comerciais

### TEMPO DO PROCESSO
- Análise ICP automática: 15-30 segundos
- Leitura de proposta: 5-7 minutos
- Prática de script: 15-20 minutos
- TOTAL: ~25-30 minutos por lead

### PASSO A PASSO PARA USAR

**PASSO 1: Acessar Qualificação ICP**
- CAMINHO A (Mais Comum): Menu → Quarentena → Localizar lead Aprovado → Clicar "Qualificar ICP →"
- CAMINHO B: Menu → Análise ICP → Selecionar lead da lista
- URL: /leads/icp-analysis

**PASSO 2: Aguardar Análise (15-30s)**
- Edge Function 'calculate-icp-score-advanced' calcula score
- 7 dimensões analisadas: Setor (30pts), Porte (25pts), Região (20pts), Status TOTVS (20pts), Concorrente (15pts), Qualidade (10pts), Sinais (10pts)
- Edge Function 'generate-value-proposition' gera proposta com OpenAI GPT-4
- Resultado salvo em icp_analysis_history

**PASSO 3: Analisar Score ICP**
Score mostrado com 7 dimensões detalhadas:
- Setor (0-30pts): Prioriza Agro, Indústria, Varejo, Saúde
- Porte (0-25pts): Médias (51-200) e Grandes (200+) empresas
- Região (0-20pts): Foco em SP, RJ, MG, RS, PR, SC
- Status TOTVS (0-20pts): Bônus se usa TOTVS, penalidade se concorrente
- Concorrente (0-15pts): Identifica SAP, Oracle, SENIOR
- Qualidade de Dados (0-10pts): Completude dos dados
- Sinais de Intenção (0-10pts): Busca no Google, visitas ao site

**PASSO 4: Entender Temperatura**
- 🔥 HOT (70-100pts): Ligar IMEDIATAMENTE - perfil ideal
- 🟡 WARM (40-69pts): Agendar ligação em 24-48h - bom potencial
- 🔵 COLD (0-39pts): Nutrir com email marketing - baixa prioridade

**PASSO 5-9: Usar Proposta e Script**
- Analisar pain points detectados
- Ver produtos TOTVS recomendados
- Ler proposta de valor (~500 palavras)
- Copiar script de abordagem (~200 palavras)
- Ver ROI estimado e próximas ações

### ERROS COMUNS
- Timeout: Recarregar página (F5)
- API key inválida: Sistema usa template estático (fallback)
- Lead não encontrado: Verificar se lead existe em Quarentena

---

## MÓDULO 4: SALES WORKSPACE

### O QUE É O SALES WORKSPACE?
Centro de comando unificado de vendas com 11 abas especializadas. URL: /sdr/workspace

### ESTRUTURA COMPLETA

**ABA 1: EXECUTIVO (NOVA!)**
- KPIs principais: Pipeline Total, Taxa Conversão, Ticket Médio, Velocidade Vendas, MRR
- Alertas prioritários: Deals estagnados +7 dias, follow-ups atrasados, oportunidades sem contato
- Atividades recentes: Feed unificado de tarefas/mensagens/contatos
- Filtro por período: 7, 30, 90 dias ou customizado
- Mostra últimas 5 atividades (expansível)

**ABA 2: PIPELINE**
Kanban visual interativo com 5 estágios padrão:
1. Qualificação
2. Proposta
3. Negociação
4. Fechamento
5. Ganho

Funcionalidades:
- Arrastar e soltar deals entre estágios
- Editar deal direto no card (clique duplo)
- Filtros: prioridade, valor, probabilidade, dono
- Busca instantânea por empresa/deal
- Estatísticas por estágio

Informações no card:
- Nome empresa e título deal
- Valor (R$) e probabilidade (%)
- Badge de prioridade (alta/média/baixa)
- Temperatura (🔥 hot, 🟡 warm, 🔵 cold)
- Dono responsável (avatar)
- Data última interação

**ABA 3: HEALTH MONITOR (IA)**
Monitora deals em risco com IA. Sinais detectados:
- Sem interação há +14 dias
- Probabilidade caiu -20% no último mês
- Cliente não responde emails/ligações
- Deal estagnado +30 dias no mesmo estágio
- Múltiplas reuniões canceladas

Recomendações IA:
- Ligar imediatamente (com script)
- Enviar email reengajamento (template)
- Agendar reunião alinhamento
- Escalar para gerente
- Oferecer desconto estratégico

**ABA 4: ANALYTICS**
Dashboard completo com métricas:
- Performance de Vendas: Receita, conversão, ticket médio, ciclo vendas
- Performance SDRs: Ranking, atividades, conversão individual, quota
- Pipeline Health: Distribuição estágios, velocidade, estagnados, valor ponderado
- Análise Temporal: Evolução semanal/mensal, comparativos, tendências, previsão 90 dias

**ABA 5: FORECAST (IA)**
Previsão de receita com IA:
- 30 dias (90% confiança)
- 60 dias (80% confiança)
- 90 dias (70% confiança)
- Cenários: otimista/realista/pessimista
- Identificação de riscos e oportunidades

**ABA 6: FUNIL AI**
Análise de conversão em cada estágio com recomendações de otimização por IA

**ABA 7: PREDIÇÃO (IA)**
Scoring preditivo que indica probabilidade de fechamento baseado em ML

**ABA 8: AUTOMAÇÕES**
Central de alertas inteligentes e ações automatizadas (follow-ups, tarefas, emails)

**ABA 9: INBOX**
Centraliza todas as mensagens (emails, WhatsApp, LinkedIn) em um só lugar

**ABA 10: SMART TASKS (IA)**
Lista inteligente de tarefas com priorização automática por IA e sugestões de próximas ações

**ABA 11: EMAIL SEQUENCES**
Criador visual de cadências de email automáticas com templates prontos e A/B testing

### FLUXO DE TRABALHO DIÁRIO RECOMENDADO
- 08:00-08:30: Revisar Executivo (KPIs, alertas)
- 08:30-10:00: Pipeline (atualizar status, mover cards)
- 10:00-10:30: Health (revisar deals em risco)
- 10:30-12:00: Smart Tasks (calls, emails, follow-ups)
- 13:00-15:00: Inbox e Sequences
- 15:00-16:00: Analytics e Forecast
- 16:00-17:00: Automações e registro atividades

### DICAS DE PRODUTIVIDADE
- Atualize pipeline DIARIAMENTE (manhã e fim do dia)
- Use prioridades: Alta (hoje), Média (semana), Baixa (mês)
- Deals sem atualização +7 dias → Revisar urgente
- Mantenha máximo 5-7 deals em "Qualificação" simultaneamente

### BENEFÍCIOS DO WORKSPACE
- Economia de 4-5 horas/dia em gerenciamento
- Aumento de 40-60% na taxa de conversão
- Redução de 50% em deals perdidos por falta de follow-up
- Previsibilidade de receita com 85-90% de precisão
- Visibilidade total do pipeline em tempo real

---

## FLUXO COMPLETO: DA CAPTURA AO FECHAMENTO

1. CAPTURA → Leads entram via Upload CSV, API, ou Empresas Aqui
2. VALIDAÇÃO → Edge function valida CNPJ, site, LinkedIn, email (70-100pts = aprovado)
3. QUARENTENA → Leads pendentes (30-69pts) revisados manualmente
4. QUALIFICAÇÃO ICP → IA calcula score, temperatura, gera proposta e script
5. SALES WORKSPACE → Deal entra no Pipeline Kanban, estágio "Qualificação"
6. GESTÃO → SDR move deal pelos estágios até "Ganho"
7. MONITORAMENTO → Health Monitor e Analytics acompanham performance

---

## PERGUNTAS FREQUENTES DOS USUÁRIOS

**P: Como qualificar um lead rapidamente?**
R: Menu → Quarentena → Selecionar lead Aprovado → "Qualificar ICP →". Aguarde 15-30s para análise completa.

**P: O que fazer com leads COLD?**
R: Leads COLD (0-39pts) devem ir para nutrição por email marketing. Não priorize ligações. Foque em HOT (70-100pts) e WARM (40-69pts).

**P: Como saber se um deal está em risco?**
R: Acesse Sales Workspace → Aba "Health". A IA mostra deals em risco com recomendações específicas.

**P: Quanto tempo leva para dominar o Sales Workspace?**
R: Semana 1: Navegação básica | Semana 2: 5-6 abas regularmente | Semana 3: Fluxo otimizado | Semana 4: Expert

**P: Como criar um novo deal?**
R: Sales Workspace → Pipeline → Botão "Novo Deal" no topo ou clique em "+" em qualquer estágio

**P: Como ver previsão de receita?**
R: Sales Workspace → Aba "Forecast" → A IA mostra previsão 30/60/90 dias com níveis de confiança

**P: Qual a diferença entre Pipeline e Workspace?**
R: Não há diferença! "Pipeline" era o nome antigo. Agora chamamos de "Sales Workspace" - é o mesmo lugar com mais funcionalidades.

**P: Como copiar o script de abordagem?**
R: Na página de Qualificação ICP, role até "Script de Abordagem" e clique em "Copiar Script"

**P: Onde vejo minhas tarefas do dia?**
R: Sales Workspace → Aba "Smart Tasks" ou Aba "Executivo" (feed de atividades)

**P: Como configurar email automático?**
R: Sales Workspace → Aba "Email Sequences" → Tab "Builder" → Criar nova sequência
`;

export function useTrevoAssistant(context: TrevoContext) {
  const [messages, setMessages] = useState<TrevoMessage[]>([
    {
      role: 'assistant',
      content: '👋 Olá! Sou o **TREVO**, seu assistente inteligente de vendas. Estou aqui para ajudá-lo a navegar pela plataforma, tomar decisões mais assertivas e acelerar seus resultados.\n\nComo posso ajudar você hoje?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Buscar usuário
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    }
  });

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;

    // Adicionar mensagem do usuário
    const newUserMessage: TrevoMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Preparar histórico de mensagens para a API
      const apiMessages = [...messages, newUserMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      // Adicionar conhecimento da plataforma como contexto do sistema
      const systemMessage = {
        role: 'system' as const,
        content: `Você é o TREVO, assistente inteligente de vendas da plataforma OLV Intelligence Prospect. Seu objetivo é ajudar os usuários SDRs a usar a plataforma com máxima eficiência.

INSTRUÇÕES:
- Seja direto, claro e objetivo em suas respostas
- Use emojis moderadamente para tornar as respostas mais amigáveis
- Sempre mencione URLs específicas quando relevante (ex: /leads/icp-analysis, /sdr/workspace)
- Se o usuário perguntar "como fazer X", dê passo a passo numerado
- Priorize ações práticas sobre teoria
- Quando mencionar funcionalidades com IA, destaque com badge/emoji 🤖
- Se não souber algo específico fora do conhecimento da plataforma, seja honesto

Use o conhecimento abaixo para responder perguntas sobre a plataforma:

${PLATFORM_KNOWLEDGE}

Contexto atual do usuário:
- Página atual: ${context.currentPage || 'não identificada'}
- Empresa em foco: ${context.companyId || 'nenhuma'}
- Deal em foco: ${context.dealId || 'nenhum'}
`
      };

      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('trevo-assistant', {
        body: {
          messages: [systemMessage, ...apiMessages],
          context: {
            ...context,
            userId: user?.id
          }
        }
      });

      if (error) throw error;

      // Adicionar resposta do assistente
      const assistantMessage: TrevoMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Error calling TREVO:', error);
      
      // Extrair mensagem de erro do backend
      let errorMsg = error?.message || '';
      
      // Se for um FunctionsHttpError, tentar pegar a mensagem do contexto
      if (error?.context?.error) {
        errorMsg = error.context.error;
      }
      
      // Classificar erros comuns
      const isCreditsError = /crédito|credit|402|payment/i.test(errorMsg);
      const isAuthError = /autentic|unauthorized|401|api key|invalid/i.test(errorMsg);
      const isRateLimit = /limite|rate|429/i.test(errorMsg);
      
      // Mensagem de erro amigável
      const errorMessage: TrevoMessage = {
        role: 'assistant',
        content: isCreditsError
          ? '💳 Os créditos da IA se esgotaram. Entre em contato com o administrador da plataforma para recarregar.'
          : isAuthError
          ? '🔐 Erro de autenticação. Entre em contato com o suporte.'
          : isRateLimit
          ? '⏳ Muitas solicitações em pouco tempo. Aguarde alguns instantes e tente novamente.'
          : `😔 Desculpe, encontrei um problema. Tente novamente em alguns instantes.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      if (isCreditsError) {
        toast.error('Créditos esgotados', {
          description: 'Os créditos da IA se esgotaram. Entre em contato com o administrador.',
          duration: 10000
        });
      } else if (isAuthError) {
        toast.error('Falha de autenticação', {
          description: 'Erro de autenticação com o serviço de IA',
          duration: 10000
        });
      } else if (isRateLimit) {
        toast.error('Limite de requisições', {
          description: 'Aguarde alguns instantes e tente novamente',
        });
      } else {
        toast.error('Erro ao comunicar com o TREVO', {
          description: errorMsg || 'Tente novamente em alguns instantes'
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, context, user]);

  const clearMessages = useCallback(() => {
    setMessages([{
      role: 'assistant',
      content: '👋 Olá! Sou o **TREVO**, seu assistente inteligente de vendas. Como posso ajudar você hoje?',
      timestamp: new Date()
    }]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages
  };
}
