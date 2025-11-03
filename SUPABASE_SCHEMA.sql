-- Tabela companies
CREATE TABLE IF NOT EXISTS public.companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cnpj TEXT UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      fantasy_name TEXT,
      main_activity TEXT,
      secondary_activities TEXT[],
      legal_nature TEXT,
      company_size TEXT,
      opening_date DATE,
      registration_status TEXT,
      full_address TEXT,
      street TEXT,
      number TEXT,
      complement TEXT,
      neighborhood TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      country TEXT DEFAULT 'Brasil',
      phone TEXT,
      email TEXT,
      website TEXT,
      share_capital DECIMAL(15,2),
      employee_count INTEGER,
      annual_revenue DECIMAL(15,2),
      linkedin_url TEXT,
      facebook_url TEXT,
      instagram_url TEXT,
      twitter_url TEXT,
      youtube_url TEXT,
      data_source TEXT,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- Tabela decision_makers
CREATE TABLE IF NOT EXISTS public.decision_makers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      position TEXT,
      department TEXT,
      seniority_level TEXT,
      email TEXT,
      phone TEXT,
      linkedin_url TEXT,
      is_verified BOOLEAN DEFAULT false,
      data_source TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- Tabela sdr_deals
CREATE TABLE IF NOT EXISTS public.sdr_deals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
      deal_title TEXT NOT NULL,
      deal_stage TEXT DEFAULT 'Prospecção',
      deal_value DECIMAL(15,2),
      probability INTEGER CHECK (probability >= 0 AND probability <= 100),
      expected_close_date DATE,
      assigned_sdr TEXT,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- Tabela analysis_runs
CREATE TABLE IF NOT EXISTS public.analysis_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
      analysis_type TEXT NOT NULL,
      input_parameters JSONB,
      result_data JSONB,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      completed_at TIMESTAMP WITH TIME ZONE
    );

-- Tabela api_usage_logs
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      api_name TEXT NOT NULL,
      endpoint TEXT,
      method TEXT,
      request_payload JSONB,
      response_status INTEGER,
      response_data JSONB,
      execution_time_ms INTEGER,
      error_message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- Tabela user_sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_email TEXT NOT NULL,
      session_token TEXT UNIQUE NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- Índice companies_cnpj
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj);

-- Índice companies_city
CREATE INDEX IF NOT EXISTS idx_companies_city ON public.companies(city);

-- Índice decision_makers_company
CREATE INDEX IF NOT EXISTS idx_decision_makers_company ON public.decision_makers(company_id);

-- Índice sdr_deals_company
CREATE INDEX IF NOT EXISTS idx_sdr_deals_company ON public.sdr_deals(company_id);

-- Índice analysis_runs_company
CREATE INDEX IF NOT EXISTS idx_analysis_runs_company ON public.analysis_runs(company_id);

-- Índice api_logs_api_name
CREATE INDEX IF NOT EXISTS idx_api_logs_api_name ON public.api_usage_logs(api_name);

-- RLS companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- RLS decision_makers
ALTER TABLE public.decision_makers ENABLE ROW LEVEL SECURITY;

-- RLS sdr_deals
ALTER TABLE public.sdr_deals ENABLE ROW LEVEL SECURITY;

-- RLS analysis_runs
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;

-- RLS api_usage_logs
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Política companies
DROP POLICY IF EXISTS "Allow all for service role" ON public.companies;
          CREATE POLICY "Allow all for service role" ON public.companies FOR ALL USING (true);

-- Política decision_makers
DROP POLICY IF EXISTS "Allow all for service role" ON public.decision_makers;
          CREATE POLICY "Allow all for service role" ON public.decision_makers FOR ALL USING (true);

-- Política sdr_deals
DROP POLICY IF EXISTS "Allow all for service role" ON public.sdr_deals;
          CREATE POLICY "Allow all for service role" ON public.sdr_deals FOR ALL USING (true);

-- Política analysis_runs
DROP POLICY IF EXISTS "Allow all for service role" ON public.analysis_runs;
          CREATE POLICY "Allow all for service role" ON public.analysis_runs FOR ALL USING (true);

-- Política api_usage_logs
DROP POLICY IF EXISTS "Allow all for service role" ON public.api_usage_logs;
          CREATE POLICY "Allow all for service role" ON public.api_usage_logs FOR ALL USING (true);

-- Política user_sessions
DROP POLICY IF EXISTS "Allow all for service role" ON public.user_sessions;
          CREATE POLICY "Allow all for service role" ON public.user_sessions FOR ALL USING (true);
