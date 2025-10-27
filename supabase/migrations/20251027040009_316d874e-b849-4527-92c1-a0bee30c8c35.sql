-- Correção de segurança: search_path nas funções
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp';