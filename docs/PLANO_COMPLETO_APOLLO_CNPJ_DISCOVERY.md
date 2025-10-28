# 🎯 PLANO COMPLETO - APOLLO + CNPJ DISCOVERY + ENRIQUECIMENTO 360°

## 📋 ÍNDICE

1. [Visão Geral do Fluxo](#visão-geral-do-fluxo)
2. [Fase 1: Autenticação & Monitoramento APIs](#fase-1-autenticação--monitoramento-apis)
3. [Fase 2: Busca Apollo com Matching Incremental](#fase-2-busca-apollo-com-matching-incremental)
4. [Fase 3: CNPJ Discovery (Multi-Source)](#fase-3-cnpj-discovery-multi-source)
5. [Fase 4: Validação & Confirmação Usuário](#fase-4-validação--confirmação-usuário)
6. [Fase 5: Enriquecimento Apollo (42 Campos)](#fase-5-enriquecimento-apollo-42-campos)
7. [Fase 6: Fallback PhantomBuster](#fase-6-fallback-phantombuster)
8. [Fase 7: Consolidação & Persistência](#fase-7-consolidação--persistência)
9. [Checklist de Validação](#checklist-de-validação)

---

## 🌊 VISÃO GERAL DO FLUXO

```
┌─────────────────────────────────────────────────────────────────────┐
│  USUÁRIO: Busca empresa "Fiord Logística Internacional"            │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FASE 1: VALIDAÇÃO DE SESSÃO & MONITORAMENTO APIs                  │
│  - Verificar se usuário está autenticado                           │
│  - Validar token não expirou                                        │
│  - Verificar saúde de APIs (background, transparente)              │
│    ✓ Apollo API Online?                                            │
│    ✓ ReceitaWS API Online?                                         │
│    ✓ EmpresaQui API Online?                                        │
│    ✓ PhantomBuster API Online?                                     │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FASE 2: BUSCA APOLLO COM MATCHING INCREMENTAL                     │
│                                                                      │
│  Nome: "Fiord Logística Internacional"                             │
│                                                                      │
│  Tentativa 1: "Fiord"                        → 15 results          │
│  Tentativa 2: "Fiord Logística"             → 8 results           │
│  Tentativa 3: "Fiord Logística Internacional" → 3 results          │
│                                                                      │
│  Scoring de Match:                                                  │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ 🥇 Fiord Logística Internacional        | Match: 98% ✅ │      │
│  │ 🥈 Fiord Transportes                    | Match: 45%    │      │
│  │ 🥉 Fiord Group                          | Match: 30%    │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                      │
│  SE NENHUM RESULTADO:                                               │
│  ❌ "Não encontramos essa empresa no Apollo"                       │
│  📋 "Você tem certeza que ela está cadastrada no Apollo?"          │
│  🔗 [Verificar no Apollo] → https://app.apollo.io/companies        │
│  📝 "Cole aqui a URL da empresa:" [___________________________]    │
│                                                                      │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  DIALOG 1: SELEÇÃO DE EMPRESA APOLLO                               │
│                                                                      │
│  "Encontramos 3 empresas. Qual delas é a correta?"                 │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │ ⭐ Fiord Logística Internacional                 98% ✅ │       │
│  │ 📍 São Paulo, SP - Brasil                              │       │
│  │ 🏢 500-1000 funcionários                               │       │
│  │ 🌐 fiordlog.com.br                                     │       │
│  │ 👥 87 decisores disponíveis no Apollo                 │       │
│  │ [✓ Selecionar] [ℹ️ Ver Detalhes]                      │       │
│  └─────────────────────────────────────────────────────────┘       │
│                                                                      │
│  [⏭️ Pular] [🔄 Buscar Novamente]                                  │
│                                                                      │
│  USUÁRIO: [✓ Selecionar]                                           │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FASE 3: CNPJ DISCOVERY (MULTI-SOURCE)                             │
│                                                                      │
│  Nome confirmado: "Fiord Logística Internacional Ltda"            │
│  Razão Social completa extraída do Apollo                          │
│                                                                      │
│  🔍 ESTRATÉGIA 1: EMPRESAQUI API                                   │
│  ────────────────────────────────────────────────────────           │
│  Query: "Fiord Logística Internacional"                           │
│  ✅ API EmpresaQui: ONLINE                                         │
│  📊 Resultados:                                                     │
│     • CNPJ: 12.345.678/0001-90 | Nome: Fiord Log Internac...  92% │
│     • CNPJ: 12.345.679/0001-45 | Nome: Fiord Logística SA   87% │
│     • CNPJ: 12.345.680/0001-23 | Nome: Fiord Internacional  45% │
│                                                                      │
│  🔍 ESTRATÉGIA 2: RECEITA WS API (FALLBACK)                        │
│  ────────────────────────────────────────────────────────           │
│  ✅ API ReceitaWS: ONLINE                                          │
│  Query combinações:                                                 │
│     1. "Fiord" + domínio (fiordlog.com.br)                        │
│     2. "Fiord Logística"                                           │
│     3. "Fiord Logística Internacional"                             │
│  📊 Resultados adicionais encontrados: 1 novo CNPJ                 │
│                                                                      │
│  🔍 ESTRATÉGIA 3: GOOGLE SEARCH (ÚLTIMO RECURSO)                   │
│  ────────────────────────────────────────────────────────           │
│  Query: "Fiord Logística Internacional CNPJ"                       │
│  ✅ Google Search: ONLINE                                          │
│  📊 Parsing de resultados:                                          │
│     • Encontrado em: https://...gov.br/...                        │
│       CNPJ: 12.345.678/0001-90 ✓                                  │
│     • Encontrado em: https://fiordlog.com.br/contato              │
│       CNPJ: 12.345.678/0001-90 ✓ (confirmação)                    │
│                                                                      │
│  🎯 CONSOLIDAÇÃO:                                                   │
│  ────────────────────────────────────────────────────────           │
│  CNPJs encontrados (ordenados por confiança):                      │
│  1. 12.345.678/0001-90 | Confiança: 95% | Fontes: 3              │
│  2. 12.345.679/0001-45 | Confiança: 87% | Fontes: 1              │
│  3. 12.345.680/0001-23 | Confiança: 45% | Fontes: 1              │
│                                                                      │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  DIALOG 2: CONFIRMAÇÃO CNPJ                                        │
│                                                                      │
│  "Encontramos 3 CNPJs. Qual deles pertence à empresa?"            │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │ ⭐ 12.345.678/0001-90                         95% ✅    │       │
│  │ 📋 FIORD LOGISTICA INTERNACIONAL LTDA                  │       │
│  │ 📍 R. das Flores, 123 - São Paulo/SP                  │       │
│  │ 📅 Abertura: 15/03/2010                                │       │
│  │ ✅ Status: ATIVA                                       │       │
│  │ 🔍 Fontes: EmpresaQui + ReceitaWS + Google            │       │
│  │ [🔗 Verificar na Receita Federal]                     │       │
│  │ [✓ Confirmar CNPJ] [❌ Não é este]                    │       │
│  └─────────────────────────────────────────────────────────┘       │
│                                                                      │
│  USUÁRIO: [✓ Confirmar CNPJ]                                       │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FASE 4: VALIDAÇÃO CRUZADA CNPJ                                    │
│                                                                      │
│  CNPJ Selecionado: 12.345.678/0001-90                             │
│                                                                      │
│  ✅ 1. Consulta EmpresaQui com CNPJ exato                          │
│     → Razão Social: ✓ Match com Apollo (92%)                      │
│     → Domínio: ✓ fiordlog.com.br                                  │
│     → Telefone: (11) 3456-7890                                     │
│     → Situação Cadastral: ATIVA                                    │
│                                                                      │
│  ✅ 2. Consulta ReceitaWS com CNPJ exato                           │
│     → Razão Social: ✓ Confirma EmpresaQui                         │
│     → QSA (Quadro Societário): 3 sócios                           │
│     → Capital Social: R$ 5.000.000,00                              │
│     → CNAEs: 4930-2/02 (Transporte rodoviário)                    │
│                                                                      │
│  ✅ 3. Cross-Check com dados Apollo                                │
│     → Nome Apollo vs Receita: ✓ 95% match                         │
│     → Domínio Apollo vs Receita: ✓ Idêntico                       │
│     → Endereço Apollo vs Receita: ✓ 88% match                     │
│                                                                      │
│  🎯 VALIDAÇÃO: 100% APROVADA                                        │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FASE 5: ENRIQUECIMENTO APOLLO (42 CAMPOS)                         │
│                                                                      │
│  Apollo Organization ID: apollo_org_5f8a3b2c1d4e6789              │
│                                                                      │
│  🏢 DADOS ORGANIZACIONAIS (18 campos):                             │
│  ✓ name, legal_name, website_url, primary_domain                  │
│  ✓ industry, sub_industry, estimated_num_employees                │
│  ✓ annual_revenue, annual_revenue_printed, founded_year           │
│  ✓ company_type (Public/Private), stock_symbol                    │
│  ✓ raw_address, street_address, city, state, postal_code, country │
│                                                                      │
│  🌐 DIGITAL PRESENCE (8 campos):                                   │
│  ✓ linkedin_url, facebook_url, twitter_url, crunchbase_url        │
│  ✓ logo_url, blog_url, angellist_url, seo_description            │
│                                                                      │
│  🔧 TECNOLOGIAS (5 campos):                                         │
│  ✓ technologies[] (SaaS usado: Salesforce, HubSpot, SAP...)       │
│  ✓ tech_stack_complete, tech_stack_categories                     │
│  ✓ hosting_provider, cms_platform                                 │
│                                                                      │
│  📊 METRICS & SIGNALS (6 campos):                                  │
│  ✓ monthly_traffic_estimate, alexa_ranking                        │
│  ✓ intent_strength, buying_signals[]                              │
│  ✓ growth_rate, hiring_status                                     │
│                                                                      │
│  📞 CONTACT INFO (5 campos):                                        │
│  ✓ phone_numbers[], corporate_phone, support_email                │
│  ✓ general_email, contact_emails[]                                │
│                                                                      │
│  🎯 TOTAL: 42 CAMPOS MAPEADOS                                       │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FASE 6: BUSCA DECISORES APOLLO (FILTRO RIGOROSO)                 │
│                                                                      │
│  Parâmetros de Busca:                                              │
│  • q_organization_id: apollo_org_5f8a3b2c1d4e6789 ✅ (EXATO!)     │
│  • q_organization_domains: fiordlog.com.br                         │
│  • person_titles: CEO, CFO, CTO, Director, VP, Manager            │
│  • per_page: 100                                                   │
│                                                                      │
│  📊 Resposta Apollo People Search:                                 │
│  Total encontrado: 87 pessoas                                      │
│                                                                      │
│  🔍 FILTRO RIGOROSO APLICADO:                                       │
│  ────────────────────────────────────────────────────────           │
│  Regra 1: organization_id DEVE ser EXATO                           │
│     ❌ Rejeitado: João Silva (org_id: apollo_org_DIFERENTE)       │
│     ✅ Aprovado: Maria Santos (org_id: apollo_org_5f8a3b2c1d4e6789)│
│                                                                      │
│  Regra 2: primary_domain DEVE ser EXATO (não aceita subdomínios)  │
│     ❌ Rejeitado: Pedro Costa (domain: marketing.fiordlog.com.br) │
│     ✅ Aprovado: Ana Lima (domain: fiordlog.com.br)               │
│                                                                      │
│  Regra 3: Se email_status = 'unavailable' → email = NULL          │
│     ❌ Rejeitado FAKE: carlos.souza@example.com                    │
│     ✅ Salvo NULL: email_status = 'unavailable'                    │
│                                                                      │
│  🎯 RESULTADO FINAL:                                                │
│  Total após filtro: 64 decisores VÁLIDOS (de 87 originais)        │
│  Rejeitados: 23 (org_id diferente ou domínio incompatível)        │
│                                                                      │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FASE 7: FALLBACK PHANTOMBUSTER (SE APOLLO FALHAR)                │
│                                                                      │
│  SE: decisores_apollo.length === 0                                 │
│                                                                      │
│  ✅ LinkedIn Company URL disponível no Apollo                      │
│  URL: https://www.linkedin.com/company/fiord-logistica            │
│                                                                      │
│  🤖 Chamada PhantomBuster API:                                      │
│  ────────────────────────────────────────────────────────           │
│  Agent: LinkedIn Company Employees Scraper                         │
│  Config:                                                            │
│    • companyUrl: linkedin.com/company/fiord-logistica             │
│    • maxEmployees: 100                                             │
│    • filters: ["CEO", "Director", "Manager", "VP"]                │
│                                                                      │
│  📊 Resposta PhantomBuster:                                         │
│  Total scraped: 42 profiles                                        │
│                                                                      │
│  🔍 DADOS EXTRAÍDOS (por perfil):                                  │
│  ✓ fullName, headline, profileUrl                                 │
│  ✓ location, currentPosition[], company                           │
│  ✓ connections, skills[], education[]                             │
│  ✓ profilePicture, background                                     │
│                                                                      │
│  ⚠️ LIMITAÇÕES:                                                     │
│  • Email: NÃO disponível via PhantomBuster                         │
│  • Phone: NÃO disponível via PhantomBuster                         │
│  • Email Status: Marcado como 'phantom_unavailable'               │
│                                                                      │
│  🎯 RESULTADO:                                                      │
│  42 decisores salvos com source: 'phantombuster'                   │
│                                                                      │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FASE 8: CONSOLIDAÇÃO & PERSISTÊNCIA                               │
│                                                                      │
│  📦 DADOS FINAIS CONSOLIDADOS:                                      │
│                                                                      │
│  🏢 EMPRESA (companies table):                                      │
│  ✓ cnpj: 12.345.678/0001-90                                        │
│  ✓ name: Fiord Logística Internacional Ltda                       │
│  ✓ domain: fiordlog.com.br                                        │
│  ✓ apollo_organization_id: apollo_org_5f8a3b2c1d4e6789            │
│  ✓ raw_data: { ... 42 campos Apollo ... }                         │
│  ✓ enrichment_status: 'completed'                                 │
│  ✓ last_enriched_at: 2025-10-28T10:30:00Z                         │
│  ✓ enrichment_sources: ['apollo', 'empresaqui', 'receitaws']      │
│                                                                      │
│  👥 DECISORES (decision_makers table):                              │
│  ✓ Total: 64 decisores Apollo + 42 PhantomBuster = 106 total      │
│  ✓ Campos completos: 42 campos mapeados                           │
│  ✓ Emails verificados: 28 (email_status='verified')               │
│  ✓ Emails guess: 15 (email_status='guessed')                      │
│  ✓ Emails indisponíveis: 21 (email=NULL, status='unavailable')    │
│  ✓ PhantomBuster only: 42 (email=NULL, status='phantom_unavailable')│
│                                                                      │
│  📊 HISTÓRICO (company_enrichment table):                           │
│  ✓ enrichment_date: 2025-10-28T10:30:00Z                          │
│  ✓ source: 'apollo_360'                                           │
│  ✓ status: 'success'                                               │
│  ✓ metadata: { cnpjs_found: 3, confidence: 95%, ... }            │
│                                                                      │
│  🎉 ENRIQUECIMENTO COMPLETO!                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📝 FASE 1: AUTENTICAÇÃO & MONITORAMENTO APIs

### 1.1 Validação de Sessão (Frontend)

**Arquivos:**
- `src/components/companies/ApolloImportDialog.tsx`
- `src/pages/CompanyDetailPage.tsx`
- `src/hooks/useApolloImport.ts`

**Implementação:**

```typescript
// ANTES de qualquer chamada à edge function:

// 1. Verificar sessão ativa
const { data: sessionData } = await supabase.auth.getSession();

if (!sessionData?.session) {
  toast.error('Sessão Expirada', {
    description: 'Por favor, faça login novamente.',
    action: <Button onClick={() => navigate('/auth')}>Fazer Login</Button>
  });
  return;
}

// 2. Verificar se token não expira em menos de 5min
const expiresAt = sessionData.session.expires_at;
if (expiresAt && Date.now() / 1000 > expiresAt - 300) {
  console.log('[Auth] Token expirando, renovando...');
  const { error } = await supabase.auth.refreshSession();
  if (error) {
    toast.error('Erro ao renovar sessão', {
      description: 'Faça login novamente.'
    });
    return;
  }
}

// 3. Pegar token atualizado
const accessToken = sessionData.session.access_token;
```

---

### 1.2 Monitoramento Automático de APIs (Background)

**Arquivo Novo:** `src/components/admin/APIHealthMonitor.tsx`

**Funcionalidade:**
- Roda a cada 5 minutos (background, transparente)
- Verifica status de todas as APIs
- Usuário NÃO vê nada (exceto se tudo falhar)
- Logs internos para debug

**APIs Monitoradas:**

```typescript
const API_HEALTH_CHECKS = [
  {
    name: 'Apollo API',
    endpoint: 'https://api.apollo.io/v1/auth/health',
    method: 'GET',
    headers: { 'X-Api-Key': APOLLO_API_KEY },
    timeout: 5000
  },
  {
    name: 'EmpresaQui API',
    endpoint: 'https://empresaqui.com.br/api/ping',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${EMPRESAQUI_API_KEY}` },
    timeout: 5000
  },
  {
    name: 'ReceitaWS API',
    endpoint: 'https://www.receitaws.com.br/v1/cnpj/00000000000191', // CNPJ teste
    method: 'GET',
    headers: { 'Authorization': `Bearer ${RECEITAWS_API_TOKEN}` },
    timeout: 5000
  },
  {
    name: 'PhantomBuster API',
    endpoint: 'https://api.phantombuster.com/api/v2/agents',
    method: 'GET',
    headers: { 'X-Phantombuster-Key': PHANTOM_API_KEY },
    timeout: 5000
  },
  {
    name: 'Google Search',
    endpoint: 'https://www.googleapis.com/customsearch/v1',
    method: 'GET',
    queryParams: { key: GOOGLE_API_KEY, cx: GOOGLE_CSE_ID, q: 'test' },
    timeout: 5000
  }
];

// Lógica:
// - Se API falhar 3x seguidas → marca como DOWN
// - Se API voltar → marca como UP
// - Usuário só vê notificação se TODAS falharem
// - Logs internos: console.log('[API Health] Apollo: UP, ReceitaWS: DOWN')
```

---

## 📝 FASE 2: BUSCA APOLLO COM MATCHING INCREMENTAL

### 2.1 Algoritmo de Matching Incremental

**Arquivo:** `supabase/functions/enrich-apollo/index.ts`

**Função Nova:**

```typescript
/**
 * Gera combinações incrementais de palavras do nome da empresa
 * 
 * Exemplo:
 * Input: "Fiord Logística Internacional Ltda"
 * Output: [
 *   "Fiord",
 *   "Fiord Logística",
 *   "Fiord Logística Internacional"
 * ]
 * 
 * Regras:
 * - Remove sufixos legais: LTDA, ME, EPP, EIRELI, S.A., CIA
 * - Ignora palavras < 3 caracteres (artigos, preposições)
 * - Máximo 5 combinações
 */
function generateNameCombinations(fullName: string): string[] {
  // 1. Limpar sufixos legais
  const cleaned = fullName
    .replace(/\s+(LTDA|ME|EPP|EIRELI|S\.A\.|SA|CIA|LIMITADA)\b\.?/gi, '')
    .trim();
  
  // 2. Dividir em palavras significativas
  const words = cleaned
    .split(/\s+/)
    .filter(word => word.length >= 3); // Ignora "de", "da", "do", "e", etc.
  
  // 3. Gerar combinações incrementais
  const combinations: string[] = [];
  for (let i = 1; i <= Math.min(words.length, 5); i++) {
    combinations.push(words.slice(0, i).join(' '));
  }
  
  return combinations;
}

/**
 * Busca organizações no Apollo usando múltiplas estratégias
 */
async function searchApolloOrganizations(
  companyName: string,
  companyDomain?: string
): Promise<ApolloOrganization[]> {
  
  const allOrganizations: ApolloOrganization[] = [];
  const nameCombinations = generateNameCombinations(companyName);
  
  console.log('[Apollo] 🔍 Combinações de nome:', nameCombinations);
  
  // Estratégia 1: Busca por domínio (maior precisão)
  if (companyDomain) {
    console.log('[Apollo] 🎯 Tentando busca por domínio:', companyDomain);
    const domainResults = await apolloOrgSearch({ 
      q_organization_domains: companyDomain 
    });
    allOrganizations.push(...domainResults);
  }
  
  // Estratégia 2: Busca incremental por nome
  for (const nameVariation of nameCombinations) {
    console.log('[Apollo] 🔍 Tentando:', nameVariation);
    const nameResults = await apolloOrgSearch({
      q_organization_name: nameVariation,
      per_page: 10
    });
    allOrganizations.push(...nameResults);
  }
  
  // Remover duplicatas por ID
  const uniqueOrgs = Array.from(
    new Map(allOrganizations.map(org => [org.id, org])).values()
  );
  
  console.log('[Apollo] 📊 Total únicas encontradas:', uniqueOrgs.length);
  
  // Calcular score de matching
  const scoredOrgs = uniqueOrgs.map(org => ({
    ...org,
    matchScore: calculateMatchScore(companyName, companyDomain, org)
  }));
  
  // Ordenar por score (maior para menor)
  return scoredOrgs.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Calcula score de matching (0-100)
 */
function calculateMatchScore(
  searchName: string,
  searchDomain: string | undefined,
  apolloOrg: ApolloOrganization
): number {
  let score = 0;
  
  // Fator 1: Match de nome (0-60 pontos)
  const nameMatch = fuzzyMatch(
    normalize(searchName),
    normalize(apolloOrg.name)
  );
  score += nameMatch * 60;
  
  // Fator 2: Match de domínio (0-40 pontos)
  if (searchDomain && apolloOrg.primary_domain) {
    const domainMatch = fuzzyMatch(
      normalize(searchDomain),
      normalize(apolloOrg.primary_domain)
    );
    score += domainMatch * 40;
  }
  
  return Math.round(score);
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '');
}

function fuzzyMatch(str1: string, str2: string): number {
  // Algoritmo Levenshtein Distance simplificado
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  
  let matches = 0;
  for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
    if (str1[i] === str2[i]) matches++;
  }
  
  return matches / maxLength;
}
```

---

### 2.2 Dialog de Seleção Apollo

**Arquivo Novo:** `src/components/companies/ApolloOrgSelectionDialog.tsx`

**Interface:**

```typescript
interface ApolloOrgSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizations: Array<ApolloOrganization & { matchScore: number }>;
  searchName: string;
  onSelect: (org: ApolloOrganization) => Promise<void>;
  onManualInput: () => void; // Caso usuário queira colar URL Apollo
}
```

**Layout Visual:**

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-4xl max-h-[80vh]">
    <DialogHeader>
      <DialogTitle>
        🔍 Encontramos {organizations.length} empresas no Apollo
      </DialogTitle>
      <DialogDescription>
        Selecione a empresa correta para importar os dados e decisores
      </DialogDescription>
    </DialogHeader>
    
    <ScrollArea className="max-h-[60vh]">
      {organizations.map((org, index) => (
        <Card key={org.id} className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Medalhas para top 3 */}
                {index === 0 && <Badge variant="default">🥇 Melhor Match</Badge>}
                {index === 1 && <Badge variant="secondary">🥈</Badge>}
                {index === 2 && <Badge variant="secondary">🥉</Badge>}
                
                {/* Avatar da empresa */}
                <Avatar>
                  <AvatarImage src={org.logo_url} />
                  <AvatarFallback>{org.name[0]}</AvatarFallback>
                </Avatar>
                
                {/* Nome e score */}
                <div>
                  <h3 className="font-semibold">{org.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Compatibilidade: {org.matchScore}%
                  </p>
                </div>
              </div>
              
              {/* Progress bar visual do score */}
              <Progress value={org.matchScore} className="w-24" />
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">🌐 Domínio:</span>
                <p className="font-medium">{org.primary_domain || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">📍 Localização:</span>
                <p className="font-medium">{org.city}, {org.state} - {org.country}</p>
              </div>
              <div>
                <span className="text-muted-foreground">🏢 Funcionários:</span>
                <p className="font-medium">{org.estimated_num_employees || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">💰 Receita:</span>
                <p className="font-medium">{org.annual_revenue || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">🏭 Indústria:</span>
                <p className="font-medium">{org.industry || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">👥 Decisores:</span>
                <p className="font-medium">~{org.employee_count || 'N/A'} disponíveis</p>
              </div>
            </div>
            
            {/* LinkedIn preview */}
            {org.linkedin_url && (
              <div className="mt-3">
                <a 
                  href={org.linkedin_url} 
                  target="_blank"
                  className="text-xs text-blue-600 hover:underline"
                >
                  🔗 Ver no LinkedIn
                </a>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex gap-2">
            <Button 
              onClick={() => onSelect(org)}
              className="flex-1"
            >
              ✓ Selecionar Esta Empresa
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open(`https://app.apollo.io/companies/${org.id}`, '_blank')}
            >
              ℹ️ Ver no Apollo
            </Button>
          </CardFooter>
        </Card>
      ))}
    </ScrollArea>
    
    <Separator />
    
    {/* Footer com opções alternativas */}
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        ❓ Não encontrou a empresa correta?
      </p>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={onManualInput}
          className="flex-1"
        >
          📝 Colar URL do Apollo Manualmente
        </Button>
        <Button 
          variant="ghost"
          onClick={() => onOpenChange(false)}
        >
          ❌ Cancelar
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

---

### 2.3 Fallback: URL Manual do Apollo

**Arquivo:** `src/components/companies/ApolloManualInputDialog.tsx`

**Quando usar:**
- Usuário não encontrou a empresa nas opções
- Usuário tem a URL do Apollo e quer colar

**Interface:**

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>📋 Colar URL do Apollo</DialogTitle>
      <DialogDescription>
        Cole a URL da página da empresa no Apollo.io
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* Instruções visuais */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Acesse <a href="https://app.apollo.io/companies" target="_blank" className="text-blue-600 hover:underline">Apollo Companies</a></li>
            <li>Busque sua empresa</li>
            <li>Copie a URL da página (ex: https://app.apollo.io/companies/5f8a3b2c...)</li>
            <li>Cole aqui abaixo ⬇️</li>
          </ol>
        </AlertDescription>
      </Alert>
      
      {/* Campo de input */}
      <div>
        <Label>URL do Apollo</Label>
        <Input
          placeholder="https://app.apollo.io/companies/..."
          value={apolloUrl}
          onChange={(e) => setApolloUrl(e.target.value)}
        />
      </div>
      
      {/* Preview se URL válida */}
      {extractedOrgId && (
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            ✅ Organization ID encontrado: <code>{extractedOrgId}</code>
          </AlertDescription>
        </Alert>
      )}
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        Cancelar
      </Button>
      <Button 
        onClick={handleFetch}
        disabled={!extractedOrgId || loading}
      >
        {loading ? '🔄 Buscando...' : '✓ Buscar Dados'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 📝 FASE 3: CNPJ DISCOVERY (MULTI-SOURCE)

### 3.1 Fluxo Hierárquico de Busca

**Arquivo:** `supabase/functions/enrich-apollo/index.ts`

**Função Principal:**

```typescript
async function discoverCNPJ(
  companyName: string,
  companyDomain?: string,
  apolloAddress?: string
): Promise<CNPJCandidate[]> {
  
  const candidates: CNPJCandidate[] = [];
  
  console.log('[CNPJ Discovery] 🎯 Iniciando busca para:', companyName);
  
  // ═══════════════════════════════════════════════════════════
  // ESTRATÉGIA 1: EMPRESAQUI API (Prioridade Alta)
  // ═══════════════════════════════════════════════════════════
  
  try {
    console.log('[CNPJ Discovery] 🔍 Tentativa 1: EmpresaQui API');
    
    const empresaquiResults = await searchEmpresaQui({
      name: companyName,
      domain: companyDomain
    });
    
    if (empresaquiResults.length > 0) {
      console.log('[CNPJ Discovery] ✅ EmpresaQui:', empresaquiResults.length, 'CNPJs');
      candidates.push(...empresaquiResults.map(r => ({
        cnpj: r.cnpj,
        razaoSocial: r.razao_social,
        nomeFantasia: r.nome_fantasia,
        source: 'empresaqui',
        confidence: calculateConfidence('empresaqui', r, companyName, companyDomain),
        metadata: r
      })));
    }
  } catch (error) {
    console.error('[CNPJ Discovery] ❌ EmpresaQui falhou:', error);
  }
  
  // ═══════════════════════════════════════════════════════════
  // ESTRATÉGIA 2: RECEITA WS API (Fallback)
  // ═══════════════════════════════════════════════════════════
  
  try {
    console.log('[CNPJ Discovery] 🔍 Tentativa 2: ReceitaWS API');
    
    // Gerar combinações de nome para busca
    const nameCombinations = generateNameCombinations(companyName);
    
    for (const nameVariation of nameCombinations) {
      const receitawsResults = await searchReceitaWS({
        name: nameVariation,
        domain: companyDomain
      });
      
      if (receitawsResults.length > 0) {
        console.log('[CNPJ Discovery] ✅ ReceitaWS:', receitawsResults.length, 'CNPJs');
        candidates.push(...receitawsResults.map(r => ({
          cnpj: r.cnpj,
          razaoSocial: r.nome,
          nomeFantasia: r.fantasia,
          source: 'receitaws',
          confidence: calculateConfidence('receitaws', r, companyName, companyDomain),
          metadata: r
        })));
      }
    }
  } catch (error) {
    console.error('[CNPJ Discovery] ❌ ReceitaWS falhou:', error);
  }
  
  // ═══════════════════════════════════════════════════════════
  // ESTRATÉGIA 3: GOOGLE SEARCH + PARSING (Último Recurso)
  // ═══════════════════════════════════════════════════════════
  
  try {
    console.log('[CNPJ Discovery] 🔍 Tentativa 3: Google Search');
    
    // Query: "Razão Social" + "CNPJ"
    const query = `"${companyName}" CNPJ`;
    
    const googleResults = await googleSearch(query, {
      num: 10,
      siteSearch: 'gov.br OR .com.br' // Focar em sites brasileiros
    });
    
    // Parsing de CNPJs encontrados nas snippets
    const cnpjRegex = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g;
    
    for (const result of googleResults) {
      const fullText = `${result.title} ${result.snippet} ${result.link}`;
      const foundCNPJs = fullText.match(cnpjRegex);
      
      if (foundCNPJs) {
        for (const cnpj of foundCNPJs) {
          // Validar CNPJ via ReceitaWS
          const validatedData = await validateCNPJ(cnpj);
          
          if (validatedData) {
            console.log('[CNPJ Discovery] ✅ Google Search:', cnpj);
            candidates.push({
              cnpj,
              razaoSocial: validatedData.nome,
              nomeFantasia: validatedData.fantasia,
              source: 'google_search',
              confidence: calculateConfidence('google', validatedData, companyName, companyDomain),
              metadata: {
                googleUrl: result.link,
                googleSnippet: result.snippet,
                ...validatedData
              }
            });
          }
        }
      }
    }
    
    console.log('[CNPJ Discovery] ✅ Google Search:', candidates.filter(c => c.source === 'google_search').length, 'CNPJs');
    
  } catch (error) {
    console.error('[CNPJ Discovery] ❌ Google Search falhou:', error);
  }
  
  // ═══════════════════════════════════════════════════════════
  // CONSOLIDAÇÃO & DEDUPLICAÇÃO
  // ═══════════════════════════════════════════════════════════
  
  // Agrupar por CNPJ (mesmo CNPJ encontrado em múltiplas fontes)
  const grouped = candidates.reduce((acc, candidate) => {
    if (!acc[candidate.cnpj]) {
      acc[candidate.cnpj] = {
        ...candidate,
        sources: [candidate.source],
        confidenceBoost: 0
      };
    } else {
      // CNPJ encontrado em múltiplas fontes → aumentar confiança
      acc[candidate.cnpj].sources.push(candidate.source);
      acc[candidate.cnpj].confidenceBoost += 10; // +10% por fonte adicional
    }
    return acc;
  }, {} as Record<string, CNPJCandidate & { sources: string[], confidenceBoost: number }>);
  
  // Converter de volta para array e aplicar boost
  const consolidated = Object.values(grouped).map(c => ({
    ...c,
    confidence: Math.min(100, c.confidence + c.confidenceBoost)
  }));
  
  // Ordenar por confiança (maior para menor)
  consolidated.sort((a, b) => b.confidence - a.confidence);
  
  console.log('[CNPJ Discovery] 🎯 Total consolidado:', consolidated.length, 'CNPJs únicos');
  
  return consolidated;
}
```

---

### 3.2 Cálculo de Confiança (Confidence Score)

```typescript
function calculateConfidence(
  source: 'empresaqui' | 'receitaws' | 'google',
  data: any,
  searchName: string,
  searchDomain?: string
): number {
  
  let score = 0;
  
  // Base score por fonte (confiabilidade intrínseca)
  const baseScores = {
    empresaqui: 50,  // API especializada
    receitaws: 40,   // API Receita Federal
    google: 30       // Parsing manual
  };
  score += baseScores[source];
  
  // Match de nome (0-30 pontos)
  const nameMatch = fuzzyMatch(
    normalize(searchName),
    normalize(data.nome || data.razao_social || '')
  );
  score += nameMatch * 30;
  
  // Match de domínio (0-20 pontos)
  if (searchDomain && data.website) {
    const domainMatch = fuzzyMatch(
      normalize(searchDomain),
      normalize(data.website)
    );
    score += domainMatch * 20;
  }
  
  return Math.round(Math.min(100, score));
}
```

---

## 📝 FASE 4: VALIDAÇÃO & CONFIRMAÇÃO USUÁRIO

### 4.1 Dialog de Confirmação CNPJ

**Arquivo:** `src/components/companies/CNPJSelectionDialog.tsx`

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-3xl">
    <DialogHeader>
      <DialogTitle>
        🔍 Encontramos {cnpjCandidates.length} CNPJs
      </DialogTitle>
      <DialogDescription>
        Selecione o CNPJ correto da empresa
      </DialogDescription>
    </DialogHeader>
    
    <ScrollArea className="max-h-[60vh]">
      {cnpjCandidates.map((candidate, index) => (
        <Card key={candidate.cnpj} className="mb-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                {/* Medalhas */}
                {index === 0 && <Badge>⭐ Maior Confiança</Badge>}
                
                <h3 className="text-lg font-bold font-mono">
                  {formatCNPJ(candidate.cnpj)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Confiança: {candidate.confidence}%
                </p>
              </div>
              
              <Progress value={candidate.confidence} className="w-32" />
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">📋 Razão Social:</span>
                <p className="font-medium">{candidate.razaoSocial}</p>
              </div>
              
              {candidate.nomeFantasia && (
                <div>
                  <span className="text-muted-foreground">✨ Nome Fantasia:</span>
                  <p className="font-medium">{candidate.nomeFantasia}</p>
                </div>
              )}
              
              <div>
                <span className="text-muted-foreground">🏢 Situação:</span>
                <Badge variant={candidate.metadata?.situacao === 'ATIVA' ? 'default' : 'destructive'}>
                  {candidate.metadata?.situacao || 'N/A'}
                </Badge>
              </div>
              
              {candidate.metadata?.abertura && (
                <div>
                  <span className="text-muted-foreground">📅 Abertura:</span>
                  <p className="font-medium">{formatDate(candidate.metadata.abertura)}</p>
                </div>
              )}
              
              {candidate.metadata?.logradouro && (
                <div>
                  <span className="text-muted-foreground">📍 Endereço:</span>
                  <p className="font-medium">
                    {candidate.metadata.logradouro}, {candidate.metadata.numero} - {candidate.metadata.bairro}
                    <br />
                    {candidate.metadata.municipio}/{candidate.metadata.uf} - CEP: {candidate.metadata.cep}
                  </p>
                </div>
              )}
              
              <div>
                <span className="text-muted-foreground">🔍 Fontes:</span>
                <div className="flex gap-1 mt-1">
                  {candidate.sources.map(source => (
                    <Badge key={source} variant="outline" className="text-xs">
                      {source === 'empresaqui' && '🏢 EmpresaQui'}
                      {source === 'receitaws' && '🏛️ ReceitaWS'}
                      {source === 'google_search' && '🔎 Google'}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex gap-2">
            <Button 
              onClick={() => onSelect(candidate)}
              className="flex-1"
            >
              ✓ Confirmar CNPJ
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open(`https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp`, '_blank')}
            >
              🔗 Verificar na Receita Federal
            </Button>
          </CardFooter>
        </Card>
      ))}
    </ScrollArea>
    
    <Separator />
    
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        ❌ Cancelar
      </Button>
      <Button variant="ghost" onClick={onManualCNPJ}>
        📝 Inserir CNPJ Manualmente
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

---

### 4.2 Validação Cruzada Pós-Seleção

**Após usuário confirmar CNPJ:**

```typescript
async function crossValidateCNPJ(
  cnpj: string,
  apolloOrg: ApolloOrganization
): Promise<ValidationResult> {
  
  console.log('[Cross Validation] 🔍 Validando CNPJ:', cnpj);
  
  const checks: ValidationCheck[] = [];
  
  // Check 1: Buscar dados completos no EmpresaQui
  try {
    const empresaquiData = await fetchEmpresaQuiByCNPJ(cnpj);
    checks.push({
      source: 'empresaqui',
      success: true,
      nameMatch: fuzzyMatch(
        normalize(apolloOrg.name),
        normalize(empresaquiData.razao_social)
      ),
      domainMatch: apolloOrg.primary_domain 
        ? fuzzyMatch(normalize(apolloOrg.primary_domain), normalize(empresaquiData.website))
        : null,
      data: empresaquiData
    });
  } catch (error) {
    checks.push({ source: 'empresaqui', success: false, error });
  }
  
  // Check 2: Buscar dados completos no ReceitaWS
  try {
    const receitawsData = await fetchReceitaWSByCNPJ(cnpj);
    checks.push({
      source: 'receitaws',
      success: true,
      nameMatch: fuzzyMatch(
        normalize(apolloOrg.name),
        normalize(receitawsData.nome)
      ),
      data: receitawsData
    });
  } catch (error) {
    checks.push({ source: 'receitaws', success: false, error });
  }
  
  // Análise consolidada
  const successfulChecks = checks.filter(c => c.success);
  
  if (successfulChecks.length === 0) {
    return {
      valid: false,
      confidence: 0,
      message: 'Não foi possível validar o CNPJ em nenhuma fonte'
    };
  }
  
  const avgNameMatch = successfulChecks.reduce((sum, c) => sum + (c.nameMatch || 0), 0) / successfulChecks.length;
  const avgDomainMatch = successfulChecks
    .filter(c => c.domainMatch !== null)
    .reduce((sum, c) => sum + (c.domainMatch || 0), 0) / successfulChecks.length;
  
  const confidence = Math.round((avgNameMatch * 70) + (avgDomainMatch * 30));
  
  return {
    valid: confidence >= 70,
    confidence,
    checks,
    message: confidence >= 70 
      ? `✅ CNPJ validado com ${confidence}% de confiança`
      : `⚠️ CNPJ possui baixa compatibilidade (${confidence}%)`
  };
}
```

---

## 📝 FASE 5: ENRIQUECIMENTO APOLLO (42 CAMPOS)

### 5.1 Mapeamento Completo de Campos

**Schema `decision_makers` (verificar se campos existem):**

```sql
-- Adicionar campos faltantes (se necessário):
ALTER TABLE decision_makers
ADD COLUMN IF NOT EXISTS departments TEXT[],
ADD COLUMN IF NOT EXISTS functions TEXT[],
ADD COLUMN IF NOT EXISTS intent_strength TEXT,
ADD COLUMN IF NOT EXISTS contact_accuracy_score INTEGER,
ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS headline TEXT,
ADD COLUMN IF NOT EXISTS employment_history JSONB;
```

**Código de Salvamento:**

```typescript
async function saveDecisionMakers(
  companyId: string,
  apolloPeople: ApolloPerson[],
  apolloOrgId: string
): Promise<number> {
  
  const decisorsToSave = apolloPeople.map(person => ({
    // ═══════════════════════════════════════════════════════════
    // IDENTIFICAÇÃO (5 campos)
    // ═══════════════════════════════════════════════════════════
    company_id: companyId,
    apollo_person_id: person.id,
    apollo_organization_id: apolloOrgId,
    enrichment_source: 'apollo',
    apollo_last_enriched_at: new Date().toISOString(),
    
    // ═══════════════════════════════════════════════════════════
    // DADOS PESSOAIS (8 campos)
    // ═══════════════════════════════════════════════════════════
    name: person.name,
    title: person.title, // Cargo atual
    headline: person.headline || person.title, // ✅ NOVO: Descrição curta
    seniority: person.seniority, // junior, mid, senior, executive
    
    // ═══════════════════════════════════════════════════════════
    // CONTATO (10 campos)
    // ═══════════════════════════════════════════════════════════
    email: person.email_status === 'unavailable' ? null : person.email, // ✅ CORRIGIDO
    email_status: person.email_status, // verified, guessed, unavailable
    verified_email: person.email_status === 'verified',
    
    phone: person.phone_numbers?.[0]?.raw_number,
    phone_type: person.phone_numbers?.[0]?.type,
    
    linkedin_url: person.linkedin_url,
    twitter_url: person.twitter_url, // ✅ NOVO
    facebook_url: person.facebook_url, // ✅ NOVO
    github_url: person.github_url, // ✅ NOVO
    
    // ═══════════════════════════════════════════════════════════
    // LOCALIZAÇÃO (4 campos)
    // ═══════════════════════════════════════════════════════════
    city: person.city,
    state: person.state,
    country: person.country,
    postal_code: person.postal_code,
    
    // ═══════════════════════════════════════════════════════════
    // ORGANIZAÇÃO & FUNÇÃO (6 campos)
    // ═══════════════════════════════════════════════════════════
    departments: person.departments || [], // ✅ NOVO: ['Sales', 'Marketing']
    functions: person.functions || [], // ✅ NOVO: ['Business Development', 'Sales Operations']
    organization_name: person.organization_name,
    organization_domain: person.organization?.primary_domain,
    
    // ═══════════════════════════════════════════════════════════
    // SINAIS DE INTENÇÃO (4 campos)
    // ═══════════════════════════════════════════════════════════
    intent_strength: person.intent_strength, // ✅ NOVO: 'high', 'medium', 'low'
    contact_accuracy_score: person.contact_accuracy_score, // ✅ NOVO: 0-100
    last_activity_date: person.last_activity_date, // ✅ NOVO: última atividade detectada
    
    // ═══════════════════════════════════════════════════════════
    // HISTÓRICO & EDUCAÇÃO (2 campos)
    // ═══════════════════════════════════════════════════════════
    employment_history: person.employment_history || [], // ✅ NOVO: array de empregos anteriores
    education: person.education || [],
    
    // ═══════════════════════════════════════════════════════════
    // METADATA COMPLETO (3 campos)
    // ═══════════════════════════════════════════════════════════
    apollo_person_metadata: person, // JSON completo do Apollo
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
  
  // Inserção em batch
  const { data, error } = await supabase
    .from('decision_makers')
    .upsert(decisorsToSave, {
      onConflict: 'company_id,email', // Evitar duplicatas
      ignoreDuplicates: false
    });
  
  if (error) throw error;
  
  console.log('[Apollo] ✅ Decisores salvos:', decisorsToSave.length);
  
  return decisorsToSave.length;
}
```

---

## 📝 FASE 6: FALLBACK PHANTOMBUSTER

**Quando ativar:**
- Apollo retornou 0 decisores
- Apollo falhou (erro 401, 500, etc.)
- Empresa tem LinkedIn URL

**Código:**

```typescript
async function fallbackPhantomBuster(
  companyId: string,
  linkedinUrl: string
): Promise<number> {
  
  console.log('[Phantom] 🤖 Iniciando fallback para:', linkedinUrl);
  
  const PHANTOM_API_KEY = Deno.env.get('PHANTOM_API_KEY');
  const PHANTOM_SESSION = Deno.env.get('PHANTOM_SESSION_COOKIE');
  
  if (!PHANTOM_API_KEY || !PHANTOM_SESSION) {
    console.log('[Phantom] ⚠️ Credenciais não configuradas, pulando...');
    return 0;
  }
  
  // Chamar edge function linkedin-scrape
  const { data, error } = await supabase.functions.invoke('linkedin-scrape', {
    body: {
      companyId,
      linkedinUrl,
      type: 'company_employees',
      maxProfiles: 100,
      filters: ['CEO', 'Director', 'Manager', 'VP', 'Head', 'CTO', 'CFO']
    }
  });
  
  if (error) {
    console.error('[Phantom] ❌ Erro:', error);
    return 0;
  }
  
  if (!data?.profiles || data.profiles.length === 0) {
    console.log('[Phantom] ℹ️ Nenhum perfil encontrado');
    return 0;
  }
  
  console.log('[Phantom] ✅ Perfis scrapeados:', data.profiles.length);
  
  // Salvar decisores do PhantomBuster
  const phantomDecisors = data.profiles.map((profile: any) => ({
    company_id: companyId,
    name: profile.fullName,
    title: profile.headline?.split('at')[0]?.trim(), // Extrair título do headline
    headline: profile.headline,
    linkedin_url: profile.profileUrl,
    
    // Localização (parsing de "São Paulo, Brazil")
    city: profile.location?.split(',')[0]?.trim(),
    country: profile.location?.split(',').pop()?.trim(),
    
    // Email: NÃO disponível via PhantomBuster
    email: null,
    email_status: 'phantom_unavailable',
    verified_email: false,
    
    // Metadata
    enrichment_source: 'phantombuster',
    phantom_profile_metadata: profile,
    phantom_last_enriched_at: new Date().toISOString(),
    
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
  
  // Inserir decisores
  const { error: insertError } = await supabase
    .from('decision_makers')
    .upsert(phantomDecisors, {
      onConflict: 'company_id,linkedin_url',
      ignoreDuplicates: true
    });
  
  if (insertError) {
    console.error('[Phantom] ❌ Erro ao salvar:', insertError);
    return 0;
  }
  
  console.log('[Phantom] ✅ Decisores salvos:', phantomDecisors.length);
  
  return phantomDecisors.length;
}
```

---

## 📝 FASE 7: CONSOLIDAÇÃO & PERSISTÊNCIA

**Dados finais salvos:**

```typescript
// 1. Atualizar empresa com dados Apollo + CNPJ
await supabase.from('companies').update({
  cnpj: validatedCNPJ,
  name: mergedName, // Prioriza Receita Federal
  domain: apolloOrg.primary_domain,
  apollo_organization_id: apolloOrg.id,
  linkedin_url: apolloOrg.linkedin_url,
  employees: apolloOrg.estimated_num_employees,
  revenue: apolloOrg.annual_revenue,
  industry: apolloOrg.industry,
  
  // Raw data completo (42 campos)
  raw_data: {
    apollo: apolloOrg,
    receitaws: receitawsData,
    empresaqui: empresaquiData
  },
  
  // Metadata de enriquecimento
  enrichment_status: 'completed',
  last_enriched_at: new Date().toISOString(),
  enrichment_sources: ['apollo', 'empresaqui', 'receitaws']
}).eq('id', companyId);

// 2. Salvar histórico de enriquecimento
await supabase.from('company_enrichment').insert({
  company_id: companyId,
  enrichment_date: new Date().toISOString(),
  source: 'apollo_360',
  status: 'success',
  metadata: {
    apollo_org_id: apolloOrg.id,
    cnpj_confidence: cnpjConfidence,
    cnpj_sources: cnpjSources,
    decisors_apollo: decisorsApolloCount,
    decisors_phantom: decisorsPhantomCount,
    total_decisors: decisorsApolloCount + decisorsPhantomCount
  }
});
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Autenticação & Sessão
- [ ] Usuário autenticado consegue acessar todas as funções
- [ ] Token é renovado automaticamente se expirar durante uso
- [ ] Erro 401 mostra mensagem amigável
- [ ] APIs são monitoradas em background (transparente)

### Busca Apollo
- [ ] Busca por nome completo funciona
- [ ] Busca incremental (primeiro nome, segundo nome, etc.) funciona
- [ ] Dialog mostra múltiplas empresas com score de matching
- [ ] Usuário pode selecionar empresa manualmente
- [ ] Quando não encontra, mostra opção de colar URL Apollo

### CNPJ Discovery
- [ ] Busca EmpresaQui retorna CNPJs
- [ ] Busca ReceitaWS (fallback) retorna CNPJs
- [ ] Busca Google Search (último recurso) retorna CNPJs
- [ ] CNPJs são consolidados e deduplicados
- [ ] Score de confiança é calculado corretamente
- [ ] Dialog mostra CNPJs ordenados por confiança
- [ ] Usuário pode confirmar CNPJ
- [ ] Link para Receita Federal funciona

### Validação Cruzada
- [ ] CNPJ selecionado é validado em múltiplas fontes
- [ ] Dados Apollo x Receita Federal são comparados
- [ ] Score de validação é exibido
- [ ] Se validação falhar, usuário é avisado

### Enriquecimento Apollo
- [ ] Todos os 42 campos do Apollo são salvos
- [ ] Emails indisponíveis não geram fakes
- [ ] Departamentos e funções são arrays
- [ ] Headline é diferente de title
- [ ] Employment history é estruturado (jsonb)

### Decisores Apollo
- [ ] Busca usa `q_organization_id` EXATO
- [ ] Filtro rejeita decisores de outras empresas
- [ ] Filtro rejeita subdomínios diferentes
- [ ] Emails são validados antes de salvar
- [ ] Decisores sem email ficam com NULL (não fake)

### Fallback PhantomBuster
- [ ] PhantomBuster é chamado quando Apollo falha
- [ ] LinkedIn da empresa é usado
- [ ] Perfis são scrapeados corretamente
- [ ] Decisores Phantom são salvos com source correto
- [ ] Não há duplicatas entre Apollo e Phantom

### Consolidação Final
- [ ] Empresa é salva com todos os dados
- [ ] CNPJ está correto
- [ ] Decisores estão relacionados à empresa correta
- [ ] Histórico de enriquecimento é salvo
- [ ] Usuário recebe notificação de sucesso

---

## 🎯 ORDEM DE IMPLEMENTAÇÃO

1. **Fase 1** (2h): Autenticação & Monitoramento APIs
2. **Fase 2** (4h): Busca Apollo + Matching + Dialog
3. **Fase 3** (6h): CNPJ Discovery Multi-Source
4. **Fase 4** (3h): Validação & Dialog Confirmação
5. **Fase 5** (3h): Mapeamento 42 Campos Apollo
6. **Fase 6** (2h): Filtro Rigoroso Decisores
7. **Fase 7** (3h): Fallback PhantomBuster
8. **Fase 8** (2h): Consolidação & Persistência

**TEMPO TOTAL: 25 horas de desenvolvimento**

---

## 🚨 REGRAS DE OURO

1. **SEMPRE** validar autenticação antes de chamadas
2. **NUNCA** gerar emails fakes (`pessoa@example.com`)
3. **SEMPRE** mostrar dialog de confirmação para usuário
4. **NUNCA** escolher automaticamente sem validação
5. **SEMPRE** tentar fallback quando fonte principal falha
6. **NUNCA** aceitar decisores de outras empresas
7. **SEMPRE** usar matching incremental de nomes
8. **NUNCA** sobrescrever dados sem confirmação usuário

---

## 📊 MÉTRICAS DE SUCESSO

### Antes:
- Taxa de empresas encontradas no Apollo: ~60%
- Taxa de CNPJs corretos: ~40%
- Taxa de decisores corretos: ~40%
- Campos Apollo mapeados: ~18/42 (42%)
- Fallback Phantom: 0%

### Após Implementação (Meta):
- Taxa de empresas encontradas no Apollo: ≥85%
- Taxa de CNPJs corretos: ≥95%
- Taxa de decisores corretos: ≥95%
- Campos Apollo mapeados: 42/42 (100%)
- Fallback Phantom: ≥70% (quando Apollo falha)

---

## 🎉 RESULTADO FINAL ESPERADO

Quando usuário buscar "Fiord Logística Internacional":

1. ✅ Sistema encontra empresa no Apollo (3 opções, 98% match na primeira)
2. ✅ Usuário confirma empresa correta
3. ✅ Sistema busca CNPJ em 3 fontes (EmpresaQui, ReceitaWS, Google)
4. ✅ Usuário confirma CNPJ correto (95% confiança)
5. ✅ Sistema valida CNPJ cruzando dados Apollo x Receita
6. ✅ Sistema busca decisores no Apollo (64 encontrados)
7. ✅ Filtra decisores rigorosamente (rejeita 23 incorretos)
8. ✅ Se Apollo falhar, chama PhantomBuster (42 perfis)
9. ✅ Salva empresa + CNPJ + 106 decisores (64 Apollo + 42 Phantom)
10. ✅ Todos os 42 campos Apollo mapeados
11. ✅ Nenhum email fake gerado
12. ✅ Histórico de enriquecimento completo

**EMPRESA TOTALMENTE ENRIQUECIDA EM ~2-3 MINUTOS!** 🚀
