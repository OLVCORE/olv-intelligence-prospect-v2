-- Tabela para armazenar matches STC de concorrentes
CREATE TABLE IF NOT EXISTS public.competitor_stc_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('double_match', 'triple_match')),
  confidence DECIMAL(3,2) NOT NULL,
  evidence TEXT,
  source_url TEXT,
  source_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_competitor_stc_company ON public.competitor_stc_matches(company_id);
CREATE INDEX IF NOT EXISTS idx_competitor_stc_match_type ON public.competitor_stc_matches(match_type);
CREATE INDEX IF NOT EXISTS idx_competitor_stc_confidence ON public.competitor_stc_matches(confidence DESC);

-- RLS
ALTER TABLE public.competitor_stc_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view competitor STC matches"
  ON public.competitor_stc_matches
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage competitor STC matches"
  ON public.competitor_stc_matches
  FOR ALL
  USING (auth.role() = 'service_role');