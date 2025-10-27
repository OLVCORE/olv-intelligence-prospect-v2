-- FASE 1: OTIMIZAÇÃO SDR - ESSENCIAL
-- Feature flags + índices básicos + função auxiliar

-- 1. ATIVAR FEATURE FLAGS
INSERT INTO public.app_features (feature, enabled, updated_at)
VALUES 
  ('auto_deal', true, now()),
  ('sdr_sequences_auto_run', true, now()),
  ('sdr_workspace_minis', true, now()),
  ('sdr_ai_forecasting', true, now())
ON CONFLICT (feature) 
DO UPDATE SET enabled = true, updated_at = now();

-- 2. ÍNDICES BÁSICOS (apenas colunas garantidas)
CREATE INDEX IF NOT EXISTS idx_sdr_deals_company_id ON public.sdr_deals(company_id);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_stage ON public.sdr_deals(stage);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_status ON public.sdr_deals(status);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_created_at ON public.sdr_deals(created_at DESC);

-- 3. FUNÇÃO AUXILIAR
CREATE OR REPLACE FUNCTION public.calculate_deal_health_score(deal_id UUID)
RETURNS INTEGER AS $func$
DECLARE
  v_score INTEGER := 70;
  v_deal RECORD;
BEGIN
  SELECT * INTO v_deal FROM public.sdr_deals WHERE id = deal_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  IF v_deal.probability > 70 AND v_deal.value > 100000 THEN v_score := v_score + 20; END IF;
  RETURN GREATEST(0, LEAST(100, v_score));
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;