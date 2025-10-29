-- ========================================
-- TABELA: Empresas Sugeridas (Descoberta)
-- ========================================
CREATE TABLE IF NOT EXISTS public.suggested_companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    discovery_batch_id uuid,
    company_name text NOT NULL,
    cnpj text,
    cnpj_validated boolean DEFAULT false,
    domain text,
    linkedin_url text,
    state text,
    city text,
    sector_code text REFERENCES public.sectors(sector_code),
    niche_code text REFERENCES public.niches(niche_code),
    
    -- Dados de enriquecimento
    apollo_data jsonb,
    linkedin_data jsonb,
    receita_ws_data jsonb,
    
    -- Origem da sugestão
    source text NOT NULL,
    source_company_id uuid REFERENCES public.companies(id),
    similarity_score numeric(3,2),
    similarity_reasons text[],
    
    -- Status
    status text NOT NULL DEFAULT 'pending',
    added_to_bank_at timestamptz,
    company_id uuid REFERENCES public.companies(id),
    
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suggested_companies_user 
ON public.suggested_companies(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_suggested_companies_status 
ON public.suggested_companies(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_suggested_companies_niche 
ON public.suggested_companies(niche_code, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_suggested_companies_source 
ON public.suggested_companies(source, created_at DESC);

-- ========================================
-- TABELA: Lotes de Descoberta
-- ========================================
CREATE TABLE IF NOT EXISTS public.discovery_batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    
    -- Critérios de busca
    sector_code text REFERENCES public.sectors(sector_code),
    niche_code text REFERENCES public.niches(niche_code),
    state text,
    city text,
    min_employees int,
    max_employees int,
    search_mode text NOT NULL,
    source_company_id uuid REFERENCES public.companies(id),
    
    -- Resultados
    total_found int NOT NULL DEFAULT 0,
    validated int NOT NULL DEFAULT 0,
    added_to_bank int NOT NULL DEFAULT 0,
    rejected int NOT NULL DEFAULT 0,
    
    status text NOT NULL DEFAULT 'pending',
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discovery_batches_user 
ON public.discovery_batches(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_discovery_batches_status 
ON public.discovery_batches(status, created_at DESC);

-- ========================================
-- RLS (Row Level Security)
-- ========================================
ALTER TABLE public.suggested_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_suggestions" ON public.suggested_companies;
CREATE POLICY "users_read_own_suggestions"
ON public.suggested_companies FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_suggestions" ON public.suggested_companies;
CREATE POLICY "users_insert_own_suggestions"
ON public.suggested_companies FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_suggestions" ON public.suggested_companies;
CREATE POLICY "users_update_own_suggestions"
ON public.suggested_companies FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_suggestions" ON public.suggested_companies;
CREATE POLICY "users_delete_own_suggestions"
ON public.suggested_companies FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

ALTER TABLE public.discovery_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_discovery" ON public.discovery_batches;
CREATE POLICY "users_read_own_discovery"
ON public.discovery_batches FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_discovery" ON public.discovery_batches;
CREATE POLICY "users_insert_own_discovery"
ON public.discovery_batches FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_discovery" ON public.discovery_batches;
CREATE POLICY "users_update_own_discovery"
ON public.discovery_batches FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

-- Service role pode gerenciar tudo
DROP POLICY IF EXISTS "service_manage_suggested" ON public.suggested_companies;
CREATE POLICY "service_manage_suggested"
ON public.suggested_companies FOR ALL 
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_manage_discovery" ON public.discovery_batches;
CREATE POLICY "service_manage_discovery"
ON public.discovery_batches FOR ALL 
USING (true)
WITH CHECK (true);