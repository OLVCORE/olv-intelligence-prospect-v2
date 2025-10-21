# 🚀 ROADMAP: ARSENAL DE INTELLIGENCE DIGITAL 360°

**Objetivo:** Criar a plataforma mais completa de inteligência digital para prospecção B2B no Brasil

---

## 📊 VISÃO GERAL DA ARQUITETURA

```
┌─────────────────────────────────────────────────────────────┐
│              CAMADA DE APRESENTAÇÃO (Frontend)               │
│  Dashboard • Relatórios • Alertas • Pitchs • Insights       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              CAMADA DE ORQUESTRAÇÃO (Engines)                │
│  Enrichment • Scoring • Risco • Sentimento • Geração IA     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              CAMADA DE COLETA (Adapters)                     │
│  Redes Sociais • Marketplaces • Jurídico • Financeiro       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 FASE 7: ENRICHMENT DIGITAL AVANÇADO

### 7.1 Presença em Redes Sociais

**Objetivo:** Avaliar presença, engajamento e sentimento em cada rede

#### Adapters a Implementar:

**A) LinkedIn Company Adapter**
```typescript
src/lib/adapters/social/linkedinCompany.ts
```
- **Dados coletados:**
  - Número de seguidores
  - Frequência de posts (últimos 30/90 dias)
  - Engajamento médio (likes, comentários, shares)
  - Funcionários ativos na rede
  - Vagas abertas publicadas
  - Tipos de conteúdo (institucional, vagas, cases, etc.)
  - Análise de sentimento dos comentários
- **Score gerado:** LinkedIn Presence Score (0-10)
- **APIs:** PhantomBuster, Proxycurl, ou scraping controlado

**B) Instagram Business Adapter**
```typescript
src/lib/adapters/social/instagram.ts
```
- **Dados coletados:**
  - Seguidores e crescimento
  - Posts recentes (feed + stories)
  - Engajamento (curtidas, comentários, salvos)
  - Hashtags mais usadas
  - Presença de vendas/catálogo
  - Bio e links externos
- **Score gerado:** Instagram Presence Score (0-10)
- **APIs:** Instagram Graph API (se business account) ou scraping

**C) Facebook Page Adapter**
```typescript
src/lib/adapters/social/facebook.ts
```
- **Dados coletados:**
  - Curtidas da página
  - Avaliações e reviews (1-5 estrelas)
  - Posts e engajamento
  - Horários de atendimento
  - Informações de contato
  - Produtos/serviços anunciados
- **Score gerado:** Facebook Presence Score (0-10)
- **APIs:** Facebook Graph API ou scraping

**D) Twitter/X Adapter**
```typescript
src/lib/adapters/social/twitter.ts
```
- **Dados coletados:**
  - Seguidores e seguindo
  - Tweets recentes (últimos 30 dias)
  - Engajamento (retweets, likes, respostas)
  - Menções da marca
  - Sentimento dos tweets
  - Tópicos mais discutidos
- **Score gerado:** Twitter Presence Score (0-10)
- **APIs:** Twitter API v2 (pago) ou scraping via PhantomBuster

**E) YouTube Channel Adapter**
```typescript
src/lib/adapters/social/youtube.ts
```
- **Dados coletados:**
  - Inscritos
  - Vídeos publicados (quantidade e frequência)
  - Views totais e médias
  - Engajamento (likes, comentários)
  - Categorias de conteúdo
- **Score gerado:** YouTube Presence Score (0-10)
- **APIs:** YouTube Data API v3

---

### 7.2 Presença em Marketplaces

**Objetivo:** Identificar presença e performance em e-commerce

#### Adapters a Implementar:

**A) Mercado Livre Adapter**
```typescript
src/lib/adapters/marketplace/mercadolivre.ts
```
- **Dados coletados:**
  - Loja oficial (sim/não)
  - Reputação do vendedor (verde, laranja, vermelho)
  - Quantidade de produtos
  - Avaliações (quantidade e média)
  - Categorias de produtos
  - Faturamento estimado (baseado em vendas)
- **Score gerado:** Mercado Livre Score (0-10)
- **APIs:** Mercado Livre API ou scraping

**B) Amazon Seller Adapter**
```typescript
src/lib/adapters/marketplace/amazon.ts
```
- **Dados coletados:**
  - Vendedor verificado
  - Avaliações do vendedor
  - Produtos listados
  - Presença em categorias
  - Prime elegível
- **Score gerado:** Amazon Presence Score (0-10)
- **APIs:** Amazon SP-API ou scraping

**C) Magazine Luiza Adapter**
```typescript
src/lib/adapters/marketplace/magazineluiza.ts
```
- Similar ao Mercado Livre, focado em marketplace brasileiro

**D) B2W (Americanas, Submarino, Shoptime)**
```typescript
src/lib/adapters/marketplace/b2w.ts
```
- Dados de presença em marketplaces B2W

---

### 7.3 Presença Jurídica e Compliance

**Objetivo:** Avaliar saúde jurídica e riscos legais

#### Adapters a Implementar:

**A) JusBrasil Adapter**
```typescript
src/lib/adapters/legal/jusbrasil.ts
```
- **Dados coletados:**
  - Processos ativos (quantidade e tipos)
  - Processos trabalhistas
  - Processos cíveis
  - Processos tributários
  - Histórico de processos (últimos 5 anos)
  - Valor estimado das causas
  - Fase processual (andamento)
- **Score gerado:** Legal Health Score (0-10) - quanto maior, melhor
- **Análise de risco:** Alto, Médio, Baixo
- **APIs:** JusBrasil API ou scraping controlado

**B) CEIS/CNEP Adapter (Cadastro de Empresas Inidôneas)**
```typescript
src/lib/adapters/legal/ceis.ts
```
- **Dados coletados:**
  - Presença em listas de sanções
  - Tipos de sanções aplicadas
  - Órgãos sancionadores
  - Período de vigência
- **Score gerado:** Compliance Score (0-10)
- **APIs:** Portal da Transparência API

---

### 7.4 Saúde Financeira e Risco

**Objetivo:** Análise preditiva de riscos econômicos e financeiros

#### Adapters a Implementar:

**A) Serasa Experian Adapter**
```typescript
src/lib/adapters/financial/serasa.ts
```
- **Dados coletados:**
  - Score de crédito empresarial
  - Inadimplência (sim/não)
  - Protestos
  - Cheques sem fundo
  - Ações de cobrança
  - Falências e recuperação judicial
  - Tempo de mercado
  - Capital social
- **Score gerado:** Financial Health Score (0-10)
- **Risco:** Alto, Médio, Baixo
- **APIs:** Serasa API (pago)

**B) Boa Vista SCPC Adapter**
```typescript
src/lib/adapters/financial/boavista.ts
```
- Similar ao Serasa, dados de crédito e inadimplência
- **APIs:** Boa Vista API (pago)

**C) Indicadores Financeiros Adapter**
```typescript
src/lib/adapters/financial/indicators.ts
```
- **Dados calculados:**
  - Capital de giro estimado
  - Endividamento
  - Liquidez
  - Rentabilidade (quando disponível)
  - Tendência de crescimento (últimos 3 anos)
- **Score gerado:** Financial Performance Score (0-10)
- **Fonte:** Dados da Receita Federal + estimativas

---

### 7.5 Monitoramento de Notícias e Reputação

**Objetivo:** Rastrear notícias, menções e reputação online

#### Adapters a Implementar:

**A) News Aggregator Adapter**
```typescript
src/lib/adapters/news/aggregator.ts
```
- **Dados coletados:**
  - Notícias mencionando a empresa (últimos 30/90 dias)
  - Sentimento das notícias (positivo, neutro, negativo)
  - Fontes das notícias (G1, Folha, Estadão, etc.)
  - Tópicos principais (expansão, crise, inovação, etc.)
  - Frequência de menções
- **Score gerado:** Media Presence Score (0-10)
- **APIs:** NewsAPI, Google News API, Serper

**B) Reclame Aqui Adapter**
```typescript
src/lib/adapters/reputation/reclameaqui.ts
```
- **Dados coletados:**
  - Reputação geral (Ótima, Boa, Regular, Ruim)
  - Quantidade de reclamações
  - Taxa de resposta
  - Taxa de solução
  - Tempo médio de resposta
  - Reclamações recentes
  - Sentimento dos consumidores
- **Score gerado:** Customer Satisfaction Score (0-10)
- **APIs:** Scraping ou API não-oficial

**C) Google Reviews Adapter**
```typescript
src/lib/adapters/reputation/googlereviews.ts
```
- **Dados coletados:**
  - Avaliação média (estrelas)
  - Quantidade de avaliações
  - Reviews recentes
  - Sentimento predominante
  - Tópicos mais mencionados (atendimento, qualidade, preço)
- **Score gerado:** Google Reviews Score (0-10)
- **APIs:** Google Places API

**D) Trustpilot Adapter**
```typescript
src/lib/adapters/reputation/trustpilot.ts
```
- Similar ao Reclame Aqui, focado em avaliações internacionais

---

## 🧠 FASE 8: INTELLIGENCE PREDITIVA

### 8.1 Sistema de Scoring Unificado

**Objetivo:** Score único que reflete a "saúde digital" da empresa

#### Engine: Digital Health Score
```typescript
src/lib/engines/intelligence/digitalHealthScore.ts
```

**Fórmula:**
```
Digital Health Score = (
  Social Media Score (20%) +
  Marketplace Score (15%) +
  Legal Health Score (25%) +
  Financial Health Score (25%) +
  Reputation Score (15%)
) / 5
```

**Componentes:**

1. **Social Media Score (0-10)**
   - LinkedIn (40%)
   - Instagram (20%)
   - Facebook (20%)
   - Twitter (10%)
   - YouTube (10%)

2. **Marketplace Score (0-10)**
   - Mercado Livre (50%)
   - Amazon (30%)
   - Outros (20%)

3. **Legal Health Score (0-10)**
   - Ausência de processos críticos (60%)
   - Compliance (40%)

4. **Financial Health Score (0-10)**
   - Score de crédito (50%)
   - Inadimplência (30%)
   - Indicadores financeiros (20%)

5. **Reputation Score (0-10)**
   - Reclame Aqui (40%)
   - Google Reviews (30%)
   - Notícias (30%)

---

### 8.2 Análise de Sentimento

**Objetivo:** Entender percepção pública sobre a empresa

#### Engine: Sentiment Analysis
```typescript
src/lib/engines/intelligence/sentimentAnalysis.ts
```

**Fontes analisadas:**
- Posts em redes sociais
- Comentários e reviews
- Notícias
- Reclamações

**Saída:**
```typescript
{
  overallSentiment: 'positive' | 'neutral' | 'negative',
  sentimentScore: 0-10,
  breakdown: {
    social: { positive: 60%, neutral: 30%, negative: 10% },
    reviews: { positive: 70%, neutral: 20%, negative: 10% },
    news: { positive: 80%, neutral: 15%, negative: 5% }
  },
  trendingTopics: ['inovação', 'atendimento', 'qualidade'],
  alerts: ['Aumento de reclamações em 20% no último mês']
}
```

---

### 8.3 Detecção de Riscos

**Objetivo:** Identificar riscos econômicos, jurídicos e reputacionais

#### Engine: Risk Detection
```typescript
src/lib/engines/intelligence/riskDetection.ts
```

**Tipos de Risco:**

1. **Risco Financeiro**
   - Inadimplência crescente
   - Queda no score de crédito
   - Protestos recentes
   - Processos de falência/recuperação judicial

2. **Risco Jurídico**
   - Processos trabalhistas em alta
   - Ações de alto valor
   - Sanções administrativas

3. **Risco Reputacional**
   - Notícias negativas viralizando
   - Queda brusca em reviews
   - Crise nas redes sociais

**Saída:**
```typescript
{
  riskLevel: 'low' | 'medium' | 'high' | 'critical',
  riskScore: 0-10, // quanto maior, maior o risco
  risks: [
    {
      type: 'financial',
      severity: 'high',
      description: 'Inadimplência identificada em 3 fontes',
      impact: 'Pode afetar capacidade de investimento',
      recommendation: 'Solicitar garantias ou pagamento antecipado'
    }
  ],
  alerts: [
    'Aumento de 40% em processos trabalhistas nos últimos 6 meses'
  ]
}
```

---

### 8.4 Monitoramento Contínuo

**Objetivo:** Alertas proativos sobre mudanças significativas

#### Engine: Monitoring & Alerts
```typescript
src/lib/engines/intelligence/monitoring.ts
```

**Eventos Monitorados:**
- Nova notícia relevante publicada
- Mudança brusca em reviews (positiva ou negativa)
- Novo processo judicial identificado
- Alteração no score de crédito
- Pico de menções em redes sociais
- Mudança na liderança (CEO, CFO, etc.)
- Vagas abertas estratégicas

**Sistema de Alertas:**
```typescript
interface Alert {
  id: string;
  type: 'opportunity' | 'warning' | 'critical';
  title: string;
  description: string;
  companyId: string;
  timestamp: Date;
  actionable: boolean;
  suggestedActions: string[];
}
```

---

## 🎨 FASE 9: GERAÇÃO DE CONTEÚDO COM IA

### 9.1 Gerador de Pitchs Comerciais

**Objetivo:** Criar apresentações personalizadas baseadas em todos os dados

#### Engine: Pitch Generator
```typescript
src/lib/engines/ai/pitchGenerator.ts
```

**Entradas:**
- Todos os dados coletados da empresa
- Digital Health Score
- Riscos identificados
- Oportunidades mapeadas
- Produtos TOTVS recomendados

**Saída:**
- **Pitch Executivo** (1 página)
  - Resumo da empresa
  - Score digital
  - 3 principais oportunidades
  - 3 produtos TOTVS recomendados
  - ROI estimado
  
- **Pitch Detalhado** (5-10 páginas)
  - Análise completa da empresa
  - Presença digital por canal
  - Análise de riscos
  - Benchmarking com concorrentes
  - Roadmap de implementação TOTVS
  - Business case completo

**Prompt para IA:**
```
Você é um especialista em vendas B2B da TOTVS. Com base nos dados abaixo,
crie um pitch comercial persuasivo e personalizado:

