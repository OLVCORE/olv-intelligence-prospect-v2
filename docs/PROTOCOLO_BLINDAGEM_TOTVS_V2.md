# 🛡️ PROTOCOLO DE BLINDAGEM E RECUPERAÇÃO
## TOTVS Deep Web Intelligence v2.0 - VERSÃO ESTÁVEL

**Data de Criação:** 21 de Janeiro de 2025  
**Status:** ✅ VERSÃO ESTÁVEL VALIDADA  
**Última Atualização:** 21/01/2025

---

## 📋 ÍNDICE

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquivos Críticos](#arquivos-críticos)
3. [Funcionalidades Validadas](#funcionalidades-validadas)
4. [Protocolo de Blindagem](#protocolo-de-blindagem)
5. [Protocolo de Recuperação de Emergência](#protocolo-de-recuperação-de-emergência)
6. [Boas Práticas para Mudanças Futuras](#boas-práticas-para-mudanças-futuras)
7. [Detalhes Técnicos de Implementação](#detalhes-técnicos-de-implementação)
8. [Checklist de Segurança](#checklist-de-segurança)

---

## 🎯 VISÃO GERAL DO SISTEMA

### O que é o TOTVS Deep Web Intelligence?

Sistema avançado de detecção de empresas que já são clientes TOTVS, utilizando:
- **17 fontes de dados** (LinkedIn Jobs, Google News, notícias premium, documentos judiciais, etc.)
- **Busca inteligente** com variações de nome de empresa
- **Validação Triple/Double Match** para garantir precisão
- **Detecção de intenção de compra** em vagas de emprego
- **Interface rica** com highlights, copy buttons, e evidências detalhadas

### Por que esta versão é crítica?

Esta versão representa **3 dias de desenvolvimento intensivo** e inclui:
- ✅ Detecção precisa de empresas como Golden Cargo
- ✅ UI completa com highlights e copy buttons
- ✅ Busca por variações de nome + CNPJ
- ✅ Logs detalhados para debugging
- ✅ Sistema de cache e retry automático

---

## 🔒 ARQUIVOS CRÍTICOS

### ⚠️ NÃO MODIFICAR SEM EXTREMA NECESSIDADE

Estes arquivos são o **núcleo** do sistema e NÃO devem ser alterados sem backup prévio:

#### 1. **Backend - Edge Function TOTVS Check**
```
📁 supabase/functions/simple-totvs-check/index.ts
```

**O que faz:**
- Executa 17 queries diferentes no Serper
- Valida evidências com Triple/Double Match
- Detecta produtos TOTVS (Protheus, Fluig, RM, Datasul, etc.)
- Identifica intenção de compra em vagas
- Gera score de confiança (0-100)

**Funções Críticas:**
```typescript
getCompanyVariations(companyName: string) // Gera variações do nome
isValidTOTVSEvidence(...) // Valida se evidência é legítima
detectProducts(text: string) // Detecta produtos TOTVS no texto
hasIntentToBuy(text: string) // Detecta intenção de compra
```

**Pontos de Atenção:**
- ❌ NÃO alterar a lógica de `getCompanyVariations`
- ❌ NÃO remover logs de debug (console.log detalhados)
- ❌ NÃO mudar a estrutura de validação Triple/Double
- ❌ NÃO modificar os arrays de produtos TOTVS

---

#### 2. **Frontend - Componente de Visualização**
```
📁 src/components/totvs/TOTVSCheckCard.tsx
```

**O que faz:**
- Exibe resultados da verificação TOTVS
- Aplica highlights automáticos em termos encontrados
- Fornece botões de copiar URLs e termos
- Mostra badges de Triple/Double Match
- Apresenta intenção de compra detectada

**Funções Críticas:**
```typescript
copyToClipboard(text: string, type: string) // Copia para clipboard
highlightTerms(text: string, products?: string[]) // Aplica highlights
```

**Elementos de UI Críticos:**
- ✅ Badges de status (GO/REVISAR/NO-GO)
- ✅ Highlights em amarelo com `<mark>`
- ✅ Botões "Copiar URL" e "Copiar Termos"
- ✅ Filtros "Triple + Double" e "Only Triple"
- ✅ Badge "INTENÇÃO DE COMPRA DETECTADA"

**Pontos de Atenção:**
- ❌ NÃO remover `dangerouslySetInnerHTML` (usado para highlights)
- ❌ NÃO alterar a lógica de `highlightTerms`
- ❌ NÃO mudar as classes Tailwind dos highlights
- ❌ NÃO remover os estados `copiedUrl` e `copiedTerms`

---

#### 3. **Hook de Integração**
```
📁 src/hooks/useSimpleTOTVSCheck.ts
```

**O que faz:**
- Gerencia a chamada à edge function
- Controla cache (1 minuto de staleTime)
- Habilita/desabilita verificação automática
- Gerencia refetch e invalidação

**Configuração Crítica:**
```typescript
staleTime: 60 * 1000,      // 1 minuto
gcTime: 5 * 60 * 1000,     // 5 minutos
refetchOnMount: true,       // Verificar ao abrir
refetchOnWindowFocus: false // Não verificar ao focar janela
```

**Pontos de Atenção:**
- ❌ NÃO alterar os tempos de cache sem testar
- ❌ NÃO mudar a lógica de `enabled`

---

#### 4. **Utilitários de Proteção de Dados**
```
📁 src/lib/utils/dataProtection.ts
```

**O que faz:**
- Cria backups automáticos antes de operações críticas
- Permite restauração de dados em caso de erro
- Valida dados antes de operações
- Limpa backups antigos

**Funções Disponíveis:**
```typescript
createDataBackup(key, data, operation) // Cria backup
restoreDataBackup(key) // Restaura backup
withDataProtection(operation, options) // Executa com proteção
validateBeforeOperation(data, schema) // Valida dados
```

---

## ✅ FUNCIONALIDADES VALIDADAS

### 1. Detecção de Empresas TOTVS ✅

**Testado com:**
- ✅ Golden Cargo Transportes e Logística Ltda.
- ✅ Empresas com nomes longos e complexos
- ✅ Empresas com variações de nome (com/sem Ltda, S.A., etc.)

**Fontes de Dados (17 queries):**
1. LinkedIn Jobs (6 queries - produtos específicos)
2. Google News (3 queries)
3. Notícias Premium (3 queries - Valor, InfoMoney, Exame)
4. Documentos Judiciais (2 queries)
5. Casos de Sucesso (1 query)
6. CVM/RI (1 query)
7. Busca por CNPJ (1 query - se disponível)

---

### 2. Sistema de Validação Triple/Double Match ✅

**Triple Match (ALTA CONFIANÇA):**
- ✅ Nome da empresa no texto
- ✅ Palavra "TOTVS" no texto
- ✅ Produto específico detectado (Protheus, Fluig, etc.)
- **Peso:** 12 pontos

**Double Match (MÉDIA CONFIANÇA):**
- ✅ Nome da empresa + "TOTVS"
- ✅ OU Nome da empresa + Produto
- **Peso:** 8 pontos

**Produtos Detectados:**
- Protheus
- Fluig
- RM
- Datasul
- Winthor
- Microsiga
- Logix
- Smart

---

### 3. Interface Rica com Highlights ✅

**Highlights Automáticos:**
- ✅ Nome da empresa (todas variações)
- ✅ Palavra "TOTVS"
- ✅ Produtos detectados
- **Estilo:** `bg-yellow-200 dark:bg-yellow-800 px-1 rounded font-semibold`

**Botões de Ação:**
- ✅ "Copiar URL" - Copia link da fonte
- ✅ "Copiar Termos" - Copia termos encontrados
- ✅ "Ver Fonte" - Abre link em nova aba
- **Feedback Visual:** Ícone muda para check + mensagem "Copiado!"

---

### 4. Detecção de Intenção de Compra ✅

**Keywords Detectadas em Vagas:**
- "implementação"
- "implantação"
- "migração"
- "expansão"
- "projeto"
- "consultor"
- "analista"
- "desenvolvedor"

**Exibição na UI:**
- ✅ Badge destacado: "🎯 INTENÇÃO DE COMPRA DETECTADA"
- ✅ Lista de keywords encontradas
- ✅ Aumenta peso da evidência em 3 pontos

---

### 5. Sistema de Logs Detalhados ✅

**Logs Implementados:**
```
[SIMPLE-TOTVS] 🔍 Validando evidência
[SIMPLE-TOTVS] 📝 Variações do nome: [...]
[SIMPLE-TOTVS] ✅ TRIPLE MATCH!
[SIMPLE-TOTVS] ⚠️ DOUBLE MATCH
[SIMPLE-TOTVS] ❌ Rejeitado
[SIMPLE-TOTVS] 🎯 Intent to buy detectado
```

**Onde Ver:**
- Console do navegador (F12 > Console)
- Logs da edge function (Lovable Cloud > Backend > Edge Functions > simple-totvs-check)

---

## 🛡️ PROTOCOLO DE BLINDAGEM

### Passo 1: Snapshot Imediato no Lovable

**QUANDO FAZER:**
- ✅ Sempre que o sistema estiver funcionando perfeitamente
- ✅ Antes de qualquer mudança significativa
- ✅ Após resolver bugs críticos

**COMO FAZER:**
1. Clique no ícone de **relógio** (History) no topo da tela do Lovable
2. Veja a lista de edits/versões
3. Localize a versão atual (ex: "21/01/2025 - 15:30")
4. Clique em **"Bookmark"** ou anote o timestamp exato
5. Escreva uma descrição clara: "✅ VERSÃO ESTÁVEL - TOTVS Detection Completo"

**O QUE ANOTAR:**
```
Data/Hora: 21/01/2025 - 15:30
Descrição: TOTVS Detection v2.0 - Golden Cargo validado
Arquivos: simple-totvs-check/index.ts, TOTVSCheckCard.tsx
Status: ✅ FUNCIONAL
```

---

### Passo 2: Integração com GitHub (ALTAMENTE RECOMENDADO)

**POR QUE FAZER:**
- ✅ Backup automático de todas as mudanças
- ✅ Controle de versão profissional
- ✅ Recuperação de qualquer ponto no tempo
- ✅ Histórico permanente (nunca se perde)
- ✅ Trabalho em equipe facilitado

**COMO FAZER:**

#### A. Conectar GitHub ao Lovable
1. No Lovable, clique no botão **"GitHub"** (canto superior direito)
2. Clique em **"Connect to GitHub"**
3. Autorize o Lovable GitHub App na sua conta GitHub
4. Escolha a conta/organização onde criar o repositório

#### B. Criar Repositório
1. Clique em **"Create Repository"**
2. Nome sugerido: `olv-intelligence-prospect`
3. Descrição: "OLV Intelligence Prospect - Sistema de Detecção TOTVS"
4. Visibilidade: **Private** (recomendado para projetos comerciais)

#### C. Criar Tag de Versão Estável
No GitHub após a primeira sincronização:
1. Vá em **Releases** > **Create a new release**
2. Tag: `v2.0-stable-totvs`
3. Title: "🛡️ Versão Estável - TOTVS Detection Completo"
4. Description:
```markdown
## ✅ Funcionalidades Validadas
- Detecção TOTVS com 17 fontes
- Triple/Double Match validation
- UI com highlights e copy buttons
- Busca por variações de nome + CNPJ
- Golden Cargo testado e aprovado

## 🔒 Arquivos Críticos
- supabase/functions/simple-totvs-check/index.ts
- src/components/totvs/TOTVSCheckCard.tsx
- src/hooks/useSimpleTOTVSCheck.ts

## ⚠️ NÃO REGREDIR DESTA VERSÃO
```

---

### Passo 3: Backup Manual de Arquivos Críticos

**QUANDO FAZER:**
- Se não tiver GitHub conectado ainda
- Como segurança extra
- Antes de mudanças arriscadas

**COMO FAZER:**
1. Abra o Lovable em Dev Mode
2. Copie o conteúdo completo dos arquivos críticos:

#### Arquivo 1: `simple-totvs-check/index.ts`
```
1. Abra o arquivo no Lovable
2. Selecione TUDO (Ctrl+A / Cmd+A)
3. Copie (Ctrl+C / Cmd+C)
4. Cole em um editor de texto local
5. Salve como: backup-simple-totvs-check-21-01-2025.txt
```

#### Arquivo 2: `TOTVSCheckCard.tsx`
```
1. Abra o arquivo no Lovable
2. Selecione TUDO (Ctrl+A / Cmd+A)
3. Copie (Ctrl+C / Cmd+C)
4. Cole em um editor de texto local
5. Salve como: backup-TOTVSCheckCard-21-01-2025.txt
```

#### Arquivo 3: `useSimpleTOTVSCheck.ts`
```
1. Abra o arquivo no Lovable
2. Selecione TUDO
3. Copie
4. Salve como: backup-useSimpleTOTVSCheck-21-01-2025.txt
```

**ONDE SALVAR:**
- OneDrive / Google Drive (com data no nome)
- Pasta local organizada por data
- Email para você mesmo com assunto: "BACKUP TOTVS v2.0 - 21/01/2025"

---

### Passo 4: Documentar Configurações Externas

**APIs Utilizadas:**
- ✅ Serper API (busca na web)
- ✅ Supabase Edge Functions

**Secrets Configurados:**
```
SERPER_API_KEY=************
SUPABASE_URL=https://ioaxzpwlurpduanzkfrt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=************
```

**Anote estes dados:**
- Se perder acesso ao Lovable, precisará reconfigurar
- Guarde em gerenciador de senhas seguro

---

## 🚨 PROTOCOLO DE RECUPERAÇÃO DE EMERGÊNCIA

### CENÁRIO 1: Algo Quebrou Após Mudança Recente

**SINTOMAS:**
- Sistema não detecta mais empresas TOTVS
- Highlights não funcionam
- Botões de copiar não respondem
- Erro 500 na edge function

**SOLUÇÃO RÁPIDA:**

#### Opção A: Restaurar via Lovable History (MAIS RÁPIDO)
```
1. Clique no ícone de relógio (History) no topo
2. Procure pela versão estável anotada: "21/01/2025 - 15:30"
3. Clique em "Restore to this version"
4. Confirme a restauração
5. Aguarde rebuild (1-2 minutos)
6. Teste novamente com Golden Cargo
```

#### Opção B: Restaurar via GitHub (SE CONECTADO)
```
1. Acesse seu repositório no GitHub
2. Vá em "Releases"
3. Encontre a release "v2.0-stable-totvs"
4. Clique em "..." > "Browse files"
5. No Lovable, use "Restore from Git" (se disponível)
   OU copie manualmente os arquivos críticos do GitHub
```

#### Opção C: Backup Manual (ÚLTIMA OPÇÃO)
```
1. Abra seus arquivos de backup locais
2. No Lovable, abra cada arquivo crítico
3. Selecione todo o conteúdo atual e delete
4. Cole o conteúdo do backup
5. Salve (Ctrl+S / Cmd+S)
6. Aguarde rebuild
7. Teste
```

---

### CENÁRIO 2: Sistema Não Detecta Empresa Específica

**SINTOMAS:**
- Empresa confirmada como cliente TOTVS
- Sistema retorna 0 evidências
- Mas outras empresas funcionam normalmente

**DIAGNÓSTICO:**

#### Passo 1: Verificar Logs Detalhados
```
1. Abra Console do navegador (F12)
2. Faça nova verificação da empresa
3. Procure por logs:
   [SIMPLE-TOTVS] 🔍 Validando evidência
   [SIMPLE-TOTVS] 📝 Variações do nome
4. Veja se as variações estão corretas
5. Verifique se alguma evidência foi rejeitada
```

#### Passo 2: Teste Manual no Google
```
1. Abra o Google
2. Busque: "Nome da Empresa" TOTVS
3. Busque: "Nome da Empresa" TOTVS site:linkedin.com/jobs
4. Busque: "Nome da Empresa" Protheus
5. Se NÃO encontrar resultados, problema é falta de presença digital
6. Se encontrar, problema é na validação do sistema
```

#### Passo 3: Ajustar Validação (SE NECESSÁRIO)
```
Se o Google encontra mas sistema não:

1. Verifique as variações geradas no console
2. Talvez precise adicionar variação manual específica
3. Exemplo: "Empresa ABC Ltda" → adicionar "Grupo ABC"
4. Edite getCompanyVariations() COM CUIDADO
5. Faça backup antes!
```

---

### CENÁRIO 3: Sistema Muito Lento (>30 segundos)

**SINTOMAS:**
- Verificação demora mais de 30 segundos
- Timeout errors
- Serper API limits

**SOLUÇÕES:**

#### A. Verificar Quotas da API Serper
```
1. Acesse: https://serper.dev/dashboard
2. Verifique se não atingiu limite mensal
3. Se atingiu, upgrade de plano ou aguarde reset
```

#### B. Reduzir Número de Queries (TEMPORÁRIO)
```
Em simple-totvs-check/index.ts:

// Comentar algumas queries menos importantes
// Manter: LinkedIn Jobs + Google News + CNPJ
// Remover temporariamente: CVM, Judicial, etc.

ATENÇÃO: Isso reduz precisão!
```

#### C. Aumentar Timeout da Edge Function
```
Atualmente: sem timeout específico
Serper retorna em ~1-3 segundos por query
17 queries = ~20-30 segundos total (normal)

Se passar de 60 segundos: problema na API Serper
```

---

### CENÁRIO 4: Perda Total do Projeto no Lovable

**SINTOMAS:**
- Projeto não abre
- Erro crítico no Lovable
- Acidentalmente deletou tudo

**RECUPERAÇÃO:**

#### Opção 1: GitHub (SE CONECTADO) ✅
```
1. Seu código está SEGURO no GitHub
2. Crie novo projeto Lovable
3. Conecte ao repositório existente
4. Import from GitHub
5. Tudo será restaurado automaticamente
```

#### Opção 2: Backup Manual
```
1. Crie novo projeto Lovable
2. Recrie estrutura de pastas
3. Cole conteúdo dos backups nos arquivos
4. Reconecte Supabase (se necessário)
5. Reconfigure secrets (SERPER_API_KEY)
```

#### Opção 3: Contato com Suporte Lovable
```
Se perdeu tudo e não tem backup:
1. Entre em contato: support@lovable.dev
2. Explique situação
3. Eles podem ter backups internos
4. Prazo: 24-48h
```

---

## 📚 BOAS PRÁTICAS PARA MUDANÇAS FUTURAS

### 1. Antes de QUALQUER Mudança

**CHECKLIST OBRIGATÓRIO:**
```
□ Fiz snapshot no History?
□ Commit no GitHub? (se conectado)
□ Backup manual dos arquivos críticos?
□ Anotei o que vou mudar?
□ Sei como reverter se der errado?
```

---

### 2. Comunicação Clara com IA

**FRASES MÁGICAS:**

✅ **Use estas frases:**
```
"APENAS mude X, MANTENHA Y intacto"
"Adicione recurso Z SEM alterar funcionalidade existente"
"Foque SOMENTE em [área específica]"
"NÃO modifique: [lista de arquivos]"
"Preserve toda lógica atual de [funcionalidade]"
```

❌ **Evite frases vagas:**
```
"Melhore o sistema" (muito vago)
"Deixe bonito" (subjetivo)
"Arruma isso" (não específico)
```

---

### 3. Mudanças Incrementais

**REGRA DE OURO:** Uma mudança por vez

✅ **CERTO:**
```
Passo 1: Adicionar novo campo no formulário
  → Testa → Funciona → Commit

Passo 2: Adicionar validação no backend
  → Testa → Funciona → Commit

Passo 3: Atualizar UI para mostrar novo campo
  → Testa → Funciona → Commit
```

❌ **ERRADO:**
```
"Adiciona campo + validação + UI + relatório + email tudo junto"
  → Se quebrar, não sabe qual parte causou problema
```

---

### 4. Testar Sempre com Caso Real

**SEMPRE teste com:**
- ✅ Golden Cargo Transportes e Logística Ltda. (caso validado)
- ✅ Empresa com nome simples
- ✅ Empresa com nome complexo
- ✅ Empresa sem CNPJ
- ✅ Empresa que NÃO é cliente TOTVS (para validar false positives)

**COMO TESTAR:**
```
1. Após mudança, aguarde rebuild
2. Abra página da empresa no sistema
3. Clique em "Verificar TOTVS"
4. Verifique:
   □ Detectou corretamente?
   □ Highlights funcionando?
   □ Botões de copiar funcionando?
   □ Logs detalhados no console?
   □ Score de confiança coerente?
```

---

### 5. Áreas Seguras para Mudança

**PODE MODIFICAR SEM MUITO RISCO:**
- ✅ Estilos CSS / Tailwind (cores, espaçamentos, fontes)
- ✅ Textos e labels da interface
- ✅ Ordem de exibição de informações
- ✅ Adicionar novas páginas/rotas (que não afetam TOTVS check)
- ✅ Componentes completamente novos (em arquivos separados)

**MODIFICAR COM CUIDADO (BACKUP OBRIGATÓRIO):**
- ⚠️ Lógica de validação em `isValidTOTVSEvidence`
- ⚠️ Função `getCompanyVariations`
- ⚠️ Arrays de produtos TOTVS
- ⚠️ Configurações de cache no hook
- ⚠️ Estrutura das queries no Serper

**NÃO MODIFICAR (EXCETO SE ABSOLUTAMENTE NECESSÁRIO):**
- ❌ Estrutura base da edge function
- ❌ Lógica de Triple/Double Match
- ❌ Sistema de highlights com `dangerouslySetInnerHTML`
- ❌ Configuração de CORS na edge function

---

## 🔧 DETALHES TÉCNICOS DE IMPLEMENTAÇÃO

### Sistema de Variações de Nome

**Função:** `getCompanyVariations(companyName: string): string[]`

**Exemplo com "Golden Cargo Transportes e Logística Ltda.":**
```typescript
Input: "Golden Cargo Transportes e Logística Ltda."

Variações geradas:
1. "Golden Cargo Transportes e Logística Ltda." (original)
2. "Golden Cargo Transportes e Logística" (sem Ltda)
3. "Golden Cargo Transportes" (sem "e Logística Ltda.")
4. "Golden Cargo" (primeiras duas palavras)

Busca no texto: QUALQUER UMA dessas variações
```

**Por que funciona:**
- LinkedIn pode usar: "Golden Cargo"
- Notícias podem usar: "Golden Cargo Transportes"
- Documentos oficiais: nome completo

---

### Sistema Triple/Double Match

**Código Simplificado:**
```typescript
function isValidTOTVSEvidence(snippet, title, companyName) {
  const fullText = `${title} ${snippet}`.toLowerCase();
  const variations = getCompanyVariations(companyName);
  
  // Verifica se ALGUMA variação está no texto
  const hasCompany = variations.some(v => 
    fullText.includes(v.toLowerCase())
  );
  
  const hasTOTVS = fullText.includes('totvs');
  const products = detectProducts(fullText);
  const hasProduct = products.length > 0;
  
  // TRIPLE MATCH = empresa + TOTVS + produto
  if (hasCompany && hasTOTVS && hasProduct) {
    return { valid: true, matchType: 'triple', weight: 12 };
  }
  
  // DOUBLE MATCH = empresa + (TOTVS ou produto)
  if (hasCompany && (hasTOTVS || hasProduct)) {
    return { valid: true, matchType: 'double', weight: 8 };
  }
  
  return { valid: false };
}
```

---

### Sistema de Highlights

**Código Simplificado:**
```typescript
function highlightTerms(text: string, products?: string[]) {
  const variations = getCompanyVariations(companyName);
  const termsToHighlight = [
    ...variations,
    'TOTVS',
    'totvs',
    ...(products || [])
  ];
  
  // Cria regex: (termo1|termo2|termo3)
  const regex = new RegExp(
    `(${termsToHighlight.map(escapeRegex).join('|')})`,
    'gi'
  );
  
  // Substitui por <mark>termo</mark>
  return text.replace(regex, 
    '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded font-semibold">$1</mark>'
  );
}
```

**Resultado Visual:**
```
Antes: "Golden Cargo busca analista TOTVS Protheus"
Depois: "<mark>Golden Cargo</mark> busca analista <mark>TOTVS</mark> <mark>Protheus</mark>"
```

---

### Sistema de Copy to Clipboard

**Código:**
```typescript
async function copyToClipboard(text: string, type: 'url' | 'terms') {
  try {
    await navigator.clipboard.writeText(text);
    
    // Feedback visual
    if (type === 'url') setCopiedUrl(true);
    if (type === 'terms') setCopiedTerms(true);
    
    // Toast de sucesso
    toast.success('Copiado!', {
      description: type === 'url' ? 'URL copiada' : 'Termos copiados'
    });
    
    // Reset após 2 segundos
    setTimeout(() => {
      if (type === 'url') setCopiedUrl(false);
      if (type === 'terms') setCopiedTerms(false);
    }, 2000);
  } catch (error) {
    toast.error('Erro ao copiar');
  }
}
```

---

### 17 Queries Executadas

**Lista Completa:**
```typescript
Queries LinkedIn (6):
1. "{company} TOTVS Protheus site:linkedin.com/jobs"
2. "{company} TOTVS Fluig site:linkedin.com/jobs"
3. "{company} TOTVS RM site:linkedin.com/jobs"
4. "{company} TOTVS Datasul site:linkedin.com/jobs"
5. "{company} TOTVS site:linkedin.com/jobs"
6. "{company} Protheus site:linkedin.com/jobs"

Queries Google News (3):
7. "{company} TOTVS"
8. "{company} TOTVS implantação"
9. "{company} sistema gestão TOTVS"

Queries Notícias Premium (3):
10. "{company} TOTVS site:valor.globo.com OR site:infomoney.com.br"
11. "{company} TOTVS site:exame.com"
12. "{company} ERP TOTVS site:convergenciadigital.com.br"

Queries Documentos (2):
13. "{company} TOTVS filetype:pdf"
14. "{company} TOTVS contrato OR acordo"

Outros (2):
15. "{company} case TOTVS OR cliente TOTVS"
16. "{company} TOTVS site:cvm.gov.br OR site:ri.totvs.com"

Query CNPJ (1):
17. "{cnpj} TOTVS" (se CNPJ disponível)
```

---

## ✅ CHECKLIST DE SEGURANÇA

### Antes de QUALQUER Mudança

```
□ Sistema está funcionando 100%?
□ Testei com Golden Cargo recentemente?
□ Fiz snapshot no Lovable History?
□ Commit no GitHub? (se conectado)
□ Backup manual dos 3 arquivos críticos?
□ Anotei data/hora da versão estável?
```

---

### Após Mudança

```
□ Rebuild completou sem erros?
□ Testei com Golden Cargo?
□ Testei com empresa NÃO-cliente TOTVS?
□ Highlights funcionando?
□ Botões de copiar funcionando?
□ Logs no console estão corretos?
□ Performance aceitável (<30 segundos)?
□ Nenhum erro 500 na edge function?
```

---

### Sinais de Alerta (REVERTER IMEDIATAMENTE)

```
🚨 Sistema não detecta empresas conhecidas
🚨 Erro 500 na edge function
🚨 Highlights não aparecem
🚨 Botões de copiar não funcionam
🚨 Console cheio de erros
🚨 Verificação demora >60 segundos
🚨 Score sempre zero
🚨 Nenhuma evidência encontrada para qualquer empresa
```

**SE VER QUALQUER SINAL ACIMA:**
1. PARE imediatamente
2. NÃO faça mais mudanças
3. RESTAURE versão estável (History ou GitHub)
4. TESTE novamente
5. SÓ então investigue o problema

---

## 📞 CONTATOS DE EMERGÊNCIA

### Suporte Lovable
- Email: support@lovable.dev
- Discord: discord.gg/lovable
- Docs: docs.lovable.dev

### Suporte Serper API
- Email: support@serper.dev
- Dashboard: serper.dev/dashboard
- Docs: serper.dev/docs

---

## 📝 HISTÓRICO DE VERSÕES

### v2.0 - 21/01/2025 ✅ ATUAL
- ✅ Detecção completa com 17 fontes
- ✅ Variações de nome de empresa
- ✅ Busca por CNPJ
- ✅ Triple/Double Match validation
- ✅ UI com highlights automáticos
- ✅ Botões de copiar URL e termos
- ✅ Detecção de intenção de compra
- ✅ Logs detalhados
- ✅ Testado e validado com Golden Cargo

### v1.5 - 20/01/2025
- Implementação inicial de highlights
- Sistema básico de copy buttons
- Primeiras queries Serper

### v1.0 - 19/01/2025
- Versão inicial do componente TOTVS Check
- Integração com Serper API
- UI básica de resultados

---

## 🎯 PRÓXIMAS MELHORIAS SUGERIDAS

**Seguras para implementar (não afetam núcleo):**
1. ✅ Exportar resultados para PDF
2. ✅ Histórico de verificações por empresa
3. ✅ Dashboard com estatísticas gerais
4. ✅ Filtros avançados de visualização
5. ✅ Notificações quando empresa muda status

**Requerem cuidado extra:**
1. ⚠️ Adicionar mais fontes de dados (além das 17)
2. ⚠️ Ajustar pesos de Triple/Double Match
3. ⚠️ Modificar lógica de variações de nome
4. ⚠️ Integrar com outras APIs

**NÃO RECOMENDADAS (muito arriscadas):**
1. ❌ Reescrever do zero
2. ❌ Mudar framework/biblioteca base
3. ❌ Alterar estrutura fundamental das queries

---

## 🏆 MENSAGEM FINAL

**Esta versão representa dias de trabalho intensivo e foi validada em produção.**

**REGRA DE OURO:** 
> "Se está funcionando, NÃO mexa sem backup!"

**REGRA DE PRATA:**
> "Mudanças incrementais sempre. Uma coisa por vez."

**REGRA DE BRONZE:**
> "Teste com Golden Cargo antes de considerar pronto."

---

**Última Atualização:** 21/01/2025  
**Status:** ✅ DOCUMENTAÇÃO COMPLETA  
**Próxima Revisão:** A cada mudança significativa

---

*Este documento é a chave para manter o sistema funcionando perfeitamente. Guarde-o com carinho.* 🛡️
