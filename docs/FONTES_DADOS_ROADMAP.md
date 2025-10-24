# 📊 Fontes de Dados e Roadmap SaaS

## 🎯 Visão Geral Estratégica

Este documento detalha todas as fontes de dados, APIs utilizadas, e o roadmap para transformar a plataforma em SaaS.

### 💎 **MERCADO ALVO: PMEs de Capital Fechado (99.9% do mercado)**

**Por que PMEs são a verdadeira oportunidade:**
- 🏆 **6.5+ milhões de empresas** no Brasil (vs. 400 de capital aberto)
- ❌ **95% sem governança** adequada
- ❌ **90% sem compliance** estruturado
- ❌ **80% usa Excel** como principal ferramenta de gestão
- ✅ **FIT PERFEITO** para consultoria + TOTVS (Protheus, Fluig, RM, BI)

**Estratégia:**
1. **Enriquecimento 360°** → Identificar dores e gaps
2. **Score de Maturidade** → Quantificar necessidade de governança
3. **Consultoria Estratégica** → Não vender software, vender transformação
4. **Produtos TOTVS** → Solução completa para estruturar a empresa

**Diferencial competitivo:**
- Não somos apenas "vendedores de software"
- Somos **parceiros de transformação digital e governança**
- Identificamos empresas que **PRECISAM** se estruturar (não as que já estão estruturadas)

---

## 📡 **1. DADOS CADASTRAIS (✅ REAL - API GRATUITA)**

### ReceitaWS
- **Status**: ✅ Implementado e Ativo
- **Tipo**: API Pública Gratuita
- **URL**: https://receitaws.com.br
- **Endpoint**: `/v1/cnpj/{cnpj}`
- **Função**: `supabase/functions/enrich-receitaws/index.ts`
- **Dados retornados**:
  - Nome empresarial e fantasia
  - CNPJ, tipo (matriz/filial), porte
  - Atividade principal e secundárias
  - Natureza jurídica
  - Endereço completo (logradouro, número, CEP, bairro, município, UF)
  - Email e telefone
  - Situação cadastral e data
  - Capital social
  - QSA (Quadro de Sócios e Administradores)
  - Simples Nacional e MEI

**Limitações**: 
- 3 requisições/minuto
- Dados podem estar desatualizados (depende da Receita Federal)

---

## 💰 **2. DADOS FINANCEIROS (⚠️ ESTIMADOS - SEM API REAL)**

### Situação Atual
- **Status**: ⚠️ Estimativas baseadas em heurísticas
- **Função**: `supabase/functions/enrich-financial/index.ts`
- **Adapter**: `src/lib/adapters/financial/creditScore.ts`

### Como Funciona Hoje (Estimativas)
Calcula scores baseados em:
1. **Número de funcionários** (maior = melhor score)
2. **Anos de atividade** (mais antigo = melhor score)
3. **Indústria/setor** (alguns setores têm mais risco)
4. **Situação cadastral** (ativa vs inativa)

### Dados Gerados (Estimados)
- ✅ Credit Score (300-950)
- ✅ Risk Classification (A, B, C, D, E)
- ✅ Payment History (estimado)
- ✅ Debt Indicators (estimado)
- ⚠️ Serasa Data (mock)
- ⚠️ SCPC Data (mock)

### 🚀 Roadmap - APIs Reais Necessárias

#### Serasa Experian (PAGA)
- **Website**: https://www.serasaexperian.com.br/
- **Produtos**:
  - Serasa Score Empresarial
  - Consulta de Negativações
  - Histórico de Pagamentos
  - Score Preditivo
- **Custo Estimado**: R$ 50-200 por consulta (depende do pacote)

#### SCPC (Serviço Central de Proteção ao Crédito) (PAGA)
- **Website**: https://www.boavistaservicos.com.br/
- **Dados**:
  - Pendências financeiras
  - Cheques sem fundo
  - Protestos
  - Ações judiciais
