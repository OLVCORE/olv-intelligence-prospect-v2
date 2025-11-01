-- Adicionar colunas STC em icp_analysis_results para armazenar resultados na QUARENTENA
ALTER TABLE public.icp_analysis_results 
ADD COLUMN IF NOT EXISTS totvs_check_status TEXT CHECK (totvs_check_status IN ('go', 'no-go', 'revisar')),
ADD COLUMN IF NOT EXISTS totvs_check_confidence TEXT CHECK (totvs_check_confidence IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS totvs_check_evidences JSONB DEFAULT '{"vagas": [], "noticias": [], "docs_oficiais": []}'::jsonb,
ADD COLUMN IF NOT EXISTS totvs_check_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS totvs_check_total_weight INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS totvs_check_reasoning TEXT;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_icp_totvs_check_status 
  ON public.icp_analysis_results(totvs_check_status);

CREATE INDEX IF NOT EXISTS idx_icp_totvs_check_date 
  ON public.icp_analysis_results(totvs_check_date DESC);

-- Comentários para documentação
COMMENT ON COLUMN public.icp_analysis_results.totvs_check_status IS 'Resultado do Simple TOTVS Check: go (sem TOTVS), no-go (usa TOTVS), revisar (incerto)';
COMMENT ON COLUMN public.icp_analysis_results.totvs_check_evidences IS 'Evidências categorizadas encontradas pelo STC';
COMMENT ON COLUMN public.icp_analysis_results.totvs_check_total_weight IS 'Peso total das evidências (40-100+ pontos)';