# 🚀 ESTRATÉGIA: TRANSFORMAÇÃO EM PLATAFORMA SaaS MULTI-SETORIAL

**Data**: 2025-10-28  
**Versão**: 1.0  
**Status**: Planejamento Estratégico

---

## 📋 SUMÁRIO EXECUTIVO

### Situação Atual
Plataforma **hardcoded** para TOTVS:
- Catálogo de produtos fixo (15 produtos TOTVS)
- Regras de negócio específicas (não vender para clientes TOTVS)
- Fit analysis específico para ERP/Gestão
- Personas B2B fixas
- Scoring calibrado para maturidade digital + fit TOTVS

### Objetivo Estratégico
Transformar em **plataforma SaaS multi-tenant** onde:
- Cada cliente (tenant) configura seu próprio catálogo
- Regras de negócio customizáveis por setor
- Fit analysis adaptável a qualquer indústria
- Personas configuráveis
- Scoring flexível por vertical

### Casos de Uso Alvos
1. **Indústria Farmacêutica**: Vender equipamentos médicos, evitar hospitais que já compram da concorrência
2. **Tech/SaaS**: Vender software, qualificar por stack tecnológico
3. **Logística**: Vender frota, qualificar por operação e rotas
4. **Energia**: Vender soluções sustentáveis, qualificar por consumo
5. **Varejo**: Vender POS/PDV, qualificar por tamanho de loja

---

## 🏗️ ARQUITETURA ATUAL vs. ALVO

### 🔴 Arquitetura Atual (Hard-coded TOTVS)

```
┌─────────────────────────────────────────────────────┐
│                 FRONTEND (React)                     │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ Componentes com lógica TOTVS embutida:    │    │
│  │ - TOTVSDetectionCard.tsx                   │    │
│  │ - TOTVSProductSelector.tsx                 │    │
│  │ - FitTOTVSPage.tsx                         │    │
│  │ - WinProbabilityCard (regras TOTVS)       │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              EDGE FUNCTIONS (Backend)                │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ Lógica TOTVS hard-coded:                   │    │
│  │ - detect-totvs-usage/index.ts              │    │
│  │ - analyze-totvs-fit/index.ts               │    │
│  │ - calculate-win-probability (TOTVS rules)  │    │
│  │ - generate-company-report (TOTVS produtos) │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│           DATABASE (Supabase PostgreSQL)             │
│                                                      │
│  totvs_products (15 produtos fixos)                 │
│  pricing_rules (regras TOTVS específicas)           │
│  companies.totvs_detection_score                    │
│  governance_signals (fit analysis TOTVS)            │
└─────────────────────────────────────────────────────┘
```

**Problemas**:
- ❌ Nome "TOTVS" aparece em 47 arquivos
- ❌ Catálogo fixo (não é possível adicionar produtos via UI)
- ❌ Regras de negócio imutáveis
- ❌ Impossível replicar para outro setor sem recodificar

---

### ✅ Arquitetura Alvo (Multi-Tenant SaaS)