- **Custo Estimado**: R$ 30-150 por consulta

#### Open Banking Brasil (GRATUITA - futuro)
- **Website**: https://openbankingbrasil.org.br/
- **Status**: Em expansão
- **Dados**: Contas, transações, investimentos (com consentimento)

---

## ⚖️ **3. DADOS JURÍDICOS (⚠️ ESTIMADOS - SEM API REAL)**

### Situação Atual
- **Status**: ⚠️ Estimativas baseadas em heurísticas
- **Função**: `supabase/functions/enrich-legal/index.ts`
- **Adapter**: `src/lib/adapters/legal/jusbrasil.ts`

### Como Funciona Hoje (Estimativas)
Estima processos baseados em:
1. **Número de funcionários** (maior = mais processos)
2. **Setor de risco** (construção, industrial, transporte = mais processos)
3. **Anos de atividade** (mais tempo = mais processos)

### Dados Gerados (Estimados)
- ✅ Total de processos (estimado)
- ✅ Processos ativos (estimado)
- ✅ Distribuição por tipo (trabalhista, cível, tributário, criminal)
- ✅ Risk Level (baixo, médio, alto, crítico)
- ✅ Legal Health Score (0-100)
- ⚠️ Processos detalhados (mock)

### 🚀 Roadmap - APIs Reais Necessárias

#### JusBrasil API (PAGA)
- **Website**: https://www.jusbrasil.com.br/
- **Produto**: JusBrasil API para empresas
- **Dados**:
  - Processos judiciais em todos os tribunais do Brasil
  - Movimentações processuais em tempo real
  - Histórico completo
  - Classificação por tipo e status
- **Custo Estimado**: R$ 500-2000/mês (depende do volume)

#### CEIS - Cadastro de Empresas Inidôneas e Suspensas (GRATUITA)
- **Website**: https://www.portaltransparencia.gov.br/
- **API**: Portal da Transparência
- **Endpoint**: `/api-de-dados/ceis`
- **Dados**: Empresas punidas por órgãos públicos
- **Status**: ✅ API pública e gratuita (NÃO implementada ainda)

#### CNEP - Cadastro Nacional de Empresas Punidas (GRATUITA)
- **Website**: https://www.portaltransparencia.gov.br/
- **API**: Portal da Transparência
- **Endpoint**: `/api-de-dados/cnep`
- **Dados**: Empresas punidas com base na Lei Anticorrupção
- **Status**: ✅ API pública e gratuita (NÃO implementada ainda)

---

## 👥 **4. DECISORES E CONTATOS (✅ REAL - API PAGA)**

### Apollo.io
- **Status**: ✅ Implementado
- **Tipo**: API Paga (requer APOLLO_API_KEY)
- **Função**: `supabase/functions/enrich-apollo/index.ts`
- **Adapter**: `src/lib/adapters/people/apollo.ts`
- **Dados retornados**:
  - Nome, cargo, senioridade
  - Email verificado
  - LinkedIn URL
  - Departamento
  - Telefone
- **Custo**: Depende do plano (requer API key do usuário)

### PhantomBuster (LinkedIn) (NÃO ATIVO)
- **Status**: ⚠️ Código existe mas não está sendo usado
- **Função**: `supabase/functions/linkedin-scrape/index.ts`
- **Adapter**: `src/lib/adapters/social/linkedinCompany.ts`
- **Por que não está ativo**: Atualmente usando Google Search para encontrar LinkedIn
- **Dados que PODERIA retornar**:
  - Perfil completo da empresa
  - Posts e engajamento
  - Followers, funcionários no LinkedIn
  - Especialidades
- **Custo**: US$ 30-150/mês

---

## 🔍 **5. BUSCA E PRESENÇA DIGITAL (✅ REAL - API GRATUITA)**

