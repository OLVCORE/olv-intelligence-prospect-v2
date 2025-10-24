-- ====================================
-- FASE 2: CPQ & PRICING INTELLIGENCE
-- ====================================

-- Tabela de regras de precificação
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('discount', 'volume', 'bundle', 'seasonal', 'competitive')),
  conditions JSONB NOT NULL DEFAULT '{}',
  action JSONB NOT NULL DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  min_quantity INTEGER,
  max_quantity INTEGER,
  product_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  customer_segments TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de histórico de cotações
CREATE TABLE IF NOT EXISTS public.quote_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT UNIQUE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  account_strategy_id UUID REFERENCES public.account_strategies(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'negotiating')),
  
  -- Produtos e configuração
  products JSONB NOT NULL DEFAULT '[]',
  total_list_price NUMERIC(15,2) DEFAULT 0,
  total_discounts NUMERIC(15,2) DEFAULT 0,
  total_final_price NUMERIC(15,2) NOT NULL,
  
  -- Pricing intelligence
  suggested_price NUMERIC(15,2),
  win_probability NUMERIC(3,2),
  competitive_position TEXT CHECK (competitive_position IN ('aggressive', 'competitive', 'premium', 'high_risk')),
  
  -- Timeline
  valid_until TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  -- Aprovação
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Metadata
  applied_rules JSONB DEFAULT '[]',
  negotiation_history JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de configuração de produtos TOTVS
CREATE TABLE IF NOT EXISTS public.product_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('BÁSICO', 'INTERMEDIÁRIO', 'AVANÇADO', 'ESPECIALIZADO')),
  description TEXT,
  
  -- Precificação
  base_price NUMERIC(15,2) NOT NULL,
  cost NUMERIC(15,2),
  min_price NUMERIC(15,2),
  
  -- Configurações
  is_configurable BOOLEAN DEFAULT false,
  config_options JSONB DEFAULT '{}',
  
  -- Dependências e bundles
  dependencies UUID[] DEFAULT ARRAY[]::UUID[],
  recommended_with UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Limites
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER,
  
  -- Status
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON public.pricing_rules(active, priority);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_valid ON public.pricing_rules(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_quote_history_company ON public.quote_history(company_id);
CREATE INDEX IF NOT EXISTS idx_quote_history_status ON public.quote_history(status);
CREATE INDEX IF NOT EXISTS idx_quote_history_created ON public.quote_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_catalog_category ON public.product_catalog(category);
CREATE INDEX IF NOT EXISTS idx_product_catalog_active ON public.product_catalog(active);

-- RLS Policies
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage pricing rules
CREATE POLICY "Authenticated users can manage pricing_rules"
  ON public.pricing_rules FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can manage quotes
CREATE POLICY "Authenticated users can manage quote_history"
  ON public.quote_history FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can read product catalog
CREATE POLICY "Authenticated users can read product_catalog"
  ON public.product_catalog FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can manage product catalog
CREATE POLICY "Admins can manage product_catalog"
  ON public.product_catalog FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_pricing_rules_updated_at
  BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_history_updated_at
  BEFORE UPDATE ON public.quote_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_catalog_updated_at
  BEFORE UPDATE ON public.product_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir produtos TOTVS no catálogo
INSERT INTO public.product_catalog (sku, name, category, description, base_price, min_price, is_configurable, config_options) VALUES
  ('TOTVS-PROTHEUS-BASIC', 'TOTVS Protheus Básico', 'BÁSICO', 'ERP essencial para gestão financeira e contábil', 15000.00, 12000.00, true, '{"modules": ["financeiro", "contabil"], "users": 10}'),
  ('TOTVS-PROTHEUS-STD', 'TOTVS Protheus Standard', 'INTERMEDIÁRIO', 'ERP completo com gestão de estoque e produção', 35000.00, 28000.00, true, '{"modules": ["financeiro", "contabil", "estoque", "compras"], "users": 25}'),
  ('TOTVS-PROTHEUS-ADV', 'TOTVS Protheus Advanced', 'AVANÇADO', 'ERP avançado com BI e analytics integrados', 75000.00, 60000.00, true, '{"modules": ["all"], "users": 50, "analytics": true}'),
  ('TOTVS-FLUIG', 'TOTVS Fluig', 'INTERMEDIÁRIO', 'Plataforma de gestão de processos e documentos', 25000.00, 20000.00, true, '{"workflows": 50, "users": 100}'),
  ('TOTVS-RM', 'TOTVS RM', 'AVANÇADO', 'Gestão de recursos humanos completa', 45000.00, 36000.00, true, '{"modules": ["folha", "ponto", "recrutamento"], "employees": 500}'),
  ('TOTVS-DATASUL', 'TOTVS Datasul', 'ESPECIALIZADO', 'ERP para manufatura e indústria', 95000.00, 76000.00, true, '{"modules": ["producao", "pcp", "qualidade"], "plants": 5}');

-- Inserir regras de precificação básicas
INSERT INTO public.pricing_rules (name, rule_type, conditions, action, priority, active) VALUES
  ('Desconto por Volume - 10%', 'volume', '{"min_quantity": 10, "max_quantity": 49}', '{"discount_type": "percentage", "value": 10}', 100, true),
  ('Desconto por Volume - 15%', 'volume', '{"min_quantity": 50, "max_quantity": 99}', '{"discount_type": "percentage", "value": 15}', 110, true),
  ('Desconto por Volume - 20%', 'volume', '{"min_quantity": 100}', '{"discount_type": "percentage", "value": 20}', 120, true),
  ('Bundle Protheus + Fluig', 'bundle', '{"products": ["TOTVS-PROTHEUS-STD", "TOTVS-FLUIG"]}', '{"discount_type": "percentage", "value": 12}', 200, true),
  ('Desconto Enterprise', 'competitive', '{"customer_segments": ["enterprise"]}', '{"discount_type": "percentage", "value": 8, "max_discount": 15000}', 50, true);