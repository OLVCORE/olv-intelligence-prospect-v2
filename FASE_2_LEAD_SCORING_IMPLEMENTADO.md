# ✅ FASE 2: LEAD SCORING AUTOMÁTICO - IMPLEMENTADO

## 📊 Sistema de Pontuação Inteligente

### Fórmula de Cálculo (0-100 pontos)

```
Lead Score = (
  Maturidade Digital    × 25% +  // companies.digital_maturity_score
  Sinais de Intenção    × 30% +  // intent_signals (últimos 90 dias)
  Fit com TOTVS         × 20% +  // companies.totvs_detection_score
  Engajamento           × 15% +  // activities, touchpoints, conversations
  Tamanho/Receita       × 10%    // employees + revenue
)
```

---

## 🎯 Funcionalidades Implementadas

### 1. **Cálculo Automático de Score**
- ✅ Função SQL `calculate_lead_score(company_id)` com ponderação inteligente
- ✅ Componentes individuais:
  - `calculate_engagement_score()` - Atividades e touchpoints dos últimos 90 dias
  - `calculate_size_score()` - Funcionários (0-60pts) + Receita (0-40pts)
  - `calculate_intent_score()` - Sinais de intenção recentes (já existia)

### 2. **Triggers Automáticos**
✅ **Recalcula score quando:**
- Empresa é enriquecida (maturidade digital atualizada)
- Score TOTVS é detectado/atualizado
- Número de funcionários ou receita é alterado
- Nova atividade é criada
- Novo touchpoint é registrado
- Nova conversa é iniciada

✅ **Atualiza prioridade automaticamente:**
- Score >= 75 → `priority = high` 🔥
- Score >= 50 → `priority = medium` 🎯
- Score < 50  → `priority = low` 📋

### 3. **Notificações Hot Lead**
✅ Quando empresa atinge score >= 75:
- Notificação automática criada na tabela `notifications`
- Alerta: "🔥 Hot Lead Detectado!"
- Metadata inclui score anterior e novo

### 4. **Edge Function - Alertas e Ações**
`supabase/functions/lead-scoring-alerts/index.ts`

✅ **Ações disponíveis:**
- `calculate_score` - Calcular score de uma empresa
- `recalculate_batch` - Recalcular scores em lote (até 100 empresas)
- `get_hot_leads` - Buscar todos hot leads (score >= 75)
- `suggest_actions` - Sugerir próximas ações baseado no score

### 5. **Componente UI - LeadScoreBadge**
`src/components/common/LeadScoreBadge.tsx`

✅ **Badge visual com:**
- Score >= 75: 🔥 "Hot Lead" (vermelho)
- Score >= 50: 📈 "Qualificado" (laranja)
- Score >= 25: ⚡ "Em Desenvolvimento" (azul)
- Score < 25:  ⚡ "Novo" (cinza)

✅ **Tooltip com:**
- Descrição do status
- Composição detalhada do score
- Recomendações de ação

### 6. **Integração com DealCard**
✅ Lead score aparece visualmente ao lado do título do deal
✅ Badge compacto para economizar espaço

---

## 🗄️ Estrutura de Dados

### Campos Adicionados

**`companies` table:**
```sql
lead_score INTEGER (0-100)
lead_score_updated_at TIMESTAMP
```

**`sdr_deals` table:**
```sql
lead_score INTEGER (0-100)
```

### Índices Criados
```sql
idx_companies_lead_score ON companies(lead_score DESC)
idx_sdr_deals_lead_score ON sdr_deals(lead_score DESC)
```

---

## 🔄 Fluxo Automático

```mermaid
graph TD
    A[Empresa Enriquecida] --> B{Trigger Detecta Mudança}
    B --> C[calculate_lead_score()]
    C --> D[Atualiza companies.lead_score]
    C --> E[Atualiza sdr_deals.lead_score]
    E --> F{Score >= 75?}
    F -->|Sim| G[Criar Notificação Hot Lead]
    F -->|Não| H[Atualizar Prioridade]
    E --> I[Atualizar Prioridade do Deal]
    I --> J{Score >= 75?}
    J -->|Sim| K[priority = high]
    J -->|Não| L{Score >= 50?}
    L -->|Sim| M[priority = medium]
    L -->|Não| N[priority = low]
```

---

## 📈 Exemplos de Score Real

