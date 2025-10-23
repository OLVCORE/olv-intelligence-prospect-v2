# Estratégia Multi-Tenant para Go-Live SaaS

## 📋 Objetivo
Documentar a estratégia de conversão de todas as integrações de API para um modelo SaaS multi-tenant escalável.

---

## 🔑 Modelos de Multi-Tenancy

### **Modelo 1: Conta Centralizada (MVP)**
- **Descrição**: Uma única conta/API key gerenciada pela plataforma
- **Vantagens**: Simples, custos previsíveis, controle total
- **Desvantagens**: Limites compartilhados, custos crescem com uso
- **Melhor para**: Validação inicial, até ~100 clientes

### **Modelo 2: BYOK (Bring Your Own Key)**
- **Descrição**: Clientes fornecem suas próprias credenciais
- **Vantagens**: Zero custo de API para nós, escalável infinitamente
- **Desvantagens**: Fricção no onboarding, suporte complexo
- **Melhor para**: Clientes enterprise, heavy users

### **Modelo 3: Híbrido (Freemium → Premium)**
- **Descrição**: Conta centralizada para free/básico, BYOK para premium
- **Vantagens**: Melhor UX + monetização + escalabilidade
- **Desvantagens**: Requer implementação dupla
- **Melhor para**: Crescimento sustentável

---

## 🎯 Inventário de APIs e Estratégia Recomendada

### **1. PhantomBuster** (LinkedIn Scraping)
- **Status Atual**: Secrets centralizadas no Lovable Cloud
- **Custo**: $59-499/mês baseado em execuções
- **Rate Limits**: ~10-30 execuções/dia por conta
- **Estratégia Recomendada**: **Híbrido**
  - **Free/Basic**: 5 scraped profiles/mês usando conta centralizada
  - **Pro**: 50 profiles/mês usando conta centralizada
  - **Enterprise**: BYOK ilimitado
- **Implementação**:
  ```sql
  -- Tabela para credenciais por cliente
  CREATE TABLE company_integrations (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    integration_type TEXT, -- 'phantombuster'
    api_key TEXT, -- encrypted
    agent_id TEXT, -- encrypted
    session_cookie TEXT, -- encrypted
    monthly_quota INTEGER,
    usage_count INTEGER DEFAULT 0,
    last_reset_at TIMESTAMPTZ DEFAULT now()
  );
  ```

---

### **2. Apollo.io** (B2B Data Enrichment)
- **Status Atual**: Secret centralizada (APOLLO_API_KEY)
- **Custo**: $49-149/usuário/mês, créditos por enriquecimento
- **Rate Limits**: 50-500 requests/dia dependendo do plano
- **Estratégia Recomendada**: **Conta Centralizada (curto prazo) → Híbrido (médio prazo)**
  - **Razão**: Apollo cobra por usuário, não por volume de API
  - **Free/Basic**: 10 enriquecimentos/mês
  - **Pro**: 100 enriquecimentos/mês
  - **Enterprise**: BYOK para clientes que já tem conta Apollo
- **Prioridade**: Média (pode começar centralizado)

---

### **3. ReceitaWS** (Dados Fiscais Brasil)
- **Status Atual**: Secret centralizada (RECEITAWS_API_TOKEN)
- **Custo**: ~R$50-200/mês baseado em requisições
- **Rate Limits**: 3 requests/minuto (free), ilimitado (pago)
- **Estratégia Recomendada**: **Conta Centralizada**
  - **Razão**: API barata, essencial para mercado brasileiro
  - **Implementação**: Manter centralizada, incluir no custo fixo da operação
  - **Contingência**: Implementar cache agressivo (TTL 30 dias)
- **Prioridade**: Baixa (manter centralizado)

---

### **4. Serper / Google Custom Search** (Web Search)
- **Status Atual**: Secrets centralizadas (SERPER_API_KEY, GOOGLE_API_KEY, GOOGLE_CSE_ID)
- **Custo**: 
  - Serper: $50/mês (2.500 searches)
  - Google CSE: $5 per 1000 queries
- **Rate Limits**: 100 requests/segundo (Serper)
- **Estratégia Recomendada**: **Conta Centralizada**
  - **Razão**: Baixo custo por request, difícil para clientes configurarem
  - **Implementação**: Incluir no custo base, limitar a 10-50 searches/empresa/mês
- **Prioridade**: Baixa (manter centralizado)

---

### **5. Hunter.io** (Email Finding & Verification)
- **Status Atual**: Secret centralizada (HUNTER_API_KEY)
- **Custo**: $49-399/mês baseado em searches/verifications
- **Rate Limits**: 50-10,000 requests/mês dependendo do plano
- **Estratégia Recomendada**: **Híbrido**
  - **Free**: 10 email searches/mês (conta centralizada)
  - **Pro**: 100 searches/mês (conta centralizada)
  - **Enterprise**: BYOK
- **Prioridade**: Alta (implementar sistema de quotas)

---

### **6. Lovable AI** (GPT-5 / Gemini)
- **Status Atual**: Secret auto-configurada (LOVABLE_API_KEY)
- **Custo**: Usage-based, incluído até certo limite
- **Rate Limits**: Por workspace, ajustável
- **Estratégia Recomendada**: **Conta Centralizada com Quotas**
  - **Implementação**: 
    - Rastrear tokens usados por empresa
    - Rate limiting por empresa (ex: 1000 tokens/dia no free)
    - Cobrar premium por uso além do limite