### Google Custom Search API
- **Status**: ✅ Implementado
- **Tipo**: API Paga/Gratuita (100 buscas/dia grátis)
- **Função**: `supabase/functions/google-search/index.ts`
- **Adapter**: `src/lib/adapters/search/googleCustomSearch.ts`
- **Uso**:
  - Buscar presença no LinkedIn
  - Detectar tech stack
  - Encontrar website
  - Buscar notícias

---

## 🤖 **6. INTELIGÊNCIA ARTIFICIAL (✅ REAL - LOVABLE AI)**

### Lovable AI Gateway
- **Status**: ✅ Implementado e Ativo
- **Tipo**: Gateway AI (Gemini + GPT)
- **URL**: https://ai.gateway.lovable.dev
- **Modelos Disponíveis**:
  - `google/gemini-2.5-flash` (padrão) ✅
  - `google/gemini-2.5-pro`
  - `openai/gpt-5`
- **Uso Atual**:
  - Gerar insights de vendas
  - Criar pitches personalizados
  - Análise de Fit TOTVS
  - Análise contextual
- **Custo**: Cobrado por token (modelo freemium)

---

## 📊 **7. SCORE FIT TOTVS (✅ REAL - IA)**

### O que é o Score?
O **Score Fit TOTVS** (0-100) mede a **propensão e aderência** da empresa aos produtos TOTVS.

### Como é Calculado
**Função**: `supabase/functions/analyze-totvs-fit/index.ts`

A IA analisa:
1. ✅ **Maturidade Digital** (infrastructure, systems, processes, security, innovation)
2. ✅ **Tecnologias Atuais** (gaps e oportunidades)
3. ✅ **Número de Funcionários** (porte da empresa)
4. ✅ **Indústria/Setor** (necessidades específicas)
5. ✅ **Processos Identificados** (grau de estruturação)

### O que o Score Significa
- **90-100**: Fit EXCELENTE - Empresa ideal para TOTVS, múltiplos produtos aplicáveis
- **75-89**: Fit ALTO - Boa aderência, alguns produtos muito indicados
- **60-74**: Fit MÉDIO - Empresa pode se beneficiar, mas precisa maturar
- **0-59**: Fit BAIXO - Empresa ainda não está pronta ou não tem necessidade

### Exemplo: OLV com Score 92
A IA identificou:
- ✅ Empresa ativa, sem processos jurídicos
- ✅ Boa estrutura digital
- ✅ Tecnologias modernas detectadas
- ✅ Porte adequado para produtos TOTVS
- ✅ Setor com necessidades claras de ERP/CRM
- ✅ Gaps que produtos TOTVS resolveriam

**Recomendações típicas para Score 92**:
- TOTVS Protheus (ERP)
- Fluig (Gestão de Processos)
- TOTVS BI (Analytics)
- Carol AI (se maturidade alta)

---

## 🗺️ **ROADMAP PARA SAAS**

### 📌 FASE 1: PMEs - Score de Governança (🏆 PRIORIDADE MÁXIMA)
**Custo**: R$ 0/mês (só IA + dados públicos)

**Objetivo**: Identificar PMEs que PRECISAM se estruturar (não as que já estão)

**Métricas de Falta de Governança:**
- [ ] **Score de Compliance**: Detectar riscos fiscais/trabalhistas
- [ ] **Score de Processos**: Identificar operação manual vs. automatizada
- [ ] **Score de Controles**: Avaliar ausência de KPIs e dashboards
- [ ] **Score de Integração**: Detectar silos de informação (Excel, WhatsApp)
- [ ] **Score de Risco Operacional**: Quantificar exposição por falta de estrutura

