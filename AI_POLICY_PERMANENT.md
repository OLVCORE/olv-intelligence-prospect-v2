# 🎯 POLÍTICA PERMANENTE DE IA - PROJETO

## ⚠️ REGRA CRÍTICA - LEIA ANTES DE QUALQUER MODIFICAÇÃO

**TODAS** as integrações de IA neste projeto **DEVEM** usar **OpenAI GPT-4o-mini EXCLUSIVAMENTE**.

## 🚫 PROIBIDO

- ❌ **Lovable AI Gateway** (https://ai.gateway.lovable.dev)
- ❌ **LOVABLE_API_KEY**
- ❌ Modelos do Google (Gemini, etc.)
- ❌ Qualquer outro provedor de IA

## ✅ OBRIGATÓRIO

- ✅ **OpenAI API** (https://api.openai.com)
- ✅ **OPENAI_API_KEY** (já configurada nos secrets)
- ✅ **Modelo: gpt-4o-mini** (custo-benefício ideal)
- ✅ Fallback gracioso se OPENAI_API_KEY não disponível

## 📋 CHECKLIST PARA NOVAS FUNÇÕES DE IA

```typescript
// ✅ CORRETO
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY not configured');
}

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini', // 👈 SEMPRE gpt-4o-mini
    messages: [...],
    temperature: 0.7,
    max_tokens: 1500
  }),
});
```

```typescript
// ❌ ERRADO - NÃO USAR
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY'); // ❌
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', { // ❌
  ...
});
```

## 💰 MOTIVO DA ESCOLHA

**OpenAI GPT-4o-mini** foi escolhido por:
1. **Custo-benefício superior** aos planos de Lovable AI
2. **API paga diretamente** com controle total de custos
3. **Qualidade consistente** para casos de uso SMB/PME
4. **Flexibilidade** para aumentar/diminuir uso conforme necessidade

## 📊 AUDITORIA REALIZADA

**Data:** 27/10/2025  
**Status:** ✅ 100% das funções migradas para OpenAI GPT-4o-mini

### Funções Auditadas

**Edge Functions com IA (23 total):**
- ✅ ai-forecast-pipeline
- ✅ ai-contextual-analysis
- ✅ ai-copilot-suggest
- ✅ ai-copilot-execute
- ✅ ai-fit-analysis
- ✅ ai-qualification-analysis
- ✅ ai-negotiation-assistant
- ✅ analyze-competitive-deal
- ✅ analyze-governance-gap
- ✅ analyze-sdr-diagnostic
- ✅ analyze-totvs-fit
- ✅ auto-enrich-company
- ✅ calculate-quote-pricing
- ✅ calculate-win-probability
- ✅ canvas-ai-command
- ✅ canvas-ai-proactive
- ✅ detect-company-segment
- ✅ generate-battle-card
- ✅ generate-business-case
- ✅ generate-company-report
- ✅ generate-scenario-analysis
- ✅ search-competitors-web
- ✅ suggest-next-action

**Todas usando OpenAI GPT-4o-mini ✅**

## 🔒 COMO GARANTIR CUMPRIMENTO

1. **Code Review:** Qualquer PR com chamadas de IA deve ser revisado
2. **Grep Check:** Buscar por `lovable.dev` ou `LOVABLE_API_KEY` no código
3. **Monitoring:** Alertar se aparecer tráfego para Lovable AI Gateway
4. **Documentation:** Este documento deve estar na raiz do projeto sempre

## 📞 CONTATO EM CASO DE DÚVIDAS

Se houver necessidade de usar outro modelo/provedor, discutir ANTES de implementar.

---

**Última Atualização:** 27/10/2025  
**Responsável:** Arquiteto do Sistema  
**Revisão:** Obrigatória a cada nova função de IA
