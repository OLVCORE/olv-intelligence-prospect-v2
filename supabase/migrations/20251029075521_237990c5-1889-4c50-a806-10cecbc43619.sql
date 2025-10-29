-- ========================================
-- EXPANDIR TABELAS EXISTENTES + CRIAR NOVAS
-- ========================================

-- Expandir totvs_usage_detection
ALTER TABLE public.totvs_usage_detection 
ADD COLUMN IF NOT EXISTS cnpj text,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS sector text,
ADD COLUMN IF NOT EXISTS platforms_scanned text[] DEFAULT array[]::text[],
ADD COLUMN IF NOT EXISTS disqualification_reason text,
ADD COLUMN IF NOT EXISTS confidence text;

-- Criar índices adicionais
CREATE INDEX IF NOT EXISTS idx_totvs_detection_region ON public.totvs_usage_detection(region, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_totvs_detection_sector ON public.totvs_usage_detection(sector, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_totvs_detection_status ON public.totvs_usage_detection(status, checked_at DESC);

-- Expandir intent_signals_detection
ALTER TABLE public.intent_signals_detection 
ADD COLUMN IF NOT EXISTS cnpj text,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS sector text,
ADD COLUMN IF NOT EXISTS platforms_scanned text[] DEFAULT array[]::text[],
ADD COLUMN IF NOT EXISTS temperature text,
ADD COLUMN IF NOT EXISTS confidence text;

-- Criar índices adicionais
CREATE INDEX IF NOT EXISTS idx_intent_detection_region ON public.intent_signals_detection(region, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_intent_detection_sector ON public.intent_signals_detection(sector, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_intent_detection_temperature ON public.intent_signals_detection(temperature, checked_at DESC);

-- ========================================
-- NOVA TABELA: Vagas Detectadas
-- ========================================
CREATE TABLE IF NOT EXISTS public.job_postings_detected (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  platform text NOT NULL,
  job_title text NOT NULL,
  job_description text,
  job_url text NOT NULL,
  required_skills text[],
  totvs_products_mentioned text[],
  location text,
  posted_at timestamptz,
  detected_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_postings_company ON public.job_postings_detected(company_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_platform ON public.job_postings_detected(platform, detected_at DESC);

-- RLS
ALTER TABLE public.job_postings_detected ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_job_postings_auth" ON public.job_postings_detected;
CREATE POLICY "read_job_postings_auth" ON public.job_postings_detected 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_job_postings_service" ON public.job_postings_detected;
CREATE POLICY "insert_job_postings_service" ON public.job_postings_detected 
  FOR INSERT WITH CHECK (true);

-- ========================================
-- NOVA TABELA: Documentos Financeiros
-- ========================================
CREATE TABLE IF NOT EXISTS public.financial_docs_detected (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  doc_type text NOT NULL,
  doc_url text NOT NULL,
  totvs_mentioned boolean NOT NULL DEFAULT false,
  totvs_as_creditor boolean NOT NULL DEFAULT false,
  excerpt text,
  detected_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_docs_company ON public.financial_docs_detected(company_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_docs_totvs_creditor ON public.financial_docs_detected(totvs_as_creditor, detected_at DESC);

-- RLS
ALTER TABLE public.financial_docs_detected ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_financial_docs_auth" ON public.financial_docs_detected;
CREATE POLICY "read_financial_docs_auth" ON public.financial_docs_detected 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_financial_docs_service" ON public.financial_docs_detected;
CREATE POLICY "insert_financial_docs_service" ON public.financial_docs_detected 
  FOR INSERT WITH CHECK (true);