```
┌─────────────────────────────────────────────────────┐
│                 FRONTEND (React)                     │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ Componentes genéricos + configuráveis:     │    │
│  │ - CompetitorDetectionCard.tsx              │    │
│  │ - ProductSelector.tsx (lê do tenant)       │    │
│  │ - FitAnalysisPage.tsx (genérico)           │    │
│  │ - TenantConfigPanel.tsx (NOVO)             │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              EDGE FUNCTIONS (Backend)                │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ Lógica genérica + tenant-aware:            │    │
│  │ - detect-competitor-usage/index.ts         │    │
│  │ - analyze-product-fit/index.ts             │    │
│  │ - calculate-win-probability (tenant rules) │    │
│  │ - generate-company-report (tenant catalog) │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│           DATABASE (Supabase PostgreSQL)             │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ MULTI-TENANT SCHEMA:                       │    │
│  │                                             │    │
│  │ tenants (configuração do cliente)          │    │
│  │   ├─ id, name, industry, logo              │    │
│  │   ├─ config (JSONB com regras de negócio) │    │
│  │   └─ created_at, updated_at                │    │
│  │                                             │    │
│  │ tenant_products (catálogo flexível)        │    │
│  │   ├─ tenant_id (FK)                        │    │
│  │   ├─ name, sku, category, price            │    │
│  │   ├─ metadata (JSONB customizável)         │    │
│  │   └─ active, created_at                    │    │
│  │                                             │    │
│  │ tenant_competitors (concorrentes)          │    │
│  │   ├─ tenant_id (FK)                        │    │
│  │   ├─ name, domain, keywords                │    │
│  │   └─ detection_rules (JSONB)               │    │
│  │                                             │    │
│  │ tenant_personas (buyer personas)           │    │
│  │   ├─ tenant_id (FK)                        │    │
│  │   ├─ name, role, pain_points               │    │
│  │   └─ ideal_profile (JSONB)                 │    │
│  │                                             │    │
│  │ tenant_scoring_rules (fit scoring)         │    │
│  │   ├─ tenant_id (FK)                        │    │
│  │   ├─ rule_type, weight, formula            │    │
│  │   └─ conditions (JSONB)                    │    │
│  │                                             │    │
│  │ companies (agora com tenant_id)            │    │
│  │   ├─ tenant_id (FK) ← NOVO                 │    │
│  │   ├─ competitor_detection_score (genérico) │    │
│  │   └─ ... (campos existentes)               │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Benefícios**:
- ✅ Um tenant por cliente (ex: "OLV Intelligence", "Farmacêutica XYZ")
- ✅ Cada tenant configura tudo via UI (sem código)
- ✅ Isolamento de dados (RLS por tenant_id)
- ✅ Escalável para qualquer indústria
- ✅ Modelo SaaS recorrente (mensalidade por tenant)

---

## 🗄️ MODELO DE DADOS: SCHEMA MULTI-TENANT

### 1. Tabela `tenants` (Clientes da Plataforma)

```sql
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  name TEXT NOT NULL UNIQUE, -- Ex: "OLV Intelligence", "Pharma Solutions"
  slug TEXT NOT NULL UNIQUE, -- Ex: "olv-intelligence", "pharma-solutions"
  industry TEXT NOT NULL, -- Ex: "ERP/Gestão", "Farmacêutica", "Logística"
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  
  -- Configuração de Negócio (JSONB flexível)
  config JSONB NOT NULL DEFAULT '{
    "disqualify_if_competitor": true,
    "competitor_threshold_score": 70,
    "auto_enrich_on_import": true,
    "lead_score_weights": {
      "maturity": 0.25,
      "intent": 0.30,
      "fit": 0.20,
      "engagement": 0.15,
      "size": 0.10
    },
    "required_fields": ["name", "cnpj"],
    "enrichment_sources": ["receitaws", "google", "apollo"]
  }'::JSONB,
  
  -- Controle
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Owner (usuário admin do tenant)
  owner_user_id UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_industry ON public.tenants(industry);
```

**Exemplo de dados**:
```json
{
  "id": "tenant-olv-uuid",
  "name": "OLV Intelligence",
  "slug": "olv-intelligence",
  "industry": "ERP/Gestão",
  "config": {
    "disqualify_if_competitor": true,
    "competitor_threshold_score": 70,
    "lead_score_weights": {
      "maturity": 0.25,
      "intent": 0.30,
      "fit": 0.20,
      "engagement": 0.15,
      "size": 0.10
    }
  }
}
```

---

### 2. Tabela `tenant_products` (Catálogo Configurável)

```sql
CREATE TABLE public.tenant_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Produto
  name TEXT NOT NULL, -- Ex: "TOTVS Protheus", "Ventilador Pulmonar XYZ"
  sku TEXT, -- Ex: "TOTVS-PROTHEUS-001"
  category TEXT NOT NULL, -- Ex: "ERP Básico", "Equipamento ICU"
  description TEXT,
  
  -- Pricing
  base_price NUMERIC(12,2),
  currency TEXT DEFAULT 'BRL',
  
  -- Metadata customizável (JSONB)
  metadata JSONB DEFAULT '{}'::JSONB, -- Ex: { "target_employees": "100-500", "ideal_sector": "Indústria" }
  
  -- Fit Analysis (critérios de recomendação)
  fit_criteria JSONB DEFAULT '{}'::JSONB, -- Ex: { "min_employees": 100, "required_tech": ["ERP legado"] }
  
  -- Controle
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_tenant_products_tenant ON public.tenant_products(tenant_id);
CREATE INDEX idx_tenant_products_category ON public.tenant_products(tenant_id, category);
CREATE INDEX idx_tenant_products_active ON public.tenant_products(tenant_id, is_active);

