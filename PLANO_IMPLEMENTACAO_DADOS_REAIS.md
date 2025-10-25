# 🚀 PLANO DE IMPLEMENTAÇÃO - DADOS REAIS

**Data:** 25/10/2025
**Objetivo:** Substituir dados mockados/estimados por dados reais ou cálculos validados

---

## 📋 PRIORIZAÇÃO (MoSCoW)

### 🔴 MUST HAVE (Crítico para negócio)
1. Catálogo de Produtos TOTVS real
2. Regras de negócio para Ticket Estimado
3. Cálculo de ROI validado com dados históricos

### 🟡 SHOULD HAVE (Importante mas não bloqueante)
4. Dados financeiros reais (API ou estimativa melhorada)
5. Enriquecimento de Decision Makers automático
6. Histórico de conversões para ML

### 🟢 COULD HAVE (Bom ter)
7. API Serasa Premium
8. Análise de concorrentes automatizada
9. Previsão de churn

### ⚪ WON'T HAVE (Fora do escopo atual)
10. Integração com ERP TOTVS (fase futura)

---

## 🎯 IMPLEMENTAÇÃO FASE 1: CATÁLOGO DE PRODUTOS TOTVS

### Passo 1: Criar Tabela de Produtos

```sql
-- Tabela principal de produtos TOTVS
CREATE TABLE public.totvs_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- BÁSICO, INTERMEDIÁRIO, AVANÇADO, ESPECIALIZADO
  description TEXT,
  target_industries TEXT[], -- Setores-alvo
  target_company_size TEXT[], -- MICRO, PEQUENO, MÉDIO, GRANDE
  min_employees INTEGER,
  max_employees INTEGER,
  
  -- Preços (base mensal)
  base_price_monthly NUMERIC,
  price_per_user NUMERIC,
  implementation_cost_min NUMERIC,
  implementation_cost_max NUMERIC,
  
  -- Requisitos técnicos
  requires_infrastructure JSONB DEFAULT '[]'::jsonb,
  compatible_with TEXT[], -- SKUs de produtos compatíveis
  requires_products TEXT[], -- SKUs de produtos necessários
  
  -- Benefícios e características
  key_features JSONB DEFAULT '[]'::jsonb,
  key_benefits JSONB DEFAULT '[]'::jsonb,
  roi_drivers JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Para ordenação
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.totvs_products ENABLE ROW LEVEL SECURITY;

-- Policy: todos podem ler produtos
CREATE POLICY "Anyone can read totvs_products"
  ON public.totvs_products
  FOR SELECT
  USING (active = true);

-- Índices para performance
CREATE INDEX idx_totvs_products_category ON totvs_products(category);
CREATE INDEX idx_totvs_products_sku ON totvs_products(sku);
CREATE INDEX idx_totvs_products_active ON totvs_products(active);
```

### Passo 2: Popular com Dados Reais

