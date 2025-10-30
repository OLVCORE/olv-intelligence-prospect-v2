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

## 📘 MANUAL DO OPERADOR - MÁQUINA DE VENDAS COMPLETA

### SISTEMA COMPLETO DE VENDAS B2B COM INTELIGÊNCIA ARTIFICIAL
**v1.0 - STRATEVO Intelligence**

Este manual completo documenta toda a operação da plataforma OLV Intelligence Prospect, desde a captura até o fechamento de deals.

---

## 🎯 VISÃO GERAL DO SISTEMA

### O QUE É A MÁQUINA DE VENDAS?

A **Máquina de Vendas** é um sistema completo e automatizado que transforma listas frias de empresas em oportunidades qualificadas de vendas, usando Inteligência Artificial para:

✅ **Capturar** leads de múltiplas fontes (CSV, API, Web Scraping)  
✅ **Validar** automaticamente CNPJ, website, LinkedIn e email  
✅ **Qualificar** com score ICP 0-100 pontos em 7 dimensões  
✅ **Priorizar** por temperatura: Hot 🔥 / Warm 🌡️ / Cold ❄️  
✅ **Gerar** propostas de valor e scripts de abordagem únicos  
✅ **Gerenciar** todo o ciclo de vendas em centro de comando unificado  

### PILARES DO SISTEMA

**1. AUTOMAÇÃO INTELIGENTE**
- 90% do trabalho manual eliminado
- Validações instantâneas em 40+ fontes públicas
- Score ICP calculado automaticamente
- Propostas geradas por IA em 15 segundos

**2. PRIORIZAÇÃO ESTRATÉGICA**
- Leads classificados por temperatura
- Focus em Hot Leads (5x mais conversão)
- Alertas de deals em risco
- Recomendações IA de próximos passos

**3. CENTRO DE COMANDO UNIFICADO**
- 11 abas especializadas no Sales Workspace
- Pipeline visual Kanban
- Health Monitor com IA preditiva
- Analytics e forecast de receita

**4. DADOS E INSIGHTS**
- Funil de conversão em tempo real
- Performance individual de SDRs
- Previsão de receita 30/60/90 dias
- Gargalos identificados automaticamente

### RESULTADOS ESPERADOS

**Velocidade:**
- Upload → Leads qualificados: **5-50 minutos** (conforme volume)
- Proposta de valor IA: **15 segundos** por lead
- Tempo economizado: **4-5 horas/dia** de trabalho manual

**Conversão:**
- Taxa de conversão: **+40-60%** vs abordagem manual
- Deals perdidos: **-50%** por falta de follow-up
- Precisão forecast: **85-90%** de acurácia

**Produtividade:**
- SDR júnior: **5-8 Hot Leads/dia**
- SDR pleno: **10-15 Hot Leads/dia**
- SDR sênior: **15-20 Hot Leads/dia**

---

## 🔄 FLUXO COMPLETO DE OPERAÇÃO

### VISÃO MACRO - 6 ETAPAS

**ETAPA 1: CAPTURA** 📊
- Upload CSV com lista de empresas
- Web scraping com filtros (setor, estado, porte)
- API pública para integrações externas
- Leads inseridos com status 'pending'

**ETAPA 2: QUARENTENA** 🛡️
- Validação automática de CNPJ (ReceitaWS)
- Validação de website (HTTP status)
- Busca de LinkedIn corporativo
- Verificação MX records de email
- Score de validação 0-100 calculado

**ETAPA 3: APROVAÇÃO/REJEIÇÃO** ✅❌
- Leads com score ≥70 → Aprovados automaticamente
- Leads 30-69 → Revisão manual necessária
- Leads <30 → Rejeitados (dados insuficientes)
- Operador pode aprovar/rejeitar manualmente

**ETAPA 4: QUALIFICAÇÃO ICP** 🎯
- Análise de fit em 7 dimensões
- Score ICP 0-100 calculado
- Classificação: Hot (70-100) / Warm (40-69) / Cold (0-39)
- Detecção de uso de TOTVS e concorrentes
- Geração de proposta de valor IA

**ETAPA 5: POOL DE LEADS** 🏊
- Leads aprovados e qualificados
- Organizados por temperatura
- Filtros avançados (score, setor, região)
- Busca instantânea
- Exportação para CSV

**ETAPA 6: SALES WORKSPACE** 💼
- Criação de deals no pipeline
- Gestão de oportunidades (Kanban)
- Follow-ups e tarefas automáticas
- Health Monitor com IA preditiva
- Analytics e forecast de receita

