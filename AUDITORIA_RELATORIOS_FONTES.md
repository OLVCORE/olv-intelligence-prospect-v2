# 🔍 AUDITORIA COMPLETA DOS RELATÓRIOS - FONTES DE DADOS

**Data:** 25/10/2025
**Objetivo:** Mapear todas as fontes de dados, identificar dados mockados e implementar conexões reais

---

## 📊 RESUMO EXECUTIVO

### ✅ JÁ ESTÁ REAL (100% FUNCIONAL)
- ✅ Dados da Receita Federal (via ReceitaWS)
- ✅ Tech Stack Detection (via Google Search)
- ✅ Presença Digital (LinkedIn, Instagram, Facebook, Twitter, YouTube, TikTok, WhatsApp)
- ✅ Scores de Maturidade Digital calculados

### ⚠️ PARCIALMENTE MOCKADO
- ⚠️ Relatório Completo da Empresa (generate-company-report)
- ⚠️ Dados Financeiros (estimados, não reais)
- ⚠️ Dados Jurídicos (estimados, não reais)
- ⚠️ Análise de Fit TOTVS (usa IA mas precisa de dados reais)

### ❌ COMPLETAMENTE MOCKADO
- ❌ Relatório Premium Serasa (existe UI mas não consome API real)
- ❌ Histórico de Pagamentos (mockado)
- ❌ Score de Crédito detalhado (estimado)

---

## 🎯 RELATÓRIO 1: RELATÓRIO COMPLETO DA EMPRESA

### 📍 Componente: `CompanyReport.tsx`
### 🔌 Edge Function: `generate-company-report`

### Estrutura do Relatório:

```typescript
{
  identification: {
    razao_social: string,     // ✅ REAL (da Receita)
    cnpj: string,             // ✅ REAL (da Receita)
    website: string,          // ✅ REAL (companies.website)
    logo_url: string          // ❌ MOCKADO
  },
  location: {
    cidade: string,           // ✅ REAL (da Receita)
    estado: string,           // ✅ REAL (da Receita)
    endereco_completo: string // ✅ REAL (da Receita)
  },
  activity: {
    setor: string,            // ✅ REAL (da Receita)
    atividade_principal: string, // ✅ REAL (da Receita)
    porte: string             // ❌ MOCKADO (precisa calcular)
  },
  structure: {
    total_funcionarios: number, // ⚠️ ESTIMADO (da Receita ou Apollo)
    departamentos_principais: [] // ❌ MOCKADO
  },
  metrics: {
    score_global: number,     // ⚠️ CALCULADO (mas pode ser melhorado)
    componentes: {
      maturidade_digital: number,  // ✅ REAL (digital_presence.overall_score)
      presenca_online: number,     // ✅ REAL (digital_presence)
      engajamento_social: number,  // ✅ REAL (digital_presence)
      inovacao_tecnologica: number // ⚠️ BASEADO EM TECH STACK
    },
    potencial_negocio: {
      ticket_estimado: {       // ❌ MOCKADO (precisa de regras de negócio)
        minimo: number,
        medio: number,
        maximo: number
      }
    },
    priorizacao: {
      roi_esperado: number,    // ❌ MOCKADO
      tempo_ciclo_venda: string, // ❌ MOCKADO
      probabilidade_conversao: number // ❌ MOCKADO
    }
  },
  recomendacoes: {
    produtos_recomendados: [], // ❌ MOCKADO (precisa de IA + catálogo)
    proximos_passos: []        // ❌ MOCKADO (precisa de IA)
  }
}
```

### 🔧 AÇÕES NECESSÁRIAS:

1. **IMEDIATO:**
   - [ ] Remover campos mockados do relatório
   - [ ] Calcular porte baseado em funcionários da Receita
   - [ ] Criar regras de negócio para ticket estimado
   - [ ] Implementar cálculo de ROI baseado em setor + porte

2. **CURTO PRAZO:**
   - [ ] Integrar com catálogo de produtos TOTVS real
   - [ ] Usar IA para gerar recomendações personalizadas
   - [ ] Implementar lógica de probabilidade de conversão

---

## 🎯 RELATÓRIO 2: MATURIDADE DIGITAL

### 📍 Componente: `MaturityReport.tsx`
### 🔌 Tabela: `digital_presence`

