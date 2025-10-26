# 🎯 Estratégia de Integração Econodata + APIs Existentes

## 📊 Situação Atual

### Fontes Ativas
1. **ReceitaWS** - Dados cadastrais CNPJ
2. **Apollo.io** - Decisores e contatos B2B
3. **PhantomBuster** - LinkedIn scraping
4. **Hunter.io** - Validação de emails
5. **Serper** - Web search e sinais
6. **OpenAI** - Análises e insights

### Problemas Identificados
- ❌ Muitos campos retornando "NA" mesmo tendo dados disponíveis
- ❌ Risco de sobrescrever dados válidos com vazios
- ❌ Falta de priorização entre fontes
- ❌ Relatórios (Gap Analysis, Insights) não sendo gerados corretamente
- ❌ Enriquecimento 360° chama todas APIs sem estratégia de merge

---

## 🏗️ Arquitetura Proposta: Sistema de Camadas

### Camada 1️⃣: FONTE PRIMÁRIA (Econodata)
**Prioridade MÁXIMA** - Dados oficiais mais completos

**87 campos Econodata:**
- ✅ Sempre prevalece sobre outras fontes
- ✅ Substitui dados vazios/incompletos
- ✅ NUNCA substitui se Econodata retornar vazio e campo atual tiver valor

**Campos cobertos:**
- Cadastrais (CNPJ, Razão Social, Nome Fantasia, etc.)
- Localização completa (endereço, CEP, região, UF)
- Financeiros (faturamento, capital social, receitas)
- Estrutura (funcionários, filiais, matriz)
- Decisores (nomes, cargos, LinkedIn)
- Colaboradores (nomes, cargos, LinkedIn)
- Operacionais (CNAE, atividades, importação/exportação)

---

### Camada 2️⃣: FONTE FEDERAL (ReceitaWS)
**Prioridade ALTA** - Dados oficiais Receita Federal

**Papel:**
- ✅ Fallback para campos cadastrais se Econodata falhar
- ✅ Valida dados básicos (status CNPJ, situação cadastral)
- ✅ Complementa campos que Econodata não trouxe

**Campos específicos:**
- Status CNPJ (ativo/inativo)
- Data abertura
- Natureza jurídica
- Capital social (se Econodata não trouxer)

---

### Camada 3️⃣: FONTES ESPECIALIZADAS (Apollo + PhantomBuster + Hunter)
**Prioridade MÉDIA** - Dados específicos de pessoas e contatos

**Apollo.io:**
- ✅ Enriquece decisores COM EMAILS + telefones
- ✅ Adiciona novos decisores não encontrados pela Econodata
- ✅ Valida cargos e hierarquia

**PhantomBuster:**
- ✅ Scraping LinkedIn para perfis completos
- ✅ Dados de experiência, educação, skills
- ✅ Complementa links de LinkedIn

**Hunter.io:**
- ✅ Valida emails de decisores
- ✅ Busca padrão de emails da empresa

---

### Camada 4️⃣: INTELIGÊNCIA (Serper + OpenAI)
**Prioridade BAIXA** - Análises e insights

**Serper (Google Search):**
- ✅ Notícias e sinais de compra
- ✅ Presença digital
- ✅ Reputação online

**OpenAI:**
- ✅ Análise de Fit TOTVS
- ✅ Gap Analysis (Governança, Maturidade)
- ✅ Insights de venda
- ✅ Sugestões de abordagem

---

## 🔄 Regras de Merge (CRÍTICO)

### Regra de Ouro
```
NUNCA SOBRESCREVER VALOR VÁLIDO COM VAZIO/NULL/NA
```

### Algoritmo de Merge
```typescript
function mergeField(currentValue: any, newValue: any, source: string): any {
  // 1. Se campo atual está vazio, aceita novo valor (mesmo que seja vazio)
  if (isEmptyValue(currentValue)) {
    return newValue;
  }
  
  // 2. Se novo valor é vazio, mantém valor atual
  if (isEmptyValue(newValue)) {
    return currentValue;
  }
  
  // 3. Se ambos têm valor, prioriza por fonte
  if (source === 'econodata') {
    return newValue; // Econodata sempre ganha
  }
  
  // 4. Para outras fontes, mantém o que já existe
  return currentValue;
}

function isEmptyValue(value: any): boolean {
  return value === null 
    || value === undefined 
    || value === '' 
    || value === 'NA' 
    || value === 'N/A'
    || (Array.isArray(value) && value.length === 0);
}
```

---

## 🎨 Interface: Botões de Enriquecimento

### Botão 1: "🌟 Enriquecer com Econodata"
**Novo botão exclusivo - Prioridade 1**

```
Fluxo:
1. Chama API Econodata (87 campos)
2. Merge inteligente com dados existentes
3. Atualiza company.raw_data preservando campos válidos
4. Salva histórico em company_enrichment (source: 'econodata')
5. Toast: "✅ 87 campos Econodata processados"
```

**Quando usar:**
- Primeira vez que adiciona empresa
- Quando quiser atualizar dados oficiais
- Periodicidade: Mensal (dados Econodata são mais estáveis)

---

