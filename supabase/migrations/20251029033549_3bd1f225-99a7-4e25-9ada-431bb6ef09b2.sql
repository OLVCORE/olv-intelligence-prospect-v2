
-- =====================================================================
-- MICROCICLO 1: FUNDAÇÃO - Índices + RLS + Governança + Auditoria
-- =====================================================================

-- ========================================
-- 1.1) ÍNDICES ÚNICOS (previne 500 no upsert)
-- ========================================
CREATE UNIQUE INDEX IF NOT EXISTS ux_people_apollo 
ON public.people (apollo_person_id) 
WHERE apollo_person_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_people_linkedin 
ON public.people (linkedin_profile_id) 
WHERE linkedin_profile_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_people_emailhash 
ON public.people (email_hash) 
WHERE email_hash IS NOT NULL;

-- ========================================
-- 1.2) GOVERNANÇA - Meta por campo + Auditoria
-- ========================================
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS field_meta JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.company_change_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    field TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    source TEXT NOT NULL,
    reason TEXT NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_change_log_company 
ON public.company_change_log(company_id, changed_at DESC);

-- Publicar no Realtime para toasts reativos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'company_change_log'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.company_change_log;
    END IF;
END $$;

-- ========================================
-- 1.3) TABELA DE AUDITORIA DE UPDATES
-- ========================================
CREATE TABLE IF NOT EXISTS public.company_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL,
    request_id UUID NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL,
    modes TEXT[] NOT NULL,
    updated_fields TEXT[] DEFAULT ARRAY[]::TEXT[],
    updated_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_updates_company 
ON public.company_updates(company_id, created_at DESC);

-- ========================================
-- 1.4) RLS - Políticas de escrita para service_role
-- ========================================

-- company_change_log: service role pode inserir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_change_log' 
        AND policyname = 'service_can_insert_change_log'
    ) THEN
        CREATE POLICY service_can_insert_change_log
        ON public.company_change_log FOR INSERT
        TO service_role
        WITH CHECK (true);
    END IF;
END $$;

-- company_updates: service role pode inserir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_updates' 
        AND policyname = 'service_can_insert_updates'
    ) THEN
        CREATE POLICY service_can_insert_updates
        ON public.company_updates FOR INSERT
        TO service_role
        WITH CHECK (true);
    END IF;
END $$;

-- company_change_log: authenticated podem ler
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_change_log' 
        AND policyname = 'auth_can_read_change_log'
    ) THEN
        CREATE POLICY auth_can_read_change_log
        ON public.company_change_log FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END $$;

-- company_updates: authenticated podem ler
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_updates' 
        AND policyname = 'auth_can_read_updates'
    ) THEN
        CREATE POLICY auth_can_read_updates
        ON public.company_updates FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END $$;
