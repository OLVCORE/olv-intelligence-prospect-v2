# Exemplos de Sugestões do AI Copilot por Contexto

## 📍 Dashboard (Página Inicial)

### Cenário: Usuário novo, sem empresas
```json
{
  "id": "start-prospecting",
  "type": "action",
  "priority": "high",
  "title": "🎯 Começar Prospecção",
  "description": "Você ainda não tem empresas cadastradas. Vamos começar identificando potenciais clientes!",
  "action": {
    "label": "Ir para Busca Global",
    "type": "navigate",
    "payload": { "url": "/search" }
  }
}
```

### Cenário: 12 empresas qualificadas sem deal
```json
{
  "id": "qualified-no-deal",
  "type": "opportunity",
  "priority": "high",
  "title": "📊 12 empresas qualificadas sem deal",
  "description": "Empresas com alto score aguardando criação de deal. Não perca essas oportunidades!",
  "action": {
    "label": "Ver Lista",
    "type": "navigate",
    "payload": { "url": "/companies" }
  }
}
```

---

## 📂 Base de Empresas

### Cenário: 5 empresas sem enriquecimento
```json
{
  "id": "enrich-companies",
  "type": "action",
  "priority": "medium",
  "title": "🔄 5 empresas sem enriquecimento",
  "description": "Enriqueça dados para obter insights de fit, maturidade e tech stack.",
  "action": {
    "label": "Enriquecer Agora",
    "type": "navigate",
    "payload": { "url": "/companies" }
  }
}
```

### Cenário: Dados desatualizados (>30 dias)
```json
{
  "id": "outdated-data",
  "type": "warning",
  "priority": "medium",
  "title": "⚠️ 8 empresas com dados desatualizados",
  "description": "Dados com mais de 30 dias. Atualize para manter análises precisas.",
  "action": {
    "label": "Atualizar Dados",
    "type": "navigate",
    "payload": { "url": "/companies" }
  }
}
```

---

## 🔍 Intelligence 360

### Cenário: Empresa sem decisores
```json
{
  "id": "find-decisor-123",
  "type": "action",
  "priority": "medium",
  "title": "Identificar decisor",
  "description": "Acme Corp ainda não tem decisor mapeado. Crucial para avançar negociação.",
  "action": {
    "label": "Buscar Decisores",
    "type": "navigate",
    "payload": { "url": "/companies/123" }
  }
}
```

### Cenário: Gap crítico de maturidade
```json
{
  "id": "maturity-gap-123",
  "type": "opportunity",
  "priority": "high",
  "title": "🔥 Gap Crítico: Infraestrutura (Score 32/100)",
  "description": "Empresa com baixa maturidade digital. ROI estimado: R$ 2.5M em 3 anos.",
  "action": {
    "label": "Calcular ROI",
    "type": "navigate",
    "payload": { "url": "/intelligence/roi-calculator/123" }
  }
}
```

### Cenário: Tech Stack fragmentado
```json
{
  "id": "tech-stack-123",
  "type": "opportunity",
  "priority": "medium",
  "title": "💎 Tech Stack fragmentado detectado",
  "description": "15 sistemas diferentes. Consolidação = economia de 40% ao ano.",
  "action": {
    "label": "Calcular TCO",
    "type": "navigate",
    "payload": { "url": "/intelligence/roi-calculator/123" }
  }
}
```

---

## 💼 Account Strategy Hub

### Cenário: Deal sem estratégia
```json
{
  "id": "create-strategy-456",
  "type": "opportunity",
  "priority": "high",
  "title": "💼 Criar estratégia para Prospecção - InnovateTech",
  "description": "Deal com 75% de probabilidade mas sem planejamento estratégico.",
  "action": {
    "label": "Criar Estratégia",
    "type": "navigate",
    "payload": { "url": "/account-strategy?company=123" }
  }
}
```

### Cenário: Estratégia incompleta
```json
{
  "id": "complete-strategy-789",
  "type": "warning",
  "priority": "medium",
  "title": "⚠️ Estratégia incompleta: Acme Corp",
  "description": "Faltam: ROI calculado, produtos definidos, proposta gerada.",
  "action": {
    "label": "Completar Estratégia",
    "type": "navigate",
    "payload": { "url": "/account-strategy/789" }
  }
}
```

