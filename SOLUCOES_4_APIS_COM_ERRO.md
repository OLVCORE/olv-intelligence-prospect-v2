# 🔧 SOLUÇÕES PARA AS 4 APIs COM ERRO

## 📊 SITUAÇÃO ATUAL

- ❌ **Supabase Edge Functions** → SOLUÇÃO: Deploy manual (veja COMO_DEPLOYAR_EDGE_FUNCTIONS.md)
- ❌ **Google Custom Search** → SOLUÇÃO: Habilitar API (2 minutos)
- ❌ **EmpresasAqui** → SOLUÇÃO: Verificar endpoint (5 minutos)
- ❌ **Stripe** → SOLUÇÃO: Nova API key (3 minutos)

---

## 1️⃣ GOOGLE CUSTOM SEARCH ⚠️ **PRIORIDADE MÉDIA**

### ❌ Erro Atual
```
"Requests to this API customsearch method google.customsearch.v1.CustomSearchService.List are blocked."
```

### ✅ Solução (2 minutos)

#### Passo 1: Acessar Google Cloud Console
👉 https://console.cloud.google.com/apis/library/customsearch.googleapis.com

#### Passo 2: Habilitar a API
1. Se não estiver logado, faça login com sua conta Google
2. Selecione o projeto que contém a API key: `AIzaSyB-s1HVlZL92f8oVz_3DtJVAkMul0Tua8E`
3. Clique em **"ENABLE"** (Habilitar)
4. Aguarde 2-3 minutos para propagação

#### Passo 3: Testar
```bash
npx tsx test-all-24-apis-final.ts
```

### 📊 Resultado Esperado
```
✅ 7. Google Custom Search
   API conectada
```

---

## 2️⃣ EMPRESASAQUI 🟢 **PRIORIDADE BAIXA**

### ❌ Erro Atual
```
"fetch failed"
```

### ✅ Solução (5 minutos)

#### Opção A: Testar Endpoint Manualmente

Abra o navegador ou use curl:

```bash
curl "https://api.empresasaqui.com/v1/empresa/27865757000102?token=a8725d0dbeda67cb9b5b7925734b451ea1aac13f"
```

Se retornar erro 404 ou 401:
- ❌ API key pode estar inválida
- ❌ Endpoint pode estar incorreto

#### Opção B: Gerar Nova API Key

1. Acesse: https://empresasaqui.com/api
2. Faça login ou crie conta
3. Gere nova API key
4. Substitua no `.env.local`:

```env
VITE_EMPRESASAQUI_API_KEY=sua_nova_chave_aqui
```

5. Reinicie o servidor dev

#### Opção C: Usar Alternativa (ReceitaWS já funciona!)

A ReceitaWS já está funcionando e oferece os mesmos dados:

```typescript
// Já funciona perfeitamente!
const response = await fetch('https://www.receitaws.com.br/v1/cnpj/27865757000102');
```

**Recomendação:** Use ReceitaWS como principal e EmpresasAqui como backup.

---

## 3️⃣ STRIPE 🟢 **PRIORIDADE BAIXA**

### ❌ Erro Atual
```
HTTP 401 - Unauthorized
```

### ✅ Solução (3 minutos)

#### Problema Identificado

A chave atual começa com `sk-user-`, que não é o formato padrão do Stripe.

Formatos válidos:
- **Test keys:** `sk_test_...`
- **Live keys:** `sk_live_...`

#### Passo 1: Gerar Nova API Key

👉 https://dashboard.stripe.com/apikeys

1. Faça login no Stripe
2. Vá em **Developers** > **API Keys**
3. Clique em **"Create secret key"** ou **"Reveal test key"**
4. Copie a chave que começa com `sk_test_` ou `sk_live_`

#### Passo 2: Atualizar .env.local

```env
VITE_STRIPE_API_KEY=sk_test_sua_nova_chave_aqui
```

#### Passo 3: Reiniciar Servidor

```bash
# Se estiver rodando npm run dev, pressione Ctrl+C e execute novamente:
npm run dev
```

#### Passo 4: Testar

```bash
npx tsx test-all-24-apis-final.ts
```

### 📊 Resultado Esperado
```
✅ 16. Stripe
   API conectada
```

---

## 🎯 PLANO DE AÇÃO RECOMENDADO

### 🔥 AGORA (Alta Prioridade)

1. **Deploy Edge Functions** (resolve 8 APIs de uma vez!)
   - Siga: `COMO_DEPLOYAR_EDGE_FUNCTIONS.md`
   - Impacto: ✅ 21/24 → 87.5%

### ⚡ HOJE (Média Prioridade)

2. **Habilitar Google Custom Search** (2 minutos)
   - Impacto: ✅ 22/24 → 91.7%

### 📅 ESTA SEMANA (Baixa Prioridade)

3. **EmpresasAqui** - Investigar ou usar alternativa
   - ReceitaWS já funciona perfeitamente
   - Impacto mínimo se deixar como está

4. **Stripe** - Gerar nova key
   - Necessário apenas quando implementar pagamentos
   - Pode aguardar MVP

---

## 📊 RESULTADO FINAL POSSÍVEL

Se resolver APENAS os itens 1 e 2:

```
✅ 22/24 APIs FUNCIONANDO (91.7%)
❌ 2/24 APIs com erro (8.3%)
```

**Isso é EXCELENTE para produção!** 🎉

---

## 🆘 PRECISA DE AJUDA?

Me avise aqui no Cursor se:
- ❓ Tiver dúvida em algum passo
- ❌ Encontrar erro ao executar
- 🔧 Precisar de ajuda técnica

Estou aqui para ajudar! 🚀

