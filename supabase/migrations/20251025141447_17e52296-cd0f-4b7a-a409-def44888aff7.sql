-- ============================================
-- FASE 1: CATÁLOGO REAL DE PRODUTOS TOTVS (CORRIGIDO)
-- ============================================

-- Dropar tabelas existentes se houver conflito
DROP TABLE IF EXISTS totvs_products CASCADE;
DROP TABLE IF EXISTS pricing_rules CASCADE;

-- Tabela de produtos TOTVS (catálogo real)
CREATE TABLE totvs_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('BÁSICO', 'INTERMEDIÁRIO', 'AVANÇADO', 'ESPECIALIZADO')),
  description TEXT,
  base_price NUMERIC(10,2) NOT NULL,
  min_price NUMERIC(10,2) NOT NULL,
  max_price NUMERIC(10,2),
  target_sectors JSONB DEFAULT '[]'::jsonb,
  target_company_size TEXT[] DEFAULT ARRAY[]::text[],
  min_employees INTEGER,
  max_employees INTEGER,
  is_configurable BOOLEAN DEFAULT true,
  config_options JSONB DEFAULT '{}'::jsonb,
  dependencies TEXT[] DEFAULT ARRAY[]::text[],
  recommended_with TEXT[] DEFAULT ARRAY[]::text[],
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de regras de precificação
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('sector', 'company_size', 'volume', 'bundle', 'region')),
  conditions JSONB NOT NULL,
  discount_percentage NUMERIC(5,2),
  price_multiplier NUMERIC(5,2),
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_totvs_products_category ON totvs_products(category);
CREATE INDEX idx_totvs_products_active ON totvs_products(active);
CREATE INDEX idx_totvs_products_sku ON totvs_products(sku);
CREATE INDEX idx_pricing_rules_type ON pricing_rules(rule_type);
CREATE INDEX idx_pricing_rules_active ON pricing_rules(active);

-- RLS Policies
ALTER TABLE totvs_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read totvs_products"
  ON totvs_products FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read pricing_rules"
  ON pricing_rules FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Popular catálogo de produtos TOTVS (dados reais)