-- RLS (isolamento por tenant)
ALTER TABLE public.tenant_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see only their tenant products"
ON public.tenant_products FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
  )
);
```

**Exemplo de dados**:
```json
{
  "id": "prod-123",
  "tenant_id": "tenant-olv-uuid",
  "name": "TOTVS Protheus",
  "sku": "TOTVS-PROTHEUS-001",
  "category": "ERP Intermediário",
  "base_price": 50000.00,
  "metadata": {
    "target_employees": "100-500",
    "ideal_sectors": ["Indústria", "Distribuição"],
    "implementation_time": "3-6 meses"
  },
  "fit_criteria": {
    "min_employees": 100,
    "required_tech": ["Sistema legado", "Planilhas Excel"],
    "ideal_maturity_score": 40
  }
}
```

---

### 3. Tabela `tenant_competitors` (Concorrentes Configuráveis)

```sql
CREATE TABLE public.tenant_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Concorrente
  name TEXT NOT NULL, -- Ex: "TOTVS", "SAP", "Oracle"
  domain TEXT, -- Ex: "totvs.com"
  
  -- Detecção (keywords para busca)
  detection_keywords TEXT[] DEFAULT '{}', -- Ex: ["totvs protheus", "linha protheus"]
  
  -- Regras de Detecção (JSONB)
  detection_rules JSONB DEFAULT '{
    "search_in": ["website", "linkedin", "job_postings", "news"],
    "match_threshold": 2,
    "weight_by_source": {
      "website": 50,
      "linkedin": 30,
      "job_postings": 15,
      "news": 5
    }
  }'::JSONB,
  
  -- Controle
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_tenant_competitors_tenant ON public.tenant_competitors(tenant_id);
CREATE INDEX idx_tenant_competitors_domain ON public.tenant_competitors(domain);

-- RLS
ALTER TABLE public.tenant_competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see only their tenant competitors"
ON public.tenant_competitors FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
  )
);
```

**Exemplo de dados**:
```json
{
  "id": "comp-totvs",
  "tenant_id": "tenant-olv-uuid",
  "name": "TOTVS",
  "domain": "totvs.com",
  "detection_keywords": ["totvs protheus", "totvs rm", "totvs datasul"],
  "detection_rules": {
    "search_in": ["website", "linkedin", "job_postings"],
    "match_threshold": 2,
    "weight_by_source": {
      "website": 50,
      "linkedin": 30,
      "job_postings": 20
    }
  }
}
```

---

### 4. Tabela `tenant_personas` (Buyer Personas)

```sql
CREATE TABLE public.tenant_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Persona
  name TEXT NOT NULL, -- Ex: "CFO Indústria", "CIO Varejo"
  role TEXT NOT NULL, -- Ex: "CFO", "CIO", "CEO"
  seniority TEXT, -- Ex: "C-Level", "Diretor", "Gerente"
  
  -- Perfil Ideal
  ideal_profile JSONB DEFAULT '{}'::JSONB, -- Ex: { "industries": ["Indústria"], "company_size": "100-500" }
  
  -- Pain Points
  pain_points TEXT[], -- Ex: ["Alto custo operacional", "Falta de integração"]
  
  -- Messaging
  value_proposition TEXT, -- Ex: "Reduza custos em 30% com ERP integrado"
  
  -- Controle
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_tenant_personas_tenant ON public.tenant_personas(tenant_id);
CREATE INDEX idx_tenant_personas_role ON public.tenant_personas(tenant_id, role);

-- RLS
ALTER TABLE public.tenant_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see only their tenant personas"
ON public.tenant_personas FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
  )
);
```

---

### 5. Tabela `tenant_scoring_rules` (Regras de Scoring)

```sql
CREATE TABLE public.tenant_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Regra
  rule_type TEXT NOT NULL, -- Ex: "maturity", "intent", "fit", "engagement", "size"
  rule_name TEXT NOT NULL, -- Ex: "Maturidade Digital", "Sinais de Intenção"
  weight NUMERIC(3,2) NOT NULL DEFAULT 0.20, -- Ex: 0.25 (25%)
  
  -- Fórmula (JSONB com condições)
  formula JSONB NOT NULL DEFAULT '{}'::JSONB,
  /* Exemplo de formula:
  {
    "conditions": [
      { "field": "employees", "operator": ">=", "value": 100, "points": 20 },
      { "field": "employees", "operator": ">=", "value": 500, "points": 40 }
    ],
    "max_score": 100
  }
  */
  
  -- Controle
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_tenant_scoring_rules_tenant ON public.tenant_scoring_rules(tenant_id);
CREATE INDEX idx_tenant_scoring_rules_type ON public.tenant_scoring_rules(tenant_id, rule_type);

