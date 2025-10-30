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
# CONHECIMENTO COMPLETO DA PLATAFORMA OLV INTELLIGENCE PROSPECT

## VISÃO GERAL DO SISTEMA

**O QUE É A MÁQUINA DE VENDAS?**
Sistema completo e automatizado para gerenciar todo o ciclo de vendas B2B com 6 módulos principais:

### MÓDULOS DO SISTEMA
1. **Captura Inteligente** - Capture leads de múltiplas fontes (CSV, web scraping, API pública)
2. **Validação Automática** - CNPJ, website, LinkedIn, email validados automaticamente
3. **Qualificação com IA** - Score ICP 0-100 com 7 dimensões de análise
4. **Proposta Personalizada** - IA gera propostas de valor e scripts únicos
5. **Sales Workspace** - Centro de comando com 11 abas especializadas
6. **Analytics Avançado** - Funil de conversão, KPIs e insights acionáveis

### FLUXO COMPLETO DO SISTEMA
📥 CAPTURA → 🔍 VALIDAÇÃO → ⏳ QUARENTENA → 🎯 QUALIFICAÇÃO ICP → 🎛️ SALES WORKSPACE → 💰 FECHAMENTO

---

## MÓDULO 1: CAPTURA DE LEADS

### OPÇÃO 1: Upload Manual (CSV/Excel)
**Como funciona:**
1. Prepare arquivo com colunas: name (obrigatório), cnpj, website, email, phone, sector, state, city, employees
2. Clique em "Upload Manual" em /leads/capture
3. Sistema detecta duplicados, insere em quarentena, dispara validação automática

**Colunas aceitas:** name/empresa, cnpj, website/site, email, phone/telefone, sector/setor, state/estado, city/cidade, employees/funcionarios

**Após upload:**
- Sistema normaliza dados
- Ignora duplicados (por CNPJ)
- Insere leads com status 'pending'
- Validação automática iniciada
- Toast de confirmação

### OPÇÃO 2: Empresas Aqui (Web Scraping)
**Como funciona:**
1. Clique "Buscar Empresas" em /leads/capture
2. Redireciona para /central-icp/discovery
3. Configure filtros (setor, estado, porte)
4. Sistema faz scraping automático
5. Leads inseridos na quarentena

**Vantagens:** Dados públicos atualizados, filtragem precisa por ICP, 100% automatizado

### OPÇÃO 3: API Pública (Integração Web)
**Endpoint:** POST https://[SEU-PROJETO].supabase.co/functions/v1/capture-lead-api

**Campos aceitos:** name (obrigatório), email, phone, sector, state, city, message, source

---

## MÓDULO 2: QUARENTENA INTELIGENTE

### ACESSO
URL: /leads/quarantine
Menu: Sidebar → Quarentena

### FILTROS DISPONÍVEIS
**Por Status:**
- Todos
- Pendentes (aguardando revisão)
- Validando (em processo)
- Aprovados (prontos para ICP)
- Rejeitados (não qualificados)
- Duplicados (CNPJ existente)

**Por Fonte:**
- Upload Manual
- Empresas Aqui
- API Web
- Indicação

**Busca:** Busca instantânea por nome, CNPJ ou email (debounce 300ms, case-insensitive)

### ESTRUTURA DO CARD DE LEAD
1. **Cabeçalho:** Nome empresa + badges (status, fonte)
2. **Dados Principais:** CNPJ, setor, local, funcionários
3. **Validações:** Badges de CNPJ válido, site ativo, LinkedIn, email
4. **Scores:** Score de validação (0-100) e qualidade de dados (%)

### AÇÕES DISPONÍVEIS

**1. VALIDAR Lead**
- Quando: Status pending, score 30-69
- O que faz: Valida CNPJ/website/LinkedIn/email via APIs
- Tempo: 5-30 segundos
- Resultado: approved (≥70), pending (30-69) ou rejected (<30)

**2. APROVAR Lead**
- Quando: Revisão manual, decidiu que é válido
- O que faz: Muda status para approved manualmente
- Habilita botão "Qualificar ICP →"

**3. REJEITAR Lead**
- Quando: Dados ruins, empresa fora do ICP, duplicado
- O que faz: Remove do fluxo de vendas, status rejected

**4. QUALIFICAR ICP →**
- Quando: Lead approved
- O que faz: Redireciona para /leads/icp-analysis, inicia análise automática
- Próximo: Lead vai para Sales Workspace após qualificação

### SISTEMA DE SCORING (0-100)
**70-100 pontos:** ✅ Aprovado automaticamente (dados completos e validados)
**30-69 pontos:** ⚠️ Revisão manual necessária (operador decide)
**0-29 pontos:** ❌ Rejeitado automaticamente (dados insuficientes)

**Critérios:**
- CNPJ Válido: +25pts
- Website Ativo: +25pts
- LinkedIn Encontrado: +20pts
- Email Válido: +15pts
- Telefone: +10pts
- Dados Completos: +5pts

