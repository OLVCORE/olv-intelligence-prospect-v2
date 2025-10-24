-- Company previews to persist non-committed search results
CREATE TABLE IF NOT EXISTS public.company_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  query TEXT,
  cnpj TEXT,
  name TEXT,
  website TEXT,
  domain TEXT,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.company_previews ENABLE ROW LEVEL SECURITY;

-- Basic policies: authenticated users can read/insert/update previews
CREATE POLICY "Authenticated users can read company_previews"
ON public.company_previews
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert company_previews"
ON public.company_previews
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update company_previews"
ON public.company_previews
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Trigger to maintain updated_at
CREATE TRIGGER update_company_previews_updated_at
BEFORE UPDATE ON public.company_previews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_company_previews_created_at ON public.company_previews (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_previews_cnpj ON public.company_previews (cnpj);
CREATE INDEX IF NOT EXISTS idx_company_previews_name ON public.company_previews (lower(name));
