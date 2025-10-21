-- Fix security warning: set search_path on function with CASCADE
DROP FUNCTION IF EXISTS update_sdr_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_sdr_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate all triggers
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_routing_rules_updated_at BEFORE UPDATE ON public.sdr_routing_rules
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.sdr_templates
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_sequences_updated_at BEFORE UPDATE ON public.sdr_sequences
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_sequence_runs_updated_at BEFORE UPDATE ON public.sdr_sequence_runs
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.sdr_tasks
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();