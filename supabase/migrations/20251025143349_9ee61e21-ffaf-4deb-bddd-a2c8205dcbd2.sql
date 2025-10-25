-- Adicionar campo de submódulos aos produtos TOTVS
ALTER TABLE totvs_products ADD COLUMN IF NOT EXISTS submodules JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN totvs_products.submodules IS 'Lista de submódulos/variações do produto (ex: Protheus, Datasul para ERP)';

-- Atualizar produtos existentes com submódulos
UPDATE totvs_products SET submodules = '["Protheus", "Datasul", "RM"]'::jsonb WHERE sku = 'ERP-BASICO';
UPDATE totvs_products SET submodules = '["Protheus", "Datasul", "RM", "Manufatura"]'::jsonb WHERE sku = 'ERP-INTERMEDIARIO';
UPDATE totvs_products SET submodules = '["Protheus Avançado", "Datasul Enterprise", "RM Corporativo"]'::jsonb WHERE sku = 'ERP-AVANCADO';

-- Adicionar novos produtos do catálogo TOTVS
INSERT INTO totvs_products (sku, name, category, description, base_price, min_price, target_company_size, target_sectors, is_configurable, config_options, dependencies, recommended_with, submodules, active) VALUES
('IA-CAROL', 'TOTVS Carol (IA)', 'AVANÇADO', 'Plataforma de Inteligência Artificial com assistente virtual, análise preditiva e automação inteligente', 35000, 28000, ARRAY['MÉDIO', 'GRANDE']::text[], '["Todos"]'::jsonb, true, '{"features": ["Assistente Virtual", "Análise Preditiva", "Automação de Processos"]}'::jsonb, ARRAY[]::text[], ARRAY['ERP-AVANCADO', 'ANALYTICS-BI']::text[], '[]'::jsonb, true),

('ANALYTICS-BI', 'TOTVS Analytics (BI)', 'INTERMEDIÁRIO', 'Business Intelligence e análise de dados com dashboards personalizáveis', 25000, 20000, ARRAY['PEQUENO', 'MÉDIO', 'GRANDE']::text[], '["Todos"]'::jsonb, true, '{"features": ["Dashboards", "Relatórios Customizados", "Data Lake"]}'::jsonb, ARRAY[]::text[], ARRAY['ERP-INTERMEDIARIO', 'ERP-AVANCADO']::text[], '[]'::jsonb, true),

('ASSINATURA-ELETRONICA', 'TOTVS Assinatura Eletrônica', 'BÁSICO', 'Assinatura digital de documentos com validade jurídica', 8000, 6000, ARRAY['PEQUENO', 'MÉDIO', 'GRANDE']::text[], '["Todos"]'::jsonb, false, '{}'::jsonb, ARRAY[]::text[], ARRAY['FLUIG-ECM']::text[], '[]'::jsonb, true),

('ATENDIMENTO-CHATBOT', 'TOTVS Atendimento', 'INTERMEDIÁRIO', 'Chatbot e sistema de atendimento ao cliente com IA', 18000, 14000, ARRAY['PEQUENO', 'MÉDIO', 'GRANDE']::text[], '["Varejo", "Serviços", "E-commerce"]'::jsonb, true, '{"channels": ["WhatsApp", "Site", "App", "Facebook"]}'::jsonb, ARRAY[]::text[], ARRAY['CRM-VENDAS', 'IA-CAROL']::text[], '[]'::jsonb, true),

('CLOUD-INFRASTRUCTURE', 'TOTVS Cloud', 'BÁSICO', 'Infraestrutura em nuvem e hospedagem de sistemas TOTVS', 12000, 10000, ARRAY['PEQUENO', 'MÉDIO', 'GRANDE']::text[], '["Todos"]'::jsonb, true, '{"tiers": ["Básico", "Profissional", "Enterprise"]}'::jsonb, ARRAY[]::text[], ARRAY['ERP-BASICO', 'ERP-INTERMEDIARIO']::text[], '[]'::jsonb, true),

