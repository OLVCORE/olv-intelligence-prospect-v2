-- ============================================
-- CICLO 3: Estrutura de Banco de Dados (IDEMPOTENTE)
-- ============================================

-- Criar tabela decision_makers apenas se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'decision_makers') THEN
    CREATE TABLE public.decision_makers (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
      apollo_person_id TEXT UNIQUE,
      apollo_organization_id TEXT,
      name TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      title TEXT,
      seniority TEXT,
      departments JSONB DEFAULT '[]'::JSONB,
      email TEXT,
      email_status TEXT,
      phone TEXT,
      mobile_phone TEXT,
      linkedin_url TEXT,
      apollo_person_url TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      recommendations_score INTEGER,
      people_auto_score_label TEXT,
      people_auto_score_value INTEGER,
      is_current_at_company BOOLEAN DEFAULT true,
      is_decision_maker BOOLEAN DEFAULT true,
      tenure_start_date DATE,
      tenure_months INTEGER,
      employment_history JSONB DEFAULT '[]'::JSONB,
      education JSONB DEFAULT '[]'::JSONB,
      company_name TEXT,
      company_employees INTEGER,
      company_industries JSONB DEFAULT '[]'::JSONB,
      company_keywords JSONB DEFAULT '[]'::JSONB,
      raw_apollo_data JSONB,
      raw_linkedin_data JSONB,
      data_sources JSONB DEFAULT '[]'::JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_enriched_at TIMESTAMPTZ,
      validation_status TEXT DEFAULT 'valid',
      rejection_reason TEXT,
      CONSTRAINT valid_email_status CHECK (email_status IN ('verified', 'unavailable', 'personal', NULL)),
      CONSTRAINT valid_seniority CHECK (seniority IN ('C-Level', 'VP', 'Director', 'Head', 'Manager', 'Senior', 'Entry', NULL))
    );
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_decision_makers_company_id ON public.decision_makers(company_id);
CREATE INDEX IF NOT EXISTS idx_decision_makers_apollo_person_id ON public.decision_makers(apollo_person_id);
CREATE INDEX IF NOT EXISTS idx_decision_makers_linkedin_url ON public.decision_makers(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_decision_makers_email ON public.decision_makers(email);
CREATE INDEX IF NOT EXISTS idx_decision_makers_seniority ON public.decision_makers(seniority);
CREATE INDEX IF NOT EXISTS idx_decision_makers_recommendations_score ON public.decision_makers(recommendations_score DESC);

-- Trigger
DROP TRIGGER IF EXISTS update_decision_makers_updated_at ON public.decision_makers;
CREATE TRIGGER update_decision_makers_updated_at
  BEFORE UPDATE ON public.decision_makers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.decision_makers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read decision_makers" ON public.decision_makers;
CREATE POLICY "Authenticated users can read decision_makers"
  ON public.decision_makers FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert decision_makers" ON public.decision_makers;
CREATE POLICY "Authenticated users can insert decision_makers"
  ON public.decision_makers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update decision_makers" ON public.decision_makers;
CREATE POLICY "Authenticated users can update decision_makers"
  ON public.decision_makers FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Service role can manage decision_makers" ON public.decision_makers;
CREATE POLICY "Service role can manage decision_makers"
  ON public.decision_makers FOR ALL
  USING (true)
  WITH CHECK (true);

-- Adicionar campos na companies
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS apollo_organization_id TEXT,
  ADD COLUMN IF NOT EXISTS similar_companies JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS technologies_full JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS employee_trends JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS website_visitors JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS company_insights JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS news JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS job_postings JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS founding_year INTEGER,
  ADD COLUMN IF NOT EXISTS apollo_score JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS suggested_leads JSONB DEFAULT '[]'::JSONB;

CREATE INDEX IF NOT EXISTS idx_companies_apollo_organization_id ON public.companies(apollo_organization_id);