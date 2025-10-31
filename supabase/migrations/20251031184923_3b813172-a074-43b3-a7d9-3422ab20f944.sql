-- Tabela para verificações TOTVS simplificadas
CREATE TABLE IF NOT EXISTS public.simple_totvs_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('go', 'no-go', 'revisar')),
  detected_totvs BOOLEAN NOT NULL DEFAULT false,
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  total_evidences INTEGER NOT NULL DEFAULT 0,
  evidences JSONB,
  reasoning TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_simple_totvs_checks_company ON public.simple_totvs_checks(company_id);
CREATE INDEX IF NOT EXISTS idx_simple_totvs_checks_status ON public.simple_totvs_checks(status);
CREATE INDEX IF NOT EXISTS idx_simple_totvs_checks_checked_at ON public.simple_totvs_checks(checked_at DESC);

-- RLS policies
ALTER TABLE public.simple_totvs_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver verificações"
  ON public.simple_totvs_checks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar verificações"
  ON public.simple_totvs_checks FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON TABLE public.simple_totvs_checks IS 'Verificações simplificadas de uso TOTVS para metodologia GO/NO-GO';
