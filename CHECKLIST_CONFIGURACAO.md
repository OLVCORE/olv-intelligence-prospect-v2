# ✅ CHECKLIST DE CONFIGURAÇÃO - STRATEVO V2

## 🎯 OBJETIVO
Conectar e testar TODAS as 24 APIs do projeto via Dashboard (SEM CLI)

---

## 📝 PASSO A PASSO

### ✅ ETAPA 1: CRIAR TABELAS NO SUPABASE

**Tempo estimado:** 2 minutos

1. [ ] Acesse: https://supabase.com/dashboard
2. [ ] Selecione o projeto: **qtcwetabhhkhvomcrqgm**
3. [ ] Clique em: **SQL Editor** (menu lateral esquerdo)
4. [ ] Clique em: **New query**
5. [ ] Abra o arquivo: `GUIA_CONFIGURACAO_COMPLETA_SUPABASE.md`
6. [ ] Copie todo o código SQL da **Seção 1 - PASSO 2**
7. [ ] Cole no SQL Editor
8. [ ] Clique em: **RUN** (botão verde inferior direito)
9. [ ] Verifique a mensagem: **"Success. No rows returned"** ✅

**Resultado esperado:** 6 tabelas criadas (companies, decision_makers, sdr_deals, analysis_runs, api_usage_logs, user_sessions)

---

### ✅ ETAPA 2: CRIAR EDGE FUNCTIONS

**Tempo estimado:** 5 minutos

#### 📌 Função 1: search-companies

1. [ ] No dashboard, clique em: **Edge Functions**
2. [ ] Clique em: **Create a new function**
3. [ ] Nome: `search-companies`
4. [ ] Copie o código da **Função 1** do guia
5. [ ] Cole no editor
6. [ ] Clique em: **Deploy function**

#### 📌 Função 2: analyze-totvs-fit

1. [ ] Clique em: **Create a new function**
2. [ ] Nome: `analyze-totvs-fit`
3. [ ] Copie o código da **Função 2** do guia
4. [ ] Cole no editor
5. [ ] Clique em: **Deploy function**

#### 📌 Função 3: generate-account-strategy

1. [ ] Clique em: **Create a new function**
2. [ ] Nome: `generate-account-strategy`
3. [ ] Copie o código da **Função 3** do guia
4. [ ] Cole no editor
5. [ ] Clique em: **Deploy function**

**Resultado esperado:** 3 funções aparecem na lista de Edge Functions ✅

---

### ✅ ETAPA 3: CONFIGURAR VARIÁVEIS DE AMBIENTE

**Tempo estimado:** 3 minutos

1. [ ] No dashboard, clique em: **Project Settings** (ícone de engrenagem)
2. [ ] Clique em: **Edge Functions**
3. [ ] Role até a seção: **Secrets**
4. [ ] Para cada variável abaixo, clique em **"Add new secret"**:

#### 🔑 Variáveis para adicionar (15 no total):

- [ ] `OPENAI_API_KEY`
- [ ] `APOLLO_API_KEY`
- [ ] `SERPER_API_KEY`
- [ ] `GOOGLE_API_KEY`
- [ ] `GOOGLE_CSE_ID`
- [ ] `YOUTUBE_API_KEY`
- [ ] `RECEITAWS_API_TOKEN`
- [ ] `EMPRESASAQUI_API_KEY`
- [ ] `HUNTER_API_KEY`
- [ ] `PHANTOM_BUSTER_API_KEY`
- [ ] `PHANTOMBUSTER_SESSION_COOKIE`
- [ ] `PHANTOMBUSTER_AGENT_ID`
- [ ] `GITHUB_API_KEY`
- [ ] `STRIPE_API_KEY`
- [ ] `STRATEVOSEARCH_API_KEY`

5. [ ] Clique em: **Save** após adicionar todas

**Resultado esperado:** 15 secrets aparecem na lista ✅

---

### ✅ ETAPA 4: TESTAR AS 24 APIs

**Tempo estimado:** 1 minuto

1. [ ] Volte para o Cursor
2. [ ] Execute o comando:

```bash
npx tsx test-all-24-apis-final.ts
```

3. [ ] Aguarde os resultados

**Resultado esperado:**
```
📊 RESULTADOS FINAIS
═══════════════════════════════════════
✅ OK: 24/24
❌ ERRO: 0/24
⚠️  AVISO: 0/24
```

---

## 🎉 CONCLUSÃO

Se você completou todas as etapas acima, você terá:

- ✅ 6 tabelas operacionais no Supabase
- ✅ 3 Edge Functions deployadas
- ✅ 15 variáveis de ambiente configuradas
- ✅ 24 APIs testadas e conectadas

---

## 🆘 PRECISA DE AJUDA?

Se algum passo não funcionou como esperado:

1. **Anote o passo que falhou**
2. **Copie a mensagem de erro**
3. **Me avise aqui no Cursor**

Vou ajudar a resolver! 🚀

---

## 📊 STATUS ATUAL

**Data:** Aguardando conclusão das etapas acima

**APIs testadas:** 0/24

**Edge Functions:** 0/3

**Tabelas criadas:** 0/6

_(Atualize este status conforme for progredindo)_

