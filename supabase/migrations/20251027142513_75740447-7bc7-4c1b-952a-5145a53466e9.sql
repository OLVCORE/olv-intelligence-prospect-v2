-- Tabela de controle de uso de APIs premium
CREATE TABLE IF NOT EXISTS public.enrichment_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_enrichment_usage_source ON public.enrichment_usage(source);
CREATE INDEX IF NOT EXISTS idx_enrichment_usage_created_at ON public.enrichment_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_enrichment_usage_company ON public.enrichment_usage(company_id);

-- RLS
ALTER TABLE public.enrichment_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read enrichment_usage"
ON public.enrichment_usage FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage enrichment_usage"
ON public.enrichment_usage FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Tabela de normalização de fontes (mapeamento de campos)
CREATE TABLE IF NOT EXISTS public.enrichment_field_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  source_field TEXT NOT NULL,
  target_field TEXT NOT NULL,
  transformation_rule JSONB DEFAULT '{}'::jsonb,
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_field_mapping_source ON public.enrichment_field_mapping(source_name);
CREATE INDEX IF NOT EXISTS idx_field_mapping_active ON public.enrichment_field_mapping(active);

-- RLS
ALTER TABLE public.enrichment_field_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read field_mapping"
ON public.enrichment_field_mapping FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage field_mapping"
ON public.enrichment_field_mapping FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Inserir mapeamentos padrão para EmpresaQui
INSERT INTO public.enrichment_field_mapping (source_name, source_field, target_field, priority) VALUES
('empresaqui', 'cnpj', 'cnpj', 100),
('empresaqui', 'razao_social', 'name', 100),
('empresaqui', 'nome_fantasia', 'trade_name', 90),
('empresaqui', 'website', 'website', 80),
('empresaqui', 'telefones[0]', 'phone', 85),
('empresaqui', 'emails[0]', 'email', 85),
('empresaqui', 'porte', 'size', 70),
('empresaqui', 'capital_social', 'share_capital', 75),
('empresaqui', 'funcionarios_presumido', 'employees_count', 80),
('empresaqui', 'faturamento_presumido', 'estimated_revenue', 80);

-- Inserir mapeamentos para Apollo
INSERT INTO public.enrichment_field_mapping (source_name, source_field, target_field, priority) VALUES
('apollo', 'name', 'name', 95),
('apollo', 'primary_domain', 'domain', 95),
('apollo', 'website_url', 'website', 90),
('apollo', 'industry', 'industry', 85),
('apollo', 'estimated_num_employees', 'employees_count', 85),
('apollo', 'linkedin_url', 'linkedin_url', 90),
('apollo', 'technologies', 'technologies', 80);

-- Inserir mapeamentos para Econodata
INSERT INTO public.enrichment_field_mapping (source_name, source_field, target_field, priority) VALUES
('econodata', 'cnpj', 'cnpj', 100),
('econodata', 'razao_social', 'name', 95),
('econodata', 'melhor_telefone', 'phone', 95),
('econodata', 'melhor_celular', 'mobile_phone', 95),
('econodata', 'melhor_site', 'website', 95),
('econodata', 'email_validados', 'email', 95),
('econodata', 'tecnologias', 'technologies', 90),
('econodata', 'funcionarios_presumido', 'employees_count', 95),
('econodata', 'faturamento_presumido', 'estimated_revenue', 95);