DADOS DA EMPRESA:
- Nome: {company.name}
- Setor: {company.industry}
- Funcionários: {company.employees}
- Digital Health Score: {score.overall}

ANÁLISE DE PRESENÇA DIGITAL:
{socialMedia.summary}

RISCOS IDENTIFICADOS:
{risks.summary}

OPORTUNIDADES MAPEADAS:
{opportunities.summary}

PRODUTOS TOTVS RECOMENDADOS:
{recommendations}

CRIE UM PITCH QUE:
1. Demonstre profundo entendimento do negócio do cliente
2. Apresente dados concretos e relevantes
3. Conecte os produtos TOTVS às necessidades específicas
4. Mostre ROI e benefícios mensuráveis
5. Inclua call-to-action claro
```

---

### 9.2 Gerador de Insights Estratégicos

**Objetivo:** Insights acionáveis para a equipe de vendas

#### Engine: Insights Generator
```typescript
src/lib/engines/ai/insightsGenerator.ts
```

**Tipos de Insights:**

1. **Timing de Abordagem**
   - "Melhor momento para abordar: Empresa abriu 5 vagas de TI - expansão em curso"
   - "Evitar contato agora: Alta taxa de reclamações - possível crise interna"

2. **Ângulo de Venda**
   - "Enfatizar: Gestão financeira (score baixo identificado)"
   - "Destacar: Cases de sucesso em compliance (processos jurídicos detectados)"

3. **Concorrência**
   - "Concorrente X já atende essa empresa (detectado no LinkedIn)"
   - "Oportunidade: Empresa não usa ERP moderno (tecnologias antigas identificadas)"

4. **Persona do Decisor**
   - "CFO recém-contratado - provável janela de mudanças"
   - "CTO ativo no LinkedIn - engajar via social selling"

---

### 9.3 Comparador de Concorrentes

**Objetivo:** Análise comparativa entre empresa-alvo e concorrentes

#### Engine: Competitor Analysis
```typescript
src/lib/engines/intelligence/competitorAnalysis.ts
```

**Saída:**
```typescript
{
  targetCompany: {
    name: 'Empresa A',
    digitalHealthScore: 6.5,
    strengths: ['Forte presença no LinkedIn', 'Boa reputação'],
    weaknesses: ['Ausência em marketplaces', 'Baixo score financeiro']
  },
  competitors: [
    {
      name: 'Concorrente B',
      digitalHealthScore: 8.2,
      comparison: {
        socialMedia: 'Muito superior (+40%)',
        financial: 'Similar',
        reputation: 'Superior (+15%)'
      },
      opportunityGap: 'Concorrente investe mais em marketing digital'
    }
  ],
  recommendations: [
    'Empresa A precisa urgentemente melhorar presença em marketplaces',
    'Oportunidade: Empresa A pode se diferenciar com melhor atendimento'
  ]
}
```

---

## 📊 FASE 10: DASHBOARDS E VISUALIZAÇÕES

### 10.1 Dashboard de Presença Digital

**Componente:** `src/pages/DigitalPresenceDashboard.tsx`

**Visualizações:**
- Radar Chart: Presença em cada canal (LinkedIn, Instagram, FB, etc.)
- Timeline: Evolução do score digital (últimos 12 meses)
- Heatmap: Engajamento por dia da semana/hora
- Word Cloud: Tópicos mais mencionados
- Gauge: Digital Health Score

---

### 10.2 Dashboard de Riscos

**Componente:** `src/pages/RiskDashboard.tsx`

**Visualizações:**
- Semáforo: Nível de risco geral (verde/amarelo/vermelho)
- Lista priorizada: Riscos críticos que exigem ação
- Gráfico de tendência: Evolução dos riscos (últimos 6 meses)
- Mapa de calor: Riscos por categoria (financeiro, jurídico, reputacional)

---

### 10.3 Dashboard de Oportunidades

**Componente:** `src/pages/OpportunitiesDashboard.tsx`

**Visualizações:**
- Pipeline de oportunidades (por score de fit)
- Timing de abordagem (quando contatar)
- Gatilhos identificados (vagas abertas, expansão, etc.)
- ROI estimado por oportunidade

---

## 🔧 ARQUITETURA TÉCNICA

### Estrutura de Pastas Proposta

```
src/
├── lib/
│   ├── adapters/
│   │   ├── social/
│   │   │   ├── linkedinCompany.ts
│   │   │   ├── instagram.ts
│   │   │   ├── facebook.ts
│   │   │   ├── twitter.ts
│   │   │   └── youtube.ts
│   │   ├── marketplace/
│   │   │   ├── mercadolivre.ts
│   │   │   ├── amazon.ts
│   │   │   └── magazineluiza.ts
│   │   ├── legal/
│   │   │   ├── jusbrasil.ts
│   │   │   └── ceis.ts
│   │   ├── financial/
│   │   │   ├── serasa.ts
│   │   │   ├── boavista.ts
│   │   │   └── indicators.ts
│   │   ├── news/
│   │   │   └── aggregator.ts
│   │   └── reputation/
│   │       ├── reclameaqui.ts
│   │       ├── googlereviews.ts
│   │       └── trustpilot.ts
│   ├── engines/
│   │   ├── intelligence/
│   │   │   ├── digitalHealthScore.ts
│   │   │   ├── sentimentAnalysis.ts
│   │   │   ├── riskDetection.ts
│   │   │   ├── monitoring.ts
│   │   │   └── competitorAnalysis.ts
│   │   └── ai/
│   │       ├── pitchGenerator.ts
│   │       └── insightsGenerator.ts
│   ├── db/
│   │   ├── digitalPresence.ts
│   │   ├── risks.ts
│   │   ├── opportunities.ts
│   │   └── insights.ts
│   └── utils/
│       ├── scoring.ts
│       ├── sentiment.ts
│       └── trends.ts
├── pages/
│   ├── DigitalPresenceDashboard.tsx
│   ├── RiskDashboard.tsx
│   ├── OpportunitiesDashboard.tsx
│   └── PitchGeneratorPage.tsx
└── components/
    ├── presence/
    │   ├── SocialMediaCard.ts
    │   ├── MarketplaceCard.tsx
    │   └── PresenceRadarChart.tsx
    ├── risk/
    │   ├── RiskMeter.tsx
    │   ├── RiskTimeline.tsx
    │   └── RiskHeatmap.tsx
    └── insights/
        ├── InsightCard.tsx
        ├── OpportunityCard.tsx
        └── PitchPreview.tsx