**Como Detectar:**
```typescript
{
  "sinais_de_falta_de_governanca": [
    "❌ Sem site estruturado ou site desatualizado",
    "❌ Presença digital fraca (LinkedIn sem posts, sem engajamento)",
    "❌ Processos trabalhistas acima da média do setor",
    "❌ Cadastro desatualizado na Receita Federal",
    "❌ Ausência de tech stack moderno detectado",
    "❌ Email genérico (contato@empresa.com) sem domínio próprio",
    "❌ Ausência de decisores no LinkedIn (gestão informal)"
  ],
  "score_necessidade_estruturacao": 85, // Quanto MAIOR, maior a necessidade
  "produtos_totvs_recomendados": [
    "Protheus (ERP): Estruturar operação e controles",
    "Fluig (BPM): Implantar governança e compliance",
    "RM (RH): Profissionalizar gestão de pessoas"
  ],
  "angulo_consultoria": "Sua empresa está crescendo, mas a gestão ainda é informal. Isso gera riscos e limita o crescimento. Vamos estruturar juntos?"
}
```

**Impacto**: 
- 🎯 Identificar 6.5M+ PMEs que PRECISAM de estruturação
- 💰 Ticket médio R$ 50k-500k (consultoria + TOTVS)
- 🤝 Posicionamento como parceiro estratégico (não fornecedor)

---

### 📌 FASE 1b: APIs GRATUITAS (Complemento)
**Custo**: R$ 0/mês

- [ ] Integrar CEIS (empresas inidôneas)
- [ ] Integrar CNEP (empresas punidas)
- [ ] Otimizar Google Search (100 buscas/dia grátis)
- [ ] Adicionar mais fontes públicas de dados governamentais

**Impacto**: Dados jurídicos mais precisos sem custo

---

### 📌 FASE 2: LINKEDIN REAL (❌ CANCELADA - LIMITAÇÃO TÉCNICA)
**Custo**: US$ 30-150/mês

- [x] ~~Ativar PhantomBuster para LinkedIn~~ **NÃO POSSÍVEL**
- [x] PhantomBuster não pode ser utilizado por limitações de API
- [ ] Alternativa: Continuar usando Google Search + LinkedIn público
- [ ] Avaliar outras fontes de dados sociais (APIs públicas do LinkedIn)

**Status**: Google Search continua sendo usado para detectar presença no LinkedIn

---

### 📌 FASE 3: DADOS FINANCEIROS REAIS (Prioridade ALTA - MVP)
**Custo por consulta**:
- 💰 **Serasa Experian**: R$ 50-200/consulta (recomendado para MVP)
- 💰 **SCPC/Boa Vista**: R$ 30-150/consulta

**Estratégia para MVP**:
- [ ] Integrar **Serasa Experian API** (mais completa e confiável)
- [ ] Verificar se existe **trial gratuito** ou créditos iniciais
- [ ] Implementar **sistema de créditos** para usuário decidir se quer consulta paga
- [ ] Mostrar **custo estimado por consulta** antes de confirmar
- [ ] Implementar cache agressivo (evitar reconsultas desnecessárias)
- [ ] Permitir usuário comprar créditos ou pagar por consulta individual

**Trial Gratuito**: 
- Serasa oferece sandbox de testes (verificar no contato comercial)
- Alguns planos têm créditos iniciais gratuitos

**Impacto**: Scores financeiros 100% reais, confiabilidade máxima para decisões de crédito

---

### 📌 FASE 4: DADOS JURÍDICOS REAIS (Prioridade ALTA)
**Custo**: R$ 500-2000/mês

- [ ] Integrar JusBrasil API
- [ ] Monitorar processos em tempo real
- [ ] Alertas de novos processos
- [ ] Histórico completo de movimentações

**Impacto**: Due diligence jurídica completa e automatizada

---

### 📌 FASE 5: EMPRESAS DE CAPITAL ABERTO (⭐ ALTA PRIORIDADE MVP)
**Custo**: GRATUITO + IA (100% dados públicos)

Esta é uma **oportunidade de ouro** para criar análises ultra-precisas com dados públicos obrigatórios.

#### Fontes de Dados Públicos (Brasil)