---

## 🎨 Canvas (War Room)

### Cenário: Canvas vazio
```json
{
  "id": "populate-canvas-321",
  "type": "insight",
  "priority": "medium",
  "title": "📝 Começar a mapear insights",
  "description": "Use o Canvas para organizar descobertas, decisões e próximos passos.",
  "action": {
    "label": "Ver Templates",
    "type": "navigate",
    "payload": { "url": "/canvas?template=sales" }
  }
}
```

### Cenário: Decisão pendente há 7 dias
```json
{
  "id": "pending-decision-canvas",
  "type": "alert",
  "priority": "high",
  "title": "⚠️ Decisão pendente: Agendar demo técnica",
  "description": "Decisão criada há 7 dias sem execução. Risco de perder momentum.",
  "action": {
    "label": "Criar Task",
    "type": "create_task",
    "payload": { "title": "Agendar demo técnica", "priority": "high" }
  }
}
```

---

## 🚀 Sales Workspace (SDR)

### Cenário: Deal estagnado 10 dias
```json
{
  "id": "stale-deal-456",
  "type": "alert",
  "priority": "urgent",
  "title": "Deal parado há 10 dias",
  "description": "Prospecção - Acme Corp sem atividade. Risco de perder oportunidade.",
  "action": {
    "label": "Agendar Follow-up",
    "type": "create_task",
    "payload": { "dealId": "456", "taskType": "follow_up" }
  }
}
```

### Cenário: Deal pronto para proposta
```json
{
  "id": "create-proposal-789",
  "type": "opportunity",
  "priority": "high",
  "title": "Prospecção - InnovateTech pronto para proposta",
  "description": "Probabilidade de 85% mas ainda sem proposta. Hora de enviar!",
  "action": {
    "label": "Criar Proposta",
    "type": "create_proposal",
    "payload": { "dealId": "789", "companyId": "123" }
  }
}
```

---

## 📊 Pipeline

### Cenário: Bottleneck em "Demo"
```json
{
  "id": "bottleneck-demo",
  "type": "warning",
  "priority": "high",
  "title": "🚧 Bottleneck em Demo",
  "description": "12 deals acumulados neste estágio. Taxa de conversão: 45% (meta: 55%)",
  "action": {
    "label": "Analisar Causas",
    "type": "navigate",
    "payload": { "url": "/sdr/analytics" }
  }
}
```

### Cenário: Deals com baixa probabilidade
```json
{
  "id": "low-prob-deals",
  "type": "warning",
  "priority": "medium",
  "title": "⚠️ 3 deals com prob. <40% em Negotiation",
  "description": "Revisar qualificação ou ajustar expectativas.",
  "action": {
    "label": "Revisar Deals",
    "type": "navigate",
    "payload": { "url": "/sdr/pipeline?filter=low_prob" }
  }
}
```

---

## 📧 Inbox Unificado

### Cenário: Resposta positiva recebida
```json
{
  "id": "positive-response-inbox",
  "type": "opportunity",
  "priority": "high",
  "title": "📧 Resposta positiva: CTO Acme Corp",
  "description": "Sentimento: Positivo (85%) | Interesse: Alto",
  "action": {
    "label": "Ver Sugestão de Resposta",
    "type": "navigate",
    "payload": { "url": "/sdr/inbox?conversation=456" }
  }
}
```

### Cenário: SLA de resposta excedido
```json
{
  "id": "sla-exceeded-inbox",
  "type": "alert",
  "priority": "urgent",
  "title": "⚠️ SLA excedido: Responder InnovateTech",
  "description": "Mensagem recebida há 26 horas. Meta: 24h.",
  "action": {
    "label": "Responder Agora",
    "type": "navigate",
    "payload": { "url": "/sdr/inbox?conversation=789" }
  }
}
```

---

## 🎯 Metas de Vendas

### Cenário: Abaixo da meta
```json
{
  "id": "below-goal",
  "type": "warning",
  "priority": "high",
  "title": "⚠️ Gap de R$ 3.2M para atingir meta Q1",
  "description": "Você está em 68% da meta. Priorize 3 deals de alto valor.",
  "action": {
    "label": "Ver Plano de Ação",
    "type": "navigate",
    "payload": { "url": "/goals" }
  }
}
```

