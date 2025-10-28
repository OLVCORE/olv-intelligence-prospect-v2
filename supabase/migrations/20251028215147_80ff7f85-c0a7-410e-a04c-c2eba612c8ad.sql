-- ============================================
-- CICLO 3: Estrutura de Banco de Dados (DROP E RECREATE)
-- ============================================

-- Drop existing table and recreate from scratch
DROP TABLE IF EXISTS public.decision_makers CASCADE;

-- 1. Criar tabela decision_makers (42+ campos conforme especificação)
CREATE TABLE public.decision_makers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identificadores
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  apollo_person_id TEXT UNIQUE,
  apollo_organization_id TEXT,
  
  -- Dados pessoais
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  title TEXT,
  seniority TEXT,
  departments JSONB DEFAULT '[]'::JSONB,
  
  -- Contatos
  email TEXT,
  email_status TEXT,
  phone TEXT,
  mobile_phone TEXT,
  
  -- Links (canônicos e obrigatórios)
  linkedin_url TEXT,
  apollo_person_url TEXT,
  
  -- Localização
  city TEXT,
  state TEXT,
  country TEXT,
  
  -- Scores e métricas
  recommendations_score INTEGER,
  people_auto_score_label TEXT,
  people_auto_score_value INTEGER,
  
  -- Vínculo com empresa
  is_current_at_company BOOLEAN DEFAULT true,
  is_decision_maker BOOLEAN DEFAULT true,
  tenure_start_date DATE,
  tenure_months INTEGER,
  
  -- Dados profissionais
  employment_history JSONB DEFAULT '[]'::JSONB,
  education JSONB DEFAULT '[]'::JSONB,
  
  -- Contexto da empresa
  company_name TEXT,
  company_employees INTEGER,
  company_industries JSONB DEFAULT '[]'::JSONB,
  company_keywords JSONB DEFAULT '[]'::JSONB,
  
  -- Metadados
  raw_apollo_data JSONB,
  raw_linkedin_data JSONB,
  data_sources JSONB DEFAULT '[]'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_enriched_at TIMESTAMPTZ,
  
  -- Validação e auditoria
  validation_status TEXT DEFAULT 'valid',
  rejection_reason TEXT,
  
  -- Constraints
  CONSTRAINT valid_email_status CHECK (email_status IN ('verified', 'unavailable', 'personal', NULL)),
  CONSTRAINT valid_seniority CHECK (seniority IN ('C-Level', 'VP', 'Director', 'Head', 'Manager', 'Senior', 'Entry', NULL))
);

-- Índices para performance
CREATE INDEX idx_decision_makers_company_id ON public.decision_makers(company_id);
CREATE INDEX idx_decision_makers_apollo_person_id ON public.decision_makers(apollo_person_id);
CREATE INDEX idx_decision_makers_linkedin_url ON public.decision_makers(linkedin_url);
CREATE INDEX idx_decision_makers_email ON public.decision_makers(email);
CREATE INDEX idx_decision_makers_seniority ON public.decision_makers(seniority);
CREATE INDEX idx_decision_makers_recommendations_score ON public.decision_makers(recommendations_score DESC);

-- Trigger para updated_at
CREATE TRIGGER update_decision_makers_updated_at
  BEFORE UPDATE ON public.decision_makers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.decision_makers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read decision_makers"
  ON public.decision_makers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert decision_makers"
  ON public.decision_makers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update decision_makers"
  ON public.decision_makers FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage decision_makers"
  ON public.decision_makers FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Adicionar campos do CICLO 3 na tabela companies
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

-- Índice para apollo_organization_id
CREATE INDEX IF NOT EXISTS idx_companies_apollo_organization_id ON public.companies(apollo_organization_id);