**1. CVM - Comissão de Valores Mobiliários** (🆓 GRATUITO)
- [ ] **API CVM - Dados Abertos**: https://dados.cvm.gov.br/
- [ ] **DFP/ITR**: Demonstrações financeiras auditadas
- [ ] **Formulário de Referência**: Governança, diretoria, remuneração
- [ ] **Fatos Relevantes**: Alertas em tempo real
- [ ] **Atas de Assembleia**: Decisões estratégicas
- **Endpoint**: `/dados/CIA_ABERTA/DOC/` (JSON/XML)

**2. B3 - Bolsa de Valores** (🆓 GRATUITO)
- [ ] **Cotações e indicadores financeiros** em tempo real
- [ ] **Relatórios de governança corporativa**
- [ ] **Composição acionária**
- **API**: https://www.b3.com.br/data/files/

**3. Portal da Transparência** (🆓 GRATUITO)
- [ ] **Contratos governamentais**
- [ ] **CNEP/CEIS**: Empresas punidas
- [ ] **Convênios e repasses**

#### O que Extrair dos Dados CVM

**A. Decisores (100% Público)**
```json
{
  "decisor": {
    "nome_completo": "João da Silva",
    "cpf": "xxx.xxx.xxx-xx",
    "cargo": "Diretor Presidente (CEO)",
    "remuneracao_anual": "R$ 2.5M - R$ 3M",
    "tempo_cargo": "3 anos",
    "formacao": "Engenharia + MBA",
    "experiencia_anterior": ["CFO na XYZ Corp", "VP na ABC Ltd"]
  }
}
```

**B. Saúde Financeira (Dados Reais)**
```json
{
  "financeiro": {
    "receita_liquida": 1500000000,
    "ebitda": 350000000,
    "lucro_liquido": 180000000,
    "margem_liquida": 12.0,
    "divida_liquida": 450000000,
    "fluxo_caixa_operacional": 280000000
  }
}
```

**C. Sinais de Compra (Fatos Relevantes)**
```json
{
  "sinais": [
    "Aprovação de CAPEX R$ 50M em TI",
    "Contratação de novo CTO",
    "Expansão para 5 novos estados",
    "Investimento em transformação digital"
  ]
}
```

#### Como Enriquecer com IA

**1. Análise de Documentos CVM** (Lovable AI + OCR)
- [ ] Extrair texto de PDFs (DFP, Formulário de Referência)
- [ ] Usar **gemini-2.5-pro** para análise de documentos longos
- [ ] Identificar mudanças estratégicas, investimentos em TI, expansão
- [ ] Detectar sinais de compra em narrativas da administração

**2. Cross-Reference Decisores**
- [ ] Nome do decisor no CVM → buscar no LinkedIn
- [ ] Buscar entrevistas, artigos, menções na mídia
- [ ] Traçar histórico profissional
- [ ] Detectar mudanças recentes (novo CEO = oportunidade)

**3. Scoring Avançado**
```typescript
{
  "fit_score": 95,  // Muito mais preciso com dados reais
  "razoes": [
    "Receita líquida R$ 1.5B (empresa grande)",
    "CAPEX aprovado de R$ 50M em TI (sinal de compra)",
    "Novo CTO contratado há 3 meses (momento ideal)",
    "Margem EBITDA 23% (capacidade de investimento)",
    "CEO com histórico de transformação digital"
  ]
}
```

#### Implementação Técnica

**Edge Function: `enrich-public-company`**
```typescript
// 1. Detectar se é empresa de capital aberto (B3)
// 2. Buscar dados CVM via API pública
// 3. Extrair PDFs e analisar com Gemini Pro
// 4. Cross-reference decisores no LinkedIn
// 5. Buscar fatos relevantes e notícias
// 6. Gerar score ultra-preciso
```

**Custo**: ZERO (tudo é API pública + Lovable AI)

---

### 📌 FASE 6: EXPANSÃO E ESCALA
**Custo**: Variável