### Botão 2: "🔄 Enriquecimento 360°"
**Botão existente - Refatorado**

```
Fluxo em cascata:
1. ✅ Econodata (se não rodou ainda ou > 30 dias)
2. ✅ ReceitaWS (fallback cadastral)
3. ✅ Apollo (decisores + emails)
4. ✅ PhantomBuster (LinkedIn scraping)
5. ✅ Hunter (validação emails)
6. ✅ Serper (sinais + notícias)
7. ✅ OpenAI (análises AI: fit, gap, insights)
```

**Cada etapa:**
- Executa em ordem
- Faz merge inteligente
- Loga em company_enrichment
- Continua mesmo se uma falhar

**Quando usar:**
- Enriquecimento completo inicial
- Antes de criar proposta
- Periodicidade: Trimestral

---

### Botão 3: "🔍 Atualizar Sinais"
**Botão leve - Apenas inteligência**

```
Fluxo:
1. Serper (notícias últimas 30 dias)
2. OpenAI (re-análise de fit baseado em dados atuais)
3. Não toca em dados cadastrais
```

**Quando usar:**
- Semanal (sinais de compra mudam rápido)
- Antes de ligar para cliente

---

## 📋 Plano de Implementação (4 Fases)

### ✅ FASE 0: Já Concluída
- [x] Parser CSV Econodata (87 campos)
- [x] Componente `DecisorsCollaboratorsCard` (visual elegante)
- [x] Upload e importação de planilhas

---

### 🔨 FASE 1: API Econodata + Botão Exclusivo (IMEDIATO)
**Tempo estimado: 2-3 horas**

**1.1 - Edge Function `enrich-econodata`**
```typescript
// supabase/functions/enrich-econodata/index.ts
- Recebe: cnpj
- Chama API Econodata (você vai fornecer credenciais)
- Retorna: 87 campos estruturados
- Trata erros e rate limits
```

**1.2 - Merge Inteligente**
```typescript
// src/lib/engines/enrichment/econodataEnricher.ts
- Implementa algoritmo de merge
- Preserva dados válidos
- Loga campos atualizados vs mantidos
```

**1.3 - Botão UI**
```typescript
// src/components/companies/EconodataEnrichButton.tsx
- Botão amarelo/ouro (destaque visual)
- Icon: Sparkles (✨)
- Loading state
- Toast com resumo: "45 campos atualizados, 42 preservados"
```

**1.4 - Integração CompanyDetailPage**
- Adiciona botão ao lado do "Enriquecimento 360°"
- Badge mostrando última atualização Econodata
- Desabilita se já rodou há menos de 7 dias

---

### 🔨 FASE 2: Refatorar Enriquecimento 360° (PRIORITÁRIO)
**Tempo estimado: 4-5 horas**

**2.1 - Engine Unificado**
```typescript
// src/lib/engines/enrichment/orchestrator.ts
- Gerencia ordem de execução
- Implementa cascata com fallbacks
- Merge entre todas fontes
- Tracking de sucesso/falha por fonte
```

**2.2 - Refatorar batch-enrich-360**
```typescript
// supabase/functions/batch-enrich-360/index.ts
- Remove lógica atual
- Usa orchestrator
- Executa em ordem: Econodata → ReceitaWS → Apollo → etc.
- Salva histórico detalhado
```

**2.3 - Status Visual**
```typescript
// src/components/companies/EnrichmentStatusTimeline.tsx
- Timeline mostrando cada fonte
- Status: success, partial, failed
- Última execução
- Campos preenchidos por fonte
```

**2.4 - Correção "NA" Problems**
- Adiciona validação `isEmptyValue()` em TODOS adapters
- Corrige Apollo adapter (muitos NAs detectados)
- Corrige PhantomBuster adapter
- Teste com empresas reais

---

### 🔨 FASE 3: Corrigir Relatórios (CRÍTICO)
**Tempo estimado: 3-4 horas**

**3.1 - Gap Analysis Report**
```typescript
// supabase/functions/analyze-governance-gap/index.ts
- Verificar por que não gera relatório
- Adicionar logs detalhados
- Corrigir prompt OpenAI (se necessário)
- Garantir salvamento em executive_reports
```

**3.2 - Fit TOTVS Report**
```typescript
// supabase/functions/analyze-totvs-fit/index.ts
- Verificar campos obrigatórios
- Corrigir lógica de score
- Melhorar recomendações de produto
```

**3.3 - Insights Proativos**
```typescript
// supabase/functions/ai-contextual-analysis/index.ts
- Corrigir geração de insights
- Usar dados Econodata para enriquecer contexto
- Salvar em insights table
```

**3.4 - Premium Reports**
```typescript
// src/components/reports/PremiumReportRequest.tsx
- Testar geração de PDFs
- Verificar dados sendo enviados
- Corrigir formatação
```

---

### 🔨 FASE 4: Automação Inteligente (OTIMIZAÇÃO)
**Tempo estimado: 2-3 horas**

**4.1 - Auto-Enriquecimento Econodata**
```typescript
// Trigger automático ao adicionar empresa por CNPJ
- Se CNPJ válido → chama Econodata automaticamente
- Usuário vê loading inline
- Botão manual disponível para re-enriquecimento
```