### Cenário: Projeção positiva
```json
{
  "id": "positive-projection",
  "type": "insight",
  "priority": "medium",
  "title": "📈 Projeção: 102% da meta",
  "description": "Com pipeline atual, você deve atingir R$ 10.2M (meta: R$ 10M).",
  "metadata": {
    "confidence": 0.78
  }
}
```

---

## 📊 Analytics SDR

### Cenário: Baixa conversão em estágio específico
```json
{
  "id": "low-conversion-demo",
  "type": "warning",
  "priority": "high",
  "title": "📉 Conversão Demo → Proposal: 45% (meta: 55%)",
  "description": "Causa raiz: Demos técnicas não abordam objeções de custo.",
  "action": {
    "label": "Ver Recomendações",
    "type": "navigate",
    "payload": { "url": "/sdr/analytics?section=conversion" }
  }
}
```

### Cenário: Ciclo de vendas longo
```json
{
  "id": "long-cycle-proposal",
  "type": "insight",
  "priority": "medium",
  "title": "⏱️ Tempo em Proposal: 15 dias (meta: 10d)",
  "description": "Reduzir 5 dias aumentaria conversão em 12%.",
  "action": {
    "label": "Implementar Automação",
    "type": "navigate",
    "payload": { "url": "/cpq" }
  }
}
```

---

## 🏆 Relatórios

### Cenário: Top performer identificado
```json
{
  "id": "top-performer",
  "type": "insight",
  "priority": "low",
  "title": "🏆 Top Performer: João Silva",
  "description": "R$ 3.2M fechado | 42% de conversão | 35 dias de ciclo.",
  "action": {
    "label": "Ver Detalhes",
    "type": "navigate",
    "payload": { "url": "/reports?view=individual" }
  }
}
```

### Cenário: Oportunidade de cross-sell
```json
{
  "id": "cross-sell-opportunity",
  "type": "opportunity",
  "priority": "medium",
  "title": "💎 Cross-sell: Fluig em 80% dos Protheus",
  "description": "Padrão detectado. Crie campanha de cross-sell.",
  "action": {
    "label": "Criar Campanha",
    "type": "navigate",
    "payload": { "url": "/playbooks?template=cross-sell" }
  }
}
```

---

## 🤖 Insights de IA (Lovable AI)

### Exemplo de insight contextual gerado
```json
{
  "id": "ai-insight-1234567890",
  "type": "insight",
  "priority": "medium",
  "title": "💡 Insight da IA",
  "description": "Análise de 28 deals abertos:\n\n1. Priorize 3 deals em Negotiation com prob. >70%\n2. Acelere follow-ups nos 5 deals parados >7 dias\n3. Envie propostas para 2 deals em Demo com alta prob.\n\nEstas ações podem aumentar conversão em 15%.",
  "metadata": {
    "confidence": 0.75
  }
}
```

---

## 📱 Notificações Push (Futuro)

### Deal avançou de estágio
```
🎉 Deal Acme Corp avançou para Negotiation!
Probabilidade aumentou para 75%. Próximo: Enviar proposta final.
```

### Meta atingida
```
🏆 Parabéns! Meta Q1 atingida!
R$ 10.2M fechado (102% da meta). Confira o ranking.
```

### Alerta crítico
```
🚨 3 deals >30 dias sem atividade
Risco de perda. Revise urgentemente.
```

---

## 🎯 Resumo de Priorização

**Urgent (Vermelho):**
- Deals estagnados >14 dias
- SLA de resposta excedido
- Gap crítico de meta (<70%)

**High (Laranja):**
- Deals estagnados 7-14 dias
- Empresas qualificadas sem deal
- Deal pronto para proposta
- Bottleneck de conversão

**Medium (Amarelo):**
- Dados desatualizados
- Estratégia incompleta
- Oportunidades de cross-sell
- Insights de otimização

**Low (Verde):**
- Insights gerais
- Reconhecimentos
- Recomendações de longo prazo
