# FASE 1: Pipeline Visual & Deal Management - Plano de Implementação

## 📊 Status Atual: 95% Completo

### ✅ O QUE JÁ TEMOS IMPLEMENTADO

#### 1. Pipeline SDR (`/sdr/pipeline`)
- ✅ Visualização Kanban de deals por estágio
- ✅ 7 estágios padrão: Novo Lead → Qualificado → Contato → Proposta → Negociação → Ganho → Perdido
- ✅ Drag & drop de cards entre estágios
- ✅ Filtros avançados (estágio, valor, empresa, responsável, período)
- ✅ Cards com informações completas (empresa, valor, responsável, data)
- ✅ Quick actions nos cards (editar, excluir, histórico)
- ✅ Métricas em tempo real (total pipeline, deals por estágio, taxa conversão)
- ✅ Forecast de vendas baseado em probabilidade
- ✅ Integração com banco de dados (`sdr_deals` table)

#### 2. Gestão de Deals
- ✅ CRUD completo via componente `DealCard`
- ✅ Associação com empresas
- ✅ Valor monetário e probabilidade
- ✅ Responsável (assigned_to)
- ✅ Data de fechamento esperado
- ✅ Notas e histórico
- ✅ Status tracking

#### 3. Analytics & Forecast
- ✅ `/sdr/analytics` - Dashboard completo de métricas
- ✅ Taxa de conversão por estágio
- ✅ Tempo médio no funil
- ✅ Forecast de receita (weighted pipeline)
- ✅ Top performers
- ✅ Deals ganhos vs perdidos

#### 4. Integrações Ativas
- ✅ Telefonia Twilio
- ✅ Email (IMAP + envio)
- ✅ WhatsApp (webhook Twilio)
- ✅ Enriquecimento 360° automático

---

## 🔨 O QUE FALTA IMPLEMENTAR (5%)

### 1. Melhorias no Kanban Visual

#### A) Customização de Estágios
**Problema:** Os 7 estágios são fixos no código.

**Solução:**
- [ ] Criar tabela `pipeline_stages` (nome, ordem, cor, probabilidade_padrao)
- [ ] Interface para admin criar/editar/reordenar estágios
- [ ] Permitir pipelines personalizados por equipe/produto

**Arquivos a criar/editar:**
```
- supabase/migrations/create_pipeline_stages.sql (migration)
- src/hooks/usePipelineStages.ts (hook customizado)
- src/components/sdr/PipelineStageManager.tsx (UI admin)
- src/pages/SDRPipelinePage.tsx (usar stages dinâmicos)
```

#### B) Bulk Actions
**Problema:** Não dá para editar múltiplos deals de uma vez.

**Solução:**
- [ ] Checkbox de seleção múltipla nos cards
- [ ] Barra de ações em massa (mover estágio, atribuir responsável, excluir)
- [ ] Confirmar antes de executar

**Arquivos a editar:**
```
- src/components/sdr/DealCard.tsx (adicionar checkbox)
- src/pages/SDRPipelinePage.tsx (bulk actions UI + lógica)
```

#### C) Arrastar entre Colunas com Animação
**Problema:** Drag & drop funciona mas sem feedback visual.

**Solução:**
- [ ] Adicionar animações suaves com `framer-motion`
- [ ] Indicador visual ao arrastar (drop zones destacados)
- [ ] Toast de confirmação ao mover

**Arquivos a editar:**
```
- src/pages/SDRPipelinePage.tsx (adicionar framer-motion)
- src/components/sdr/DealCard.tsx (animações no card)
```

---

### 2. Integração Bitrix24 (Novo)

#### Objetivo
Permitir sincronização bidirecional de deals entre OLV Intelligence e Bitrix24.

#### Recursos Necessários
- [ ] Secrets: `BITRIX24_WEBHOOK_URL` e `BITRIX24_USER_ID`
- [ ] Tabela `bitrix_sync_config` (user_id, webhook_url, sync_direction, last_sync)
- [ ] Tabela `bitrix_sync_log` (histórico de sincronizações)

#### Funcionalidades

**A) Autenticação & Setup**
- [ ] UI para configurar webhook Bitrix (em `/sdr/integrations`)
- [ ] Validar conexão antes de salvar
- [ ] Selecionar direção: OLV → Bitrix, Bitrix → OLV, ou bidirecional

