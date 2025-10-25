# Arquitetura SDR + Pipeline: Integração e Fluxo de Dados

## 📊 Visão Geral da Arquitetura

O sistema CRM+SDR Sales Acceleration Platform possui duas tabelas principais para gerenciar o funil de vendas:

### 1. **sdr_deals** (Gestão de Deals/Oportunidades)
Tabela principal usada pelo **Kanban de Deals** e automações.

**Campos principais:**
- `id`, `title`, `description`
- `company_id`, `contact_id` (relações com empresas e contatos)
- `stage` (estágio no funil: discovery, demo, proposal, negotiation, won, lost)
- `value` (valor estimado do deal)
- `probability` (% de chance de fechar)
- `priority` (low, medium, high, urgent)
- `status` (open, won, lost, archived)
- `expected_close_date`
- `next_action`, `next_action_date`
- `conversation_id`, `canvas_id` (integrações)

**Usado por:**
- `/sdr/workspace` (Kanban principal)
- Hook `useDeals`
- Sistema de automações (`useAutomationEngine`, `useSDRAutomations`)
- Analytics (`useAdvancedAnalytics`)

---

### 2. **sdr_opportunities** (Pipeline de Vendas)
Tabela usada pelo **Pipeline de Vendas** tradicional.

**Campos principais:**
- `id`, `title`
- `company_id`, `contact_id`
- `stage` (mesmo conceito de funil)
- `value`, `probability`
- `next_action`, `next_action_date`
- `conversation_id`, `canvas_id`
- `won_date` (data de fechamento)

**Usado por:**
- `/sdr/pipeline` (visão Pipeline)
- Hook `useSDRPipeline`
- Métricas SDR (`useSDRMetrics`)

---

## 🔄 Como SDR e Pipeline se Integram

### Fluxo de Dados Atual

```
┌─────────────────────────────────────────────────────────────┐
│                    ENTRADA DE LEADS                          │
│  (Contatos, Empresas, Conversas, Canvas)                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
    ┌────────────────────────────┐
    │   SDR_DEALS (Kanban)       │ ←──┐
    │  - Gestão visual de deals  │    │
    │  - Drag & drop             │    │
    │  - Automações inteligentes │    │
    └────────────┬───────────────┘    │
                 │                     │
                 ↓                     │
    ┌────────────────────────────┐    │
    │  SDR_OPPORTUNITIES         │    │
    │  (Pipeline tradicional)    │    │
    │  - Forecast                │    │ Sincronização
    │  - Relatórios              │    │ Manual/Async
    └────────────┬───────────────┘    │
                 │                     │
                 ↓                     │
    ┌────────────────────────────┐    │
    │   ATIVIDADES & LOGS        │ ───┘
    │  - sdr_deal_activities     │
    │  - sdr_audit               │
    │  - messages (inbox)        │
    └────────────────────────────┘
```

### Entidades Relacionadas

#### **companies** (Empresas)
- Armazena informações de empresas
- `id`, `name`, `cnpj`, `website`, `industry`, `employees`, `revenue`
- Enriquecimento automático via ReceitaWS, LinkedIn, etc.

#### **contacts** (Contatos)
- Pessoas dentro das empresas
- `id`, `name`, `email`, `phone`, `company_id`
- Pode ter múltiplos contatos por empresa

#### **conversations** (Conversas/Inbox)
- Canal unificado de comunicação
- `id`, `channel` (email, whatsapp), `company_id`, `contact_id`
- Integra com `messages` para histórico completo

#### **canvas** (Canvas Estratégico)
- Workspace colaborativo para estratégias de conta
- Vincula deals, insights, notas, decisões
- `company_id` para associar estratégias a empresas

---

## 🔧 Funções e Responsabilidades

### SDR Suite (`/sdr/workspace`)
**Função:** Centro de comando para SDRs gerenciarem deals ativamente

**Recursos:**
- ✅ Kanban visual de deals (`sdr_deals`)
- ✅ Drag & drop para mover estágios
- ✅ Quick actions (ligar, WhatsApp, email)
- ✅ Automações inteligentes (SLA, follow-ups, deal parado)
- ✅ Inbox unificado (mini)
- ✅ Tarefas e sequências de cadência

**Tabelas usadas:**
- `sdr_deals` (principal)
- `contacts`, `companies` (relacionamentos)
- `conversations`, `messages` (comunicação)
- `sdr_tasks`, `sdr_sequences` (automação)

---

### Pipeline (`/sdr/pipeline`)
**Função:** Visão estratégica do funil para forecast e análise

**Recursos:**
- ✅ Pipeline tradicional por estágios
- ✅ Forecast e previsões
- ✅ Métricas e conversão
- ✅ Win/loss analysis