INSERT INTO totvs_products (sku, name, category, description, base_price, min_price, max_price, target_sectors, target_company_size, min_employees, max_employees) VALUES
('TOTVS-ERP-PROTHEUS-BASIC', 'TOTVS Protheus - Pacote Básico', 'BÁSICO', 'ERP completo com módulos essenciais: Financeiro, Contábil, Fiscal e Compras', 45000, 35000, 60000, '["Indústria", "Comércio", "Serviços"]'::jsonb, ARRAY['PEQUENA', 'MÉDIA'], 20, 200),
('TOTVS-FLUIG-BASIC', 'TOTVS Fluig - Gestão de Processos', 'BÁSICO', 'Plataforma de gestão de processos e documentos digitais', 18000, 12000, 25000, '["Todos"]'::jsonb, ARRAY['PEQUENA', 'MÉDIA', 'GRANDE'], 10, NULL),
('TOTVS-RH-BASIC', 'TOTVS RM - Gestão de RH', 'BÁSICO', 'Sistema de gestão de recursos humanos e folha de pagamento', 22000, 15000, 30000, '["Todos"]'::jsonb, ARRAY['PEQUENA', 'MÉDIA', 'GRANDE'], 20, NULL),
('TOTVS-ERP-PROTHEUS-FULL', 'TOTVS Protheus - Pacote Completo', 'INTERMEDIÁRIO', 'ERP completo com todos os módulos: Financeiro, Contábil, Fiscal, Compras, Vendas, Estoque, Produção', 85000, 70000, 120000, '["Indústria", "Comércio", "Serviços"]'::jsonb, ARRAY['MÉDIA', 'GRANDE'], 50, 500),
('TOTVS-CRM', 'TOTVS CRM', 'INTERMEDIÁRIO', 'Gestão completa de relacionamento com clientes e pipeline de vendas', 35000, 25000, 50000, '["Comércio", "Serviços", "Tecnologia"]'::jsonb, ARRAY['MÉDIA', 'GRANDE'], 30, NULL),
('TOTVS-WMS', 'TOTVS WMS - Gestão de Armazém', 'INTERMEDIÁRIO', 'Sistema de gerenciamento de armazém e logística', 42000, 30000, 60000, '["Indústria", "Comércio", "Logística"]'::jsonb, ARRAY['MÉDIA', 'GRANDE'], 50, NULL),
('TOTVS-MES', 'TOTVS MES - Manufatura', 'INTERMEDIÁRIO', 'Sistema de execução de manufatura para controle de produção', 55000, 40000, 75000, '["Indústria"]'::jsonb, ARRAY['MÉDIA', 'GRANDE'], 100, NULL),
('TOTVS-BI-ANALYTICS', 'TOTVS Analytics - Business Intelligence', 'AVANÇADO', 'Plataforma avançada de BI e analytics com dashboards executivos', 48000, 35000, 70000, '["Todos"]'::jsonb, ARRAY['MÉDIA', 'GRANDE'], 50, NULL),
('TOTVS-AI-CAROL', 'TOTVS Carol - Plataforma de IA', 'AVANÇADO', 'Inteligência artificial para análise preditiva e automação', 65000, 50000, 95000, '["Todos"]'::jsonb, ARRAY['GRANDE'], 200, NULL),
('TOTVS-BLOCKCHAIN', 'TOTVS Blockchain', 'AVANÇADO', 'Solução blockchain para rastreabilidade e segurança de dados', 75000, 60000, 110000, '["Indústria", "Agronegócio", "Financeiro"]'::jsonb, ARRAY['GRANDE'], 500, NULL),
('TOTVS-AGRO', 'TOTVS Agro', 'ESPECIALIZADO', 'ERP especializado para agronegócio', 95000, 75000, 140000, '["Agronegócio"]'::jsonb, ARRAY['MÉDIA', 'GRANDE'], 50, NULL),
('TOTVS-SAUDE', 'TOTVS Saúde', 'ESPECIALIZADO', 'Sistema de gestão hospitalar completo', 120000, 95000, 180000, '["Saúde"]'::jsonb, ARRAY['MÉDIA', 'GRANDE'], 100, NULL),
('TOTVS-EDUCACAO', 'TOTVS Educacional', 'ESPECIALIZADO', 'Plataforma de gestão educacional', 55000, 40000, 80000, '["Educação"]'::jsonb, ARRAY['MÉDIA', 'GRANDE'], 50, NULL),
('TOTVS-FINANCEIRO', 'TOTVS Banking', 'ESPECIALIZADO', 'Sistema para instituições financeiras', 150000, 120000, 220000, '["Financeiro", "Bancos"]'::jsonb, ARRAY['GRANDE'], 200, NULL),
('TOTVS-VAREJO', 'TOTVS Varejo', 'ESPECIALIZADO', 'Solução completa para gestão de varejo', 68000, 50000, 95000, '["Comércio", "Varejo"]'::jsonb, ARRAY['MÉDIA', 'GRANDE'], 50, NULL);

-- Popular regras de precificação
INSERT INTO pricing_rules (name, rule_type, conditions, discount_percentage, priority) VALUES
('Desconto Agronegócio', 'sector', '{"sectors": ["Agronegócio", "Agricultura"]}'::jsonb, 5.00, 10),
('Desconto Educação', 'sector', '{"sectors": ["Educação"]}'::jsonb, 8.00, 10),
('Desconto Saúde', 'sector', '{"sectors": ["Saúde", "Hospitais"]}'::jsonb, 7.00, 10),
('Desconto Pequena Empresa', 'company_size', '{"size": "PEQUENA", "employees_max": 50}'::jsonb, 10.00, 5),
('Desconto Média Empresa', 'company_size', '{"size": "MÉDIA", "employees_min": 51, "employees_max": 200}'::jsonb, 5.00, 5),
('Bundle Básico + RH', 'bundle', '{"products": ["TOTVS-ERP-PROTHEUS-BASIC", "TOTVS-RH-BASIC"]}'::jsonb, 12.00, 15),
('Bundle Completo + CRM', 'bundle', '{"products": ["TOTVS-ERP-PROTHEUS-FULL", "TOTVS-CRM"]}'::jsonb, 15.00, 15),
('Bundle Full Stack', 'bundle', '{"min_products": 3}'::jsonb, 20.00, 20);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_totvs_products_updated_at
  BEFORE UPDATE ON totvs_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at
  BEFORE UPDATE ON pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();