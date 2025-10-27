-- Adicionar campos completos do Apollo na tabela companies
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS apollo_id text,
ADD COLUMN IF NOT EXISTS market_segments text[],
ADD COLUMN IF NOT EXISTS sic_codes text[],
ADD COLUMN IF NOT EXISTS naics_codes text[],
ADD COLUMN IF NOT EXISTS funding_total numeric,
ADD COLUMN IF NOT EXISTS funding_rounds jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_funding_round_date date,
ADD COLUMN IF NOT EXISTS last_funding_round_amount numeric,
ADD COLUMN IF NOT EXISTS investors jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS job_postings_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS job_postings jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS buying_intent_score integer,
ADD COLUMN IF NOT EXISTS buying_intent_signals jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS website_visitors_count integer,
ADD COLUMN IF NOT EXISTS website_visitors_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS account_score integer,
ADD COLUMN IF NOT EXISTS apollo_signals jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS apollo_metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS apollo_last_enriched_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS employee_count_from_apollo integer,
ADD COLUMN IF NOT EXISTS revenue_range_from_apollo text,
ADD COLUMN IF NOT EXISTS phone_numbers text[],
ADD COLUMN IF NOT EXISTS social_urls jsonb DEFAULT '{}'::jsonb;

-- Criar índices para otimização de busca
CREATE INDEX IF NOT EXISTS idx_companies_apollo_id ON companies(apollo_id);
CREATE INDEX IF NOT EXISTS idx_companies_market_segments ON companies USING GIN(market_segments);
CREATE INDEX IF NOT EXISTS idx_companies_sic_codes ON companies USING GIN(sic_codes);
CREATE INDEX IF NOT EXISTS idx_companies_buying_intent_score ON companies(buying_intent_score);
CREATE INDEX IF NOT EXISTS idx_companies_account_score ON companies(account_score);

-- Expandir tabela decision_makers com campos do Apollo People
ALTER TABLE decision_makers
ADD COLUMN IF NOT EXISTS apollo_person_id text,
ADD COLUMN IF NOT EXISTS email_status text,
ADD COLUMN IF NOT EXISTS email_verification_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS contact_accuracy_score integer,
ADD COLUMN IF NOT EXISTS seniority_level text,
ADD COLUMN IF NOT EXISTS departments text[],
ADD COLUMN IF NOT EXISTS persona_tags text[],
ADD COLUMN IF NOT EXISTS apollo_person_metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS direct_phone text,
ADD COLUMN IF NOT EXISTS mobile_phone text,
ADD COLUMN IF NOT EXISTS work_direct_phone text,
ADD COLUMN IF NOT EXISTS extrapolated_email_confidence numeric,
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS intent_strength text,
ADD COLUMN IF NOT EXISTS show_intent boolean DEFAULT false;

-- Criar índices para decision_makers
CREATE INDEX IF NOT EXISTS idx_decision_makers_apollo_id ON decision_makers(apollo_person_id);
CREATE INDEX IF NOT EXISTS idx_decision_makers_email_status ON decision_makers(email_status);
CREATE INDEX IF NOT EXISTS idx_decision_makers_seniority ON decision_makers(seniority_level);
CREATE INDEX IF NOT EXISTS idx_decision_makers_accuracy ON decision_makers(contact_accuracy_score);

-- Comentários para documentação
COMMENT ON COLUMN companies.market_segments IS 'Market segments from Apollo (e.g., SMB, Mid-Market, Enterprise)';
COMMENT ON COLUMN companies.sic_codes IS 'Standard Industrial Classification codes from Apollo';
COMMENT ON COLUMN companies.naics_codes IS 'North American Industry Classification System codes from Apollo';
COMMENT ON COLUMN companies.buying_intent_signals IS 'Buying intent signals detected by Apollo';
COMMENT ON COLUMN companies.apollo_signals IS 'Various signals from Apollo (hiring, funding, tech adoption, etc)';
COMMENT ON COLUMN decision_makers.email_status IS 'Email verification status from Apollo (verified, guessed, unavailable, etc)';
COMMENT ON COLUMN decision_makers.contact_accuracy_score IS 'Apollo contact accuracy score (0-100)';
COMMENT ON COLUMN decision_makers.seniority_level IS 'Seniority level from Apollo (C-Level, VP, Director, Manager, etc)';