```

---

## 🗄️ BANCO DE DADOS

### Novas Tabelas a Criar

```sql
-- Digital Presence
CREATE TABLE digital_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  
  -- Social Media
  linkedin_score NUMERIC,
  linkedin_data JSONB,
  instagram_score NUMERIC,
  instagram_data JSONB,
  facebook_score NUMERIC,
  facebook_data JSONB,
  twitter_score NUMERIC,
  twitter_data JSONB,
  youtube_score NUMERIC,
  youtube_data JSONB,
  
  -- Marketplaces
  mercadolivre_score NUMERIC,
  mercadolivre_data JSONB,
  amazon_score NUMERIC,
  amazon_data JSONB,
  
  -- Overall
  overall_presence_score NUMERIC,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legal & Compliance
CREATE TABLE legal_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  
  jusbrasil_processes INTEGER,
  jusbrasil_data JSONB,
  ceis_sanctions BOOLEAN,
  ceis_data JSONB,
  
  legal_health_score NUMERIC,
  compliance_score NUMERIC,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial Health
CREATE TABLE financial_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  
  credit_score NUMERIC,
  default_status BOOLEAN,
  protests INTEGER,
  lawsuits INTEGER,
  
  serasa_data JSONB,
  boavista_data JSONB,
  
  financial_health_score NUMERIC,
  risk_level TEXT, -- 'low', 'medium', 'high', 'critical'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reputation
