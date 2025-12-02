# 🧪 PLANO DE TESTE PÓS-RESET

**Objetivo:** Validar que sistema está funcionando com as correções

---

## ✅ FASE 1: RESET (5 minutos)

### 1.1 Executar SQL
```sql
-- Copiar e executar: RESET_DATABASE_CLEAN_START.sql
-- No Supabase SQL Editor
```

### 1.2 Verificar limpeza
```sql
-- Ver se está tudo limpo
SELECT COUNT(*) FROM companies; -- Empresas restantes
SELECT COUNT(*) FROM simple_totvs_checks; -- Deveria ser 0
SELECT COUNT(*) FROM icp_analysis_results; -- Deveria ser 0
```

---

## ✅ FASE 2: TESTE COM 3 EMPRESAS (30 minutos)

### 2.1 Importar 3 empresas de teste

**EMPRESA 1: Tradimaq S.A.** (caso problema)
- CNPJ: 22.320.881/0001-60
- **Expectativa:** Detectar "Quadro de Credores" como evidência
- **Resultado esperado:** "É CLIENTE" (no-go) ou pelo menos mostrar evidências

**EMPRESA 2: [Escolher 1 que você SABE que é cliente TOTVS]**
- CNPJ: ???
- **Expectativa:** Detectar evidências reais
- **Resultado esperado:** "É CLIENTE" (no-go)

**EMPRESA 3: [Escolher 1 que você SABE que NÃO é cliente]**
- CNPJ: ???
- **Expectativa:** Não encontrar evidências (ou poucas)
- **Resultado esperado:** "NÃO É CLIENTE" (go) ou "INCONCLUSIVO"

### 2.2 Verificar para CADA empresa:

#### ✅ CHECKLIST POR EMPRESA:

**Frontend (Tela de Quarentena):**
- [ ] Empresa aparece na lista?
- [ ] Badge TOTVS mostra status correto?
- [ ] Ao clicar, abre relatório?

**Relatório TOTVS:**
- [ ] Status aparece (GO/NO-GO/INCONCLUSIVO)?
- [ ] Card grande mostra confiança?
- [ ] Evidências aparecem na lista? (URLs, títulos, snippets)
- [ ] Highlights funcionam? (palavras destacadas)
- [ ] Triple/Double/Single matches contam certo?
- [ ] Fontes consultadas mostram número correto (~50)?

**Logs (Supabase Dashboard → Functions → Logs):**
- [ ] "TRIPLE MATCH DETECTADO" ou "DOUBLE MATCH DETECTADO"?
- [ ] "❌ Rejeitado: IA não detectou" NÃO deveria aparecer mais
- [ ] Evidências sendo aceitas (não rejeitadas)?

### 2.3 Validação Específica - Tradimaq

**Deve aparecer:**
```
📄 Evidência: "Quadro de Credores"
URL: [link para documento judicial]
Snippet: "TOTVS S.A. ... R$ 935.305,61 ... 22320881000160"
Match Type: DOUBLE ou TRIPLE
```

**Logs devem mostrar:**
```
[SIMPLE-TOTVS] 💰 Evidência de RELAÇÃO COMERCIAL detectada (credor/recuperação judicial)
[SIMPLE-TOTVS] ✅ ✅ DOUBLE MATCH DETECTADO! (Empresa + TOTVS na mesma matéria)
```

---

## ✅ FASE 3: MÉTRICAS DE SUCESSO

### Critérios de aprovação (pelo menos 2 de 3):

| Métrica | Meta | Resultado |
|---------|------|-----------|
| **Tradimaq detecta evidências** | Sim | [ ] |
| **Empresa cliente detectada** | É CLIENTE | [ ] |
| **Empresa não-cliente detectada** | NÃO É ou INCONCLUSIVO | [ ] |
| **Evidências aparecem no frontend** | Sim (URLs clicáveis) | [ ] |
| **Highlights funcionam** | Sim (palavras destacadas) | [ ] |
| **Consumo de créditos** | ~100 por empresa | [ ] |

### Se 2+ critérios passarem:
✅ **SISTEMA FUNCIONANDO** → Importar resto das empresas

### Se < 2 critérios passarem:
❌ **PROBLEMA AINDA EXISTE** → Investigar mais

---

## 🔍 TROUBLESHOOTING

### Problema: Nenhuma evidência aparece

**Verificar:**
1. Logs mostram "9 FASES" de busca?
   - Se não: API Serper pode estar com problema
2. Logs mostram "❌ Rejeitado: TOTVS não mencionada"?
   - Se sim: Empresa realmente não tem evidências
3. Logs mostram "❌ Rejeitado: IA não detectou"?
   - Se sim: PROBLEMA! Validação AI ainda ativa

**Solução:**
```bash
# Re-deploy da função
supabase functions deploy simple-totvs-check
```

### Problema: Evidências nos logs mas não aparecem no frontend

**Verificar:**
1. DevTools (F12) → Network → "simple-totvs-check"
2. Ver Response → campo "evidences" tem dados?
   - Se sim: Problema no frontend (componente não renderizando)
   - Se não: Problema no backend (não retornando dados)

**Solução (se problema no frontend):**
```bash
# Re-build e deploy do frontend
npm run build
vercel --prod
```

### Problema: Consome muitos créditos (>150 por empresa)

**Possível causa:**
- Sistema buscando múltiplas vezes (não usando cache)

**Verificar:**
```sql
-- Ver quantas buscas foram feitas para mesma empresa
SELECT 
  company_name,
  COUNT(*) as buscas,
  MAX(created_at) as ultima_busca
FROM simple_totvs_checks
GROUP BY company_name
HAVING COUNT(*) > 1;
```

**Solução:**
- Cache deveria funcionar após primeira busca
- Se não funcionar: problema na tabela `simple_totvs_checks`

---

## 📊 RELATÓRIO FINAL

Após testar 3 empresas, preencher:

```
EMPRESA 1 (Tradimaq):
- Status detectado: [GO/NO-GO/INCONCLUSIVO]
- Evidências encontradas: [número]
- Evidências aparecem no frontend: [SIM/NÃO]
- Highlights funcionam: [SIM/NÃO]
- Créditos consumidos: [número]

EMPRESA 2 ([nome]):
- Status detectado: [GO/NO-GO/INCONCLUSIVO]
- Evidências encontradas: [número]
- Evidências aparecem no frontend: [SIM/NÃO]
- Highlights funcionam: [SIM/NÃO]
- Créditos consumidos: [número]

EMPRESA 3 ([nome]):
- Status detectado: [GO/NO-GO/INCONCLUSIVO]
- Evidências encontradas: [número]
- Evidências aparecem no frontend: [SIM/NÃO]
- Highlights funcionam: [SIM/NÃO]
- Créditos consumidos: [número]

RESULTADO GERAL: [✅ APROVADO / ❌ REPROVADO]
```

---

## 🚀 PRÓXIMOS PASSOS

### Se testes passarem (✅):
1. Importar resto das empresas (10, 50, 100...)
2. Monitorar primeiras 10-20 verificações
3. Ajustar se necessário

### Se testes falharem (❌):
1. Enviar relatório com logs
2. Investigar causa específica
3. Fazer ajustes necessários
4. Re-testar

---

**Tempo estimado total:** 30-45 minutos
**Créditos consumidos:** ~300 (100 por empresa x 3)