**Tabelas usadas:**
- `sdr_opportunities` (principal)
- `sdr_pipeline_stages` (definição de estágios)
- `companies`, `contacts` (relacionamentos)

---

## 🐛 Problemas Identificados

### 1. **Duplicação de Dados**
❌ Atualmente, `sdr_deals` e `sdr_opportunities` não estão sincronizados
- Deals criados no Workspace não aparecem no Pipeline
- Oportunidades do Pipeline não têm automações do SDR

### 2. **Contatos sem Empresa**
❌ Contatos na base estão com `company_id = NULL`
- Formulário de criação de tarefa não mostra contatos
- Filtro por empresa não funciona corretamente

### 3. **Sequências não Criam**
❌ Botão "Nova Sequência" não tem funcionalidade
- Falta dialog de criação
- Falta formulário para steps de cadência

---

## ✅ Soluções Recomendadas

### Opção 1: Unificar Tabelas (Recomendado)
Migrar tudo para `sdr_deals` e deprecar `sdr_opportunities`

**Vantagens:**
- ✅ Uma única fonte de verdade
- ✅ Automações funcionam em todos os deals
- ✅ Simplifica manutenção

**Implementação:**
1. Migrar dados de `sdr_opportunities` → `sdr_deals`
2. Atualizar `useSDRPipeline` para usar `sdr_deals`
3. Adicionar view `sdr_opportunities` (compatibilidade)

### Opção 2: Sincronização Bi-direcional
Manter ambas as tabelas sincronizadas via triggers

**Vantagens:**
- ✅ Mantém separação de conceitos
- ✅ Não quebra código existente

**Desvantagens:**
- ❌ Complexidade de manter sincronizado
- ❌ Possíveis conflitos de dados

---

## 🔄 Iteração Ideal: Fluxo do Lead ao Fechamento

```
1. Lead entra (manual, import, formulário)
   ↓
2. Criado em `companies` + `contacts`
   ↓
3. SDR qualifica e cria Deal (`sdr_deals`)
   ↓
4. Deal entra no Kanban (/sdr/workspace)
   ↓
5. Automações sugerem ações:
   - Follow-up se deal parado > 7 dias
   - SLA se fechamento < 3 dias
   - Sequência de cadência automática
   ↓
6. SDR executa ações (Inbox integrado):
   - Ligações (Twilio)
   - WhatsApp
   - Email
   ↓
7. Conversas registradas em `conversations` + `messages`
   ↓
8. Deal avança pelos estágios:
   discovery → demo → proposal → negotiation
   ↓
9. Analytics em tempo real:
   - Pipeline forecast
   - Métricas de conversão
   - Tempo médio por estágio
   ↓
10. Fechamento:
    - Won → `status='won'` + `won_date`
    - Lost → `status='lost'` + `lost_reason`
```

---

## 📋 Próximos Passos

1. **Corrigir Contatos:**
   - Associar contatos existentes a empresas
   - Validar `company_id` obrigatório em novos contatos

2. **Implementar Criação de Sequências:**
   - Dialog com form completo
   - Steps de cadência (Day 0, +2, +5, +7)
   - Templates de mensagem

3. **Decisão Arquitetural:**
   - Unificar `sdr_deals` + `sdr_opportunities`
   - OU implementar sincronização

4. **Testes End-to-End:**
   - Lead → Deal → Automação → Fechamento
   - Validar todos os fluxos

---

## 📊 Tabelas Auxiliares

- `sdr_pipeline_stages` - Definição customizável de estágios
- `sdr_deal_activities` - Log de atividades em deals
- `sdr_tasks` - Tarefas associadas a deals/contatos
- `sdr_sequences` - Sequências de cadência
- `sdr_sequence_runs` - Execução de sequências por contato
- `sdr_templates` - Templates de mensagens
- `sdr_audit` - Auditoria de mudanças
- `sdr_notifications` - Notificações em tempo real
- `sdr_api_keys`, `sdr_webhooks` - Integrações externas

---

## 🎯 Resumo Executivo

**O que funciona:**
- ✅ Kanban de Deals visual e funcional
- ✅ Automações inteligentes (SLA, follow-ups)
- ✅ Inbox unificado (email + WhatsApp)
- ✅ Canvas estratégico
- ✅ API pública e webhooks

**O que precisa correção:**
- ⚠️ Sincronização entre Deals e Opportunities
- ⚠️ Contatos sem empresa associada
- ⚠️ Criação de sequências de cadência

**Próxima Fase:**
- 🔄 Unificar modelo de dados
- 🔧 Corrigir bugs de UX
- 📊 Adicionar relatórios avançados