CREATE TABLE reputation_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  
  reclameaqui_score NUMERIC,
  reclameaqui_data JSONB,
  google_reviews_score NUMERIC,
  google_reviews_data JSONB,
  
  overall_reputation_score NUMERIC,
  sentiment TEXT, -- 'positive', 'neutral', 'negative'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- News & Mentions
CREATE TABLE news_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  
  title TEXT,
  source TEXT,
  url TEXT,
  published_at TIMESTAMPTZ,
  sentiment TEXT,
  summary TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risks
CREATE TABLE risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  
  type TEXT, -- 'financial', 'legal', 'reputational'
  severity TEXT, -- 'low', 'medium', 'high', 'critical'
  description TEXT,
  impact TEXT,
  recommendation TEXT,
  
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' -- 'active', 'monitoring', 'resolved'
);

-- Insights
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  
  type TEXT, -- 'timing', 'angle', 'competitor', 'persona'
  title TEXT,
  description TEXT,
  confidence_score NUMERIC,
  actionable BOOLEAN,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Generated Pitchs
CREATE TABLE pitchs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  
  type TEXT, -- 'executive', 'detailed'
  content TEXT,
  format TEXT, -- 'markdown', 'html', 'pdf'
  
  generated_by UUID, -- user_id
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  
  version INTEGER DEFAULT 1
);
```

---

## 🚀 CRONOGRAMA DE IMPLEMENTAÇÃO

### Sprint 1-2 (Semanas 1-4): Fundação
- [ ] Criar estrutura de pastas e tipos
- [ ] Implementar adapters de redes sociais (LinkedIn, Instagram, Facebook)
- [ ] Criar Digital Presence Score engine
- [ ] Implementar dashboard básico de presença digital

### Sprint 3-4 (Semanas 5-8): Expansão
- [ ] Adapters de marketplaces (Mercado Livre, Amazon)
- [ ] Adapter JusBrasil
- [ ] Adapter Serasa/Boa Vista
- [ ] Sistema de scoring unificado (Digital Health Score)

### Sprint 5-6 (Semanas 9-12): Intelligence
- [ ] Sentiment Analysis engine
- [ ] Risk Detection engine
- [ ] Monitoring & Alerts system
- [ ] Dashboard de riscos

### Sprint 7-8 (Semanas 13-16): IA Generativa
- [ ] Pitch Generator com Lovable AI
- [ ] Insights Generator
- [ ] Competitor Analysis
- [ ] Dashboard de oportunidades

### Sprint 9-10 (Semanas 17-20): Refinamento
- [ ] Otimização de performance
- [ ] Cache inteligente
- [ ] Testes E2E completos
- [ ] Documentação final

---

## 💡 DIFERENCIAIS COMPETITIVOS

Com essa implementação, a OLV Intelligence terá:

✅ **Arsenal de Dados Único no Mercado**
- 15+ fontes de dados integradas
- Análise 360° da empresa-alvo

✅ **Intelligence Preditiva**
- Detecção proativa de riscos
- Alertas sobre oportunidades
- Análise de sentimento em tempo real

✅ **Geração de Conteúdo com IA**
- Pitchs personalizados em segundos
- Insights acionáveis para vendedores
- Benchmarking automático de concorrentes

✅ **ROI Mensurável**
- Redução de 70% no tempo de pesquisa
- Aumento de 40% na taxa de conversão
- Pitchs 10x mais personalizados

---

## 📈 MÉTRICAS DE SUCESSO

| Métrica | Baseline | Meta |
|---------|----------|------|
| Fontes de dados integradas | 6 | 15+ |
| Tempo médio de enrichment | Manual (2h) | Automático (5min) |
| Precisão de scoring | N/A | >85% |
| Taxa de conversão de pitchs | N/A | >40% |
| Satisfação do usuário | N/A | >4.5/5 |

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

1. **Validar Roadmap:** Confirmar prioridades e ajustar cronograma
2. **Configurar APIs:** Obter credenciais para todas as APIs necessárias
3. **Prototipar Dashboard:** Criar mockups do Digital Presence Dashboard
4. **Implementar Pilot:** Começar com LinkedIn + JusBrasil + Serasa

---

**🚀 PRONTO PARA COMEÇAR A FASE 7?**

Aguardo sua confirmação para iniciar a implementação do arsenal de intelligence digital completo!
