-- Corrigir search_path nas funções criadas

-- Function: Atualizar updated_at automaticamente (com search_path)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function: Incrementar contador de interações (com search_path)
CREATE OR REPLACE FUNCTION increment_interaction_counter()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.interaction_type = 'call' THEN
    UPDATE public.companies
    SET total_calls = COALESCE(total_calls, 0) + 1,
        last_contact_at = NEW.interaction_date
    WHERE id = NEW.company_id;
  ELSIF NEW.interaction_type = 'email' THEN
    UPDATE public.companies
    SET total_emails = COALESCE(total_emails, 0) + 1,
        last_contact_at = NEW.interaction_date
    WHERE id = NEW.company_id;
  ELSIF NEW.interaction_type = 'meeting' THEN
    UPDATE public.companies
    SET total_meetings = COALESCE(total_meetings, 0) + 1,
        last_contact_at = NEW.interaction_date
    WHERE id = NEW.company_id;
  ELSIF NEW.interaction_type = 'whatsapp' THEN
    UPDATE public.companies
    SET total_whatsapp = COALESCE(total_whatsapp, 0) + 1,
        last_contact_at = NEW.interaction_date
    WHERE id = NEW.company_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function: Atualizar estatísticas de fonte (com search_path)
CREATE OR REPLACE FUNCTION update_source_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.validation_status = 'approved' AND OLD.validation_status != 'approved' THEN
    UPDATE public.leads_sources
    SET total_approved = COALESCE(total_approved, 0) + 1,
        success_rate = (COALESCE(total_approved, 0) + 1)::DECIMAL / NULLIF(total_captured, 0) * 100
    WHERE id = NEW.source_id;
  END IF;
  
  RETURN NEW;
END;
$$;