- **Prioridade**: Alta (implementar metering)

---

### **7. Twilio** (SMS/WhatsApp)
- **Status Atual**: Secrets centralizadas (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
- **Custo**: Pay-per-message (~$0.01-0.15 por mensagem)
- **Rate Limits**: Ilimitado (baseado em saldo)
- **Estratégia Recomendada**: **Pass-through com Markup**
  - **Implementação**: 
    - Cobrar do cliente por mensagem enviada (com markup de 20-50%)
    - Ou incluir X mensagens/mês por plano
- **Prioridade**: Alta (direct cost)

---

### **8. Resend** (Transactional Email)
- **Status Atual**: Secret centralizada (RESEND_API_KEY)
- **Custo**: $20/mês (50k emails)
- **Rate Limits**: 10 emails/segundo
- **Estratégia Recomendada**: **Conta Centralizada**
  - **Razão**: Baixo custo, difícil de configurar por cliente
  - **Implementação**: Incluir no custo fixo, monitorar abuse
- **Prioridade**: Baixa (manter centralizado)

---

### **9. Mapbox** (Maps & Geocoding)
- **Status Atual**: Secret centralizada (MAPBOX_PUBLIC_TOKEN)
- **Custo**: Free até 50k loads/mês, depois $0.50 per 1000
- **Rate Limits**: 600 requests/minuto
- **Estratégia Recomendada**: **Conta Centralizada**
  - **Razão**: Muito barato, essencial para UX
  - **Implementação**: Manter público, incluir no custo base
- **Prioridade**: Baixa (manter centralizado)

---

## 🗺️ Roadmap de Implementação

### **Fase 1: Foundation (Sprint 1-2)**
- [ ] Criar tabela `company_integrations` para armazenar credenciais
- [ ] Criar tabela `api_usage_tracking` para metering
- [ ] Implementar encryption de secrets por empresa
- [ ] Criar UI de settings para clientes gerenciarem integrações

### **Fase 2: Quotas & Metering (Sprint 3-4)**
- [ ] Implementar sistema de quotas por empresa
- [ ] Criar middleware para rate limiting por tenant
- [ ] Dashboard de usage por empresa (admin)
- [ ] Alertas quando atingir 80% da quota

### **Fase 3: BYOK Implementation (Sprint 5-6)**
- [ ] PhantomBuster BYOK (priority 1)
- [ ] Hunter.io BYOK (priority 2)
- [ ] Apollo.io BYOK (priority 3)
- [ ] UI para clientes adicionarem suas próprias keys

### **Fase 4: Billing Integration (Sprint 7-8)**
- [ ] Integrar Stripe para cobrança usage-based
- [ ] Implementar planos Free/Pro/Enterprise
- [ ] Sistema de credits/top-up para overages
- [ ] Invoicing automático

---

## 📊 Estimativa de Custos por Cliente

### **Modelo Centralizado (até 100 clientes)**
| API | Plano Necessário | Custo/Mês | Custo por Cliente |
|-----|------------------|-----------|-------------------|
| PhantomBuster | Growth ($99) | $99 | $0.99 |
| Apollo.io | Pro ($149) | $149 | $1.49 |
| ReceitaWS | Pro (R$200) | ~$40 | $0.40 |
| Hunter.io | Starter ($49) | $49 | $0.49 |
| Lovable AI | Usage-based | ~$100 | $1.00 |
| Serper | Basic ($50) | $50 | $0.50 |
| Twilio | Pay-as-you-go | Variável | Variável |
| Resend | Pro ($20) | $20 | $0.20 |
| Mapbox | Free tier | $0 | $0 |
| **TOTAL** | | **~$507/mês** | **~$5.07/cliente** |

**Break-even**: Se cobrar $49/mês por cliente, precisa de mínimo 11 clientes para cobrir custos de API.

### **Recomendação de Pricing**
- **Free**: $0 (quotas muito limitadas, apenas para trial)
- **Starter**: $49/mês (quotas básicas, conta centralizada)
- **Pro**: $149/mês (quotas generosas, conta centralizada)
- **Enterprise**: $499+/mês (BYOK, usage-based add-ons)

---

## 🔐 Segurança & Compliance

### **Armazenamento de Secrets**
- ✅ Usar criptografia AES-256 para API keys de clientes
- ✅ Nunca logar secrets em logs ou Sentry
- ✅ Implementar key rotation automática
- ✅ Audit log de acesso a secrets

### **LGPD / GDPR Compliance**
- ✅ Clientes enterprise podem usar suas próprias contas (data residency)
- ✅ Implementar data retention policies
- ✅ Permitir exportação/deletion de dados integrados

---

## 🚨 Próximas Decisões Necessárias

1. **Definir planos de pricing final** (Free/Starter/Pro/Enterprise)
2. **Escolher billing provider** (Stripe recomendado)
3. **Decidir se permite trial sem cartão** (sim recomendado)
4. **Definir usage overage policy** (auto-upgrade vs hard limit vs pay-as-you-go)
5. **Criar legal terms** (ToS, Privacy Policy, DPA para enterprise)

---

**Última atualização**: 2025-10-23  
**Status**: 🟡 Em planejamento - aguardando decisão de go-live
