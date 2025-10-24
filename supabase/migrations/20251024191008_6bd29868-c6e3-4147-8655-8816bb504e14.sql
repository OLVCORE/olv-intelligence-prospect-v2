-- ============================================================
-- SISTEMA DE RASTREABILIDADE E VERSIONAMENTO ROBUSTO
-- Inspirado em Econodata, Uplexis e outras plataformas enterprise
-- ============================================================

-- 1. ANALYSIS RUNS: Rastreia cada execução de enriquecimento
CREATE TABLE public.analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  run_type TEXT NOT NULL CHECK (run_type IN ('full_360', 'incremental', 'scheduled', 'manual')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Métricas de qualidade
  sources_attempted JSONB DEFAULT '[]'::jsonb, -- Lista de fontes tentadas
  sources_succeeded JSONB DEFAULT '[]'::jsonb, -- Fontes que funcionaram
  sources_failed JSONB DEFAULT '[]'::jsonb,    -- Fontes que falharam
  
  -- Dados agregados do run
  data_quality_score INTEGER CHECK (data_quality_score BETWEEN 0 AND 100),
  fields_enriched INTEGER DEFAULT 0,
  fields_total INTEGER DEFAULT 0,
  
  -- Logs e erros
  error_log JSONB,
  metadata JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analysis_runs_company ON public.analysis_runs(company_id);
CREATE INDEX idx_analysis_runs_status ON public.analysis_runs(status);
CREATE INDEX idx_analysis_runs_started ON public.analysis_runs(started_at DESC);

-- 2. ANALYSIS ARTIFACTS: Armazena resultado de cada etapa/fonte
CREATE TABLE public.analysis_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.analysis_runs(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  artifact_type TEXT NOT NULL CHECK (artifact_type IN (
    'receita_federal', 'web_scraping', 'social_media', 'tech_stack',
    'legal_data', 'financial_data', 'decision_makers', 'ai_insights'
  )),
  
  source_name TEXT NOT NULL, -- Ex: 'ReceitaWS', 'Google Search', 'LinkedIn'
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  
  -- Dados coletados
  raw_data JSONB NOT NULL,
  normalized_data JSONB, -- Dados normalizados para schema padrão
  
  -- Metadados de qualidade
  data_checksum TEXT, -- Hash para detectar mudanças
  fields_count INTEGER,
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  
  -- Rastreabilidade
  execution_time_ms INTEGER,
  api_call_cost DECIMAL(10,6), -- Custo estimado da chamada
  error_details TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_artifacts_run ON public.analysis_artifacts(run_id);
CREATE INDEX idx_artifacts_company ON public.analysis_artifacts(company_id);
CREATE INDEX idx_artifacts_type ON public.analysis_artifacts(artifact_type);

-- 3. VERSIONAMENTO DE RELATÓRIOS: Nunca perde histórico
CREATE TABLE public.executive_reports_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.executive_reports(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  run_id UUID REFERENCES public.analysis_runs(id) ON DELETE SET NULL,
  
  version_number INTEGER NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('company','maturity','fit')),
  content JSONB NOT NULL,
  
  -- Metadados da versão
  change_summary TEXT,
  fields_changed JSONB, -- Lista de campos que mudaram desde versão anterior
  quality_improvement DECIMAL(5,2), -- % de melhoria em relação à versão anterior
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_report_versions_report ON public.executive_reports_versions(report_id);
CREATE INDEX idx_report_versions_company ON public.executive_reports_versions(company_id);
CREATE UNIQUE INDEX idx_report_versions_unique ON public.executive_reports_versions(company_id, report_type, version_number);

-- 4. COMPANY SNAPSHOTS: Estado da empresa em cada momento
CREATE TABLE public.company_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES public.analysis_runs(id) ON DELETE CASCADE,
  
  -- Snapshot completo dos dados
  company_data JSONB NOT NULL,
  digital_presence_data JSONB,
  decision_makers_data JSONB,
  governance_signals_data JSONB,
  
  -- Hash para detectar mudanças
  data_hash TEXT NOT NULL,
  
  -- Indicadores de staleness
  data_freshness_score INTEGER CHECK (data_freshness_score BETWEEN 0 AND 100),
  days_since_last_update INTEGER,
  
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_snapshots_company ON public.company_snapshots(company_id);
CREATE INDEX idx_snapshots_run ON public.company_snapshots(run_id);
CREATE INDEX idx_snapshots_date ON public.company_snapshots(snapshot_date DESC);

-- 5. RLS POLICIES para todas as tabelas
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_reports_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies: usuários autenticados podem ler tudo
CREATE POLICY "Authenticated users can read analysis_runs"
  ON public.analysis_runs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert analysis_runs"
  ON public.analysis_runs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update analysis_runs"
  ON public.analysis_runs FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read artifacts"
  ON public.analysis_artifacts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert artifacts"
  ON public.analysis_artifacts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can read report versions"
  ON public.executive_reports_versions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert report versions"
  ON public.executive_reports_versions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can read snapshots"
  ON public.company_snapshots FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert snapshots"
  ON public.company_snapshots FOR INSERT TO authenticated WITH CHECK (true);

-- 6. FUNÇÃO para auto-incrementar version_number
CREATE OR REPLACE FUNCTION public.get_next_report_version(p_company_id UUID, p_report_type TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_version
  FROM public.executive_reports_versions
  WHERE company_id = p_company_id AND report_type = p_report_type;
  
  RETURN v_next_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Adicionar campo run_id em executive_reports para rastreabilidade
ALTER TABLE public.executive_reports 
  ADD COLUMN IF NOT EXISTS run_id UUID REFERENCES public.analysis_runs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS data_quality_score INTEGER CHECK (data_quality_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS sources_used JSONB DEFAULT '[]'::jsonb;