('CREDITO-FINANCEIRO', 'TOTVS Crédito', 'ESPECIALIZADO', 'Plataforma de análise de crédito e gestão financeira', 32000, 25000, ARRAY['MÉDIO', 'GRANDE']::text[], '["Financeiro", "Varejo"]'::jsonb, true, '{"features": ["Score de Crédito", "Análise de Risco", "Cobrança Inteligente"]}'::jsonb, ARRAY['ERP-INTERMEDIARIO']::text[], ARRAY['ANALYTICS-BI']::text[], '[]'::jsonb, true),

('CRM-VENDAS', 'TOTVS CRM', 'INTERMEDIÁRIO', 'CRM de vendas com pipeline, automação e integrações', 22000, 18000, ARRAY['PEQUENO', 'MÉDIO', 'GRANDE']::text[], '["Todos"]'::jsonb, true, '{"features": ["Pipeline Visual", "Automação", "Mobile", "Integrações"]}'::jsonb, ARRAY[]::text[], ARRAY['ERP-INTERMEDIARIO', 'MARKETING-DIGITAL']::text[], '[]'::jsonb, true),

('FLUIG-ECM', 'TOTVS Fluig', 'INTERMEDIÁRIO', 'Plataforma de gestão de processos, documentos e colaboração', 28000, 22000, ARRAY['MÉDIO', 'GRANDE']::text[], '["Todos"]'::jsonb, true, '{"modules": ["BPM", "ECM", "Social"]}'::jsonb, ARRAY[]::text[], ARRAY['ERP-INTERMEDIARIO', 'ASSINATURA-ELETRONICA']::text[], '["BPM", "ECM", "Social"]'::jsonb, true),

('IPAAS-INTEGRACAO', 'TOTVS iPaaS', 'AVANÇADO', 'Plataforma de integração entre sistemas e APIs', 30000, 24000, ARRAY['MÉDIO', 'GRANDE']::text[], '["Todos"]'::jsonb, true, '{"connectors": 100}'::jsonb, ARRAY['ERP-INTERMEDIARIO']::text[], ARRAY['CLOUD-INFRASTRUCTURE']::text[], '[]'::jsonb, true),

('MARKETING-DIGITAL', 'TOTVS Marketing', 'INTERMEDIÁRIO', 'Automação de marketing digital e gestão de campanhas', 20000, 16000, ARRAY['PEQUENO', 'MÉDIO', 'GRANDE']::text[], '["Varejo", "E-commerce", "Serviços"]'::jsonb, true, '{"features": ["Email Marketing", "Landing Pages", "Automação", "Analytics"]}'::jsonb, ARRAY[]::text[], ARRAY['CRM-VENDAS', 'ANALYTICS-BI']::text[], '[]'::jsonb, true),

('PAGAMENTOS-DIGITAL', 'TOTVS Pagamentos', 'INTERMEDIÁRIO', 'Gateway de pagamentos e gestão de transações', 15000, 12000, ARRAY['PEQUENO', 'MÉDIO', 'GRANDE']::text[], '["Varejo", "E-commerce"]'::jsonb, true, '{"methods": ["Cartão", "PIX", "Boleto", "Parcelamento"]}'::jsonb, ARRAY[]::text[], ARRAY['ERP-INTERMEDIARIO', 'CREDITO-FINANCEIRO']::text[], '[]'::jsonb, true),

('RH-GESTAO-PESSOAS', 'TOTVS RH', 'INTERMEDIÁRIO', 'Sistema completo de gestão de recursos humanos', 24000, 19000, ARRAY['MÉDIO', 'GRANDE']::text[], '["Todos"]'::jsonb, true, '{"modules": ["Folha", "Ponto", "Benefícios", "Recrutamento", "Treinamento"]}'::jsonb, ARRAY['ERP-BASICO']::text[], ARRAY['ANALYTICS-BI']::text[], '["Folha de Pagamento", "Ponto Eletrônico", "Benefícios", "Recrutamento e Seleção", "Treinamento e Desenvolvimento"]'::jsonb, true)

ON CONFLICT (sku) DO UPDATE SET
  submodules = EXCLUDED.submodules,
  description = EXCLUDED.description,
  recommended_with = EXCLUDED.recommended_with;