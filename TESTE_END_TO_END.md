# 🧪 TESTE END-TO-END - OLV Intelligence System

## 📋 PLANO DE TESTE COMPLETO

### **Objetivo**
Validar toda a jornada do usuário do login até a geração de relatórios.

---

## ✅ FASE 1 - AUTENTICAÇÃO

### Teste 1.1: Login
- [ ] Abrir /login
- [ ] Inserir credenciais válidas
- [ ] Verificar redirecionamento para /dashboard
- [ ] Verificar session no localStorage

### Teste 1.2: Cadastro
- [ ] Criar nova conta
- [ ] Verificar e-mail de confirmação (se aplicável)
- [ ] Login com nova conta

**Status**: ✅ IMPLEMENTADO

---

## ✅ FASE 2 - BUSCA DE EMPRESA

### Teste 2.1: Busca por CNPJ
- [ ] Navegar para /search
- [ ] Inserir CNPJ válido: `18.627.195/0001-60`
- [ ] Clicar em "Buscar Empresa"
- [ ] Verificar loading state
- [ ] Verificar dados retornados:
  - Nome da empresa
  - CNPJ formatado
  - Website
  - Setor/Indústria
  - Número de funcionários

**Dados Esperados** (ReceitaWS):
```json
{
  "name": "MASTER INDUSTRIA E COMERCIO LTDA",
  "cnpj": "18.627.195/0001-60",
  "industry": "Fabricação de canetas, lápis e outros artigos"
}
```

**Status**: ✅ FUNCIONAL
**Evidências**: 2 empresas cadastradas com sucesso no banco

### Teste 2.2: Busca por Nome
- [ ] Inserir nome: "Magazine Luiza"
- [ ] Verificar retorno de dados
- [ ] Validar informações cadastrais

**Status**: 🟡 NÃO TESTADO

---

## ⚠️ FASE 3 - DECISORES (PROBLEMA IDENTIFICADO)

### Teste 3.1: Enriquecimento de Decisores
- [ ] Após busca de empresa, verificar seção "Decisores Encontrados"
- [ ] Validar que Apollo.io retorna dados
- [ ] Verificar campos:
  - Nome completo
  - Cargo (title)
  - E-mail
  - LinkedIn URL
  - Department
  - Seniority

**Status Atual**: ❌ **FALHA**
**Problema**: Apollo.io não está retornando decisores (0 registros na tabela `decision_makers`)

**Possíveis Causas**:
1. API key inválida ou sem quota
2. Filtros muito restritivos na query
3. Timeout na chamada
4. Empresa não existe na base Apollo

**Ação Corretiva**: Investigar logs e testar API Apollo manualmente

---

## ✅ FASE 4 - MATURIDADE DIGITAL

### Teste 4.1: Análise de Maturidade
- [ ] Verificar que o score é calculado automaticamente
- [ ] Validar sub-scores:
  - Infrastructure (8.0)
  - Systems (3.0 ou 7.0)
  - Processes (7.0)
  - Security (N/A)
  - Innovation (N/A)
- [ ] Verificar overall_score (5.8 ou 6.6)

**Status**: ✅ FUNCIONAL
**Evidências**:
- MASTER INDUSTRIA: Overall 5.8 (infra:8, systems:3, processes:7)
- OLV INTERNACIONAL: Overall 6.6 (infra:8, systems:7, processes:7)

---

## 🔴 FASE 5 - SINAIS DE COMPRA (NÃO IMPLEMENTADO)

### Teste 5.1: Detecção de Buying Signals
- [ ] Verificar se sinais de compra são gerados
- [ ] Validar tipos de sinais:
  - Contratações recentes
  - Expansão de equipe
  - Notícias sobre investimentos
  - Mudanças tecnológicas

**Status**: ❌ **NÃO FUNCIONAL**
**Evidências**: 0 registros na tabela `buying_signals`

**Ação Corretiva**: Implementar lógica de detecção de sinais

---

## 🟡 FASE 6 - FIT TOTVS (IMPLEMENTADO MAS NÃO TESTADO)

### Teste 6.1: Análise de Fit
- [ ] Navegar para /fit-totvs
- [ ] Selecionar empresa
- [ ] Clicar em "Analisar Fit"
- [ ] Verificar recomendações de produtos TOTVS
- [ ] Validar score de aderência

**Status**: 🟡 IMPLEMENTADO (Edge Function existe) mas NÃO TESTADO

---

## 🔴 FASE 7 - CANVAS COLABORATIVO (NÃO IMPLEMENTADO)

### Teste 7.1: Criação de Canvas
- [ ] Navegar para /canvas
- [ ] Verificar erro 404

**Status**: ❌ **NÃO IMPLEMENTADO**

**Requisitos**:
- Editor em tempo real (Supabase Realtime)
- Autosave a cada 2s
- Comentários e marcações
- Integração com dados das empresas
- Comandos de IA

---

## 🔴 FASE 8 - PROCESSAMENTO EM MASSA (NÃO IMPLEMENTADO)

### Teste 8.1: Upload CSV
- [ ] Upload arquivo CSV com 10 empresas
- [ ] Verificar progresso
- [ ] Validar processamento em lotes

**Status**: ❌ **NÃO IMPLEMENTADO**

---

## 📊 SUMÁRIO EXECUTIVO

### **Funcionalidades Operacionais** ✅
- Autenticação
- Busca de empresas (ReceitaWS)
- Análise de maturidade digital
- Persistência de dados

### **Funcionalidades com Falhas** ⚠️
- Enriquecimento de decisores (Apollo.io)
- Sinais de compra (não implementado)
- Fit TOTVS (não testado)

### **Funcionalidades Ausentes** ❌
- Canvas Colaborativo
- Processamento em massa (CSV)

---

## 🎯 PRÓXIMOS PASSOS

### **Prioridade 1 - CRÍTICO** 🔥
1. ✅ Diagnosticar problema Apollo.io
2. ✅ Testar Edge Function `enrich-email`
3. ✅ Testar Edge Function `linkedin-scrape`
4. ✅ Testar Edge Function `analyze-totvs-fit`

### **Prioridade 2 - ALTO** 🟠
5. Implementar Canvas Colaborativo
6. Adicionar detecção de Buying Signals

### **Prioridade 3 - MÉDIO** 🟡
7. Implementar upload CSV
8. Processamento em massa (lotes de 50)

---

## 🔧 COMANDOS DE TESTE

### Teste Manual da Edge Function `search-companies`
```bash
curl -X POST https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/search-companies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cnpj":"18.627.195/0001-60"}'
```

### Verificar Logs no Supabase
```sql
SELECT * FROM search_history ORDER BY created_at DESC LIMIT 10;
SELECT * FROM companies ORDER BY created_at DESC LIMIT 5;
SELECT * FROM decision_makers ORDER BY created_at DESC LIMIT 10;
```

---

## 📝 LOG DE EXECUÇÃO

### 2025-10-21 00:44 UTC
- ✅ Analisado banco de dados
- ✅ Identificadas 2 empresas cadastradas
- ✅ Confirmada análise de maturidade funcionando
- ❌ Identificado problema: 0 decisores encontrados
- ❌ Identificado gap: 0 sinais de compra
- 🔄 Iniciando diagnóstico Apollo.io

---

*Documento vivo - atualizado conforme testes são executados*
