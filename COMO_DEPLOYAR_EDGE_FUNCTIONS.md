# 🚀 DEPLOY DE EDGE FUNCTIONS - SUPABASE

## 📁 ARQUIVOS CRIADOS

Criei 3 Edge Functions prontas para deploy:

1. ✅ `supabase/functions/search-companies/index.ts`
2. ✅ `supabase/functions/analyze-totvs-fit/index.ts`
3. ✅ `supabase/functions/generate-account-strategy/index.ts`

---

## 🎯 OPÇÃO 1: DEPLOY VIA DASHBOARD (RECOMENDADO)

### ✅ Passo 1: Acessar Edge Functions

👉 https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/functions

### ✅ Passo 2: Deploy da Função 1 - search-companies

1. Clique em **"Deploy a new function"** ou **"Create function"**
2. Nome: `search-companies`
3. Copie o conteúdo de: `supabase/functions/search-companies/index.ts`
4. Cole no editor
5. Clique em **"Deploy function"**

### ✅ Passo 3: Deploy da Função 2 - analyze-totvs-fit

1. Clique em **"Deploy a new function"**
2. Nome: `analyze-totvs-fit`
3. Copie o conteúdo de: `supabase/functions/analyze-totvs-fit/index.ts`
4. Cole no editor
5. Clique em **"Deploy function"**

### ✅ Passo 4: Deploy da Função 3 - generate-account-strategy

1. Clique em **"Deploy a new function"**
2. Nome: `generate-account-strategy`
3. Copie o conteúdo de: `supabase/functions/generate-account-strategy/index.ts`
4. Cole no editor
5. Clique em **"Deploy function"**

### ✅ Passo 5: Verificar Secrets

As funções precisam destas variáveis de ambiente (já deveriam estar configuradas):

- `OPENAI_API_KEY`
- `SUPABASE_URL` (automático)
- `SUPABASE_SERVICE_ROLE_KEY` (automático)

Se não estiverem configuradas:
1. Vá em: **Project Settings** > **Edge Functions** > **Secrets**
2. Adicione `OPENAI_API_KEY` com o valor do `.env.local`

---

## 🎯 OPÇÃO 2: DEPLOY VIA CLI (SE TIVER SUPABASE CLI)

Se você tiver o Supabase CLI instalado:

```bash
# Login
supabase login

# Link do projeto
supabase link --project-ref qtcwetabhhkhvomcrqgm

# Deploy todas as funções de uma vez
supabase functions deploy search-companies
supabase functions deploy analyze-totvs-fit
supabase functions deploy generate-account-strategy

# Ou deploy de todas
supabase functions deploy
```

---

## ✅ TESTAR APÓS O DEPLOY

Volte aqui no Cursor e execute:

```bash
npx tsx test-all-24-apis-final.ts
```

Agora você deve ver:

```
✅ 3. Supabase Edge Functions - FUNCIONANDO
✅ APIs 18-24 (Custom Stratevo) - FUNCIONANDO
```

---

## 📊 IMPACTO ESPERADO

Depois do deploy:

**ANTES:**
- ✅ 20/24 APIs (83%)
- ❌ 4 APIs com erro

**DEPOIS:**
- ✅ 21/24 APIs (87.5%)
- ❌ 3 APIs com erro

As 7 APIs Custom Stratevo vão funcionar automaticamente quando as Edge Functions estiverem deployadas! 🎉

---

## 🆘 PROBLEMAS?

Se encontrar erro no deploy:

1. **Erro de sintaxe:** Verifique se copiou o código completo
2. **Erro de permissão:** Faça login no Supabase primeiro
3. **Erro de API Key:** Configure os Secrets primeiro

Me avise se precisar de ajuda! 🚀