**Arquivos a criar:**
```
- supabase/migrations/create_bitrix_sync_tables.sql
- supabase/functions/bitrix-sync-deals/index.ts (função principal)
- supabase/functions/bitrix-test-connection/index.ts (validar webhook)
- src/components/sdr/BitrixIntegrationConfig.tsx (UI de configuração)
- src/pages/SDRIntegrationsPage.tsx (adicionar seção Bitrix)
```

**B) Sincronização de Deals**
- [ ] Mapear campos OLV ↔ Bitrix:
  - `sdr_deals.title` → `TITLE`
  - `sdr_deals.stage` → `STAGE_ID`
  - `sdr_deals.value` → `OPPORTUNITY`
  - `sdr_deals.company_id` → `COMPANY_ID` (via lookup)
  - `sdr_deals.assigned_to` → `ASSIGNED_BY_ID`
- [ ] Webhook recebendo updates do Bitrix
- [ ] Cron job para sincronização periódica (a cada 15min)

**Arquivos:**
```
- supabase/functions/bitrix-webhook-receiver/index.ts (receber eventos)
- supabase/functions/bitrix-sync-deals/index.ts (sincronizar deals)
```

**C) Histórico & Logs**
- [ ] Mostrar última sincronização na UI
- [ ] Botão "Sincronizar Agora" manual
- [ ] Logs detalhados de erros/sucessos

**Arquivos:**
```
- src/hooks/useBitrixSync.ts (hook para gerenciar sync)
- src/components/sdr/BitrixSyncStatus.tsx (status visual)
```

---

## 📋 PLANO DE EXECUÇÃO

### Etapa 1: Melhorias Kanban (1-2 horas)
1. [ ] Criar migration `pipeline_stages`
2. [ ] Implementar hook `usePipelineStages`
3. [ ] Criar `PipelineStageManager` component
4. [ ] Atualizar `SDRPipelinePage` para usar stages dinâmicos
5. [ ] Adicionar bulk actions
6. [ ] Melhorar animações drag & drop

### Etapa 2: Integração Bitrix24 (2-3 horas)
1. [ ] Criar migrations (sync_config + sync_log)
2. [ ] Implementar edge functions:
   - `bitrix-test-connection`
   - `bitrix-sync-deals`
   - `bitrix-webhook-receiver`
3. [ ] Criar UI de configuração (`BitrixIntegrationConfig`)
4. [ ] Adicionar na página `/sdr/integrations`
5. [ ] Implementar hook `useBitrixSync`
6. [ ] Criar componente de status `BitrixSyncStatus`
7. [ ] Configurar cron job no Supabase

### Etapa 3: Testes & Refinamentos (1 hora)
1. [ ] Testar criação/edição/exclusão de deals
2. [ ] Testar drag & drop entre estágios
3. [ ] Testar sincronização Bitrix (mock data)
4. [ ] Validar logs e histórico
5. [ ] Performance check (drag & drop com 100+ deals)

---

## 🎯 RESULTADO ESPERADO

Após concluir a FASE 1, teremos:

✅ **Pipeline Kanban 100% Funcional**
- Estágios customizáveis
- Bulk actions
- Animações suaves
- Drag & drop responsivo

✅ **Integração Bitrix24 Completa**
- Sincronização automática de deals
- Webhook para eventos em tempo real
- UI de configuração intuitiva
- Logs e histórico de sync

✅ **Benchmark com Bitrix24**
- Mesma funcionalidade de Kanban
- Sincronização bidirecional
- Inteligência 360° adicional (nosso diferencial)

---

## 🚀 PRÓXIMAS FASES

**FASE 2:** Comunicação Unificada (videoconferência + WhatsApp UI completo)  
**FASE 3:** Automações & IA Proativa (workflow builder + AI Co-Pilot)  
**FASE 4:** Analytics & Forecast (análises preditivas + dashboards executivos)  
**FASE 5:** Integrações Adicionais (Pipedrive, HubSpot, Salesforce)

---

## 📞 PERGUNTAS ANTES DE COMEÇAR

1. **Estágios customizáveis:** Quer poder criar pipelines diferentes (ex: vendas, CS, recrutamento)?
2. **Bitrix24:** Você já tem uma conta Bitrix? Precisa do webhook URL para testar.
3. **Sincronização:** Quer que seja automática (a cada 15min) ou só manual?
4. **Prioridade:** Prefere focar em melhorias do Kanban OU integração Bitrix primeiro?

---

**Aguardando aprovação para iniciar implementação! 🚀**