### FLUXO VISUAL DETALHADO

FLUXO: 📊 UPLOAD → 🛡️ QUARENTENA → ✅ APROVAÇÃO → 🎯 QUALIFICAÇÃO ICP → 🏊 POOL → 💼 SALES WORKSPACE → 🚀 FECHAMENTO
       (CSV)      (Validação)      (Filtros)       (Score 0-100)        (Leads)    (11 Abas)            (Deal Ganho)

### CRITÉRIOS DE TRANSIÇÃO ENTRE ETAPAS

**Quarentena → Pool de Leads:**
- ✅ Lead aprovado manualmente OU
- ✅ Score validação ≥70 (automático) OU
- ✅ Operador clicou "Aprovar Lead"

**Pool → Sales Workspace:**
- ✅ Lead com score ICP ≥75 (automático - vira deal) OU
- ✅ SDR clica "Criar Deal" manualmente OU
- ✅ Lead com temperatura Hot (prioridade máxima)

**Qualificação ICP quando executar:**
- ✅ Apenas em leads já APROVADOS na quarentena
- ✅ Recomendado para Hot e Warm (Cold raramente vale)
- ✅ Acesso: Quarentena → Lead → "Qualificar ICP →"

---

## 📊 MÓDULO 1: CAPTURA INTELIGENTE

### VISÃO GERAL DA CAPTURA

A **Captura** é o ponto de entrada de leads no sistema. Existem 3 formas de capturar empresas:

1. **Upload Manual (CSV/Excel)** - Mais comum, ideal para listas prontas
2. **Busca Empresas (Web Scraping)** - Busca automatizada com filtros
3. **API Pública** - Integração com sites, landing pages, formulários

### FORMA 1: UPLOAD MANUAL (CSV/EXCEL)

**URL:** '/leads/capture'  
**Menu:** Captura de Leads → Upload Manual

#### PASSO A PASSO:

1. **Prepare sua planilha:**
   - Formato aceito: CSV ou XLSX
   - Tamanho máximo: **10.000 linhas** por arquivo
   - Encoding: UTF-8 (padrão Excel/Google Sheets)

2. **Colunas aceitas (nomes flexíveis):**

| Coluna Sugerida | Nomes Alternativos Aceitos | Obrigatório? |
|----------------|----------------------------|--------------|
| Nome | name, empresa, company, razao_social, cliente | ✅ SIM |
| CNPJ | cnpj, document, documento | ⚠️ Recomendado |
| Site | website, site, url, domain, link | ⚠️ Recomendado |
| Email | email, mail, contato, e-mail | ⚠️ Recomendado |
| Telefone | phone, telefone, tel, celular, fone | Opcional |
| Setor | sector, setor, industry, segmento, ramo | Opcional |
| Estado | state, estado, uf | Opcional |
| Cidade | city, cidade, municipio, localidade | Opcional |
| Funcionários | employees, funcionarios, staff, colaboradores | Opcional |

3. **Sistema normaliza automaticamente:**
   - Remove espaços extras
   - Formata CNPJ (XX.XXX.XXX/XXXX-XX)
   - Detecta duplicados por CNPJ
   - Insere status 'pending' na quarentena

4. **Validação inicial:**
   - Nome obrigatório (mínimo 3 caracteres)
   - CNPJ validado se fornecido
   - Website validado se fornecido
   - Email validado se fornecido

#### EXEMPLO DE CSV PERFEITO:

FORMATO CSV:
Nome,CNPJ,Site,Email,Telefone,Setor,Estado,Cidade,Funcionários
Empresa ABC Ltda,12.345.678/0001-90,empresaabc.com.br,contato@abc.com,(11) 98765-4321,Indústria,SP,São Paulo,150
Tech Solutions,98.765.432/0001-10,techsolutions.com,info@tech.com,(21) 91234-5678,Tecnologia,RJ,Rio de Janeiro,80

#### TRATAMENTO DE DUPLICADOS:

Sistema detecta duplicados por:
1. **CNPJ** (prioridade máxima) - Se CNPJ já existe, ignora
2. **Nome + Estado** - Se empresa já existe no mesmo estado, alerta
3. **Email** - Se email já existe, sugere revisão

**Comportamento automático:**
- Duplicado exato (CNPJ) → **Ignora** silenciosamente
- Duplicado parcial (nome similar) → **Insere** mas marca flag
- Sem CNPJ → Sistema não detecta duplicados (insere sempre)

#### VOLUME E PERFORMANCE:

| Volume | Tempo Médio | Recomendação |
|--------|-------------|--------------|
| 10 empresas | ~30 segundos | ⚡ Teste rápido |
| 100 empresas | ~5 minutos | ✅ Upload padrão |
| 500 empresas | ~25 minutos | ⏳ Upload grande |
| 1000 empresas | ~50 minutos | 🕐 Upload massivo |

💡 **DICA:** Divida uploads grandes em lotes de 500 para melhor controle.

### FORMA 2: BUSCA EMPRESAS (WEB SCRAPING)

**URL:** '/central-icp/discovery'  
**Menu:** Central ICP → Buscar Empresas

#### FUNCIONALIDADES:

**Filtros Disponíveis:**
- **Setor:** Tecnologia, Indústria, Varejo, Saúde, Agronegócio, Logística, Educação, Serviços
- **Estado:** Todos os estados brasileiros (foco SP, RJ, MG, RS, PR, SC)
- **Porte:** Micro (1-10), Pequena (11-50), Média (51-200), Grande (200+)
- **Cidade:** Principais capitais e cidades estratégicas

**Fontes de Dados:**
- Portais de vagas de emprego (+40 sites)
- Diretórios empresariais públicos
- LinkedIn corporativo
- Google Places API
- Registros CNPJ Receita Federal (públicos)

**Processo:**
1. Configure filtros desejados
2. Clique "Buscar Empresas"
3. Sistema executa scraping em tempo real
4. Empresas encontradas vão para **Quarentena**
5. Validação automática inicia em seguida

**Vantagens:**
- ✅ Dados públicos atualizados
- ✅ Filtros precisos
- ✅ 100% automatizado
- ✅ Sem necessidade de planilha prévia

**Limitações:**
- ⏳ Mais lento que upload CSV (1-2 empresas/segundo)
- 📊 Volume limitado a 500 empresas por busca
- 🌐 Depende de disponibilidade das fontes

### FORMA 3: API PÚBLICA (PARA DESENVOLVEDORES)

**Endpoint:** POST https://seu-projeto.supabase.co/functions/v1/capture-lead-api

**Headers:** Content-Type: application/json, Authorization: Bearer ANON_KEY

**Body (JSON):** name (obrigatório), email, phone, sector, state, city, message, source

**Campos:** name (obrigatório - string min 3 caracteres), email (opcional - validado), phone (opcional - formatado), sector (opcional - normalizado), state (opcional - sigla UF), city (opcional), message (opcional - em notes), source (opcional - identifica origem)

**Resposta de Sucesso (200):** success: true, lead_id: uuid, message: Lead capturado com sucesso

**Casos de Uso:**
- Formulários de contato em sites
- Landing pages de campanhas
- Integração com CRMs externos
- Webhooks de automação
- Chatbots e assistentes virtuais

---

## 🛡️ MÓDULO 2: QUARENTENA INTELIGENTE

### VISÃO GERAL DA QUARENTENA

A **Quarentena** é o centro de triagem de leads, onde todos os leads capturados passam por validações automáticas antes de serem aprovados para o pool de vendas.

**URL:** '/leads/quarantine'  
**Menu:** Quarentena Inteligente

### OBJETIVOS DA QUARENTENA:

1. **Validar Dados** - Verificar CNPJ, site, email, LinkedIn
2. **Filtrar Lixo** - Rejeitar empresas com dados ruins/falsos
3. **Detectar Duplicados** - Evitar leads repetidos
4. **Calcular Score de Validação** - 0-100 pontos de qualidade
5. **Aprovar/Rejeitar** - Decidir quais leads merecem atenção

### STATUS POSSÍVEIS NA QUARENTENA:

| Status | Ícone | Descrição | Ação Necessária |
|--------|-------|-----------|-----------------|
| **pending** | 🟡 | Aguardando validação | Aguarde ou valide manualmente |
| **validating** | 🔄 | Validação em progresso | Aguarde conclusão (~15-30s) |
| **approved** | ✅ | Validado e aprovado | Pode qualificar ICP ou criar deal |
| **rejected** | ❌ | Dados insuficientes ou inválidos | Revisar dados ou descartar |
| **duplicate** | 🔁 | CNPJ duplicado detectado | Verificar se já existe no sistema |

### SISTEMA DE SCORE DE VALIDAÇÃO (0-100)

O **Score de Validação** mede a **qualidade e completude dos dados** do lead, não o fit estratégico (isso é o Score ICP).

#### CRITÉRIOS DE PONTUAÇÃO:

| Critério | Pontos | Como é Validado |
|----------|--------|-----------------|
| **CNPJ Válido** | +25 | Consulta ReceitaWS API (Receita Federal) |
| **Website Ativo** | +25 | HTTP Status Check (200 OK) + Tempo resposta <5s |
| **LinkedIn Encontrado** | +20 | Busca perfil corporativo no LinkedIn |
| **Email Válido** | +15 | DNS MX Records verificados + Sintaxe RFC |
| **Telefone Presente** | +10 | Campo preenchido e formatado corretamente |
| **Dados Completos** | +5 | Todos os campos preenchidos (nome, CNPJ, site, email, telefone, setor, estado) |

**SCORE TOTAL = Soma de todos os critérios atendidos (máximo 100)**

#### REGRAS DE APROVAÇÃO AUTOMÁTICA:

- **Score 70-100:** ✅ **Aprovado automaticamente** - Alta qualidade, pronto para vendas
- **Score 30-69:** ⚠️ **Revisão manual necessária** - Você decide se aprova ou rejeita
- **Score 0-29:** ❌ **Rejeitado automaticamente** - Dados insuficientes ou inválidos

### VALIDAÇÕES DETALHADAS:

#### 1. VALIDAÇÃO DE CNPJ (+25pts)

**Processo:**
1. Formata CNPJ (remove pontos, barras, hífens)
2. Valida dígitos verificadores (algoritmo MOD-11)
3. Consulta ReceitaWS API (Receita Federal)
4. Verifica situação cadastral (ativa ou não)

**Resultado:**
- ✅ CNPJ válido e ativo → +25pts
- ⚠️ CNPJ válido mas inativo → +10pts (alerta)
- ❌ CNPJ inválido ou não encontrado → 0pts

**Dados Enriquecidos:**
- Razão social oficial
- Nome fantasia
- Data de abertura
- Endereço completo
- Natureza jurídica
- Capital social

#### 2. VALIDAÇÃO DE WEBSITE (+25pts)

