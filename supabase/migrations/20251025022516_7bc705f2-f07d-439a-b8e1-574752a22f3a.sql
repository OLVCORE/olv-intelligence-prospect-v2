-- Tabela de catálogo de serviços de consultoria OLV
CREATE TABLE IF NOT EXISTS consulting_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('DIAGNÓSTICO', 'OPERACIONAL', 'ESTRATÉGICO', 'TECNOLOGIA', 'COMPLIANCE', 'CAPACITAÇÃO')),
  description TEXT,
  
  -- Precificação por horas técnicas
  base_hourly_rate DECIMAL(10,2),
  min_hourly_rate DECIMAL(10,2),
  max_hourly_rate DECIMAL(10,2),
  
  -- Estimativa de horas por projeto
  estimated_hours_min INTEGER,
  estimated_hours_max INTEGER,
  
  -- Precificação por projeto fechado
  base_project_price DECIMAL(10,2),
  min_project_price DECIMAL(10,2),
  max_project_price DECIMAL(10,2),
  
  -- Modelos de precificação disponíveis
  pricing_models JSONB DEFAULT '["project", "hourly", "retainer", "performance"]'::jsonb,
  
  -- Configurações específicas
  requires_platforms JSONB DEFAULT '[]'::jsonb,
  target_sectors JSONB DEFAULT '[]'::jsonb,
  complexity_factors JSONB DEFAULT '{}'::jsonb,
  
  -- Custos adicionais típicos
  implementation_cost DECIMAL(10,2),
  training_cost DECIMAL(10,2),
  travel_daily_rate DECIMAL(10,2) DEFAULT 1500,
  
  -- Metadados
  consultant_level TEXT CHECK (consultant_level IN ('JÚNIOR', 'PLENO', 'SÊNIOR', 'ESPECIALISTA', 'TRIBUTÁRIO', 'COMPLIANCE')),
  is_configurable BOOLEAN DEFAULT true,
  dependencies TEXT[] DEFAULT ARRAY[]::text[],
  recommended_with TEXT[] DEFAULT ARRAY[]::text[],
  active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de precificação de consultores por nível
CREATE TABLE IF NOT EXISTS consultant_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL UNIQUE CHECK (level IN ('JÚNIOR', 'PLENO', 'SÊNIOR', 'ESPECIALISTA', 'TRIBUTÁRIO', 'COMPLIANCE')),
  hourly_rate_min DECIMAL(10,2) NOT NULL,
  hourly_rate_max DECIMAL(10,2) NOT NULL,
  description TEXT,
  experience_years_min INTEGER,
  experience_years_max INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir taxas base de consultores
INSERT INTO consultant_rates (level, hourly_rate_min, hourly_rate_max, description, experience_years_min, experience_years_max) VALUES
('JÚNIOR', 180, 280, 'Consultor Júnior em Comex & Supply Chain', 2, 5),
('PLENO', 290, 400, 'Consultor Pleno em Comex & Supply Chain', 5, 10),
('SÊNIOR', 410, 550, 'Consultor Sênior em Comex & Supply Chain', 10, 15),
('ESPECIALISTA', 560, 750, 'Especialista/Gerente de Projeto', 15, NULL),
('TRIBUTÁRIO', 450, 650, 'Especialista Tributário/Fiscal em Comex', 10, NULL),
('COMPLIANCE', 480, 680, 'Especialista em Compliance Comex', 10, NULL);

-- Inserir serviços principais da OLV
INSERT INTO consulting_services (sku, name, category, description, consultant_level, estimated_hours_min, estimated_hours_max, base_project_price, min_project_price, max_project_price) VALUES
('OLV-DIAG-001', 'Diagnóstico Estratégico Inicial', 'DIAGNÓSTICO', 'Análise completa da maturidade organizacional e digital, assessment de processos atuais (AS-IS), mapeamento de gaps e oportunidades', 'SÊNIOR', 60, 100, 37500, 25000, 50000),
('OLV-IMP-001', 'Estruturação de Importação Exclusiva', 'OPERACIONAL', 'Modelagem completa, planejamento fiscal e operacional para importação exclusiva com estratégias diferenciadas', 'ESPECIALISTA', 150, 250, 90000, 60000, 120000),
('OLV-EXP-001', 'Otimização de Processos de Exportação', 'OPERACIONAL', 'Mapeamento, melhorias e implementação de processos otimizados de exportação', 'SÊNIOR', 120, 200, 72500, 50000, 95000),
('OLV-TRIB-001', 'Planejamento Tributário em Comex', 'ESTRATÉGICO', 'Análise tributária, sugestão de regimes especiais e implementação de redução tributária estruturada', 'TRIBUTÁRIO', 80, 150, 57500, 40000, 75000),
('OLV-SC-001', 'Implementação de Gestão de Supply Chain', 'OPERACIONAL', 'Desenho e implementação completa de nova cadeia de suprimentos integrada', 'ESPECIALISTA', 200, 400, 145000, 90000, 200000),
('OLV-COMP-001', 'Auditoria e Plano de Compliance Comex', 'COMPLIANCE', 'Revisão de conformidade regulatória e elaboração de plano de ação detalhado', 'COMPLIANCE', 100, 180, 65000, 45000, 85000),
('OLV-CAP-001', 'Capacitação Personalizada (por dia)', 'CAPACITAÇÃO', 'Treinamento in-company para equipes em Comex e Supply Chain', 'SÊNIOR', 8, 8, 4000, 3000, 5000),
('OLV-EST-001', 'Consultoria Estratégica em Comércio Exterior', 'ESTRATÉGICO', 'Orientação estratégica para expansão e otimização das operações globais', 'ESPECIALISTA', 100, 180, 95000, 60000, 130000),
('OLV-LOG-001', 'Planejamento Logístico Integrado', 'OPERACIONAL', 'Design e gestão de rotas e modais para máxima eficiência logística', 'SÊNIOR', 80, 140, 65000, 45000, 90000),
('OLV-TECH-001', 'Tecnologia Aplicada à Competitividade', 'TECNOLOGIA', 'Implementação e uso das plataformas OLV (STRATEVO, EXCELTTA, etc.) para inteligência e gestão', 'ESPECIALISTA', 120, 200, 110000, 70000, 150000);

-- RLS Policies
ALTER TABLE consulting_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultant_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read consulting_services" ON consulting_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert consulting_services" ON consulting_services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update consulting_services" ON consulting_services FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete consulting_services" ON consulting_services FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read consultant_rates" ON consultant_rates FOR SELECT TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_consulting_services_category ON consulting_services(category);
CREATE INDEX idx_consulting_services_active ON consulting_services(active);
CREATE INDEX idx_consultant_rates_level ON consultant_rates(level);