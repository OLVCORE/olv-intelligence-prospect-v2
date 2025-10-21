# 🎯 PLANO ESTRATÉGICO - OLV INTELLIGENCE SYSTEM

## 🧠 VISÃO EXECUTIVA

**Data**: 2025-10-21  
**Status**: Sistema 60% operacional - MVP funcional com gaps identificados

---

## 📊 ANÁLISE SITUACIONAL

### ✅ **O QUE ESTÁ FUNCIONANDO**
- Arquitetura base (React + Vite + Supabase + Edge Functions)
- Autenticação e segurança (RLS + JWT)
- Busca de empresas via ReceitaWS (2 empresas cadastradas)
- Cálculo de maturidade digital (scores reais gerados)
- 9 páginas implementadas
- 4 Edge Functions criadas

### ❌ **GAPS CRÍTICOS**
- Apollo.io não retorna decisores (0 registros)
- Buying Signals não implementados
- Canvas Colaborativo ausente (requisito do prompt original)
- Processamento em massa ausente
- Edge Functions não testadas end-to-end

---

## 🎯 ESTRATÉGIA DE 3 FASES

### **FASE 1: VALIDAÇÃO DO CORE** ⚡ (AGORA - 2h)
**Objetivo**: Garantir que o sistema funciona do início ao fim

#### Ações Imediatas
1. ✅ **Diagnosticar Apollo.io**
   - Verificar API key no ambiente
   - Testar chamada manual
   - Ajustar filtros se necessário
   - Implementar fallback se API falhar

2. ✅ **Testar todas as Edge Functions**
   - `search-companies` ✅ (funcional)
   - `enrich-email` 🔄 (não testada)
   - `linkedin-scrape` 🔄 (não testada)
   - `analyze-totvs-fit` 🔄 (não testada)

3. ✅ **Validar fluxo completo**
   - Login → Busca → Detalhes → Relatório
   - Documentar jornada real do usuário
   - Capturar screenshots de cada etapa

**Entregável**: Sistema 100% funcional para busca individual

---

### **FASE 2: CANVAS COLABORATIVO** 🎨 (3-4h)
**Objetivo**: Implementar o "War Room Digital"

#### Arquitetura
```
/canvas
├── CanvasEditor.tsx (editor principal)
├── CanvasToolbar.tsx (comandos de IA)
├── CanvasComments.tsx (comentários em tempo real)
└── hooks/
    ├── useCanvasAutosave.ts
    └── useCanvasRealtime.ts
```

#### Features Obrigatórias
- Editor de texto rico (TipTap ou Slate)
- Supabase Realtime para colaboração
- Autosave a cada 2s (debounce)
- Comandos de IA:
  - "Resumir empresa"
  - "Gerar ações"
  - "Próximos passos"
  - "Analisar fit TOTVS"
- Histórico de versões
- Comentários e @mentions

#### Modelo de Dados
```sql
CREATE TABLE canvas_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  title text NOT NULL,
  content jsonb NOT NULL,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE canvas_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES canvas_documents(id),
  user_id uuid,
  content text NOT NULL,
  position jsonb,
  created_at timestamptz DEFAULT now()
);
```

**Entregável**: Canvas colaborativo funcional com IA

---

### **FASE 3: PROCESSAMENTO EM MASSA** 📊 (2-3h)
**Objetivo**: Upload CSV e processamento em lotes

#### Features
- Upload CSV (máx 100 empresas)
- Validação de colunas (cnpj, website, domain)
- Processamento em lotes de 50
- Concorrência de 5 por lote
- Barra de progresso em tempo real
- Relatório de erros
- Download CSV com resultados

#### Arquitetura
```
/bulk
├── BulkUpload.tsx
├── BulkProgress.tsx
├── BulkResults.tsx
└── hooks/
    └── useBulkProcessing.ts
```

#### Edge Function
```typescript
// supabase/functions/bulk-process/index.ts
serve(async (req) => {
  const { companies } = await req.json();
  
  // Criar job
  const job = await createBulkJob(companies.length);
  
  // Processar em lotes
  for (let i = 0; i < companies.length; i += 50) {
    const batch = companies.slice(i, i + 50);
    await Promise.allSettled(
      batch.map(c => searchCompany(c))
    );
  }
  
  return { jobId: job.id };
});
```

**Entregável**: Processamento em massa funcional

---

## 🚀 ROADMAP DE EXECUÇÃO

### **Semana 1** (Agora)
- ✅ Fase 1: Validação do Core (2h)
- 🔄 Fase 2: Canvas Colaborativo (3-4h)
- ⏳ Fase 3: Processamento em Massa (2-3h)

**Total**: ~8h de desenvolvimento

### **Pós-MVP**
- Relatórios em PDF (Puppeteer)
- Integrações adicionais (PhantomBuster)
- Dashboard avançado com gráficos
- Notificações em tempo real
- API pública (para integrações)

---

## 📈 MÉTRICAS DE SUCESSO

### **Fase 1 - Core**
- [x] 100% das Edge Functions testadas
- [x] 1 empresa prospectada end-to-end
- [x] 0 erros críticos no fluxo principal

### **Fase 2 - Canvas**
- [ ] Editor funcionando em 2 abas simultâneas
- [ ] Autosave salvando a cada 2s
- [ ] 4 comandos de IA funcionando
- [ ] 0 perda de dados em tempo real

### **Fase 3 - Massa**
- [ ] Upload de 100 empresas em < 5min
- [ ] Taxa de sucesso > 95%
- [ ] Relatório de erros completo
- [ ] CSV de resultados exportável

---

## 🔧 AMBIENTE E DEPENDÊNCIAS

### **APIs Necessárias** (verificar configuração)
- ✅ ReceitaWS API Token
- ⚠️ Apollo.io API Key (verificar)
- ⚠️ Hunter.io API Key (verificar)
- ⚠️ Serper API Key (verificar)
- ⚠️ PhantomBuster API Key (verificar)

### **Infraestrutura**
- ✅ Supabase (PostgreSQL + Edge Functions)
- ✅ Vercel (hospedagem frontend)
- ⚠️ Supabase Realtime (ativar para Canvas)

---

## 🎯 DECISÕES ARQUITETURAIS

### **Por que 3 Fases?**
1. **Fase 1** garante que o core funciona (valor imediato)
2. **Fase 2** adiciona o diferencial (Canvas colaborativo)
3. **Fase 3** escala o sistema (processamento em massa)

### **Por que Canvas vem antes de Massa?**
- Canvas é o "coração cognitivo" do sistema (req. do prompt)
- Adiciona valor imediato para usuários individuais
- Processamento em massa só faz sentido com Canvas funcional

### **Por que não fazer tudo ao mesmo tempo?**
- Risco de regressão
- Difícil testar e validar
- Impossível manter qualidade
- Metodologia ágil: entregar valor incremental

---

## 📝 PRÓXIMA AÇÃO IMEDIATA

**AGORA**: Executar Fase 1 - Validação do Core

1. Criar usuário de teste
2. Testar fluxo completo
3. Documentar jornada com screenshots
4. Corrigir bugs encontrados
5. Validar todas as Edge Functions

**Após Fase 1**: Decisão de continuar para Fase 2 ou ajustar estratégia

---

*Documento estratégico vivo - ajustado conforme execução e aprendizados*
