# 🎯 GUIA COMPLETO: CONFIGURAR SUPABASE VIA DASHBOARD

## 📋 ÍNDICE
1. [Criar Tabelas (SQL Editor)](#1-criar-tabelas)
2. [Criar Edge Functions](#2-criar-edge-functions)
3. [Configurar Variáveis de Ambiente](#3-configurar-variáveis)
4. [Testar Conexões](#4-testar-conexões)

---

## 1️⃣ CRIAR TABELAS NO SUPABASE

### 🌐 PASSO 1: Acessar SQL Editor

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: **qtcwetabhhkhvomcrqgm**
3. No menu lateral, clique em: **SQL Editor**
4. Clique em: **New query**

### 📝 PASSO 2: Copiar e Executar este SQL

**Cole este código completo no editor e clique em "RUN":**

```sql
-- ============================================
-- STRATEVO V2 - SCHEMA COMPLETO
-- ============================================

-- Tabela: companies
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  fantasy_name TEXT,
  main_activity TEXT,
  secondary_activities TEXT[],
  legal_nature TEXT,
  company_size TEXT,
  opening_date DATE,
  registration_status TEXT,
  full_address TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'Brasil',
  phone TEXT,
  email TEXT,
  website TEXT,
  share_capital DECIMAL(15,2),
  employee_count INTEGER,
  annual_revenue DECIMAL(15,2),
  linkedin_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  youtube_url TEXT,
  data_source TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: decision_makers
CREATE TABLE IF NOT EXISTS public.decision_makers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  position TEXT,
  department TEXT,
  seniority_level TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  data_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: sdr_deals
CREATE TABLE IF NOT EXISTS public.sdr_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  deal_title TEXT NOT NULL,
  deal_stage TEXT DEFAULT 'Prospecção',
  deal_value DECIMAL(15,2),
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  assigned_sdr TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: analysis_runs
CREATE TABLE IF NOT EXISTS public.analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  input_parameters JSONB,
  result_data JSONB,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela: api_usage_logs
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name TEXT NOT NULL,
  endpoint TEXT,
  method TEXT,
  request_payload JSONB,
  response_status INTEGER,
  response_data JSONB,
  execution_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: user_sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para Performance
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_city ON public.companies(city);
CREATE INDEX IF NOT EXISTS idx_decision_makers_company ON public.decision_makers(company_id);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_company ON public.sdr_deals(company_id);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_company ON public.analysis_runs(company_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_api_name ON public.api_usage_logs(api_name);

-- RLS (Row Level Security) - Habilitado
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_makers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (Acesso Total para Service Role)
CREATE POLICY "Allow all for service role" ON public.companies
  FOR ALL USING (true);

CREATE POLICY "Allow all for service role" ON public.decision_makers
  FOR ALL USING (true);

CREATE POLICY "Allow all for service role" ON public.sdr_deals
  FOR ALL USING (true);

CREATE POLICY "Allow all for service role" ON public.analysis_runs
  FOR ALL USING (true);

CREATE POLICY "Allow all for service role" ON public.api_usage_logs
  FOR ALL USING (true);

CREATE POLICY "Allow all for service role" ON public.user_sessions
  FOR ALL USING (true);

-- ✅ Schema criado com sucesso!
```

### ✅ RESULTADO ESPERADO

Você deve ver a mensagem: **"Success. No rows returned"**

---

## 2️⃣ CRIAR EDGE FUNCTIONS NO SUPABASE

### 🌐 PASSO 1: Acessar Edge Functions

1. No dashboard do Supabase: https://supabase.com/dashboard
2. Clique em: **Edge Functions** (menu lateral)
3. Clique em: **Create a new function**

### 📝 PASSO 2: Criar Funções Principais

**Crie estas 3 funções essenciais:**

#### ✅ FUNÇÃO 1: `search-companies`

**Nome:** `search-companies`

**Código:**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, filters } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    let queryBuilder = supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (query) {
      queryBuilder = queryBuilder.or(`company_name.ilike.%${query}%,fantasy_name.ilike.%${query}%,cnpj.ilike.%${query}%`)
    }

    if (filters?.city) {
      queryBuilder = queryBuilder.eq('city', filters.city)
    }

    const { data, error } = await queryBuilder

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, companies: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
```

---

#### ✅ FUNÇÃO 2: `analyze-totvs-fit`

**Nome:** `analyze-totvs-fit`

**Código:**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { companyData } = await req.json()
    
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiKey) {
      throw new Error('OpenAI API Key não configurada')
    }

    // Análise de fit com TOTVS
    const prompt = `Analise a adequação desta empresa para soluções TOTVS:

Empresa: ${companyData.company_name}
Setor: ${companyData.main_activity}
Tamanho: ${companyData.company_size}
Funcionários: ${companyData.employee_count}
Receita Anual: R$ ${companyData.annual_revenue}

Forneça uma análise em JSON com:
{
  "fit_score": 0-100,
  "recommended_products": ["produto1", "produto2"],
  "pain_points": ["dor1", "dor2"],
  "engagement_strategy": "estratégia detalhada"
}
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Você é um especialista em análise de fit para soluções TOTVS.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    })

    const result = await response.json()
    const analysis = JSON.parse(result.choices[0].message.content)

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
```

---

#### ✅ FUNÇÃO 3: `generate-account-strategy`

**Nome:** `generate-account-strategy`

**Código:**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { companyId, companyData, decisionMakers } = await req.json()
    
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiKey) {
      throw new Error('OpenAI API Key não configurada')
    }

    const prompt = `Gere uma estratégia de account-based selling para:

Empresa: ${companyData.company_name}
Decisores: ${decisionMakers.map((d: any) => `${d.full_name} - ${d.position}`).join(', ')}
Setor: ${companyData.main_activity}

Forneça em JSON:
{
  "executive_summary": "resumo executivo",
  "key_stakeholders": [{
    "name": "nome",
    "role": "cargo",
    "engagement_approach": "abordagem"
  }],
  "value_proposition": "proposta de valor",
  "next_actions": ["ação1", "ação2"],
  "timeline": "linha do tempo"
}
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Você é um especialista em estratégias de vendas B2B.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
      }),
    })

    const result = await response.json()
    const strategy = JSON.parse(result.choices[0].message.content)

    return new Response(
      JSON.stringify({ success: true, strategy }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
```

---

## 3️⃣ CONFIGURAR VARIÁVEIS DE AMBIENTE

### 🌐 PASSO 1: Acessar Settings

1. No dashboard: https://supabase.com/dashboard
2. Clique em: **Project Settings** (ícone de engrenagem)
3. Clique em: **Edge Functions**
4. Role até: **Secrets**

### 📝 PASSO 2: Adicionar Todas as Chaves

**Clique em "Add new secret" para cada uma:**

| Secret Name | Value |
|-------------|-------|
| `OPENAI_API_KEY` | `[Copie do seu .env.local]` |
| `APOLLO_API_KEY` | `[Copie do seu .env.local]` |
| `SERPER_API_KEY` | `[Copie do seu .env.local]` |
| `GOOGLE_API_KEY` | `[Copie do seu .env.local]` |
| `GOOGLE_CSE_ID` | `[Copie do seu .env.local]` |
| `YOUTUBE_API_KEY` | `[Copie do seu .env.local]` |
| `RECEITAWS_API_TOKEN` | `[Copie do seu .env.local]` |
| `EMPRESASAQUI_API_KEY` | `[Copie do seu .env.local]` |
| `HUNTER_API_KEY` | `[Copie do seu .env.local]` |
| `PHANTOM_BUSTER_API_KEY` | `[Copie do seu .env.local]` |
| `PHANTOMBUSTER_SESSION_COOKIE` | `[Copie do seu .env.local]` |
| `PHANTOMBUSTER_AGENT_ID` | `[Copie do seu .env.local]` |
| `GITHUB_API_KEY` | `[Copie do seu .env.local]` |
| `STRIPE_API_KEY` | `[Copie do seu .env.local]` |
| `STRATEVOSEARCH_API_KEY` | `[Copie do seu .env.local]` |

**💡 DICA:** Abra o arquivo `.env.local` no Cursor e copie os valores de lá!

⚠️ **IMPORTANTE:** Clique em "Save" após adicionar todas!

---

## 4️⃣ TESTAR AS CONEXÕES

### 🧪 Volte aqui no Cursor e execute:

```bash
npx tsx test-api-connections.ts
```

### ✅ RESULTADO ESPERADO

Você deve ver:
- ✅ Supabase Database: **OK**
- ✅ Edge Functions: **OK**
- ✅ Todas as 24 APIs: **TESTADAS**

---

## 🎯 CHECKLIST FINAL

- [ ] ✅ Tabelas criadas no SQL Editor
- [ ] ✅ 3 Edge Functions deployadas
- [ ] ✅ 15 variáveis de ambiente configuradas
- [ ] ✅ Teste de conexão executado

---

## 🆘 PROBLEMAS?

Se algum passo falhar, me avise e vou ajudar a resolver! 🚀

