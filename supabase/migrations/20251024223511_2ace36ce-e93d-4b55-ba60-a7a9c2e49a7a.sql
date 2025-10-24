-- Corrigir search_path das funções para segurança
DROP FUNCTION IF EXISTS update_sdr_deals_updated_at CASCADE;
DROP FUNCTION IF EXISTS log_deal_stage_change CASCADE;

CREATE FUNCTION update_sdr_deals_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_sdr_deals_updated_at
  BEFORE UPDATE ON sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_sdr_deals_updated_at();

CREATE FUNCTION log_deal_stage_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO sdr_deal_activities (deal_id, activity_type, description, old_value, new_value, created_by)
    VALUES (
      NEW.id,
      'stage_change',
      'Estágio alterado de ' || OLD.stage || ' para ' || NEW.stage,
      jsonb_build_object('stage', OLD.stage),
      jsonb_build_object('stage', NEW.stage),
      auth.uid()
    );
    
    NEW.last_activity_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_deal_stage_change
  BEFORE UPDATE ON sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION log_deal_stage_change();