---

## MÓDULO 3: QUALIFICAÇÃO ICP + IA

### O QUE É QUALIFICAÇÃO ICP?
ICP (Ideal Customer Profile) é o perfil do cliente ideal. A IA calcula score 0-100 com 7 dimensões, classifica por temperatura e gera proposta personalizada.

### BENEFÍCIOS
- Economiza 2-3 horas de pesquisa por lead
- Aumenta conversão em 35%
- Padroniza abordagem entre SDRs
- Melhora qualidade das conversas

### TEMPO DO PROCESSO
- Análise ICP automática: 15-30s
- Leitura proposta: 5-7min
- Prática script: 15-20min
- **TOTAL: ~25-30 minutos por lead**

### PASSO A PASSO

**PASSO 1: Acessar**
- Via Quarentena: Lead aprovado → "Qualificar ICP →"
- Via Direto: Menu → Análise ICP → Selecionar lead
- URL: /leads/icp-analysis

**PASSO 2: Aguardar Análise (15-30s)**
- Edge Function 'calculate-icp-score-advanced' calcula score
- Edge Function 'generate-value-proposition' gera proposta (GPT-4)
- Resultado salvo em icp_analysis_history

**PASSO 3: Analisar Score ICP (7 Dimensões)**
1. **Setor (0-30pts):** Prioriza Agro, Indústria, Varejo, Saúde
2. **Porte (0-25pts):** Médias (51-200) e Grandes (200+) empresas
3. **Região (0-20pts):** Foco SP, RJ, MG, RS, PR, SC
4. **Status TOTVS (0-20pts):** Bônus se usa TOTVS, penalidade se concorrente
5. **Concorrente (0-15pts):** Identifica SAP, Oracle, SENIOR
6. **Qualidade Dados (0-10pts):** Completude dos dados
7. **Sinais Intenção (0-10pts):** Busca Google, visitas site

**PASSO 4: Entender Temperatura**
- 🔥 **HOT (70-100pts):** Ligar IMEDIATAMENTE - perfil ideal, alta prioridade
- 🟡 **WARM (40-69pts):** Agendar ligação 24-48h - bom potencial
- 🔵 **COLD (0-39pts):** Nutrir com email marketing - baixa prioridade

**PASSOS 5-9:** Analisar pain points, ver produtos recomendados, ler proposta (~500 palavras), copiar script (~200 palavras), ver ROI estimado

### ERROS COMUNS
- **Timeout:** Recarregar página (F5)
- **API key inválida:** Sistema usa template estático (fallback)
- **Lead não encontrado:** Verificar em Quarentena

---

## MÓDULO 4: SALES WORKSPACE (Centro de Comando)

### O QUE É?
Centro de comando unificado de vendas com 11 abas especializadas.
**URL:** /sdr/workspace | **Menu:** SDR → Sales Workspace

### ESTRUTURA COMPLETA - 11 ABAS

**ABA 1: EXECUTIVO (NOVA!)**
Dashboard executivo minimalista com indicadores críticos:
- **KPIs:** Pipeline Total (R$), Taxa Conversão (%), Ticket Médio (R$), Velocidade Vendas (dias), MRR
- **Alertas:** Deals estagnados +7 dias, follow-ups atrasados, oportunidades sem contato
- **Atividades:** Feed unificado de tarefas/mensagens/contatos com filtro de período (7, 30, 90 dias)

**ABA 2: PIPELINE**
Kanban visual interativo com 5 estágios: Qualificação → Proposta → Negociação → Fechamento → Ganho

Funcionalidades:
- Arrastar e soltar deals entre estágios
- Editar deal direto (clique duplo)
- Filtros: prioridade, valor, probabilidade, dono
- Busca instantânea
- Estatísticas por estágio

**ABA 3: HEALTH MONITOR (IA)**
Monitora deals em risco com IA. Sinais detectados:
- Sem interação há +14 dias
- Probabilidade caiu -20% no mês
- Cliente não responde
- Deal estagnado +30 dias
- Reuniões canceladas

Recomendações IA: Ligar (com script), email reengajamento (template), reunião alinhamento, escalar gerente, desconto estratégico

**ABA 4: ANALYTICS**
Dashboard completo:
- Performance Vendas: receita, conversão, ticket médio, ciclo vendas
- Performance SDRs: ranking, atividades, conversão individual, quota
- Pipeline Health: distribuição estágios, velocidade, estagnados, valor ponderado
- Análise Temporal: evolução semanal/mensal, comparativos, tendências, previsão 90 dias

**ABA 5: FORECAST (IA)**
Previsão de receita:
- 30 dias (90% confiança)
- 60 dias (80% confiança)
- 90 dias (70% confiança)
- Cenários: otimista/realista/pessimista
- Riscos e oportunidades

