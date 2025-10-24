-- Corrigir warnings de segurança: SET search_path nas functions

-- 1. Corrigir function update_sdr_deals_updated_at
DROP FUNCTION IF EXISTS update_sdr_deals_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_sdr_deals_updated_at()
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

-- Recriar trigger
CREATE TRIGGER trigger_update_sdr_deals_updated_at
  BEFORE UPDATE ON sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_sdr_deals_updated_at();

-- 2. Corrigir function log_deal_stage_change
DROP FUNCTION IF EXISTS log_deal_stage_change() CASCADE;

CREATE OR REPLACE FUNCTION log_deal_stage_change()
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

-- Recriar trigger
CREATE TRIGGER trigger_log_deal_stage_change
  BEFORE UPDATE ON sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION log_deal_stage_change();

COMMENT ON FUNCTION update_sdr_deals_updated_at IS 'Atualiza automaticamente o campo updated_at nos deals';
COMMENT ON FUNCTION log_deal_stage_change IS 'Registra automaticamente mudanças de estágio nos deals';