### Status: ✅ 90% REAL

```typescript
{
  overall_score: number,      // ✅ REAL (calculado na edge function)
  social_score: number,       // ✅ REAL (presença em redes sociais)
  web_score: number,          // ✅ REAL (website + tech stack)
  engagement_score: number,   // ✅ REAL (estimado com IA)
  linkedin_data: jsonb,       // ✅ REAL (URL + descrição)
  instagram_data: jsonb,      // ✅ REAL (URL + descrição)
  facebook_data: jsonb,       // ✅ REAL (URL + descrição)
  twitter_data: jsonb,        // ✅ REAL (URL + descrição)
  youtube_data: jsonb,        // ✅ REAL (URL + descrição)
  website_metrics: jsonb      // ⚠️ PARCIAL (tem dados básicos)
}
```

### 🔧 AÇÕES NECESSÁRIAS:

1. **MELHORIAS:**
   - [ ] Enriquecer website_metrics com dados de tráfego (se possível via API)
   - [ ] Adicionar análise de qualidade do conteúdo das redes sociais
   - [ ] Implementar análise de frequência de posts

---

## 🎯 RELATÓRIO 3: FIT TOTVS

### 📍 Componente: `FitReport.tsx`
### 🔌 Edge Function: `analyze-totvs-fit`

### Status: ⚠️ 50% REAL / 50% IA GENERATIVA

```typescript
{
  fitScore: number,           // ⚠️ CALCULADO POR IA (precisa de validação)
  summary: string,            // ✅ GERADO POR IA
  recommendedProducts: [],    // ⚠️ IA + CATÁLOGO (precisa ser real)
  strengths: [],              // ✅ GERADO POR IA
  opportunities: [],          // ✅ GERADO POR IA
  estimatedInvestment: {
    min: number,              // ❌ MOCKADO
    max: number               // ❌ MOCKADO
  },
  estimatedTimeline: string,  // ❌ MOCKADO
  keyBenefits: []            // ✅ GERADO POR IA
}
```

### 🔧 AÇÕES NECESSÁRIAS:

1. **CRÍTICO:**
   - [ ] Conectar com catálogo real de produtos TOTVS
   - [ ] Criar tabela `totvs_products` com dados reais
   - [ ] Implementar cálculo de investimento baseado em produtos reais
   - [ ] Validar fitScore com critérios objetivos

2. **IMPORTANTE:**
   - [ ] Criar histórico de vendas para melhorar estimativas
   - [ ] Implementar matriz de decisão produto x setor x porte

---

## 🎯 RELATÓRIO 4: PREMIUM SERASA

### 📍 Componente: `CompanyReport.tsx` (seção premium)
### 🔌 Não implementado (apenas UI)

### Status: ❌ 100% MOCKADO

```typescript
{
  creditScore: number,        // ❌ MOCKADO
  riskClassification: string, // ❌ MOCKADO
  predictiveRiskScore: number, // ❌ MOCKADO
  serasaData: {
    protestos: number,        // ❌ MOCKADO
    acoesJudiciais: number,   // ❌ MOCKADO
    debitosPrevidenciarios: number // ❌ MOCKADO
  },
  paymentHistory: {
    onTimePayments: number,   // ❌ MOCKADO
    latePayments: number,     // ❌ MOCKADO
    defaulted: number         // ❌ MOCKADO
  }
}
```

### 🔧 AÇÕES NECESSÁRIAS:

1. **DECISÃO ESTRATÉGICA:**
   - [ ] Avaliar custo-benefício da API Serasa
   - [ ] Alternativa: usar dados da Receita + estimativas inteligentes
   - [ ] Alternativa: parceria com bureau de crédito brasileiro

---

## 📋 TABELAS PRINCIPAIS E SUAS FONTES

### `companies` (tabela principal)
```typescript
{
  name: string,               // ✅ ReceitaWS (fantasia ou razão)
  cnpj: string,               // ✅ Input do usuário
  domain: string,             // ⚠️ Extraído do website
  website: string,            // ⚠️ Google Search ou input
  industry: string,           // ✅ ReceitaWS
  revenue: string,            // ❌ Não disponível (precisa API)
  employees: number,          // ⚠️ ReceitaWS ou Apollo
  location: jsonb,            // ✅ ReceitaWS
  linkedin_url: string,       // ⚠️ Google Search
  technologies: text[],       // ✅ Google Search (tech stack)
  digital_maturity_score: number, // ✅ Calculado
  raw_data: jsonb             // ✅ Armazena todos os dados brutos
}
```

