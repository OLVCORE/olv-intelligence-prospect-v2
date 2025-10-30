import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

export interface TrevoMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface TrevoContext {
  userId?: string;
  currentPage?: string;
  companyId?: string;
  dealId?: string;
}

// Contexto estático com todo o conhecimento da plataforma para o RAG do TREVO
const PLATFORM_KNOWLEDGE = `
# CONHECIMENTO COMPLETO DA PLATAFORMA OLV INTELLIGENCE PROSPECT

## 🚀 TUTORIAL COMPLETO - TRANSFORME DADOS EM VENDAS EM 5 MINUTOS

### BEM-VINDO À SUA MÁQUINA DE VENDAS AUTOMATIZADA! 🎉

**O sistema em 3 passos simples:**
1. **Upload** → Envie sua lista de empresas
2. **Análise IA** → Algoritmo trabalha automaticamente
3. **Vendas** → Foque nos leads Hot com maior potencial

**FLUXO VISUAL COMPLETO:**
📊 Upload CSV → ✨ IA Analisa → 🔥 Score ICP → ✅ Quarentena → 🎯 Pool de Leads → 💰 Sales Workspace → 🚀 Fechamento

---

## 📊 PASSO 1: TRAGA SUAS EMPRESAS (Upload CSV)

### O QUE VOCÊ PRECISA:
✅ Planilha Excel ou CSV com lista de empresas
✅ Pode ter qualquer coluna: nome, CNPJ, site, email, telefone, setor, estado, cidade, funcionários
✅ Não precisa estar perfeito - a IA organiza e normaliza automaticamente!

### EXEMPLO DE CSV QUE FUNCIONA:
| Nome da Empresa    | CNPJ              | Site              | Email           |
|--------------------|-------------------|-------------------|-----------------|
| Empresa ABC Ltda   | 12.345.678/0001-90| empresaabc.com.br | contato@abc.com |
| Tech Solutions     | 98.765.432/0001-10| techsolutions.com | info@tech.com   |

### COLUNAS ACEITAS (nomes flexíveis):
- **Nome:** name, empresa, company, razao_social
- **CNPJ:** cnpj, document
- **Site:** website, site, url, domain
- **Email:** email, mail, contato
- **Telefone:** phone, telefone, tel, celular
- **Setor:** sector, setor, industry, segmento
- **Estado:** state, estado, uf
- **Cidade:** city, cidade, municipio
- **Funcionários:** employees, funcionarios, staff

### COMO FAZER O UPLOAD:
1. Acesse: **Menu → Captura de Leads** ou vá para **/leads/capture**
2. Clique em **"Upload Manual"**
3. Selecione seu arquivo CSV/Excel
4. Sistema detecta duplicados automaticamente (por CNPJ)
5. Leads inseridos com status 'pending' na quarentena
6. Validação automática inicia em seguida

💡 **DICA IMPORTANTE:** Quanto mais informação você fornecer (nome + CNPJ + site), melhor será a análise da IA!

---

## ✨ PASSO 2: IA ANALISA TUDO AUTOMATICAMENTE

### A MÁGICA ACONTECE AQUI! 🪄
Nossa IA analisa cada empresa em segundos, fazendo todo o trabalho pesado por você.

### O QUE A IA FAZ (3 ETAPAS):

**1️⃣ BUSCA INFORMAÇÕES PÚBLICAS** 🔍
- Pesquisa em +40 portais de vagas de emprego
- Busca perfil no LinkedIn da empresa
- Consulta dados na Receita Federal
- Valida website e email
- Detecta setor e porte da empresa

**2️⃣ DETECTA USO DE TOTVS** 🎯
- Identifica se empresa já usa sistema TOTVS
- Descarta automaticamente clientes atuais
- Detecta concorrentes (SAP, Oracle, Senior)
- Pontua fit com produtos TOTVS
- **RESULTADO:** Evita perda de tempo com prospects ruins

**3️⃣ CALCULA SCORE ICP (0-100 pontos)** 📊
- Analisa 7 dimensões de fit
- Classifica temperatura: Hot 🔥 / Warm 🌡️ / Cold ❄️
- Gera proposta de valor personalizada
- Cria script de abordagem único
- Estima ROI e valor do deal

### ⏱️ TEMPO DE PROCESSAMENTO:
- **10 empresas:** ~30 segundos ⚡
- **100 empresas:** ~5 minutos ⏳
- **1000 empresas:** ~50 minutos 🕐

### SCORE ICP - 7 DIMENSÕES (0-100 PONTOS):

1. **Setor (0-30pts)** → Prioriza: Agro, Indústria, Varejo, Saúde, Logística
2. **Porte (0-25pts)** → Ideal: Médias (51-200) e Grandes (200+) empresas  
3. **Região (0-20pts)** → Foco: SP, RJ, MG, RS, PR, SC, BA, PE
4. **Status TOTVS (0-20pts)** → Bônus se não usa TOTVS, penalidade se usa
5. **Concorrente (0-15pts)** → Identifica SAP, Oracle, SENIOR, Microsiga
6. **Qualidade Dados (0-10pts)** → Completude e validação dos dados
7. **Sinais de Intenção (0-10pts)** → Buscas no Google, visitas ao site, vagas abertas

---

## 🎯 PASSO 3: RESULTADOS NA QUARENTENA

### ENTENDENDO AS TEMPERATURAS DOS LEADS 🌡️

#### 🔥 **HOT LEADS (Score 70-100)**
- **O que é:** Cliente IDEAL para TOTVS
- **Características:** Setor prioritário + porte adequado + não usa TOTVS + região estratégica
- **O que fazer:** 📞 **LIGAR IMEDIATAMENTE!** Alta chance de compra
- **Prioridade:** MÁXIMA - Atenda no mesmo dia
- **Conversão:** 5x maior que leads frios
- **Automação:** Leads com score ≥75 viram Deals automaticamente no Sales Workspace

#### 🌡️ **WARM LEADS (Score 40-69)**
- **O que é:** Bom potencial, mas precisa de trabalho
- **Características:** Fit parcial com ICP, dados incompletos ou região secundária
- **O que fazer:** 📧 Nutrição por email + ligação em 24-48h
- **Prioridade:** MÉDIA - Trabalhe depois dos Hot
- **Estratégia:** Educar sobre TOTVS, enviar cases de sucesso, agendar demo

#### ❄️ **COLD LEADS (Score 0-39)**
- **O que é:** Baixo fit com ICP atual
- **Características:** Setor incompatível, porte pequeno, concorrente forte, dados ruins
- **O que fazer:** 💌 Email marketing automático, nutrição de longo prazo
- **Prioridade:** BAIXA - Foque em Hot e Warm primeiro
- **Quando abordar:** Apenas se sobrar tempo ou se score aumentar

### O QUE FAZER NA QUARENTENA? ✅

**3 PASSOS SIMPLES:**
1. 👀 **Revise** a lista de empresas analisadas pela IA
2. ✅ **Selecione** as empresas que você quer trabalhar
3. 🎯 **Aprove** para mover ao Pool de Leads (botão "Aprovar")

**FILTROS DISPONÍVEIS:**
- Por temperatura: Hot / Warm / Cold
- Por status: Pendente / Validando / Aprovado / Rejeitado / Duplicado
- Por fonte: Upload Manual / Empresas Aqui / API / Indicação
- Busca: Nome, CNPJ ou email (instantâneo)

**AÇÕES RÁPIDAS:**
- 🔍 **Validar Lead:** Executa validação completa (CNPJ, site, LinkedIn, email)
- ✅ **Aprovar Lead:** Move manualmente para o Pool de Leads
- ❌ **Rejeitar Lead:** Remove do fluxo de vendas (dados ruins, fora do ICP)
- 🎯 **Qualificar ICP →** Inicia análise aprofundada (apenas leads aprovados)

### SISTEMA DE SCORING DE VALIDAÇÃO (0-100):

**Critérios de validação:**
- ✅ CNPJ Válido (Receita Federal): +25pts
- ✅ Website Ativo (HTTP 200): +25pts  
- ✅ LinkedIn Encontrado: +20pts
- ✅ Email Válido (MX Records): +15pts
- ✅ Telefone Presente: +10pts
- ✅ Dados Completos (todos os campos): +5pts

**Resultado automático:**
- **70-100 pontos:** ✅ Aprovado automaticamente
- **30-69 pontos:** ⚠️ Revisão manual necessária (você decide)
- **0-29 pontos:** ❌ Rejeitado automaticamente (dados insuficientes)

---

## 🚀 PASSO 4: VENDA! FOQUE NOS MELHORES

### SEU PIPELINE ESTÁ PRONTO E PRIORIZADO! 🎯

Agora é só executar a estratégia de vendas com foco nos leads mais quentes.

### 🎯 ONDE TRABALHAR OS LEADS:

**1. POOL DE LEADS** (Visão Geral)
- URL: **/central-icp/home**
- Todas as empresas aprovadas organizadas por temperatura
- Cards visuais com score, setor, porte, região
- Filtros avançados: temperatura, score, setor, estado, porte
- Busca instantânea
- **Organize por:** Hot 🔥 → Warm 🌡️ → Cold ❄️

**2. SDR WORKSPACE** (Centro de Comando)
- URL: **/sdr/workspace**
- **11 abas especializadas** para gestão completa de vendas
- Pipeline visual de oportunidades (Kanban)
- Inbox unificado (WhatsApp + Email + LinkedIn)
- Tarefas e follow-ups automáticos
- Analytics e forecast de receita
- Health Monitor (IA detecta deals em risco)

### 📋 DICA DE OURO - ESTRATÉGIA DIÁRIA:

**MANHÃ (08:00-12:00):**
1. 🔥 **LIGAR para todos os Hot Leads** (prioridade máxima)
2. 📧 Enviar emails personalizados para Warm Leads
3. ✅ Atualizar status dos deals no pipeline
4. 📊 Revisar alertas do Health Monitor

**TARDE (13:00-17:00):**
1. 📞 Follow-ups de ligações da manhã
2. 💬 Responder mensagens no Inbox
3. 📈 Analisar analytics e forecast
4. 🤖 Configurar automações e sequences

**VELOCIDADE É TUDO! ⚡**
- Hot Leads contactados em <4h têm **5x mais conversão**
- Responder leads em <1h aumenta conversão em **391%**
- **REGRA:** Hot Lead entra → Liga em até 2 horas!

---

## VISÃO GERAL DO SISTEMA

### MÓDULOS DO SISTEMA
1. **Captura Inteligente** - Capture leads de múltiplas fontes (CSV, web scraping, API pública)
2. **Validação Automática** - CNPJ, website, LinkedIn, email validados automaticamente
3. **Qualificação com IA** - Score ICP 0-100 com 7 dimensões de análise
4. **Proposta Personalizada** - IA gera propostas de valor e scripts únicos
5. **Sales Workspace** - Centro de comando com 11 abas especializadas
6. **Analytics Avançado** - Funil de conversão, KPIs e insights acionáveis

---

## 📍 OUTRAS FORMAS DE CAPTURAR LEADS

### OPÇÃO 2: Buscar Empresas (Web Scraping)
- Acesse: **/central-icp/discovery** ou Menu → "Buscar Empresas"
- Configure filtros: setor, estado, porte, cidade
- Sistema faz scraping em bases públicas
- Empresas vão direto para a Quarentena
- **Vantagem:** Dados públicos atualizados, filtros precisos, 100% automatizado

### OPÇÃO 3: API Pública (Para Desenvolvedores)
- **Endpoint:** POST https://[projeto].supabase.co/functions/v1/capture-lead-api
- **Campos:** name (obrigatório), email, phone, sector, state, city, message, source
- **Uso:** Integração com sites, landing pages, formulários externos

---

## 💼 SALES WORKSPACE - CENTRO DE COMANDO COMPLETO

### O QUE É O SALES WORKSPACE?
**URL:** /sdr/workspace  
**Atalho:** Menu SDR → Sales Workspace

Centro unificado para gerenciar **todo o ciclo de vendas** com 11 abas especializadas. Substitui múltiplas ferramentas (CRM + Email + WhatsApp + Tasks + Analytics).

### 📊 ESTRUTURA - 11 ABAS ESPECIALIZADAS

#### **ABA 1: EXECUTIVO** 📈
Dashboard minimalista com indicadores críticos em tempo real.

**KPIs Principais:**
- 💰 **Pipeline Total** - Valor total de todas as oportunidades abertas
- 📊 **Taxa de Conversão** - % de deals ganhos vs total
- 💵 **Ticket Médio** - Valor médio por deal fechado
- ⚡ **Velocidade de Vendas** - Tempo médio para fechar deal (em dias)
- 📈 **MRR** - Monthly Recurring Revenue (receita recorrente)

**Alertas Inteligentes:**
- 🚨 Deals estagnados há +7 dias sem atividade
- ⏰ Follow-ups atrasados que precisam de atenção
- 🎯 Oportunidades sem contato há +3 dias

**Feed de Atividades:**
- Timeline unificada: tarefas + mensagens + contatos
- Filtros: últimos 7, 30 ou 90 dias
- Marca atividades como concluídas

#### **ABA 2: PIPELINE** 🎯
Kanban visual interativo de oportunidades.

**5 Estágios do Funil:**
1. 🔍 **Qualificação** - Lead inicial, discovery call
2. 💡 **Proposta** - Envio de proposta comercial
3. 🤝 **Negociação** - Ajustes de preço, objeções
4. 📝 **Fechamento** - Assinatura de contrato
5. ✅ **Ganho** - Deal fechado com sucesso

**Funcionalidades:**
- **Drag & Drop:** Arraste deals entre estágios
- **Edição Rápida:** Clique duplo para editar deal
- **Filtros:** Prioridade, valor, probabilidade, dono, temperatura
- **Busca Instantânea:** Encontre deals por nome, empresa, valor
- **Estatísticas:** Valor total e quantidade por estágio
- **Cores:** Visual por prioridade (Alta=Vermelho, Média=Amarelo, Baixa=Azul)

**Dica de Produtividade:**
- Atualize o pipeline **2x ao dia** (manhã e fim de tarde)
- Máximo **5-7 deals** em "Qualificação" simultaneamente
- Deals +7 dias sem atualização = **revisar urgente**

#### **ABA 3: HEALTH MONITOR** 🏥
IA monitora deals em risco 24/7 e sugere ações corretivas.

**Sinais de Risco Detectados:**
- 🚨 **Sem interação há +14 dias** - Cliente esfriou
- 📉 **Probabilidade caiu -20%** no último mês
- 👻 **Cliente não responde** emails/ligações
- ⏳ **Deal estagnado +30 dias** no mesmo estágio
- ❌ **Reuniões canceladas** repetidamente

**Recomendações IA:**
- 📞 **Ligar agora** (com script sugerido)
- 📧 **Email de reengajamento** (template pronto)
- 🤝 **Reunião de alinhamento** (agenda sugerida)
- 👔 **Escalar para gerente** (quando deal é estratégico)
- 💸 **Desconto estratégico** (margem de negociação)

#### **ABA 4: ANALYTICS** 📊
Dashboard completo de performance de vendas.

**4 Blocos de Análise:**

**1. Performance de Vendas:**
- Receita Total (mês, trimestre, ano)
- Taxa de Conversão Geral
- Ticket Médio por Deal
- Ciclo Médio de Vendas (dias)

**2. Performance SDRs:**
- Ranking de vendedores
- Atividades realizadas (calls, emails, meetings)
- Conversão individual
- Cumprimento de quota (%)

**3. Pipeline Health:**
- Distribuição por estágio (%)
- Velocidade por estágio (tempo médio)
- Deals estagnados (alerta)
- Valor ponderado (probabilidade × valor)

**4. Análise Temporal:**
- Evolução semanal/mensal (gráficos)
- Comparativo período anterior
- Tendências e sazonalidade
- Previsão próximos 90 dias

#### **ABA 5: FORECAST** 🔮
IA prevê receita futura com alta precisão.

**Previsões por Período:**
- **30 dias:** 90% de confiança (deals quentes)
- **60 dias:** 80% de confiança (pipeline atual)
- **90 dias:** 70% de confiança (tendências)

**3 Cenários:**
- 🟢 **Otimista:** Melhor caso (conversão acima da média)
- 🟡 **Realista:** Cenário mais provável (média histórica)
- 🔴 **Pessimista:** Pior caso (conversão abaixo da média)

**Riscos e Oportunidades:**
- Deals em risco de perder (+ valor em risco)
- Deals quase fechando (+ valor provável)
- Gap para meta do mês/trimestre

#### **ABAS 6-11 (RESUMO)**

**6. Funil AI** 🤖
- Análise de conversão por estágio
- Gargalos identificados pela IA
- Otimizações sugeridas
- Benchmark vs mercado

**7. Predição** 🎯
- Scoring preditivo ML (qual deal vai fechar?)
- Probabilidade de sucesso por deal
- Próximos passos sugeridos
- Melhor momento para follow-up

**8. Automações** ⚙️
- Alertas inteligentes configuráveis
- Ações automáticas (emails, tarefas)
- Workflows personalizados
- Integração com outros sistemas

**9. Inbox** 📬
- Mensagens centralizadas
- WhatsApp + Email + LinkedIn em um lugar
- Resposta rápida com templates
- Histórico completo de conversas

**10. Smart Tasks** ✅
- Tarefas com priorização IA
- Agenda inteligente (melhor horário)
- Follow-ups automáticos
- Notificações push/email

**11. Email Sequences** 📧
- Cadências automáticas
- Templates prontos para usar
- A/B testing de emails
- Métricas: open rate, click rate, reply rate

---

## 🎯 FLUXO DE TRABALHO DIÁRIO RECOMENDADO

### ROTINA MATINAL (08:00-12:00) ☀️
1. **08:00-08:30** → Aba **Executivo** (revisar KPIs e alertas)
2. **08:30-10:00** → Aba **Pipeline** (atualizar status de deals)
3. **10:00-10:30** → Aba **Health** (tratar deals em risco)
4. **10:30-12:00** → Aba **Smart Tasks** (calls e emails prioritários)

### ROTINA VESPERTINA (13:00-17:00) 🌅
1. **13:00-15:00** → Aba **Inbox** (responder mensagens) + **Sequences** (configurar cadências)
2. **15:00-16:00** → Aba **Analytics** (analisar performance) + **Forecast** (revisar previsões)
3. **16:00-17:00** → Aba **Automações** (configurar) + Registrar atividades do dia

### DICAS DE PRODUTIVIDADE ⚡
- ✅ Atualize pipeline **diariamente** (manhã + fim de dia)
- 🔥 Prioridades: **Alta** (hoje), **Média** (semana), **Baixa** (mês)
- ⏰ Deals +7 dias sem atualização → **Revisar urgente**
- 🎯 Máximo **5-7 deals** em "Qualificação" simultaneamente
- 📞 **Ligue sempre primeiro**, email depois
- ⚡ Velocidade importa: responda leads em <1h (conversão 391% maior)

### BENEFÍCIOS DO SALES WORKSPACE 💪
- ⏱️ **Economia:** 4-5 horas/dia de trabalho manual
- 📈 **Aumento:** 40-60% na taxa de conversão
- 🛡️ **Redução:** 50% de deals perdidos por falta de follow-up
- 🔮 **Previsibilidade:** 85-90% de acurácia na previsão de receita
- 👁️ **Visibilidade:** 100% em tempo real de todo o pipeline

---

## MÓDULO 4: SALES WORKSPACE (Centro de Comando)

### O QUE É?
Centro de comando unificado de vendas com 11 abas especializadas.
**URL:** /sdr/workspace | **Menu:** SDR → Sales Workspace

### ESTRUTURA COMPLETA - 11 ABAS

**ABA 1: EXECUTIVO (NOVA!)**
Dashboard executivo minimalista com indicadores críticos:
- **KPIs:** Pipeline Total (R$), Taxa Conversão (%), Ticket Médio (R$), Velocidade Vendas (dias), MRR
- **Alertas:** Deals estagnados +7 dias, follow-ups atrasados, oportunidades sem contato
- **Atividades:** Feed unificado de tarefas/mensagens/contatos com filtro de período (7, 30, 90 dias)

**ABA 2: PIPELINE**
Kanban visual interativo com 5 estágios: Qualificação → Proposta → Negociação → Fechamento → Ganho

Funcionalidades:
- Arrastar e soltar deals entre estágios
- Editar deal direto (clique duplo)
- Filtros: prioridade, valor, probabilidade, dono
- Busca instantânea
- Estatísticas por estágio

**ABA 3: HEALTH MONITOR (IA)**
Monitora deals em risco com IA. Sinais detectados:
- Sem interação há +14 dias
- Probabilidade caiu -20% no mês
- Cliente não responde
- Deal estagnado +30 dias
- Reuniões canceladas

Recomendações IA: Ligar (com script), email reengajamento (template), reunião alinhamento, escalar gerente, desconto estratégico

**ABA 4: ANALYTICS**
Dashboard completo:
- Performance Vendas: receita, conversão, ticket médio, ciclo vendas
- Performance SDRs: ranking, atividades, conversão individual, quota
- Pipeline Health: distribuição estágios, velocidade, estagnados, valor ponderado
- Análise Temporal: evolução semanal/mensal, comparativos, tendências, previsão 90 dias

**ABA 5: FORECAST (IA)**
Previsão de receita:
- 30 dias (90% confiança)
- 60 dias (80% confiança)
- 90 dias (70% confiança)
- Cenários: otimista/realista/pessimista
- Riscos e oportunidades

**ABAS 6-11 (RESUMO)**
6. **Funil AI:** Análise conversão com otimizações IA
7. **Predição:** Scoring preditivo ML
8. **Automações:** Alertas inteligentes e ações automáticas
9. **Inbox:** Mensagens centralizadas (emails, WhatsApp, LinkedIn)
10. **Smart Tasks:** Tarefas com priorização IA
11. **Email Sequences:** Cadências automáticas com templates

### FLUXO DE TRABALHO DIÁRIO RECOMENDADO
- 08:00-08:30: Executivo (KPIs, alertas)
- 08:30-10:00: Pipeline (atualizar status)
- 10:00-10:30: Health (deals em risco)
- 10:30-12:00: Smart Tasks (calls, emails)
- 13:00-15:00: Inbox e Sequences
- 15:00-16:00: Analytics e Forecast
- 16:00-17:00: Automações e registro

### DICAS DE PRODUTIVIDADE
- Atualize pipeline DIARIAMENTE (manhã e fim de dia)
- Prioridades: Alta (hoje), Média (semana), Baixa (mês)
- Deals sem atualização +7 dias → Revisar urgente
- Máximo 5-7 deals em "Qualificação" simultaneamente

### BENEFÍCIOS
- Economia de 4-5 horas/dia
- Aumento 40-60% conversão
- Redução 50% deals perdidos
- Previsibilidade 85-90% receita
- Visibilidade total real-time

---

## ❓ PERGUNTAS FREQUENTES (FAQ)

### CAPTURA E UPLOAD
**P: Como qualificar um lead rapidamente?**
R: Menu → Quarentena → Lead Aprovado → "Qualificar ICP →". Aguarde 15-30s para análise completa.

**P: Posso fazer upload de quantas empresas de uma vez?**
R: Sim! Não há limite. 10 empresas = 30s | 100 empresas = 5min | 1000 empresas = 50min

**P: O que acontece se houver duplicados no CSV?**
R: Sistema detecta automaticamente por CNPJ e ignora duplicados, sem gerar erro.

**P: Preciso ter CNPJ de todas as empresas?**
R: Não é obrigatório, mas quanto mais dados (nome + CNPJ + site), melhor será a análise da IA.

### SCORES E TEMPERATURAS
**P: O que fazer com leads COLD?**
R: Leads COLD (0-39pts) vão para nutrição por email. Não priorize. Foque em HOT (70-100pts) e WARM (40-69pts) primeiro.

**P: Por que meu lead ficou com score baixo?**
R: Score baixo pode indicar: setor incompatível, porte pequeno, já usa TOTVS ou concorrente forte, dados incompletos, região não prioritária.

**P: Como aumentar o score de um lead?**
R: Adicione mais dados (site, CNPJ, LinkedIn), valide informações, ou reclassifique manualmente se souber que é bom cliente.

**P: Qual diferença entre score de validação e score ICP?**
R: **Score de Validação** (0-100) = qualidade dos dados e validações (CNPJ, site, email). **Score ICP** (0-100) = fit estratégico com perfil de cliente ideal.

### SALES WORKSPACE
**P: Como saber se deal está em risco?**
R: Sales Workspace → Aba "Health". IA mostra deals em risco com sinais detectados e recomendações de ação.

**P: Quanto tempo para dominar Sales Workspace?**
R: Semana 1: Navegação básica (3-4 abas) | Semana 2: Uso de 5-6 abas | Semana 3: Fluxo otimizado | Semana 4: Expert completo

**P: Como criar novo deal?**
R: Sales Workspace → Pipeline → "Novo Deal" (botão principal) ou "+" em qualquer estágio do funil

**P: Como ver previsão de receita?**
R: Sales Workspace → Aba "Forecast" → IA mostra previsão para 30/60/90 dias com 3 cenários (otimista/realista/pessimista)

**P: Diferença entre Pipeline e Workspace?**
R: Não há! "Pipeline" era o nome antigo (aba única). Agora é "Sales Workspace" - mesmo lugar, mas com 11 abas especializadas.

**P: Onde vejo tarefas do dia?**
R: Sales Workspace → Aba "Smart Tasks" (tarefas com priorização IA) ou Aba "Executivo" (feed de atividades)

**P: Como configurar email automático?**
R: Sales Workspace → Aba "Email Sequences" → Tab "Builder" → Criar sequência → Adicionar emails → Definir intervalos → Ativar

### ANÁLISE E QUALIFICAÇÃO
**P: Como copiar script de abordagem?**
R: Página Qualificação ICP → Role até seção "Script de Abordagem" → Botão "Copiar Script" (copia para área de transferência)

**P: A proposta IA substitui meu trabalho?**
R: Não! A proposta é um **roteiro inteligente** para você personalizar. Use como base, adapte ao seu estilo e ao contexto do cliente.

**P: Preciso qualificar ICP de todos os leads?**
R: Recomendado apenas para leads **aprovados** na quarentena. Foque em Hot e Warm - leads Cold raramente valem o esforço.

**P: Como a IA detecta que empresa usa TOTVS?**
R: Busca em +40 portais de vagas (menções a "TOTVS", "Protheus", "Microsiga"), LinkedIn, site da empresa, sinais públicos online.

### ESTRATÉGIA E CONVERSÃO
**P: Qual a melhor hora para ligar para Hot Leads?**
R: **Manhã (09:00-11:00)** ou **Tarde (14:00-16:00)**. Evite segunda de manhã (ocupados) e sexta tarde (desengajamento).

**P: Quantos Hot Leads devo trabalhar por dia?**
R: SDR júnior: 5-8 | SDR pleno: 10-15 | SDR sênior: 15-20. Qualidade > Quantidade!

**P: Devo ligar ou mandar email primeiro?**
R: **Hot Leads:** SEMPRE ligar primeiro (urgência). **Warm Leads:** Email + ligação 24-48h. **Cold Leads:** Apenas email.

**P: O que fazer se o lead não atender a ligação?**
R: 1) Deixar recado curto e profissional | 2) Mandar email de acompanhamento | 3) Registrar no sistema | 4) Tentar novamente em 2-3 dias.

---

## ROTAS E NAVEGAÇÃO

**Principais URLs:**
- /leads/capture - Captura de leads
- /leads/quarantine - Quarentena inteligente
- /leads/icp-analysis - Qualificação ICP + IA
- /sdr/workspace - Sales Workspace (centro de comando)
- /central-icp/discovery - Busca empresas (scraping)
- /documentation - Este manual completo

**Atalhos importantes:**
- Botão "Manual do SDR" sempre visível no topo do Sales Workspace
- Redirecionamento automático: /sdr/dashboard → /sdr/workspace

---

## TECNOLOGIAS E APIs

**Validações usadas:**
- CNPJ: ReceitaWS API
- Website: HTTP Status Check
- LinkedIn: Web Scraping
- Email: DNS MX Records

**IA Generativa:**
- Proposta de valor: OpenAI GPT-4
- Score ICP: Algoritmo proprietário 7 dimensões
- Previsão receita: ML preditivo
- Health Monitor: Padrões comportamentais ML

**Edge Functions:**
- validate-lead-comprehensive
- upload-csv
- capture-api
- calculate-icp-score-advanced
- generate-value-proposition
- trevo-assistant (este assistente!)

---

## BOAS PRÁTICAS

### Para SDRs:
1. Sempre qualifique leads HOT primeiro (70-100pts)
2. Atualize pipeline 2x ao dia (manhã e tarde)
3. Leads +7 dias sem atualização = prioridade máxima
4. Pratique script 15-20min antes de ligar
5. Use proposta IA como roteiro, não leia textualmente

### Para Gestores:
1. Monitore aba Executivo diariamente
2. Revise Health Monitor semanalmente
3. Use Forecast para planejamento trimestral
4. Analytics para identificar gargalos no funil
5. Valide dados de quarentena regularmente

### Para Administradores:
1. Mantenha fontes de captura ativas
2. Configure automações no Workspace
3. Monitore performance das validações
4. Ajuste critérios de ICP conforme mercado
5. Treine equipe em todas as 11 abas do Workspace
`;