**ABAS 6-11 (RESUMO)**
6. **Funil AI:** Análise conversão com otimizações IA
7. **Predição:** Scoring preditivo ML
8. **Automações:** Alertas inteligentes e ações automáticas
9. **Inbox:** Mensagens centralizadas (emails, WhatsApp, LinkedIn)
10. **Smart Tasks:** Tarefas com priorização IA
11. **Email Sequences:** Cadências automáticas com templates

### FLUXO DE TRABALHO DIÁRIO RECOMENDADO
- 08:00-08:30: Executivo (KPIs, alertas)
- 08:30-10:00: Pipeline (atualizar status)
- 10:00-10:30: Health (deals em risco)
- 10:30-12:00: Smart Tasks (calls, emails)
- 13:00-15:00: Inbox e Sequences
- 15:00-16:00: Analytics e Forecast
- 16:00-17:00: Automações e registro

### DICAS DE PRODUTIVIDADE
- Atualize pipeline DIARIAMENTE (manhã e fim de dia)
- Prioridades: Alta (hoje), Média (semana), Baixa (mês)
- Deals sem atualização +7 dias → Revisar urgente
- Máximo 5-7 deals em "Qualificação" simultaneamente

### BENEFÍCIOS
- Economia de 4-5 horas/dia
- Aumento 40-60% conversão
- Redução 50% deals perdidos
- Previsibilidade 85-90% receita
- Visibilidade total real-time

---

## PERGUNTAS FREQUENTES (FAQ)

**P: Como qualificar um lead rapidamente?**
R: Menu → Quarentena → Lead Aprovado → "Qualificar ICP →". Aguarde 15-30s.

**P: O que fazer com leads COLD?**
R: Leads COLD (0-39pts) vão para nutrição por email. Não priorize. Foque em HOT (70-100pts) e WARM (40-69pts).

**P: Como saber se deal está em risco?**
R: Sales Workspace → Aba "Health". IA mostra deals em risco com recomendações.

**P: Quanto tempo para dominar Sales Workspace?**
R: Semana 1: Navegação básica | Semana 2: 5-6 abas | Semana 3: Fluxo otimizado | Semana 4: Expert

**P: Como criar novo deal?**
R: Sales Workspace → Pipeline → "Novo Deal" ou "+" em qualquer estágio

**P: Como ver previsão de receita?**
R: Sales Workspace → Aba "Forecast" → IA mostra 30/60/90 dias

**P: Diferença entre Pipeline e Workspace?**
R: Não há! "Pipeline" era nome antigo. Agora "Sales Workspace" - mesmo lugar, mais funcionalidades.

**P: Como copiar script de abordagem?**
R: Página Qualificação ICP → Role até "Script de Abordagem" → "Copiar Script"

**P: Onde vejo tarefas do dia?**
R: Sales Workspace → Aba "Smart Tasks" ou Aba "Executivo" (feed atividades)

**P: Como configurar email automático?**
R: Sales Workspace → Aba "Email Sequences" → Tab "Builder" → Criar sequência

---

## ROTAS E NAVEGAÇÃO

**Principais URLs:**
- /leads/capture - Captura de leads
- /leads/quarantine - Quarentena inteligente
- /leads/icp-analysis - Qualificação ICP + IA
- /sdr/workspace - Sales Workspace (centro de comando)
- /central-icp/discovery - Busca empresas (scraping)
- /documentation - Este manual completo

**Atalhos importantes:**
- Botão "Manual do SDR" sempre visível no topo do Sales Workspace
- Redirecionamento automático: /sdr/dashboard → /sdr/workspace

---

## TECNOLOGIAS E APIs

**Validações usadas:**
- CNPJ: ReceitaWS API
- Website: HTTP Status Check
- LinkedIn: Web Scraping
- Email: DNS MX Records

**IA Generativa:**
- Proposta de valor: OpenAI GPT-4
- Score ICP: Algoritmo proprietário 7 dimensões
- Previsão receita: ML preditivo
- Health Monitor: Padrões comportamentais ML

**Edge Functions:**
- validate-lead-comprehensive
- upload-csv
- capture-api
- calculate-icp-score-advanced
- generate-value-proposition
- trevo-assistant (este assistente!)

---

## BOAS PRÁTICAS

### Para SDRs:
1. Sempre qualifique leads HOT primeiro (70-100pts)
2. Atualize pipeline 2x ao dia (manhã e tarde)
3. Leads +7 dias sem atualização = prioridade máxima
4. Pratique script 15-20min antes de ligar
5. Use proposta IA como roteiro, não leia textualmente

### Para Gestores:
1. Monitore aba Executivo diariamente
2. Revise Health Monitor semanalmente
3. Use Forecast para planejamento trimestral
4. Analytics para identificar gargalos no funil
5. Valide dados de quarentena regularmente

### Para Administradores:
1. Mantenha fontes de captura ativas
2. Configure automações no Workspace
3. Monitore performance das validações
4. Ajuste critérios de ICP conforme mercado
5. Treine equipe em todas as 11 abas do Workspace
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
