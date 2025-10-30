-- Migration: Preparar tabelas para automação completa do pipeline
-- Data: 2025-01-30

-- 1. Adicionar colunas faltantes em icp_analysis_results
ALTER TABLE public.icp_analysis_results 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'descartada')),
ADD COLUMN IF NOT EXISTS raw_analysis JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS breakdown JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS motivos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS evidencias_totvs JSONB DEFAULT '[]'::jsonb;

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_icp_analysis_company_id ON public.icp_analysis_results(company_id);
CREATE INDEX IF NOT EXISTS idx_icp_analysis_status ON public.icp_analysis_results(status);
CREATE INDEX IF NOT EXISTS idx_icp_analysis_temperatura ON public.icp_analysis_results(temperatura);
CREATE INDEX IF NOT EXISTS idx_icp_analysis_score ON public.icp_analysis_results(icp_score DESC);

-- 3. Adicionar colunas faltantes em leads_pool
ALTER TABLE public.leads_pool
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'converted')),
ADD COLUMN IF NOT EXISTS temperatura TEXT DEFAULT 'cold' CHECK (temperatura IN ('hot', 'warm', 'cold')),
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}'::jsonb;

-- 4. Criar índices em leads_pool
CREATE INDEX IF NOT EXISTS idx_leads_pool_company_id ON public.leads_pool(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_pool_status ON public.leads_pool(status);
CREATE INDEX IF NOT EXISTS idx_leads_pool_temperatura ON public.leads_pool(temperatura);
CREATE INDEX IF NOT EXISTS idx_leads_pool_score ON public.leads_pool(icp_score DESC);

-- 5. Atualizar companies com campos de análise ICP
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS icp_temperature TEXT CHECK (icp_temperature IN ('hot', 'warm', 'cold')),
ADD COLUMN IF NOT EXISTS icp_breakdown JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS icp_motivos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS icp_analyzed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS totvs_detection_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS totvs_detection_details JSONB DEFAULT '[]'::jsonb;

-- 6. Criar índices em companies para filtros ICP
CREATE INDEX IF NOT EXISTS idx_companies_icp_score ON public.companies(icp_score DESC) WHERE icp_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_icp_temperature ON public.companies(icp_temperature) WHERE icp_temperature IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_disqualified ON public.companies(is_disqualified) WHERE is_disqualified = true;

-- 7. Comentários explicativos
COMMENT ON COLUMN public.icp_analysis_results.company_id IS 'Referência à empresa analisada';
COMMENT ON COLUMN public.icp_analysis_results.status IS 'Status do resultado: pendente, aprovada ou descartada';
COMMENT ON COLUMN public.icp_analysis_results.raw_analysis IS 'Resultado completo da análise em JSON';
COMMENT ON COLUMN public.leads_pool.company_id IS 'Referência à empresa no pool de leads';
COMMENT ON COLUMN public.leads_pool.status IS 'Status do lead: active, inactive ou converted';
COMMENT ON COLUMN public.leads_pool.temperatura IS 'Temperatura do lead: hot, warm ou cold';