- [ ] Open Banking (dados financeiros com consentimento)
- [ ] Reclame Aqui API (reputação)
- [ ] Google Analytics API (tráfego web)
- [ ] Integração com CRMs (Salesforce, HubSpot, Pipedrive)
- [ ] Webhook system para clientes
- [ ] Multi-tenant completo

---

## 💰 **CUSTOS ESTIMADOS MENSAIS (SaaS)**

### Plano Básico (até 100 empresas/mês)
- ReceitaWS: Gratuito
- Google Search: Gratuito (100/dia)
- CEIS/CNEP: Gratuito
- Lovable AI: ~R$ 200/mês
- **Total**: ~R$ 200/mês

### Plano Profissional (até 500 empresas/mês)
- Básico: R$ 200
- PhantomBuster: R$ 300/mês
- Serasa (200 consultas): R$ 10.000/mês
- JusBrasil: R$ 1.500/mês
- **Total**: ~R$ 12.000/mês

### Plano Enterprise (ilimitado)
- Profissional: R$ 12.000
- Serasa (volume): R$ 30.000/mês
- JusBrasil (volume): R$ 5.000/mês
- Infraestrutura: R$ 3.000/mês
- **Total**: ~R$ 50.000/mês

---

## 🎯 **PRÓXIMOS PASSOS IMEDIATOS - MVP**

### 🏆 **PRIORIDADE ABSOLUTA: PMEs de Capital Fechado (99.9% do mercado)**

**Estratégia Revisada:**
- **Capital Aberto**: Quick win interessante, mas são apenas 400 empresas (0.01%)
- **PMEs**: 6.5M+ empresas que PRECISAM de governança e estruturação

### ⭐ Prioridade 1 - Enriquecimento PMEs (FOCO PRINCIPAL)
1. [ ] **🎯 Score de Governança e Maturidade Organizacional**
   - Detectar falta de processos estruturados
   - Identificar uso de planilhas Excel
   - Avaliar compliance fiscal/trabalhista
   - Medir maturidade digital (infraestrutura, sistemas)
   - **Output**: "Esta empresa PRECISA se estruturar" (não "está estruturada")

2. [ ] **📊 Análise de Gaps e Oportunidades**
   - Mapear onde faltam controles
   - Identificar processos manuais
   - Detectar falta de integração entre sistemas
   - Quantificar risco de não-conformidade

3. [ ] **🤝 Pitch de Consultoria + Tecnologia**
   - Não vender "software"
   - Vender "transformação organizacional"
   - Posicionar TOTVS como solução completa:
     - Protheus (ERP): Estruturar operação
     - Fluig (BPM): Governança e compliance
     - RM (RH): Gestão de pessoas
     - BI/Analytics: Inteligência gerencial

4. [ ] **💰 Sistema de Créditos para APIs Pagas**
   - Serasa/SCPC: R$ 50-200/consulta (financeiro)
   - JusBrasil: R$ 500-2000/mês (jurídico)
   - Usuário decide quando vale a pena pagar
   - Cache agressivo (evitar reconsultas)

### 🚀 Prioridade 2 - Capital Aberto (Quick Win, mas mercado pequeno)
5. [ ] **📈 Enriquecimento Capital Aberto (CVM/B3)**
   - API CVM gratuita
   - Análise de documentos com Gemini Pro
   - **Mercado**: Apenas 400 empresas
   - **Uso**: Showcase, cases de sucesso, benchmark

### Prioridade 1 (Gratuitas)
2. [ ] **Ativar CEIS e CNEP** (APIs gratuitas do governo)
3. [ ] **Melhorar scores estimados** (enquanto não tem APIs pagas)

### Prioridade 2 (MVP SaaS)
4. [ ] **Negociar Serasa Experian** (verificar trial gratuito)
   - Contato comercial para planos e custos exatos
   - Verificar sandbox de desenvolvimento
   - Avaliar créditos iniciais gratuitos

