-- Fix pricing_rules table - add name column and fix data insertion

-- Add missing name column to pricing_rules
ALTER TABLE public.pricing_rules 
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Regra sem nome';

-- Now insert sample data
INSERT INTO public.product_catalog (sku, name, category, description, base_price, min_price) VALUES
-- BÁSICO
('TOT-GEST-001', 'Protheus Gestão Básica', 'BÁSICO', 'Sistema de gestão empresarial básico', 25000, 20000),
('TOT-CONT-001', 'Contabilidade Básica', 'BÁSICO', 'Módulo de contabilidade essencial', 15000, 12000),
('TOT-FISC-001', 'Fiscal Básico', 'BÁSICO', 'Controle fiscal fundamental', 18000, 14000),

-- INTERMEDIÁRIO
('TOT-ERP-001', 'Protheus ERP Standard', 'INTERMEDIÁRIO', 'Sistema ERP completo', 50000, 40000),
('TOT-CRM-001', 'CRM Salesforce Integrado', 'INTERMEDIÁRIO', 'Gestão de relacionamento', 35000, 28000),
('TOT-BI-001', 'Business Intelligence', 'INTERMEDIÁRIO', 'Análises e relatórios', 30000, 24000),

-- AVANÇADO
('TOT-AI-001', 'Carol Intelligence', 'AVANÇADO', 'Inteligência artificial empresarial', 80000, 65000),
('TOT-CLOUD-001', 'Protheus Cloud Enterprise', 'AVANÇADO', 'ERP em nuvem completo', 75000, 60000),
('TOT-FLUIG-001', 'Fluig Digital Platform', 'AVANÇADO', 'Plataforma de transformação digital', 60000, 48000),

-- ESPECIALIZADO
('TOT-SAUDE-001', 'Sistema Hospitalar', 'ESPECIALIZADO', 'Gestão hospitalar completa', 120000, 95000),
('TOT-EDUC-001', 'Gestão Educacional', 'ESPECIALIZADO', 'Sistema para instituições de ensino', 100000, 80000),
('TOT-IND-001', 'MES Manufacturing', 'ESPECIALIZADO', 'Execução de manufatura', 150000, 120000)
ON CONFLICT (sku) DO NOTHING;

-- Sample pricing rules with names
INSERT INTO public.pricing_rules (name, rule_type, conditions, discount_percentage, priority) VALUES
('Desconto Microempresa', 'company_size', '{"size": "MICRO"}', 15, 100),
('Desconto Pequena Empresa', 'company_size', '{"size": "PEQUENO"}', 10, 90),
('Desconto Média Empresa', 'company_size', '{"size": "MÉDIO"}', 5, 80),
('Desconto Grande Empresa', 'company_size', '{"size": "GRANDE"}', 0, 70),
('Desconto Tecnologia', 'sector', '{"sectors": ["tecnologia", "software"]}', 8, 60),
('Desconto Saúde/Educação', 'sector', '{"sectors": ["saúde", "educação"]}', 12, 50),
('Desconto Varejo', 'sector', '{"sectors": ["varejo", "comércio"]}', 5, 40)
ON CONFLICT DO NOTHING;