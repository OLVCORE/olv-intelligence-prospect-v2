-- ✅ FASE 1: Tabela para persistir relatórios de detecção TOTVS
CREATE TABLE IF NOT EXISTS public.totvs_detection_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sdr_deal_id UUID REFERENCES public.sdr_deals(id) ON DELETE SET NULL,
  
  -- Dados do relatório
  score INTEGER NOT NULL DEFAULT 0,
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  detection_status TEXT NOT NULL DEFAULT 'no_detection',
  
  -- Evidências estruturadas
  evidences JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Metodologia completa
  methodology JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Score breakdown
  score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Metadados
  execution_time_ms INTEGER,
  sources_checked INTEGER DEFAULT 0,
  sources_with_results INTEGER DEFAULT 0,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Índices para performance
  CONSTRAINT valid_score CHECK (score >= 0 AND score <= 100)
);

-- Índices otimizados
CREATE INDEX idx_totvs_reports_company ON public.totvs_detection_reports(company_id);
CREATE INDEX idx_totvs_reports_deal ON public.totvs_detection_reports(sdr_deal_id);
CREATE INDEX idx_totvs_reports_score ON public.totvs_detection_reports(score DESC);
CREATE INDEX idx_totvs_reports_created ON public.totvs_detection_reports(created_at DESC);

-- RLS: Usuários autenticados podem ler todos os relatórios
ALTER TABLE public.totvs_detection_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read totvs_detection_reports"
  ON public.totvs_detection_reports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert totvs_detection_reports"
  ON public.totvs_detection_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger para atualizar totvs_detection_score na tabela companies
CREATE OR REPLACE FUNCTION update_company_totvs_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.companies
  SET 
    totvs_detection_score = NEW.score,
    totvs_last_checked_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.company_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_company_totvs_score
  AFTER INSERT ON public.totvs_detection_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_company_totvs_score();

COMMENT ON TABLE public.totvs_detection_reports IS 'Persistência de relatórios de detecção TOTVS com histórico completo';