export function useTrevoAssistant(context: TrevoContext) {
  const [messages, setMessages] = useState<TrevoMessage[]>([
    {
      role: 'assistant',
      content: '👋 Olá! Sou o **TREVO**, seu assistente inteligente de vendas. Estou aqui para ajudá-lo a navegar pela plataforma, tomar decisões mais assertivas e acelerar seus resultados.\n\nComo posso ajudar você hoje?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Buscar usuário
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    }
  });

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;

    // Adicionar mensagem do usuário
    const newUserMessage: TrevoMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Preparar histórico de mensagens para a API
      const apiMessages = [...messages, newUserMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      // Adicionar conhecimento da plataforma como contexto do sistema
      const systemMessage = {
        role: 'system' as const,
        content: `Você é o TREVO, assistente inteligente de vendas da plataforma OLV Intelligence Prospect. Seu objetivo é ajudar os usuários SDRs a usar a plataforma com máxima eficiência.

INSTRUÇÕES:
- Seja direto, claro e objetivo em suas respostas
- Use emojis moderadamente para tornar as respostas mais amigáveis
- Sempre mencione URLs específicas quando relevante (ex: /leads/icp-analysis, /sdr/workspace)
- Se o usuário perguntar "como fazer X", dê passo a passo numerado
- Priorize ações práticas sobre teoria
- Quando mencionar funcionalidades com IA, destaque com badge/emoji 🤖
- Se não souber algo específico fora do conhecimento da plataforma, seja honesto

Use o conhecimento abaixo para responder perguntas sobre a plataforma:

${PLATFORM_KNOWLEDGE}

Contexto atual do usuário:
- Página atual: ${context.currentPage || 'não identificada'}
- Empresa em foco: ${context.companyId || 'nenhuma'}
- Deal em foco: ${context.dealId || 'nenhum'}
`
      };

      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('trevo-assistant', {
        body: {
          messages: [systemMessage, ...apiMessages],
          context: {
            ...context,
            userId: user?.id
          }
        }
      });

      if (error) throw error;

      // Adicionar resposta do assistente
      const assistantMessage: TrevoMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Error calling TREVO:', error);
      
      // Extrair mensagem de erro do backend
      let errorMsg = error?.message || '';
      
      // Se for um FunctionsHttpError, tentar pegar a mensagem do contexto
      if (error?.context?.error) {
        errorMsg = error.context.error;
      }
      
      // Classificar erros comuns
      const isCreditsError = /crédito|credit|402|payment/i.test(errorMsg);
      const isAuthError = /autentic|unauthorized|401|api key|invalid/i.test(errorMsg);
      const isRateLimit = /limite|rate|429/i.test(errorMsg);
      
      // Mensagem de erro amigável
      const errorMessage: TrevoMessage = {
        role: 'assistant',
        content: isCreditsError
          ? '💳 Os créditos da IA se esgotaram. Entre em contato com o administrador da plataforma para recarregar.'
          : isAuthError
          ? '🔐 Erro de autenticação. Entre em contato com o suporte.'
          : isRateLimit
          ? '⏳ Muitas solicitações em pouco tempo. Aguarde alguns instantes e tente novamente.'
          : `😔 Desculpe, encontrei um problema. Tente novamente em alguns instantes.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      if (isCreditsError) {
        toast.error('Créditos esgotados', {
          description: 'Os créditos da IA se esgotaram. Entre em contato com o administrador.',
          duration: 10000
        });
      } else if (isAuthError) {
        toast.error('Falha de autenticação', {
          description: 'Erro de autenticação com o serviço de IA',
          duration: 10000
        });
      } else if (isRateLimit) {
        toast.error('Limite de requisições', {
          description: 'Aguarde alguns instantes e tente novamente',
        });
      } else {
        toast.error('Erro ao comunicar com o TREVO', {
          description: errorMsg || 'Tente novamente em alguns instantes'
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, context, user]);

  const clearMessages = useCallback(() => {
    setMessages([{
      role: 'assistant',
      content: '👋 Olá! Sou o **TREVO**, seu assistente inteligente de vendas. Como posso ajudar você hoje?',
      timestamp: new Date()
    }]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages
  };
}