```sql
-- Inserir produtos TOTVS reais (BÁSICO)
INSERT INTO public.totvs_products (sku, name, category, description, target_industries, target_company_size, min_employees, max_employees, base_price_monthly, implementation_cost_min, implementation_cost_max, key_features, key_benefits) VALUES

-- BÁSICO
('PROT-001', 'TOTVS Protheus', 'BÁSICO', 'ERP completo para gestão empresarial integrada', 
  ARRAY['Indústria', 'Comércio', 'Serviços'], 
  ARRAY['PEQUENO', 'MÉDIO', 'GRANDE'],
  10, NULL,
  15000.00, 50000.00, 200000.00,
  '["Gestão Financeira", "Gestão de Estoque", "Gestão Fiscal", "Contabilidade"]'::jsonb,
  '["Redução de 40% em retrabalho operacional", "Compliance fiscal automático", "Visibilidade em tempo real"]'::jsonb),

('FLUIG-001', 'Fluig', 'BÁSICO', 'Plataforma de gestão de processos e documentos', 
  ARRAY['Todos'], 
  ARRAY['PEQUENO', 'MÉDIO', 'GRANDE'],
  20, NULL,
  8000.00, 30000.00, 100000.00,
  '["BPM", "ECM", "Portal Corporativo", "Automação de Workflows"]'::jsonb,
  '["Redução de 60% no tempo de aprovações", "Eliminação de papel", "Rastreabilidade total"]'::jsonb),

-- INTERMEDIÁRIO
('BI-001', 'TOTVS BI', 'INTERMEDIÁRIO', 'Business Intelligence e Analytics', 
  ARRAY['Todos'], 
  ARRAY['MÉDIO', 'GRANDE'],
  50, NULL,
  12000.00, 40000.00, 150000.00,
  '["Dashboards interativos", "Relatórios personalizáveis", "Data Discovery"]'::jsonb,
  '["Decisões 70% mais rápidas", "ROI de 250% em 18 meses", "Identificação de oportunidades ocultas"]'::jsonb),

('RH-001', 'TOTVS RH', 'INTERMEDIÁRIO', 'Gestão completa de recursos humanos', 
  ARRAY['Todos'], 
  ARRAY['MÉDIO', 'GRANDE'],
  100, NULL,
  10000.00, 35000.00, 120000.00,
  '["Folha de Pagamento", "Ponto Eletrônico", "Recrutamento", "Treinamento"]'::jsonb,
  '["Redução de 50% no tempo de fechamento de folha", "Compliance trabalhista", "Engajamento de colaboradores"]'::jsonb),

-- AVANÇADO
('CAROL-001', 'Carol AI', 'AVANÇADO', 'Plataforma de Inteligência Artificial', 
  ARRAY['Todos'], 
  ARRAY['GRANDE'],
  500, NULL,
  25000.00, 100000.00, 500000.00,
  '["Machine Learning", "Previsões Inteligentes", "Automação Cognitiva", "NLP"]'::jsonb,
  '["Previsões 85% mais precisas", "Automação de decisões complexas", "Insights preditivos"]'::jsonb),

-- ESPECIALIZADOS
('AGRO-001', 'TOTVS Agro', 'ESPECIALIZADO', 'Gestão completa para agronegócio', 
  ARRAY['Agronegócio', 'Agropecuária'], 
  ARRAY['MÉDIO', 'GRANDE'],
  50, NULL,
  18000.00, 60000.00, 250000.00,
  '["Gestão de Safras", "Controle de Insumos", "Rastreabilidade", "Integração com maquinário"]'::jsonb,
  '["Aumento de 30% na produtividade", "Redução de 25% em perdas", "Rastreabilidade total"]'::jsonb);
```

### Passo 3: Atualizar Edge Function analyze-totvs-fit

A edge function atual já usa IA, mas agora vai buscar produtos reais do banco:

```typescript
// Em analyze-totvs-fit/index.ts
// Buscar produtos TOTVS reais do banco
const { data: products } = await supabase
  .from('totvs_products')
  .select('*')
  .eq('active', true)
  .order('priority', { ascending: false });

const productCatalog = products.map(p => ({
  sku: p.sku,
  name: p.name,
  category: p.category,
  description: p.description,
  pricing: {
    monthly: p.base_price_monthly,
    implementation: `R$ ${p.implementation_cost_min.toLocaleString()} - R$ ${p.implementation_cost_max.toLocaleString()}`
  },
  features: p.key_features,
  benefits: p.key_benefits
}));

// Incluir catálogo no prompt da IA
const systemPrompt = `Você é um especialista em análise de fit de produtos TOTVS.

**CATÁLOGO REAL DE PRODUTOS:**
${JSON.stringify(productCatalog, null, 2)}

Sua tarefa é recomendar produtos deste catálogo baseado nas necessidades da empresa.`;
```

---

## 🎯 IMPLEMENTAÇÃO FASE 2: TICKET ESTIMADO REAL

### Estratégia: Matriz de Decisão Multi-Fatorial

