-- ========================================
-- FASE 1: CORREÇÃO CRÍTICA SDR (Schema Correto)
-- ========================================

-- PARTE 1: Migração de dados
INSERT INTO public.sdr_deals (
  id, company_id, contact_id, assigned_to, title, stage, value, probability,
  status, priority, source, description, expected_close_date, lost_reason,
  won_date, last_activity_at, created_at, updated_at
)
SELECT 
  o.id, o.company_id, o.contact_id, o.assigned_to, o.title, o.stage, 
  COALESCE(o.value, 0), COALESCE(o.probability, 50),
  'open' as status,
  'medium' as priority,
  'migration' as source,
  COALESCE(o.next_action, o.metadata::text) as description,
  o.expected_close_date, o.lost_reason, o.won_date,
  o.updated_at as last_activity_at,
  o.created_at, o.updated_at
FROM public.sdr_opportunities o
WHERE NOT EXISTS (SELECT 1 FROM public.sdr_deals d WHERE d.id = o.id)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.sdr_opportunities IS 'DEPRECATED - Use sdr_deals';

-- PARTE 2: Feature flags
INSERT INTO public.app_features (feature, enabled, updated_at)
VALUES 
  ('auto_deal', true, now()),
  ('sdr_sequences_auto_run', true, now()),
  ('sdr_workspace_minis', true, now())
ON CONFLICT (feature) DO UPDATE SET enabled = true, updated_at = now();

-- PARTE 3: Índices
CREATE INDEX IF NOT EXISTS idx_sdr_deals_company_id ON public.sdr_deals(company_id);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_stage ON public.sdr_deals(stage);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_status ON public.sdr_deals(status);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_automation ON public.sdr_deals(status, last_activity_at) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_sdr_sequence_runs_status ON public.sdr_sequence_runs(status);

-- PARTE 4: Função health score
CREATE OR REPLACE FUNCTION public.calculate_deal_health_score(deal_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 70;
  v_days_stale INTEGER;
BEGIN
  SELECT EXTRACT(DAY FROM (NOW() - COALESCE(last_activity_at, created_at)))
  INTO v_days_stale FROM public.sdr_deals WHERE id = deal_id;
  
  IF NOT FOUND THEN RETURN 0; END IF;
  IF v_days_stale > 14 THEN RETURN 40;
  ELSIF v_days_stale > 7 THEN RETURN 55; END IF;
  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;