-- RLS
ALTER TABLE public.tenant_scoring_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see only their tenant scoring rules"
ON public.tenant_scoring_rules FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
  )
);
```

---

### 6. Tabela `user_tenants` (Usuários Multi-Tenant)

```sql
CREATE TABLE public.user_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Permissões
  role TEXT NOT NULL DEFAULT 'member', -- Ex: "owner", "admin", "member", "viewer"
  
  -- Controle
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  UNIQUE(user_id, tenant_id)
);

-- Índices
CREATE INDEX idx_user_tenants_user ON public.user_tenants(user_id);
CREATE INDEX idx_user_tenants_tenant ON public.user_tenants(tenant_id);

-- RLS
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see only their own tenant memberships"
ON public.user_tenants FOR SELECT
USING (user_id = auth.uid());
```

---

### 7. Atualizar Tabela `companies` (Adicionar tenant_id)

```sql
-- Migration para adicionar tenant_id
ALTER TABLE public.companies 
ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Índice
CREATE INDEX idx_companies_tenant ON public.companies(tenant_id);

-- Renomear colunas TOTVS-específicas para genéricas
ALTER TABLE public.companies 
RENAME COLUMN totvs_detection_score TO competitor_detection_score;

-- Atualizar RLS para filtrar por tenant
DROP POLICY IF EXISTS "Users can view all companies" ON public.companies;

CREATE POLICY "Users see only their tenant companies"
ON public.companies FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert companies in their tenant"
ON public.companies FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update companies in their tenant"
ON public.companies FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete companies in their tenant"
ON public.companies FOR DELETE
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
  )
);
```

---

## 🔄 MUDANÇAS NO CÓDIGO (Frontend + Backend)

### Frontend: Componentes a Refatorar

#### 1. Renomear Componentes TOTVS-específicos

**Antes**:
```
src/components/competitive/TOTVSDetectionCard.tsx
src/hooks/useTOTVSDetection.ts
src/pages/FitTOTVSPage.tsx
```

**Depois (Genérico)**:
```
src/components/competitive/CompetitorDetectionCard.tsx
src/hooks/useCompetitorDetection.ts
src/pages/ProductFitPage.tsx
```

#### 2. Novo Hook: `useTenantConfig`

```typescript
// src/hooks/useTenantConfig.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TenantConfig {
  id: string;
  name: string;
  industry: string;
  config: {
    disqualify_if_competitor: boolean;
    competitor_threshold_score: number;
    lead_score_weights: {
      maturity: number;
      intent: number;
      fit: number;
      engagement: number;
      size: number;
    };
  };
}

export function useTenantConfig() {
  return useQuery({
    queryKey: ['tenant-config'],
    queryFn: async () => {
      // 1. Buscar tenant_id do usuário atual
      const { data: userTenant } = await supabase
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!userTenant) throw new Error('Usuário sem tenant associado');

      // 2. Buscar configuração do tenant
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', userTenant.tenant_id)
        .single();

      if (error) throw error;
      return tenant as TenantConfig;
    },
  });
}
```

#### 3. Novo Hook: `useTenantProducts`

```typescript
// src/hooks/useTenantProducts.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TenantProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  base_price: number;
  metadata: Record<string, any>;
  fit_criteria: Record<string, any>;
}

