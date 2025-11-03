# 🚀 DEPLOY COMPLETO - SUPABASE (CRÍTICO)

## 🚨 PROBLEMA IDENTIFICADO

**Status:** 🔴 CRÍTICO - Nada foi deployado para produção!

```
❌ 139 Migrations SQL → Não executadas
❌ 135 Edge Functions → Não deployadas  
✅ Frontend React → OK (Vercel cuida)
```

---

## 📊 O QUE PRECISA SER FEITO

### 1. Deploy das Edge Functions (135 funções)
### 2. Execução das Migrations (139 arquivos SQL)
### 3. Configuração de variáveis de ambiente no Supabase

---

## ✅ SOLUÇÃO COMPLETA

### **OPÇÃO 1: Via Lovable (RECOMENDADO - Automático)**

Se o projeto foi criado no Lovable, o deploy é **AUTOMÁTICO**:

#### Passo 1: Acessar Lovable
```
https://lovable.dev/projects/83aa9319-3cdb-4039-89a3-d5632b977732
```

#### Passo 2: Fazer Sync
1. Clicar em **"Sync"** ou **"Deploy"**
2. Lovable vai:
   - ✅ Executar todas as migrations
   - ✅ Deployar todas as Edge Functions
   - ✅ Configurar variáveis de ambiente
   - ✅ Sincronizar tudo automaticamente

#### Passo 3: Aguardar (5-10 minutos)
Lovable demora alguns minutos para fazer o deploy completo.

#### Passo 4: Testar
```bash
npx tsx test-edge-functions.ts
```

Se retornar **✅ Sucesso**, está tudo certo!

---

### **OPÇÃO 2: Via Supabase CLI (Manual)**

Se NÃO usar Lovable, precisa fazer deploy manual:

#### Passo 1: Instalar Supabase CLI

```bash
# Windows (via npm)
npm install -g supabase

# OU via winget
winget install Supabase.CLI
```

#### Passo 2: Login no Supabase

```bash
npx supabase login
```

Vai abrir o navegador para autenticar.

#### Passo 3: Linkar Projeto

```bash
npx supabase link --project-ref qtcwetabhhkhvomcrqgm
```

Vai pedir:
- Database password (pegar no dashboard)

#### Passo 4: Deploy das Migrations

```bash
# Aplicar TODAS as migrations de uma vez
npx supabase db push

# OU aplicar uma por vez (mais seguro)
npx supabase migration up
```

#### Passo 5: Deploy das Edge Functions

```bash
# Deploy de TODAS as functions de uma vez
npx supabase functions deploy

# OU uma por uma (mais controlado)
npx supabase functions deploy search-companies
npx supabase functions deploy enrich-company-360
npx supabase functions deploy analyze-totvs-fit
# ... repetir para as 135 funções
```

#### Passo 6: Configurar Secrets (Variáveis de Ambiente)

```bash
# Configurar TODAS as chaves de API como secrets
npx supabase secrets set APOLLO_API_KEY=TiwPX9bmdP0GuHijED57GQ
npx supabase secrets set OPENAI_API_KEY=sk-proj-...
npx supabase secrets set SERPER_API_KEY=e3f0cea...
npx supabase secrets set RECEITAWS_API_TOKEN=71260c7...
npx supabase secrets set HUNTER_API_KEY=02e8e5e...
npx supabase secrets set GOOGLE_API_KEY=AIzaSyB...
npx supabase secrets set YOUTUBE_API_KEY=AIzaSyC...
npx supabase secrets set GITHUB_API_KEY=github_pat_...
npx supabase secrets set STRIPE_API_KEY=sk-user-...
npx supabase secrets set EMPRESASAQUI_API_KEY=a8725d0...
npx supabase secrets set PHANTOM_BUSTER_API_KEY=0Haraww...
# ... todas as 24 chaves
```

---

### **OPÇÃO 3: Via Supabase Dashboard (Edge Functions uma por uma)**

Não recomendado para 135 funções, mas possível:

1. Acessar: https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/functions
2. Clicar em **"Create Function"**
3. Copiar código de cada função
4. Deploy uma por uma
5. Configurar secrets

**Muito trabalhoso para 135 funções!**

---

## 🎯 ESTRATÉGIA RECOMENDADA

### **Use Lovable se possível!**

**Por quê?**
- ✅ Deploy automático de tudo
- ✅ Sincronização contínua
- ✅ Não precisa configurar nada manualmente
- ✅ Atualiza automaticamente quando você faz mudanças
- ✅ Gerencia secrets automaticamente

**Se o projeto veio do Lovable:**
1. Entre no Lovable
2. Clique em "Sync" ou "Deploy"
3. Aguarde 10 minutos
4. Teste

**Se NÃO usar Lovable:**
Use a Opção 2 (Supabase CLI)

---

## 📋 CHECKLIST PÓS-DEPLOY

Depois de fazer o deploy, verifique:

### 1. ✅ Migrations Executadas

```bash
# Via CLI
npx supabase migration list

# OU via Dashboard
# Acessar: Database → Migrations
# Ver histórico de migrations aplicadas
```

### 2. ✅ Edge Functions Deployadas

```bash
# Via CLI
npx supabase functions list

# OU via Dashboard
# Acessar: Edge Functions
# Ver lista de funções ativas
```

### 3. ✅ Secrets Configurados

```bash
# Via CLI
npx supabase secrets list

# OU via Dashboard
# Acessar: Project Settings → Edge Functions → Secrets
```

### 4. ✅ Teste Automatizado

```bash
# Testar APIs
npx tsx test-api-connections.ts

# Testar Edge Functions
npx tsx test-edge-functions.ts
```

Se tudo passar com **✅**, deploy completo!

---

## ⏱️ TEMPO ESTIMADO

| Método | Tempo | Complexidade |
|--------|-------|--------------|
| **Lovable (Auto)** | 10-15 min | ⭐ Fácil |
| **Supabase CLI** | 1-2 horas | ⭐⭐⭐ Médio |
| **Dashboard Manual** | 4-6 horas | ⭐⭐⭐⭐⭐ Difícil |

---

## 🚨 SE DER ERRO NO DEPLOY

### Erro: "Database password required"

**Solução:**
1. Acessar: https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/settings/database
2. Copiar a senha ou resetá-la
3. Usar no comando `supabase link`

### Erro: "Migration already applied"

**Solução:**
```bash
# Ver status das migrations
npx supabase migration list

# Se precisar re-aplicar
npx supabase db reset
```

### Erro: "Function deployment failed"

**Solução:**
1. Verificar logs:
   ```bash
   npx supabase functions logs <function-name>
   ```
2. Verificar se todos os secrets estão configurados
3. Verificar sintaxe do código Deno

### Erro: "Secret not found in function"

**Solução:**
```bash
# Listar secrets atuais
npx supabase secrets list

# Adicionar o secret faltante
npx supabase secrets set NOME_DA_CHAVE=valor
```

---

## 📖 DOCUMENTAÇÃO OFICIAL

- Supabase CLI: https://supabase.com/docs/guides/cli
- Edge Functions: https://supabase.com/docs/guides/functions
- Migrations: https://supabase.com/docs/guides/cli/managing-environments
- Lovable: https://docs.lovable.dev/

---

## 🎯 PRÓXIMOS PASSOS APÓS DEPLOY

1. ✅ Verificar que Edge Functions respondem
2. ✅ Testar busca de empresas
3. ✅ Validar enriquecimento 360°
4. ✅ Testar análises com IA
5. ✅ Validar todos os módulos na interface

---

## 📝 RESUMO

**Problema:** Nada foi deployado para produção  
**Solução:** Deploy via Lovable (auto) ou Supabase CLI (manual)  
**Tempo:** 10 min (Lovable) ou 1-2h (CLI)  
**Prioridade:** 🔴 CRÍTICA - Sem isso, plataforma não funciona

**Depois de resolver:** Plataforma fica 100% operacional! 🚀