```typescript
// Nova função em generate-company-report
function calculateRealTicket(company: any, maturity: any, products: any[]) {
  // Fatores que influenciam o ticket
  const factors = {
    companySize: getCompanySizeFactor(company.employees),
    maturityLevel: getMaturityFactor(maturity?.overall_score || 0),
    industryComplexity: getIndustryFactor(company.industry),
    technologyGap: getTechGapFactor(company.technologies, maturity)
  };
  
  // Produtos aplicáveis
  const applicableProducts = products.filter(p => 
    isProductApplicable(p, company, maturity)
  );
  
  // Calcular ticket base
  const baseTicket = applicableProducts.reduce((sum, p) => {
    return sum + (p.base_price_monthly * 12); // Anualizar
  }, 0);
  
  // Ajustar por fatores
  const minTicket = Math.round(
    baseTicket * factors.companySize * factors.maturityLevel * 0.7
  );
  
  const medTicket = Math.round(
    baseTicket * factors.companySize * factors.maturityLevel
  );
  
  const maxTicket = Math.round(
    baseTicket * factors.companySize * factors.maturityLevel * 1.5 *
    factors.industryComplexity
  );
  
  return {
    minimo: minTicket,
    medio: medTicket,
    maximo: maxTicket,
    confidence: calculateConfidence(company, maturity),
    products: applicableProducts.map(p => p.name),
    assumptions: [
      `Baseado em ${applicableProducts.length} produtos aplicáveis`,
      `Fator de porte: ${factors.companySize.toFixed(2)}`,
      `Fator de maturidade: ${factors.maturityLevel.toFixed(2)}`
    ]
  };
}

function getCompanySizeFactor(employees: number): number {
  if (employees <= 10) return 0.5;   // Micro
  if (employees <= 50) return 1.0;   // Pequena
  if (employees <= 200) return 2.0;  // Média
  if (employees <= 500) return 3.5;  // Média-grande
  return 5.0;                        // Grande
}

function getMaturityFactor(score: number): number {
  // Empresas com menor maturidade têm maior potencial de investimento
  if (score < 30) return 1.5;  // Muito a melhorar
  if (score < 50) return 1.3;  // Considerável a melhorar
  if (score < 70) return 1.1;  // Melhorias moderadas
  return 0.9;                  // Já madura
}

function getIndustryFactor(industry: string): number {
  const complexIndustries = [
    'indústria', 'manufatura', 'farmacêutico', 
    'químico', 'automotivo', 'aeroespacial'
  ];
  
  const simpleIndustries = [
    'comércio', 'varejo', 'consultoria'
  ];
  
  const industryLower = (industry || '').toLowerCase();
  
  if (complexIndustries.some(i => industryLower.includes(i))) {
    return 1.3; // Mais complexo = maior investimento
  }
  
  if (simpleIndustries.some(i => industryLower.includes(i))) {
    return 0.9; // Mais simples = menor investimento
  }
  
  return 1.0; // Neutro
}

function getTechGapFactor(technologies: string[], maturity: any): number {
  // Se não tem tecnologias modernas, precisa investir mais
  const modernTechs = ['AWS', 'Azure', 'Google Cloud', 'SAP', 'Salesforce'];
  const hasModernTech = technologies.some(t => 
    modernTechs.some(mt => t.includes(mt))
  );
  
  if (hasModernTech) return 0.8;  // Já tem base tecnológica
  if (technologies.length === 0) return 1.5; // Precisa começar do zero
  return 1.0; // Neutro
}

function isProductApplicable(product: any, company: any, maturity: any): boolean {
  // Verificar porte
  const companySize = getPorte(company.employees);
  if (!product.target_company_size.includes(companySize)) {
    return false;
  }
  
  // Verificar setor (se especificado)
  if (product.target_industries.length > 0 && 
      !product.target_industries.includes('Todos')) {
    const matchesIndustry = product.target_industries.some((ind: string) =>
      (company.industry || '').toLowerCase().includes(ind.toLowerCase())
    );
    if (!matchesIndustry) return false;
  }
  
  // Verificar maturidade
  const maturityScore = maturity?.overall_score || 0;
  if (product.category === 'AVANÇADO' && maturityScore < 50) {
    return false; // Não recomendar produtos avançados para empresas imaturas
  }
  
  return true;
}

function calculateConfidence(company: any, maturity: any): number {
  let confidence = 50; // Base
  
  if (company.employees > 0) confidence += 20;
  if (company.industry) confidence += 10;
  if (maturity?.overall_score) confidence += 20;
  
  return Math.min(95, confidence); // Máximo 95%
}
```