**4.2 - Scheduled Jobs**
```typescript
// Atualização periódica automática
- Econodata: Mensal (dados mudam devagar)
- Sinais: Semanal (notícias/sinais mudam rápido)
- Apollo: Trimestral (pessoas mudam de empresa)
```

**4.3 - Smart Alerts**
```typescript
// Notifica quando:
- Novo decisor detectado
- Mudança de faturamento (Econodata)
- Sinal de compra forte (Serper)
- Empresa mudou de status (ReceitaWS)
```

---

## 📊 Mapeamento de Campos: Quem Preenche O Quê?

### Campos Compartilhados (Merge com prioridade)

| Campo | Econodata | ReceitaWS | Apollo | Decisão |
|-------|-----------|-----------|--------|---------|
| **cnpj** | ✅ Primário | ✅ Valida | - | Econodata ganha |
| **razao_social** | ✅ Primário | ✅ Fallback | - | Econodata ganha |
| **nome_fantasia** | ✅ Primário | ✅ Fallback | - | Econodata ganha |
| **employees** | ✅ Primário | - | ✅ Fallback | Econodata ganha |
| **revenue** | ✅ Primário | - | ✅ Estimado | Econodata ganha |
| **endereco** | ✅ Completo | ✅ Básico | - | Econodata ganha |

### Campos Exclusivos

| Campo | Fonte Única | Tipo |
|-------|-------------|------|
| **decisores_linkedin** | Econodata | Array de URLs |
| **colaboradores_cargos** | Econodata | Array de strings |
| **importador** | Econodata | Boolean |
| **exportador** | Econodata | Boolean |
| **tem_mei** | Econodata | Boolean |
| **decision_makers (tabela)** | Apollo | Tabela separada |
| **linkedin_profiles** | PhantomBuster | Scraping profundo |
| **email_validation** | Hunter | Verificação |
| **buying_signals** | Serper | Notícias/sinais |
| **fit_score** | OpenAI | Análise AI |

---

## 🚦 Status de Implementação

### ✅ Concluído
- [x] Parser CSV Econodata (87 campos)
- [x] Componente visual DecisorsCollaboratorsCard
- [x] Sistema de upload de planilhas

### 🟡 Em Progresso
- [ ] Nenhum (aguardando aprovação do plano)

### ⏳ Pendente
- [ ] FASE 1: API Econodata + Botão exclusivo
- [ ] FASE 2: Refatorar Enriquecimento 360°
- [ ] FASE 3: Corrigir relatórios
- [ ] FASE 4: Automação inteligente

---

## ❓ Perguntas para Prosseguir

### 1. Credenciais Econodata
**Preciso para criar a integração:**
- [ ] URL base da API Econodata
- [ ] API Key / Token de autenticação
- [ ] Documentação da API (endpoints, rate limits)
- [ ] Custo por requisição (para calcular uso)

### 2. Fluxo de Auto-Enriquecimento
**Quando usuário digita CNPJ:**
- ✅ Opção A: Chama Econodata automaticamente (mais rápido, gasta crédito)
- ✅ Opção B: Mostra botão "Buscar com Econodata" (manual, economiza)
- ✅ **SUA RESPOSTA:** "Ambos" - auto + botão manual disponível

### 3. Prioridade de Execução
**Qual fase começar primeiro?**
- Opção A: FASE 1 (Econodata) - Resolve fonte primária
- Opção B: FASE 3 (Relatórios) - Resolve problema urgente de NAs
- **Recomendo:** FASE 1 → FASE 3 → FASE 2 → FASE 4

### 4. Dados Atuais
**O que fazer com empresas já cadastradas?**
- Opção A: Rodar Econodata em batch para todas
- Opção B: Só enriquecer quando usuário clicar manualmente
- Opção C: Enriquecer gradualmente (10 por dia em background)

---

## 💡 Recomendação Final

### Ordem de Execução Sugerida:

**IMEDIATO (Esta semana):**
1. ✅ Você me fornece credenciais Econodata
2. ✅ Implemento FASE 1 completa (API + Botão)
3. ✅ Testamos com 5 empresas reais
4. ✅ Ajustamos parser se necessário

**PRIORITÁRIO (Semana seguinte):**
5. ✅ FASE 3: Corrijo relatórios (Gap, Fit, Insights)
6. ✅ Testo geração de cada relatório
7. ✅ Garanto que OpenAI está recebendo dados corretos

**OTIMIZAÇÃO (Após validação):**
8. ✅ FASE 2: Refatoro Enriquecimento 360° com orchestrator
9. ✅ FASE 4: Automação e jobs agendados

---

## 🎯 Decisão Necessária

**Você concorda com este plano?**

Se sim, responda:
1. ✅ "Concordo, vamos começar pela FASE 1"
2. 📧 Forneça credenciais Econodata (via secrets)
3. 🚀 Eu implemento e testamos juntos

Se não, me diga:
- O que ajustar no plano?
- Qual fase priorizar diferente?
- Alguma preocupação específica?

**Aguardo sua aprovação para prosseguir! 🚀**
