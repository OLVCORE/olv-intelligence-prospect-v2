-- Create company_enrichment table with RLS and triggers
CREATE TABLE IF NOT EXISTS public.company_enrichment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_company_enrichment UNIQUE (company_id, source)
);

-- Enable RLS
ALTER TABLE public.company_enrichment ENABLE ROW LEVEL SECURITY;

-- Policies (aligned with existing project pattern)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'company_enrichment' AND policyname = 'Authenticated users can insert company_enrichment'
  ) THEN
    CREATE POLICY "Authenticated users can insert company_enrichment"
    ON public.company_enrichment
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'company_enrichment' AND policyname = 'Authenticated users can read company_enrichment'
  ) THEN
    CREATE POLICY "Authenticated users can read company_enrichment"
    ON public.company_enrichment
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'company_enrichment' AND policyname = 'Authenticated users can update company_enrichment'
  ) THEN
    CREATE POLICY "Authenticated users can update company_enrichment"
    ON public.company_enrichment
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Trigger to maintain updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_company_enrichment_updated_at'
  ) THEN
    CREATE TRIGGER update_company_enrichment_updated_at
    BEFORE UPDATE ON public.company_enrichment
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Helpful index on source for analytics
CREATE INDEX IF NOT EXISTS idx_company_enrichment_source ON public.company_enrichment(source);
CREATE INDEX IF NOT EXISTS idx_company_enrichment_company ON public.company_enrichment(company_id);