5. [ ] **Sistema de Créditos e Consultas Pagas**
   - Implementar wallet de créditos do usuário
   - Mostrar custo antes de cada consulta paga (Serasa, JusBrasil)
   - Permitir compra de pacotes de créditos
   - Interface para usuário aprovar consultas pagas

6. [ ] **Negociar JusBrasil** (dados jurídicos reais)
   - Verificar planos e custos
   - Avaliar período de testes

### Bloqueadores Técnicos
- ❌ **PhantomBuster**: Não pode ser usado
- ⚠️ **LinkedIn direto**: Usar apenas Google Search público

---

## 💎 **VANTAGEM COMPETITIVA: Capital Aberto**

**Por que isso é revolucionário:**

1. **100% Dados Públicos e Gratuitos** 
   - CVM, B3, Portal da Transparência
   - Sem custo de APIs pagas

2. **Decisores Rastreáveis**
   - Nome completo, CPF, cargo, remuneração
   - Cross-reference com LinkedIn, Google News
   - Histórico de decisões documentado

3. **Sinais de Compra em Tempo Real**
   - Fatos relevantes CVM (investimentos, expansão)
   - Mudanças de diretoria (novo CTO/CEO)
   - CAPEX aprovado em TI/Digital

4. **Análise de Documentos com IA**
   - Gemini Pro analisa PDFs de 100+ páginas
   - Extrai insights de narrativas da administração
   - Detecta padrões de investimento em tecnologia

5. **Score "Sniper" Ultra-Preciso**
   - Dados financeiros auditados (não estimados)
   - Decisores identificados (não aproximados)
   - Sinais de compra documentados (não inferidos)

**Exemplo de Precisão:**

❌ **Antes (estimado)**: "Empresa média, ~100 funcionários, sem processos"

✅ **Depois (capital aberto)**: 
- "Magazine Luiza S.A."
- "Receita líquida R$ 20B, EBITDA 23%"
- "CEO: Frederico Trajano (LinkedIn 500k+ seguidores)"
- "Fato relevante (15/10/2024): Aprovado CAPEX R$ 80M em transformação digital"
- "Novo CTO contratado há 2 meses: João Silva (ex-Mercado Livre)"
- "**FIT SCORE: 98/100** - Oportunidade CRÍTICA"

---

## 📝 **NOTAS IMPORTANTES**

- ✅ **ReceitaWS**: 100% funcional e gratuito
- ⚠️ **Dados Financeiros**: Estimados via heurísticas (não são reais ainda)
- ⚠️ **Dados Jurídicos**: Estimados via heurísticas (não são reais ainda)
- ✅ **Apollo**: Funcional (requer API key do usuário)
- ❌ **PhantomBuster**: NÃO pode ser usado (bloqueio técnico)
- ⚠️ **LinkedIn**: Somente via Google Search (busca pública)
- ✅ **IA**: 100% funcional via Lovable AI Gateway
- 💡 **Fit Score TOTVS**: 0-100 indica **aderência aos produtos TOTVS**, NÃO propensão de compra

## 💳 **SISTEMA DE CRÉDITOS PARA CONSULTAS PAGAS (MVP)**

### Como Funcionará:
1. **Usuário compra créditos** ou paga por consulta
2. **Antes de enriquecer com API paga**, sistema mostra:
   - Custo da consulta (ex: "R$ 80 - Serasa Experian")
   - Créditos disponíveis
   - Botão "Confirmar Consulta Paga"
3. **Após confirmação**, consulta é realizada e créditos debitados
4. **Dados ficam em cache**, evitando reconsultas

### Custos por Tipo de Consulta:
- 💰 **Serasa Financial**: ~R$ 50-200
- ⚖️ **JusBrasil Legal**: ~R$ 500-1000/mês (plano)

---

**Última atualização**: 2025-10-24
**Responsável**: Sistema de Inteligência 360°