### `digital_presence`
```typescript
// ✅ 100% PREENCHIDA PELA EDGE FUNCTION enrich-company-360
```

### `digital_maturity`
```typescript
// ⚠️ TABELA EXISTE MAS NÃO É USADA (redundante com digital_presence)
// DECISÃO: Remover ou migrar lógica?
```

### `decision_makers`
```typescript
{
  name: string,               // ⚠️ Apollo ou input manual
  title: string,              // ⚠️ Apollo ou input manual
  email: string,              // ⚠️ Hunter.io ou Apollo
  linkedin_url: string,       // ⚠️ Apollo ou Google Search
  department: string,         // ⚠️ Apollo ou estimado
  seniority: string           // ⚠️ Apollo ou estimado
}
```

---

## 🚀 PLANO DE IMPLEMENTAÇÃO PRIORIZADO

### FASE 1: CORRIGIR DADOS MOCKADOS (IMEDIATO)
**Prazo: 2-3 dias**

1. **Relatório Completo da Empresa:**
   - Remover campos completamente mockados
   - Implementar cálculo de porte (micro/pequena/média/grande)
   - Criar regras de negócio para ticket estimado
   - Implementar cálculo de ROI baseado em dados reais

2. **Catálogo de Produtos TOTVS:**
   - Criar tabela `totvs_products`
   - Popular com dados reais dos produtos
   - Conectar com análise de Fit

### FASE 2: MELHORAR DADOS EXISTENTES (CURTO PRAZO)
**Prazo: 1 semana**

1. **Decision Makers:**
   - Implementar busca automática via Apollo (se API disponível)
   - Melhorar busca por LinkedIn com IA

2. **Análise de Fit:**
   - Criar matriz produto x setor x porte
   - Implementar histórico de vendas
   - Validar fitScore com critérios objetivos

### FASE 3: ADICIONAR NOVAS FONTES (MÉDIO PRAZO)
**Prazo: 2-3 semanas**

1. **Dados Financeiros:**
   - Avaliar APIs disponíveis (Serasa, Boa Vista, etc.)
   - Implementar alternativa com estimativas inteligentes

2. **Análise de Concorrência:**
   - Identificar concorrentes automaticamente
   - Criar battle cards automatizados

---

## 🎯 MÉTRICAS DE SUCESSO

### Atual (Antes):
- 40% dados reais
- 30% dados estimados com IA
- 30% dados mockados

### Meta (Depois da Fase 1):
- 70% dados reais
- 20% dados estimados com IA
- 10% dados mockados (apenas campos não-críticos)

### Meta Final (Depois da Fase 3):
- 85% dados reais
- 10% dados estimados com IA validada
- 5% dados mockados (apenas decorativos)

---

## 📊 DASHBOARD DE FONTES DE DADOS

| Fonte | Status | Uso Atual | Limite API | Custo |
|-------|--------|-----------|------------|-------|
| ReceitaWS | ✅ Ativo | Dados cadastrais | 3 req/s | Grátis |
| Google Search | ✅ Ativo | Tech stack, redes sociais | 100 req/dia | API Key |
| Apollo.io | ⚠️ Parcial | Decision makers | API Key necessária | Pago |
| Hunter.io | ⚠️ Parcial | Emails | API Key necessária | Freemium |
| Serasa Experian | ❌ Não implementado | Dados financeiros | - | Caro |
| Lovable AI | ✅ Ativo | Análises e insights | Ilimitado | Incluído |

---

## 🔗 PRÓXIMOS PASSOS IMEDIATOS

1. ✅ Revisar este documento com a equipe
2. [ ] Decidir sobre integração Serasa (sim/não/alternativa)
3. [ ] Criar tabela `totvs_products` com dados reais
4. [ ] Implementar cálculos de ticket e ROI reais
5. [ ] Remover campos mockados críticos dos relatórios
6. [ ] Atualizar documentação técnica

---

**Próxima revisão:** Após implementação da Fase 1
**Responsável:** Equipe de Desenvolvimento
**Aprovação:** Necessária para integração com Serasa