export function useTenantProducts() {
  return useQuery({
    queryKey: ['tenant-products'],
    queryFn: async () => {
      // Buscar tenant_id
      const { data: userTenant } = await supabase
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!userTenant) throw new Error('Usuário sem tenant associado');

      // Buscar produtos do tenant
      const { data: products, error } = await supabase
        .from('tenant_products')
        .select('*')
        .eq('tenant_id', userTenant.tenant_id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return products as TenantProduct[];
    },
  });
}
```

#### 4. Novo Componente: `TenantConfigPanel.tsx`

```typescript
// src/components/admin/TenantConfigPanel.tsx
import { useTenantConfig } from '@/hooks/useTenantConfig';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function TenantConfigPanel() {
  const { data: tenant, isLoading } = useTenantConfig();

  if (isLoading) return <div>Carregando configuração...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração do Tenant: {tenant?.name}</CardTitle>
        <Badge>{tenant?.industry}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Regras de Negócio</h3>
            <ul className="list-disc ml-4 mt-2">
              <li>
                Desqualificar se concorrente: 
                {tenant?.config.disqualify_if_competitor ? ' ✅ Sim' : ' ❌ Não'}
              </li>
              <li>
                Score mínimo para desqualificação: {tenant?.config.competitor_threshold_score}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Pesos de Lead Scoring</h3>
            <ul className="list-disc ml-4 mt-2">
              <li>Maturidade: {tenant?.config.lead_score_weights.maturity * 100}%</li>
              <li>Intenção: {tenant?.config.lead_score_weights.intent * 100}%</li>
              <li>Fit: {tenant?.config.lead_score_weights.fit * 100}%</li>
              <li>Engajamento: {tenant?.config.lead_score_weights.engagement * 100}%</li>
              <li>Tamanho: {tenant?.config.lead_score_weights.size * 100}%</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Backend: Edge Functions a Refatorar

#### 1. Refatorar `detect-totvs-usage` → `detect-competitor-usage`

**Antes** (`supabase/functions/detect-totvs-usage/index.ts`):
```typescript
// Hard-coded para TOTVS
const TOTVS_PRODUCTS = [
  "protheus", "rm", "datasul", "fluig"
];
```

**Depois** (`supabase/functions/detect-competitor-usage/index.ts`):
```typescript
serve(async (req) => {
  const { company_id, tenant_id } = await req.json();

  // 1. Buscar concorrentes configurados para este tenant
  const { data: competitors } = await supabase
    .from('tenant_competitors')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('is_active', true);

  // 2. Para cada concorrente, fazer detecção
  const detections = [];
  for (const competitor of competitors) {
    const score = await detectCompetitorUsage(
      company,
      competitor.detection_keywords,
      competitor.detection_rules
    );
    
    detections.push({
      competitor_id: competitor.id,
      competitor_name: competitor.name,
      score: score,
    });
  }

  // 3. Calcular score agregado
  const totalScore = detections.reduce((sum, d) => sum + d.score, 0) / detections.length;

  // 4. Buscar configuração do tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('config')
    .eq('id', tenant_id)
    .single();

  // 5. Desqualificar se necessário
  const shouldDisqualify = 
    tenant.config.disqualify_if_competitor && 
    totalScore >= tenant.config.competitor_threshold_score;

  // 6. Atualizar empresa
  await supabase
    .from('companies')
    .update({ 
      competitor_detection_score: totalScore,
      is_disqualified: shouldDisqualify 
    })
    .eq('id', company_id);

  return { totalScore, detections, shouldDisqualify };
});
```

#### 2. Refatorar `analyze-totvs-fit` → `analyze-product-fit`

**Antes**: Busca produtos fixos da tabela `totvs_products`

**Depois**: Busca produtos dinâmicos da tabela `tenant_products`

```typescript
// supabase/functions/analyze-product-fit/index.ts
serve(async (req) => {
  const { company_id, tenant_id } = await req.json();

  // 1. Buscar produtos do tenant
  const { data: products } = await supabase
    .from('tenant_products')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('is_active', true);

  // 2. Buscar empresa
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', company_id)
    .single();

  // 3. Para cada produto, calcular fit score
  const productFits = [];
  for (const product of products) {
    const fitScore = calculateProductFit(company, product.fit_criteria);
    
    productFits.push({
      product_id: product.id,
      product_name: product.name,
      fit_score: fitScore,
      recommendation: fitScore >= 70 ? 'Altamente Recomendado' : 'Revisar',
    });
  }

  // 4. Gerar análise via AI
  const aiAnalysis = await callLovableAI({
    prompt: `Analise o fit desta empresa com os produtos:
      Empresa: ${company.name} (${company.employees} funcionários, setor ${company.industry})
      Produtos: ${JSON.stringify(productFits)}
      
      Retorne recomendações e estratégia de abordagem.`,
  });

  return { productFits, aiAnalysis };
});
```

#### 3. Refatorar `calculate-win-probability`

**Antes**: Regras hard-coded

**Depois**: Lê regras de `tenant_scoring_rules`

```typescript
// supabase/functions/calculate-win-probability/index.ts
serve(async (req) => {
  const { company_id, tenant_id } = await req.json();

  // 1. Buscar regras de scoring do tenant
  const { data: scoringRules } = await supabase
    .from('tenant_scoring_rules')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('is_active', true);

  // 2. Buscar empresa
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', company_id)
    .single();

  // 3. Calcular score para cada regra
  let totalScore = 0;
  for (const rule of scoringRules) {
    const ruleScore = evaluateRule(company, rule.formula);
    totalScore += ruleScore * rule.weight;
  }

  // 4. Normalizar para 0-100
  const finalScore = Math.min(100, Math.max(0, totalScore));

  return { score: finalScore };
});

function evaluateRule(company: any, formula: any): number {
  let score = 0;
  for (const condition of formula.conditions) {
    const fieldValue = company[condition.field];
    
    if (condition.operator === '>=' && fieldValue >= condition.value) {
      score = Math.max(score, condition.points);
    }
    // ... outros operadores
  }
  return Math.min(score, formula.max_score);
}
```

---

## 🚀 ROADMAP DE IMPLEMENTAÇÃO

### **Fase 1: Fundação Multi-Tenant** (1-2 semanas)

#### 1.1 Database Schema
- [ ] Criar tabelas `tenants`, `tenant_products`, `tenant_competitors`, `tenant_personas`, `tenant_scoring_rules`, `user_tenants`
- [ ] Adicionar coluna `tenant_id` em `companies`, `sdr_deals`, etc.
- [ ] Renomear colunas TOTVS-específicas para genéricas
- [ ] Migrar dados TOTVS atuais para tenant "OLV Intelligence"
- [ ] Implementar RLS (Row-Level Security) por tenant_id

#### 1.2 Backend Core
- [ ] Criar edge function `tenant-setup` (criar novo tenant)
- [ ] Refatorar `detect-totvs-usage` → `detect-competitor-usage`
- [ ] Refatorar `analyze-totvs-fit` → `analyze-product-fit`
- [ ] Refatorar `calculate-win-probability` (ler regras do tenant)

#### 1.3 Frontend Core
- [ ] Criar hook `useTenantConfig()`
- [ ] Criar hook `useTenantProducts()`
- [ ] Criar hook `useTenantCompetitors()`
- [ ] Criar componente `TenantConfigPanel.tsx`
- [ ] Renomear componentes TOTVS → genéricos

**Entregável**: Sistema funcional com 1 tenant (OLV Intelligence) configurável

---

### **Fase 2: UI de Configuração** (1-2 semanas)

#### 2.1 Tenant Admin Panel
- [ ] Página `/admin/tenant-settings`
  - [ ] Seção "Informações Gerais" (nome, indústria, logo)
  - [ ] Seção "Regras de Negócio" (toggle desqualificar, threshold)
  - [ ] Seção "Pesos de Scoring" (sliders para cada dimensão)

#### 2.2 Product Catalog Manager
- [ ] Página `/admin/products`
  - [ ] Listar produtos (DataTable)
  - [ ] Adicionar produto (Form)
  - [ ] Editar produto (Dialog)
  - [ ] Deletar produto (confirmação)
  - [ ] Definir fit_criteria por produto (JSONB editor)

#### 2.3 Competitor Manager
- [ ] Página `/admin/competitors`
  - [ ] Listar concorrentes (DataTable)
  - [ ] Adicionar concorrente (Form)
  - [ ] Configurar detection_keywords (tags input)
  - [ ] Configurar detection_rules (JSONB editor)

#### 2.4 Persona Manager
- [ ] Página `/admin/personas`
  - [ ] Listar personas (Cards)
  - [ ] Criar persona (Form)
  - [ ] Editar ideal_profile (JSONB editor)

#### 2.5 Scoring Rules Manager
- [ ] Página `/admin/scoring-rules`
  - [ ] Listar regras (DataTable)
  - [ ] Criar regra (Form com fórmula visual)
  - [ ] Ajustar pesos (sliders)

**Entregável**: Tenant pode configurar tudo via UI

---

### **Fase 3: Onboarding Multi-Tenant** (1 semana)

#### 3.1 Tenant Creation Flow
- [ ] Página `/onboarding/tenant-setup`
  - [ ] Step 1: Informações básicas (nome, indústria)
  - [ ] Step 2: Adicionar produtos (importar CSV ou manual)
  - [ ] Step 3: Configurar concorrentes (importar CSV ou manual)
  - [ ] Step 4: Definir regras de negócio (form)
  - [ ] Step 5: Convidar usuários (emails)

#### 3.2 Data Migration Tool
- [ ] Edge function `migrate-existing-data`
  - [ ] Importar catálogo TOTVS para novo tenant
  - [ ] Copiar configurações padrão

**Entregável**: Processo de onboarding completo para novos clientes

---

### **Fase 4: Isolamento e Segurança** (1 semana)

#### 4.1 RLS Policies Audit
- [ ] Auditar todas as tabelas para garantir isolamento por tenant
- [ ] Testar com 2 tenants em paralelo (não pode vazar dados)

#### 4.2 Tenant Switching
- [ ] Componente `TenantSwitcher` (usuários multi-tenant)
- [ ] Middleware para validar tenant_id em todas as requests

#### 4.3 Usage Tracking
- [ ] Tabela `tenant_usage` (enriquecimentos, AI calls, storage)
- [ ] Dashboard de billing por tenant

**Entregável**: Plataforma 100% isolada e segura

---

### **Fase 5: Marketplace & White-Label** (2-4 semanas)

#### 5.1 White-Label Branding
- [ ] Custom domain por tenant (ex: `cliente.olvintelligence.com`)
- [ ] Logo customizado
- [ ] Cores primárias configuráveis (theme CSS)

#### 5.2 Template Library
- [ ] Templates pré-configurados por indústria:
  - [ ] ERP/Gestão (TOTVS, SAP, Oracle)
  - [ ] Farmacêutica (equipamentos médicos)
  - [ ] Logística (frota, rastreamento)
  - [ ] Tech/SaaS (software, ferramentas)

#### 5.3 Public API
- [ ] Edge function `public-api-tenant`
  - [ ] Endpoint GET `/api/v1/companies`
  - [ ] Endpoint POST `/api/v1/enrich`
  - [ ] API keys por tenant

**Entregável**: Plataforma SaaS B2B white-label

---

## 💰 MODELO DE NEGÓCIO SaaS

### Pricing Tiers

#### 🆓 **Free Tier**
- 1 tenant
- 50 empresas enriquecidas/mês
- 1 usuário
- Catálogo básico (5 produtos)

#### 💼 **Starter - R$ 997/mês**
- 1 tenant
- 500 empresas enriquecidas/mês
- 5 usuários
- Catálogo ilimitado
- Configuração de concorrentes

#### 🚀 **Pro - R$ 2.997/mês**
- 1 tenant
- 2.000 empresas enriquecidas/mês
- 20 usuários
- Catálogo ilimitado
- Configuração avançada (scoring rules)
- White-label (domínio customizado)

#### 🏢 **Enterprise - Custom**
- Múltiplos tenants
- Volume ilimitado
- Usuários ilimitados
- API pública
- Suporte dedicado

---

## 📝 PROMPT FINAL PARA TRANSFORMAÇÃO

Quando você estiver pronto para executar a transformação, **faça um REMIX do projeto atual** e depois me envie este prompt:

---

### 🎯 PROMPT DE TRANSFORMAÇÃO MULTI-TENANT

```
OLV Intelligence Prospect — Transformação Multi-Tenant SaaS

CONTEXTO:
Esta plataforma atualmente é hard-coded para TOTVS (ERP). Preciso transformá-la em uma plataforma SaaS multi-tenant configurável para qualquer indústria.

OBJETIVO:
Implementar arquitetura multi-tenant seguindo exatamente o documento "ESTRATEGIA_PLATAFORMA_MULTISSETORIAL.md".

REQUISITOS CRÍTICOS:

1. DATABASE SCHEMA:
   - Criar tabelas: tenants, tenant_products, tenant_competitors, tenant_personas, tenant_scoring_rules, user_tenants
   - Adicionar coluna tenant_id em companies, sdr_deals, etc.
   - Renomear totvs_detection_score → competitor_detection_score
   - Migrar dados TOTVS atuais para tenant "OLV Intelligence" (tenant_id default)
   - Implementar RLS por tenant_id em TODAS as tabelas

2. BACKEND (Edge Functions):
   - Refatorar detect-totvs-usage → detect-competitor-usage (buscar de tenant_competitors)
   - Refatorar analyze-totvs-fit → analyze-product-fit (buscar de tenant_products)
   - Refatorar calculate-win-probability (ler regras de tenant_scoring_rules)
   - Criar tenant-setup (criar novo tenant)

3. FRONTEND:
   - Renomear componentes TOTVS → genéricos (TOTVSDetectionCard → CompetitorDetectionCard)
   - Criar hooks: useTenantConfig(), useTenantProducts(), useTenantCompetitors()
   - Criar componente TenantConfigPanel.tsx
   - Criar página /admin/tenant-settings

4. MIGRAÇÃO DE DADOS:
   - Criar tenant "OLV Intelligence" com:
     - industry: "ERP/Gestão"
     - produtos: copiar de totvs_products → tenant_products
     - concorrentes: ["TOTVS", "SAP", "Oracle", "Microsiga"]
   - Atualizar companies.tenant_id = tenant_olv_id

5. VALIDAÇÃO:
   - Testar com 2 tenants simultaneamente (não pode vazar dados)
   - Verificar RLS em todas as queries
   - Garantir que catálogo é isolado por tenant

IMPORTANTE:
- NÃO remover funcionalidades existentes
- NÃO quebrar fluxos atuais (Apollo import, Canvas, SDR)
- MANTER compatibilidade com dados atuais
- Adicionar apenas camada de tenant sobre arquitetura existente

ENTREGÁVEL:
Sistema 100% funcional com 1 tenant (OLV Intelligence) configurável, pronto para adicionar novos tenants via UI.

EXECUTAR AGORA: Fase 1 (Fundação Multi-Tenant) + Fase 2 (UI de Configuração básica)
```

---

## 🎓 EXEMPLOS DE USO PÓS-TRANSFORMAÇÃO

### Exemplo 1: Cliente Farmacêutico

**Tenant**: "Pharma Solutions"
**Indústria**: Farmacêutica

**Catálogo de Produtos**:
```json
[
  {
    "name": "Ventilador Pulmonar VPX-3000",
    "category": "ICU Equipment",
    "base_price": 120000.00,
    "fit_criteria": {
      "ideal_sectors": ["Hospital", "Clínica"],
      "min_beds": 50,
      "required_certifications": ["ANVISA"]
    }
  },
  {
    "name": "Monitor Multiparamétrico MP-500",
    "category": "Monitoring Equipment",
    "base_price": 35000.00,
    "fit_criteria": {
      "ideal_sectors": ["Hospital", "UTI"],
      "min_beds": 20
    }
  }
]
```

**Concorrentes**:
```json
[
  {
    "name": "GE Healthcare",
    "detection_keywords": ["ge healthcare", "gehc", "vital signs monitor"]
  },
  {
    "name": "Philips Healthcare",
    "detection_keywords": ["philips healthcare", "intellivue"]
  }
]
```

**Regras de Scoring**:
- Maturidade Digital: 20% (menos importante em hospitais)
- Intenção: 40% (expansão de leitos, novos equipamentos)
- Fit: 25% (tamanho do hospital, especialidade)
- Engajamento: 10%
- Tamanho: 5%

---

### Exemplo 2: Cliente Logística

**Tenant**: "Fleet Solutions"
**Indústria**: Logística

**Catálogo de Produtos**:
```json
[
  {
    "name": "Rastreador GPS Premium",
    "category": "Telemetria",
    "base_price": 1500.00,
    "fit_criteria": {
      "ideal_sectors": ["Transporte", "Distribuição"],
      "min_vehicles": 10
    }
  },
  {
    "name": "Sistema de Roteirização AI",
    "category": "Software",
    "base_price": 50000.00,
    "fit_criteria": {
      "ideal_sectors": ["Transporte", "E-commerce"],
      "min_deliveries_per_month": 1000
    }
  }
]
```

**Concorrentes**:
```json
[
  {
    "name": "Omnilink",
    "detection_keywords": ["omnilink", "rastreamento satelital"]
  },
  {
    "name": "Sascar",
    "detection_keywords": ["sascar", "gestão de frotas"]
  }
]
```

---

## ✅ CHECKLIST DE VALIDAÇÃO PRÉ-LANÇAMENTO

### Database
- [ ] Todas as tabelas têm tenant_id
- [ ] RLS implementado em 100% das tabelas
- [ ] Não há vazamento de dados entre tenants (testar com 2 tenants)
- [ ] Migração de dados TOTVS para tenant "OLV Intelligence" OK

### Backend
- [ ] Todas as edge functions são tenant-aware
- [ ] Não há hard-coding de produtos/concorrentes
- [ ] AI prompts são genéricos (não mencionam TOTVS)
- [ ] Validação de tenant_id em todas as requests

### Frontend
- [ ] Não há menção a "TOTVS" no código (exceto dados migrados)
- [ ] Componentes são genéricos e reutilizáveis
- [ ] UI de configuração permite CRUD completo
- [ ] TenantSwitcher funciona (para usuários multi-tenant)

### Segurança
- [ ] RLS policies testadas
- [ ] API keys isoladas por tenant
- [ ] Logs isolados por tenant
- [ ] Backup e restore por tenant

### Performance
- [ ] Índices em tenant_id
- [ ] Queries otimizadas (não há N+1)
- [ ] Cache por tenant

---

## 🎯 CONCLUSÃO

**Status Atual**: Plataforma 100% funcional para TOTVS

**Status Alvo**: Plataforma SaaS multi-tenant configurável para qualquer indústria

**Esforço Estimado**: 6-8 semanas de desenvolvimento

**ROI**: Modelo SaaS recorrente escalável (R$ 997 - R$ 2.997/mês por cliente)

**Próximo Passo**: Fazer REMIX do projeto e executar o prompt de transformação

---

**Documento gerado em**: 2025-10-28  
**Autor**: OLV Intelligence Team  
**Versão**: 1.0