### Hot Lead (85 pontos)
```
Maturidade Digital: 75 × 25% = 18.75
Sinais Intenção:    90 × 30% = 27.00
Fit TOTVS:          80 × 20% = 16.00
Engajamento:        85 × 15% = 12.75
Tamanho/Receita:    100 × 10% = 10.00
--------------------------------
TOTAL:                    = 84.50 ≈ 85
```
**→ Resultado:** 🔥 Hot Lead - Contato urgente recomendado

### Lead Qualificado (62 pontos)
```
Maturidade Digital: 60 × 25% = 15.00
Sinais Intenção:    70 × 30% = 21.00
Fit TOTVS:          50 × 20% = 10.00
Engajamento:        60 × 15% = 9.00
Tamanho/Receita:    70 × 10% = 7.00
--------------------------------
TOTAL:                    = 62.00
```
**→ Resultado:** 📈 Qualificado - Considerar abordagem

---

## 🚀 Como Usar

### Frontend - Calcular Score Manual
```typescript
const { data } = await supabase.functions.invoke('lead-scoring-alerts', {
  body: { 
    action: 'calculate_score',
    company_id: 'uuid-da-empresa'
  }
});
```

### Frontend - Buscar Hot Leads
```typescript
const { data } = await supabase.functions.invoke('lead-scoring-alerts', {
  body: { action: 'get_hot_leads' }
});
// Retorna lista de empresas com score >= 75
```

### Frontend - Sugerir Ações
```typescript
const { data } = await supabase.functions.invoke('lead-scoring-alerts', {
  body: { 
    action: 'suggest_actions',
    company_id: 'uuid-da-empresa'
  }
});
// Retorna sugestões inteligentes baseado no score
```

### Backend - Recalcular Lote (Cron)
```typescript
const { data } = await supabase.functions.invoke('lead-scoring-alerts', {
  body: { 
    action: 'recalculate_batch',
    batch_size: 100
  }
});
```

---

## 🎨 Onde o Score Aparece

1. ✅ **DealCard** - Badge compacto ao lado do título
2. 🔜 **CompanyDetailPage** - Score destacado no header
3. 🔜 **Pipeline Kanban** - Filtrar por score
4. 🔜 **Dashboard Executivo** - Distribuição de scores
5. 🔜 **Hot Leads Widget** - Lista de top leads

---

## 📊 Métricas e KPIs

### Disponíveis para Análise:
- **Taxa de Conversão por Faixa de Score**
  - Hot Leads (75+): X% convertem em deals ganhos
  - Qualificados (50-74): Y% convertem
  - Baixo Score (<50): Z% convertem

- **Tempo Médio de Conversão por Score**
  - Hot Leads: Média de N dias até fechamento
  - Qualificados: Média de M dias

- **Precisão do Score**
  - % de Hot Leads que realmente fecham
  - Ajustar pesos da fórmula baseado em resultados

---

## 🔐 Segurança

✅ **RLS Aplicado:**
- Funções SQL com `SECURITY DEFINER` e `search_path = public`
- Edge function usa `SUPABASE_SERVICE_ROLE_KEY`
- Notificações apenas para usuário autenticado

✅ **Validações:**
- Score sempre entre 0-100 (CHECK constraint)
- Campos nullable com COALESCE para evitar NULL errors

---

## 🎯 Próximos Passos

### Curto Prazo (Fase 2 - Continuação):
1. ⬜ Integrar score no CompanyDetailPage
2. ⬜ Adicionar filtro por score no Kanban
3. ⬜ Criar widget "Top Hot Leads" no Dashboard
4. ⬜ Adicionar gráfico de distribuição de scores

### Médio Prazo (Fase 3):
1. ⬜ Machine Learning para otimizar pesos da fórmula
2. ⬜ Score temporal (tendência de score ao longo do tempo)
3. ⬜ Alertas proativos quando score aumenta/diminui
4. ⬜ Comparação de score entre competidores

---

## 💡 Benefícios Conquistados

✅ **Priorização Automática** - Sistema identifica automaticamente leads mais promissores
✅ **Dados Reais** - Score baseado em dados reais coletados pela plataforma
✅ **Atualizações em Tempo Real** - Triggers recalculam automaticamente
✅ **Alertas Inteligentes** - Notificações quando empresa vira hot lead
✅ **Sugestões de Ação** - IA sugere próximos passos baseado no score
✅ **Visibilidade** - Score visível em todos deals do Kanban
✅ **Performance** - Índices otimizados para queries rápidas

---

**Status:** ✅ **100% Funcional**
**Data:** 27/10/2025
**Próximo Milestone:** Workflow Builder + Alertas Inteligentes Proativos