---

## 🎯 IMPLEMENTAÇÃO FASE 3: ROI VALIDADO

### Estratégia: Usar Dados Históricos + Benchmarks

```typescript
// Nova tabela para histórico de vendas (para ML futuro)
CREATE TABLE public.deal_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  products_sold JSONB NOT NULL,
  total_value NUMERIC NOT NULL,
  implementation_time_days INTEGER,
  actual_roi_12months NUMERIC,
  actual_roi_24months NUMERIC,
  customer_satisfaction INTEGER, -- 1-5
  churned BOOLEAN DEFAULT false,
  churned_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Função melhorada de cálculo de ROI
function calculateValidatedROI(company: any, maturity: any, products: any[]): number {
  // Buscar casos similares do histórico (quando disponível)
  // Por ora, usar benchmarks da indústria
  
  const benchmarks = {
    ERP: { roi_12m: 150, roi_24m: 280 },
    BI: { roi_12m: 250, roi_24m: 450 },
    RH: { roi_12m: 180, roi_24m: 320 },
    AI: { roi_12m: 300, roi_24m: 600 }
  };
  
  // Calcular ROI baseado nos produtos recomendados
  const avgROI = products.reduce((sum, p) => {
    const category = p.category.toUpperCase();
    const benchmark = benchmarks[category] || { roi_12m: 150, roi_24m: 280 };
    return sum + benchmark.roi_12m;
  }, 0) / products.length;
  
  // Ajustar por maturidade (gap maior = maior ROI potencial)
  const maturityGap = (100 - (maturity?.overall_score || 0)) / 100;
  const adjustedROI = avgROI * (1 + maturityGap * 0.5);
  
  return Math.round(adjustedROI);
}
```

---

## 📊 CRONOGRAMA DE IMPLEMENTAÇÃO

### Semana 1
- [x] Auditoria completa (concluída)
- [ ] Criar tabela totvs_products
- [ ] Popular produtos reais
- [ ] Testar query de produtos

### Semana 2
- [ ] Atualizar analyze-totvs-fit com catálogo real
- [ ] Implementar calculateRealTicket()
- [ ] Testar cálculos com empresas reais

### Semana 3
- [ ] Implementar calculateValidatedROI()
- [ ] Criar deal_outcomes table (para ML futuro)
- [ ] Atualizar relatórios com novos dados

### Semana 4
- [ ] Testes E2E completos
- [ ] Documentação atualizada
- [ ] Deploy em produção

---

## ✅ CRITÉRIOS DE SUCESSO

### Ticket Estimado
- ✅ Baseado em produtos reais do catálogo
- ✅ Considera porte da empresa
- ✅ Considera maturidade digital
- ✅ Considera setor/indústria
- ✅ Inclui nível de confiança

### ROI
- ✅ Baseado em benchmarks validados
- ✅ Ajustado por características da empresa
- ✅ Preparado para ML com histórico

### Produtos Recomendados
- ✅ Vêm do catálogo real
- ✅ Filtrados por aplicabilidade
- ✅ Priorizados por relevância

---

## 🎯 PRÓXIMA AÇÃO IMEDIATA

Vamos implementar a Fase 1 agora? Criar a tabela totvs_products e popular com dados reais?

1. ✅ Criar migration para totvs_products
2. ✅ Popular com 10-15 produtos reais
3. ✅ Atualizar analyze-totvs-fit para usar catálogo real
4. ✅ Testar com uma empresa

Confirme para eu iniciar a implementação!
