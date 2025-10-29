-- COMPANIES: garantir colunas mapeáveis
ALTER TABLE public.companies
    ADD COLUMN IF NOT EXISTS apollo_organization_id text,
    ADD COLUMN IF NOT EXISTS linkedin_company_id text,
    ADD COLUMN IF NOT EXISTS sub_industry text,
    ADD COLUMN IF NOT EXISTS employee_count_range text,
    ADD COLUMN IF NOT EXISTS headquarters_city text,
    ADD COLUMN IF NOT EXISTS headquarters_state text,
    ADD COLUMN IF NOT EXISTS headquarters_country text,
    ADD COLUMN IF NOT EXISTS revenue_range text,
    ADD COLUMN IF NOT EXISTS apollo_url text,
    ADD COLUMN IF NOT EXISTS last_apollo_sync_at timestamptz;

CREATE INDEX IF NOT EXISTS ix_companies_apollo_org ON public.companies (apollo_organization_id);

-- PEOPLE (42 campos principais)
CREATE TABLE IF NOT EXISTS public.people (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    apollo_person_id text,
    linkedin_profile_id text,
    linkedin_url text,
    first_name text,
    last_name text,
    full_name text,
    job_title text,
    seniority text,
    department text,
    email_primary text,
    email_hash text,
    email_status text,
    phones jsonb,
    city text,
    state text,
    country text,
    timezone text,
    languages jsonb,
    skills jsonb,
    headline text,
    current_company_apollo_id text,
    current_company_linkedin_id text,
    started_at date,
    ended_at date,
    last_seen_at timestamptz,
    last_updated_at timestamptz,
    source text DEFAULT 'apollo',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_people_apollo ON public.people (apollo_person_id) WHERE apollo_person_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_people_linkedin ON public.people (linkedin_profile_id) WHERE linkedin_profile_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_people_emailhash ON public.people (email_hash) WHERE email_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_people_fullname ON public.people (full_name);

-- Vínculo COMPANY ↔ PERSON
CREATE TABLE IF NOT EXISTS public.company_people (
    company_id uuid NOT NULL,
    person_id uuid NOT NULL,
    apollo_organization_id text,
    department text,
    seniority text,
    location_city text,
    location_state text,
    location_country text,
    title_at_company text,
    is_current boolean DEFAULT true,
    confidence numeric,
    source text DEFAULT 'apollo',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (company_id, person_id)
);
CREATE INDEX IF NOT EXISTS ix_company_people_company ON public.company_people (company_id);

-- SIMILARES
CREATE TABLE IF NOT EXISTS public.similar_companies (
    company_id uuid NOT NULL,
    similar_company_external_id text NOT NULL,
    similar_name text,
    location text,
    employees_min int,
    employees_max int,
    similarity_score numeric,
    source text DEFAULT 'apollo',
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (company_id, similar_company_external_id)
);

-- NEWS
CREATE TABLE IF NOT EXISTS public.company_news (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id uuid NOT NULL,
    title text NOT NULL,
    url text NOT NULL,
    portal text,
    published_at timestamptz,
    score numeric,
    why text,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_company_news_company ON public.company_news (company_id);

-- JOBS
CREATE TABLE IF NOT EXISTS public.company_jobs (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id uuid NOT NULL,
    title text,
    location text,
    url text,
    portal text,
    posted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_company_jobs_company ON public.company_jobs (company_id);

-- TECHNOLOGIES
CREATE TABLE IF NOT EXISTS public.company_technologies (
    company_id uuid NOT NULL,
    technology text NOT NULL,
    category text,
    source text DEFAULT 'apollo',
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (company_id, technology)
);

-- INSIGHTS
CREATE TABLE IF NOT EXISTS public.company_insights (
    company_id uuid PRIMARY KEY,
    auto_score numeric,
    drivers jsonb,
    updated_at timestamptz
);

-- AUDITORIA
CREATE TABLE IF NOT EXISTS public.company_updates (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    activity_id uuid NOT NULL,
    request_id uuid NOT NULL,
    company_id uuid NOT NULL,
    organization_id text NOT NULL,
    modes text[] NOT NULL,
    updated_fields text[] NOT NULL,
    updated_count int NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_company_updates_company ON public.company_updates (company_id);

-- RLS Policies para as novas tabelas
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.similar_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_updates ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para leitura autenticada
CREATE POLICY "Authenticated users can read people" ON public.people FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read company_people" ON public.company_people FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read similar_companies" ON public.similar_companies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read company_news" ON public.company_news FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read company_jobs" ON public.company_jobs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read company_technologies" ON public.company_technologies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read company_insights" ON public.company_insights FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read company_updates" ON public.company_updates FOR SELECT USING (auth.uid() IS NOT NULL);

-- Service role pode inserir/atualizar (usado pela Edge Function)
CREATE POLICY "Service role can manage people" ON public.people FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage company_people" ON public.company_people FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage similar_companies" ON public.similar_companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage company_news" ON public.company_news FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage company_jobs" ON public.company_jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage company_technologies" ON public.company_technologies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage company_insights" ON public.company_insights FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage company_updates" ON public.company_updates FOR ALL USING (true) WITH CHECK (true);