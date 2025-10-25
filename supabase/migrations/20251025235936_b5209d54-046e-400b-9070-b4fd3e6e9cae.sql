-- Fix trigger auto_create_deal_after_enrichment - remove colunas inexistentes
CREATE OR REPLACE FUNCTION public.auto_create_deal_after_enrichment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deal_exists BOOLEAN;
  v_priority TEXT;
  v_value NUMERIC;
BEGIN
  -- Verificar se já existe deal para essa empresa
  SELECT EXISTS(
    SELECT 1 FROM sdr_deals 
    WHERE company_id = NEW.id 
    AND status IN ('open', 'won')
  ) INTO v_deal_exists;
  
  -- Se já existe deal ativo, não criar outro
  IF v_deal_exists THEN
    RETURN NEW;
  END IF;
  
  -- Se empresa foi enriquecida (tem maturity score), criar deal automaticamente
  IF NEW.digital_maturity_score IS NOT NULL AND OLD.digital_maturity_score IS NULL THEN
    
    -- Calcular prioridade baseada no score
    v_priority := CASE 
      WHEN NEW.digital_maturity_score >= 70 THEN 'high'
      WHEN NEW.digital_maturity_score >= 50 THEN 'medium'
      ELSE 'low'
    END;
    
    -- Estimar valor baseado em tamanho da empresa
    v_value := CASE 
      WHEN NEW.employees IS NOT NULL AND NEW.employees > 500 THEN 100000
      WHEN NEW.employees IS NOT NULL AND NEW.employees > 100 THEN 50000
      ELSE 25000
    END;
    
    -- Criar deal automaticamente (SEM next_action e next_action_date que não existem)
    INSERT INTO sdr_deals (
      company_id,
      title,
      stage,
      priority,
      status,
      value,
      probability,
      source,
      created_at
    ) VALUES (
      NEW.id,
      'Prospecção - ' || NEW.name,
      'discovery',
      v_priority,
      'open',
      v_value,
      30, -- Probabilidade inicial
      'enrichment_auto',
      NOW()
    );
    
    -- Log da atividade
    INSERT INTO sdr_deal_activities (
      deal_id,
      activity_type,
      description,
      created_by
    )
    SELECT 
      id,
      'deal_created',
      'Deal criado automaticamente após enriquecimento 360°',
      auth.uid()
    FROM sdr_deals
    WHERE company_id = NEW.id
    ORDER BY created_at DESC
    LIMIT 1;
    
  END IF;
  
  RETURN NEW;
END;
$function$;