**Processo:**
1. Normaliza URL (adiciona https:// se necessário)
2. Tenta acesso HTTP/HTTPS
3. Verifica status code (200 = sucesso)
4. Mede tempo de resposta (<5s = bom)
5. Detecta redirecionamentos

**Resultado:**
- ✅ Site acessível (200 OK) e rápido → +25pts
- ⚠️ Site acessível mas lento (>5s) → +15pts
- ⚠️ Site com redirecionamento → +10pts
- ❌ Site inacessível ou erro → 0pts

**Sinais de Qualidade:**
- 🟢 HTTPS válido (certificado SSL)
- 🟢 Tempo resposta <2s (excelente)
- 🟡 Redirecionamento (pode ser válido)
- 🔴 Erro 404, 500, timeout (problema)

#### 3. VALIDAÇÃO DE LINKEDIN (+20pts)

**Processo:**
1. Busca perfil corporativo no LinkedIn
2. Verifica se empresa tem página oficial
3. Conta número de seguidores
4. Detecta atividade recente (posts)

**Resultado:**
- ✅ LinkedIn encontrado e ativo (posts recentes) → +20pts
- ⚠️ LinkedIn encontrado mas inativo → +10pts
- ❌ LinkedIn não encontrado → 0pts

**Dados Enriquecidos:**
- Número de funcionários (estimativa)
- Setor/indústria
- Especialidades
- Localização sede

#### 4. VALIDAÇÃO DE EMAIL (+15pts)

**Processo:**
1. Valida sintaxe (RFC 5322)
2. Verifica domínio do email
3. Consulta DNS MX Records
4. Detecta emails temporários/descartáveis

**Resultado:**
- ✅ Email válido com MX ativo → +15pts
- ⚠️ Email válido mas sem MX → +5pts
- ❌ Email inválido ou temporário → 0pts

**Classificação de Qualidade:**
- 🟢 Email corporativo (@empresa.com.br) - MELHOR
- 🟡 Email genérico (@gmail, @hotmail) - ACEITÁVEL
- 🔴 Email temporário (@tempmail) - REJEITADO

#### 5. VALIDAÇÃO DE TELEFONE (+10pts)

**Critérios:**
- Campo preenchido → +5pts
- Formato válido (DDD + número) → +3pts
- DDD válido (lista oficial Anatel) → +2pts

**Formatos Aceitos:**
- (11) 98765-4321 - Celular com DDD
- (21) 3456-7890 - Fixo com DDD
- 11987654321 - Apenas números
- +55 11 98765-4321 - Internacional

#### 6. COMPLETUDE DE DADOS (+5pts)

**Critérios:**
- ✅ Todos os campos obrigatórios preenchidos → +5pts
- ⚠️ Apenas campos essenciais (nome + CNPJ) → +2pts
- ❌ Apenas nome → 0pts

**Campos Avaliados:**
- Nome (obrigatório)
- CNPJ
- Website
- Email
- Telefone
- Setor
- Estado

### AÇÕES DISPONÍVEIS NA QUARENTENA:

#### 1. VALIDAR LEAD (Botão 🔍)

**O que faz:**
- Executa validação completa (todos os 6 critérios)
- Atualiza score de validação
- Enriquece dados automaticamente
- Atualiza status para 'validating' → 'approved' ou 'rejected'

**Quando usar:**
- Lead com status 'pending' (não validado ainda)
- Lead com dados atualizados manualmente
- Dúvida sobre qualidade do lead

**Tempo:** ~15-30 segundos por lead

#### 2. APROVAR LEAD (Botão ✅)

**O que faz:**
- Move lead manualmente para Pool de Leads
- Ignora score de validação
- Define status como 'approved'
- Lead fica disponível para qualificação ICP

**Quando usar:**
- Você conhece a empresa e sabe que é válida
- Lead com score 30-69 mas você quer trabalhar
- Indicação direta de parceiro/cliente

#### 3. REJEITAR LEAD (Botão ❌)

**O que faz:**
- Define status como 'rejected'
- Remove do fluxo de vendas
- Não aparece mais no Pool de Leads
- Mantém registro no histórico

**Quando usar:**
- Dados claramente falsos ou inválidos
- Empresa fora do perfil (ex: pessoa física)
- Lead com score <30 e dados incompletos
- Duplicado confirmado

#### 4. QUALIFICAR ICP → (Botão 🎯)

**O que faz:**
- Inicia análise aprofundada de fit estratégico
- Calcula Score ICP 0-100 em 7 dimensões
- Gera proposta de valor com IA
- Cria script de abordagem personalizado
- Detecta uso de TOTVS e concorrentes

**Quando usar:**
- ✅ Apenas em leads **aprovados** (status 'approved')
- ✅ Recomendado para leads com score validação ≥70
- ✅ Priorize Hot e Warm (Cold raramente vale)

**Tempo:** ~15-30 segundos por lead

**IMPORTANTE:** Qualificação ICP é paga (consome créditos IA), use com sabedoria!

### FILTROS E BUSCA NA QUARENTENA:

#### FILTROS DISPONÍVEIS:

**Por Status:**
- 🟡 Pendente (pending)
- 🔄 Validando (validating)
- ✅ Aprovado (approved)
- ❌ Rejeitado (rejected)
- 🔁 Duplicado (duplicate)

**Por Temperatura (se qualificado ICP):**
- 🔥 Hot (score ICP 70-100)
- 🌡️ Warm (score ICP 40-69)
- ❄️ Cold (score ICP 0-39)

**Por Fonte:**
- 📊 Upload Manual
- 🔍 Empresas Aqui (scraping)
- 🌐 API Pública
- 👥 Indicação

**Por Score de Validação:**
- 🟢 Alto (70-100)
- 🟡 Médio (30-69)
- 🔴 Baixo (0-29)

#### BUSCA INSTANTÂNEA:

**Busca por:**
- Nome da empresa (parcial ou completo)
- CNPJ (com ou sem formatação)
- Email (parcial ou completo)
- Telefone
- Cidade ou Estado

**Comportamento:**
- Busca em tempo real (sem necessidade de pressionar Enter)
- Case-insensitive (maiúsculas/minúsculas)
- Aceita caracteres especiais (CNPJ com pontos)

### BOAS PRÁTICAS NA QUARENTENA:

#### PARA OPERADORES:

1. **Revise Quarentena DIARIAMENTE** (2x ao dia: manhã e tarde)
2. **Priorize leads com score ≥70** (aprovação automática)
3. **Valide manualmente leads 30-69** antes de rejeitar
4. **Rejeite imediatamente leads <30** (economize tempo)
5. **Marque duplicados** quando detectados
6. **Use filtros** para focar em leads específicos

#### PARA GESTORES:

1. **Monitore taxa de aprovação** (ideal: 70-80% de aprovados)
2. **Revise leads rejeitados** semanalmente (pode ter falsos negativos)
3. **Valide qualidade das fontes** de captura
4. **Ajuste critérios de validação** se necessário
5. **Treine operadores** em validação manual

#### ARMADILHAS COMUNS:

- ❌ **Aprovar sem validar** - Lixo entra no pool de leads
- ❌ **Rejeitar tudo automaticamente** - Perde oportunidades
- ❌ **Não revisar duplicados** - Contata empresa 2x (péssima impressão)
- ❌ **Ignorar quarentena** - Leads ficam parados indefinidamente
- ❌ **Qualificar ICP de leads rejeitados** - Desperdício de créditos

---

## 🎯 MÓDULO 3: QUALIFICAÇÃO ICP

### VISÃO GERAL DA QUALIFICAÇÃO ICP

A **Qualificação ICP** (Ideal Customer Profile) é onde a IA analisa profundamente cada lead aprovado e determina o **fit estratégico** com o perfil de cliente ideal da TOTVS.

**URL:** '/leads/icp-analysis/{company_id}'  
**Acesso:** Quarentena → Lead Aprovado → Botão "Qualificar ICP →"

### O QUE É O SCORE ICP?

O **Score ICP** é uma nota de **0 a 100 pontos** que indica o quão BOM é aquele lead para a TOTVS, considerando 7 dimensões estratégicas:

1. **Setor** (0-30pts) - Empresa está em setor prioritário?
2. **Porte** (0-25pts) - Tamanho da empresa é adequado?
3. **Região** (0-20pts) - Localização é estratégica?
4. **Status TOTVS** (0-20pts) - Já usa TOTVS? (penalidade se sim)
5. **Concorrente** (0-15pts) - Usa SAP, Oracle, SENIOR?
6. **Qualidade Dados** (0-10pts) - Dados completos e validados?
7. **Sinais de Intenção** (0-10pts) - Busca ativa por soluções?

**SCORE TOTAL = Soma de todas as dimensões (máximo 100)**

### CLASSIFICAÇÃO POR TEMPERATURA:

| Temperatura | Score ICP | Significado | O Que Fazer |
|-------------|-----------|-------------|-------------|
| 🔥 **HOT** | 70-100 | Cliente IDEAL para TOTVS | **LIGAR IMEDIATAMENTE!** Alta conversão |
| 🌡️ **WARM** | 40-69 | Bom potencial, precisa trabalho | Nutrição + ligação em 24-48h |
| ❄️ **COLD** | 0-39 | Baixo fit com ICP | Email marketing automático, baixa prioridade |

### DETALHAMENTO DAS 7 DIMENSÕES:

#### 1. SETOR (0-30 pontos) - MÁXIMA IMPORTÂNCIA

**Setores Prioritários (pontos máximos):**
- 🏭 **Indústria/Manufatura** → +30pts (máximo fit TOTVS)
- 🌾 **Agronegócio/Agro** → +30pts (máximo fit TOTVS)
- 🏪 **Varejo/Comércio** → +28pts (alto fit)
- 🏥 **Saúde/Hospitalar** → +25pts (alto fit)
- 🚚 **Logística/Transporte** → +25pts (alto fit)
- 🏗️ **Construção Civil** → +22pts (médio-alto fit)
- 🍔 **Alimentação/Restaurantes** → +20pts (médio fit)

**Setores Secundários (pontos médios):**
- 📚 **Educação** → +15pts
- 🏨 **Hospitalidade/Turismo** → +15pts
- 💼 **Serviços Profissionais** → +12pts
- 📞 **Call Center/BPO** → +10pts

**Setores Baixa Prioridade (pontos baixos):**
- 💻 **Tecnologia/Software** → +5pts (baixo fit, geralmente usam SaaS próprio)
- 🏦 **Financeiro/Bancos** → +5pts (regulação específica)
- 🏛️ **Governo/Setor Público** → +3pts (processos licitatórios complexos)

**Detecção Automática do Setor:**
- Análise de palavras-chave no nome da empresa
- Consulta LinkedIn corporativo
- Busca em CNAE (Receita Federal)
- Web scraping do site institucional

#### 2. PORTE (0-25 pontos) - ALTA IMPORTÂNCIA

**Classificação por Número de Funcionários:**
- 🏢 **Grande (200+ funcionários)** → +25pts (máximo fit - alto valor contrato)
- 🏢 **Média-Grande (101-200)** → +22pts (alto fit)
- 🏪 **Média (51-100)** → +18pts (bom fit - sweet spot TOTVS)
- 🏪 **Pequena-Média (26-50)** → +12pts (fit moderado)
- 🏠 **Pequena (11-25)** → +8pts (fit baixo)
- 🏠 **Micro (1-10)** → +3pts (muito pequena para TOTVS)

**Fontes de Dados:**
- LinkedIn corporativo (mais confiável)
- Portais de vagas de emprego
- CNPJ Receita Federal (estimativa)
- Declaração no site institucional

**Por Que Porte Importa?**
- Empresas maiores → Contratos de maior valor (💰 maior MRR)
- Empresas médias → Equilíbrio ideal entre valor e facilidade de venda
- Empresas pequenas → Contratos menores, maior churn

#### 3. REGIÃO (0-20 pontos) - MÉDIA IMPORTÂNCIA

**Estados Prioritários (pontos altos):**
- 🟢 **São Paulo (SP)** → +20pts (maior mercado, +40% vendas TOTVS)
- 🟢 **Rio de Janeiro (RJ)** → +18pts (2º maior mercado)
- 🟢 **Minas Gerais (MG)** → +16pts (forte indústria)
- 🟢 **Rio Grande do Sul (RS)** → +15pts (forte agro)
- 🟢 **Paraná (PR)** → +15pts (forte agro + indústria)
- 🟢 **Santa Catarina (SC)** → +14pts (forte indústria)

**Estados Secundários (pontos médios):**
- 🟡 **Bahia (BA)** → +12pts
- 🟡 **Pernambuco (PE)** → +12pts
- 🟡 **Ceará (CE)** → +11pts
- 🟡 **Goiás (GO)** → +10pts
- 🟡 **Distrito Federal (DF)** → +10pts
- 🟡 **Espírito Santo (ES)** → +10pts

**Demais Estados (pontos baixos):**
- 🔴 Outros estados → +5 a +8pts (menor presença TOTVS)

**Por Que Região Importa?**
- Presença física de equipe TOTVS (suporte on-site)
- Ecossistema de parceiros locais
- Cultura de adoção de ERPs
- Custo de operação e deslocamento

#### 4. STATUS TOTVS (0-20 pontos) - ALTA IMPORTÂNCIA

**Regras de Pontuação:**
- ✅ **NÃO usa TOTVS** → +20pts (oportunidade máxima)
- ⚠️ **Usa TOTVS parcial** (1-2 módulos) → +10pts (upsell possível)
- ❌ **Usa TOTVS completo** (3+ módulos) → -10pts (EVITAR - já é cliente)
- ❌ **Cliente TOTVS recente** (<2 anos) → -20pts (EVITAR - contrato vigente)

**Como a IA Detecta:**
1. **Busca em portais de vagas:**
   - "Conhecimento em TOTVS Protheus" (forte sinal)
   - "Experiência com Microsiga" (legado TOTVS)
   - "Usuário TOTVS" (sinal fraco, pode ser ex-funcionário)

2. **Análise do LinkedIn:**
   - Funcionários com "TOTVS" nas habilidades
   - Posts mencionando TOTVS
   - Certificações TOTVS na empresa

3. **Scraping do site:**
   - Menção a TOTVS em "Nossos Sistemas"
   - Logos de parceiros (TOTVS)
   - Certificações exibidas

4. **Base de clientes TOTVS** (se disponível):
   - CNPJ na base de clientes ativos
   - Histórico de contratos

**Por Que Status TOTVS É Crítico:**
- Cliente atual = **perda de tempo** (não pode vender)
- Não cliente = **oportunidade real**
- Ex-cliente = **oportunidade de reconquista** (abordagem diferente)

#### 5. CONCORRENTE (0-15 pontos)

**Detecção de Concorrentes:**
- ❌ **SAP** → -15pts (maior concorrente, difícil trocar)
- ❌ **Oracle** → -12pts (grande concorrente enterprise)
- ❌ **SENIOR** → -10pts (concorrente médio porte)
- ❌ **Microsiga** → -5pts (legado, agora é TOTVS)
- ✅ **Nenhum detectado** → +15pts (oportunidade limpa)

**Como a IA Detecta:**
- Mesma lógica do Status TOTVS
- Busca menções em vagas de emprego
- Análise de LinkedIn de funcionários
- Scraping do site institucional

**Por Que Concorrente Importa:**
- SAP/Oracle → Empresas grandes, difícil migrar (custo alto)
- SENIOR → Concorrente direto médio porte
- Sem ERP → Oportunidade limpa, fácil venda

#### 6. QUALIDADE DADOS (0-10 pontos)

**Pontuação Baseada no Score de Validação:**
- Score Validação 90-100 → +10pts (dados perfeitos)
- Score Validação 70-89 → +8pts (dados bons)
- Score Validação 50-69 → +5pts (dados médios)
- Score Validação 30-49 → +3pts (dados fracos)
- Score Validação 0-29 → 0pts (dados ruins)

**Por Que Importa:**
- Dados completos = facilita abordagem
- Dados validados = reduz bounce de emails/ligações
- Dados ruins = desperdício de tempo

#### 7. SINAIS DE INTENÇÃO (0-10 pontos)

**Sinais Captados:**
- 🔍 **Buscas no Google** relacionadas a "ERP", "sistema gestão" → +4pts
- 💼 **Vagas de emprego abertas** para "Analista de Sistemas ERP" → +3pts
- 📈 **Crescimento rápido** (abertura de filiais) → +2pts
- 🌐 **Visita ao site TOTVS** (se rastreável) → +1pt

**Fontes:**
- Google Ads/Analytics (se integrado)
- Portais de vagas (Indeed, LinkedIn, Catho)
- Notícias sobre expansão da empresa
- Dados públicos de crescimento

**Por Que Importa:**
- Timing é tudo! Empresa buscando ERP = **urgência**
- Sinal de intenção = **3x mais conversão**

### O QUE ACONTECE APÓS QUALIFICAÇÃO ICP?

**Processamento:**
1. IA calcula score nas 7 dimensões (~15s)
2. Soma pontos e define temperatura (Hot/Warm/Cold)
3. Gera **proposta de valor personalizada** com IA
4. Cria **script de abordagem único** para o SDR
5. Estima **valor do deal** e **ROI esperado**

**Dados Gerados:**

#### 1. PROPOSTA DE VALOR IA (Texto Automático)

A IA gera proposta personalizada destacando: setor prioritário, porte ideal, região estratégica, solução TOTVS recomendada, investimento estimado, ROI esperado, diferenciais competitivos e próximos passos.

#### 2. SCRIPT DE ABORDAGEM IA (Roteiro de Ligação)

A IA cria roteiro completo com: abertura (15s), qualificação (30s com perguntas), proposta de valor (45s), fechamento (30s agendamento demo), tratamento de objeções (já temos sistema, não tenho tempo, muito caro).

#### 3. ESTIMATIVA DE VALOR DO DEAL

**Cálculo Automático:** MRR Estimado (Monthly Recurring Revenue), LTV (Lifetime Value), Payback Period (tempo recuperar investimento), ROI Esperado (retorno sobre investimento). Exemplo: MRR R$ 2.000/mês, Contrato 36 meses, Valor Total R$ 72.000, Payback 18-24 meses, ROI Cliente 250% em 3 anos.

### AUTOMAÇÕES PÓS-QUALIFICAÇÃO:

#### LEADS HOT (Score ICP ≥75):
- ✅ **Cria Deal automaticamente** no Sales Workspace
- ✅ Estágio inicial: "Qualificação"
- ✅ Prioridade: "Alta"
- ✅ Notificação push para SDR responsável
- ✅ Tarefa automática: "Ligar em até 4 horas"

#### LEADS WARM (Score ICP 40-74):
- ✅ Fica disponível no Pool de Leads
- ✅ Sugestão: "Enviar email antes de ligar"
- ✅ Cadência de nutrição recomendada (7 dias)

#### LEADS COLD (Score ICP 0-39):
- ✅ Fica no Pool mas sem urgência
- ✅ Sugestão: "Email marketing automático"
- ✅ Revisão mensal (pode esquentar)

### BOAS PRÁTICAS NA QUALIFICAÇÃO ICP:

#### QUANDO QUALIFICAR:
- ✅ **SEMPRE:** Leads aprovados com score validação ≥70
- ✅ **RECOMENDADO:** Leads Warm com dados completos
- ⚠️ **TALVEZ:** Leads Cold apenas se tiver certeza de fit
- ❌ **NUNCA:** Leads rejeitados ou com dados ruins (desperdício)

#### COMO USAR OS DADOS:
- 📖 **Leia a proposta IA** antes de ligar (contexto)
- 📝 **Adapte o script** ao seu estilo pessoal (não leia roboticamente)
- 💡 **Use os diferenciais** destacados pela IA
- 🎯 **Foque nas dores** identificadas (produção, estoque, custos)
- 📞 **Pratique o script** 2-3x antes de ligar (fluidez)

#### ARMADILHAS COMUNS:
- ❌ Qualificar TUDO sem critério (gasta créditos IA)
- ❌ Ignorar a proposta IA e fazer abordagem genérica
- ❌ Ler o script textualmente (soa artificial)
- ❌ Não atualizar dados após ligação
- ❌ Esquecer de criar deal no Workspace

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
