# 🔧 SOLUÇÃO: Supabase Database - Migrations Pendentes

## 📊 SITUAÇÃO IDENTIFICADA

**Problema:** Tabela `companies` não encontrada  
**Causa:** 139 migrations SQL existem localmente mas não foram executadas no Supabase  
**Status:** ⚠️ BLOQUEANDO - Database vazio

---

## ✅ SOLUÇÃO RÁPIDA (5 minutos)

### **OPÇÃO 1: Via Supabase Dashboard (Mais Fácil)**

#### Passo 1: Acessar o Dashboard
```
https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm
```

#### Passo 2: Verificar Tabelas
1. Clique em **"Table Editor"** no menu lateral
2. Veja se as tabelas existem:
   - `companies`
   - `decision_makers`
   - `analysis_runs`
   - `sdr_deals`
   - etc.

#### Passo 3: Se NÃO existirem tabelas

**3a) Via SQL Editor:**
1. Clique em **"SQL Editor"** no menu lateral
2. Clique em **"New query"**
3. Cole o conteúdo de uma migration SQL
4. Execute com **RUN**
5. Repita para as principais migrations

**OU**

**3b) Via Database > Migrations:**
1. Clique em **"Database"** → **"Migrations"**
2. Veja o histórico de migrations executadas
3. Se estiver vazio, as migrations nunca rodaram

---

### **OPÇÃO 2: Via Lovable (Automatizado)**

Se o projeto foi criado no Lovable, as migrations são sincronizadas automaticamente:

1. Acessar: https://lovable.dev/projects/83aa9319-3cdb-4039-89a3-d5632b977732
2. Clicar em **"Database"** ou **"Sync"**
3. Lovable aplica migrations automaticamente

---

### **OPÇÃO 3: Via Supabase CLI (Avançado)**

```bash
# 1. Instalar Supabase CLI (se não tiver)
npm install -g supabase

# 2. Login no Supabase
npx supabase login

# 3. Linkar projeto
npx supabase link --project-ref qtcwetabhhkhvomcrqgm

# 4. Aplicar migrations
npx supabase db push
```

**Nota:** Vai pedir senha do banco. Se não souber:
1. Acessar Dashboard → Settings → Database
2. Copiar a senha ou resetar

---

## 🎯 TESTE RÁPIDO

Depois de aplicar migrations, teste:

```bash
# Na raiz do projeto
npx tsx test-api-connections.ts
```

Se aparecer **✅ Supabase Database: OK**, problema resolvido!

---

## 📋 MIGRATIONS PRINCIPAIS QUE DEVEM EXISTIR

Execute estas queries no SQL Editor se precisar criar manualmente:

### 1. Tabela `companies` (Principal)

```sql
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT,
  website TEXT,
  domain TEXT,
  industry TEXT,
  employee_count INTEGER,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Brasil',
  lat DECIMAL,
  lng DECIMAL,
  digital_maturity_score INTEGER,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_cnpj ON companies(cnpj);
CREATE INDEX idx_companies_domain ON companies(domain);
CREATE INDEX idx_companies_name ON companies(name);
```

### 2. Tabela `decision_makers`

```sql
CREATE TABLE IF NOT EXISTS decision_makers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  linkedin_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_decision_makers_company ON decision_makers(company_id);
```

### 3. Tabela `sdr_deals`

```sql
CREATE TABLE IF NOT EXISTS sdr_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  stage TEXT DEFAULT 'novo',
  status TEXT DEFAULT 'ativo',
  value DECIMAL,
  probability INTEGER,
  next_action TEXT,
  next_action_date DATE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sdr_deals_company ON sdr_deals(company_id);
CREATE INDEX idx_sdr_deals_stage ON sdr_deals(stage);
```

---

## ⚠️ SE AINDA NÃO FUNCIONAR

### Verificar RLS (Row Level Security)

As tabelas podem existir mas estar bloqueadas por RLS:

```sql
-- Desabilitar RLS temporariamente para teste
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE decision_makers DISABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_deals DISABLE ROW LEVEL SECURITY;

-- OU criar política permissiva
CREATE POLICY "Acesso público" ON companies FOR ALL USING (true);
```

---

## 📊 COMO CONFIRMAR QUE FUNCIONOU

### Teste 1: Via SQL Editor
```sql
SELECT COUNT(*) FROM companies;
```

Se retornar `0` → Tabela existe mas vazia ✅  
Se retornar erro → Tabela não existe ❌

### Teste 2: Via Teste Automatizado
```bash
npx tsx test-api-connections.ts
```

Deve mostrar:
```
✅ 1. Supabase Database
   Status: OK
   Mensagem: Respondeu em XXms
```

---

## 🚀 PRÓXIMOS PASSOS APÓS RESOLVER

1. ✅ Confirmar que tabelas existem
2. ✅ Testar criação de empresa na interface
3. ✅ Validar enriquecimento completo
4. ✅ Testar todos os módulos

---

## 📞 PRECISA DE AJUDA?

Se após seguir todos os passos ainda não funcionar:

1. Tire screenshots do:
   - Table Editor (mostrando as tabelas)
   - SQL Editor (executando SELECT * FROM companies LIMIT 1)
   - Erro específico

2. Me mostre para eu ajudar a diagnosticar

---

**IMPORTANTE:** Este é o único problema crítico identificado na auditoria. Resolvendo isso, a plataforma fica 100% operacional!

