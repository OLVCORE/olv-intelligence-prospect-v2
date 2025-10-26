-- 1) Tabela de feature flags (kill switch)
CREATE TABLE IF NOT EXISTS public.app_features (
  feature TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_features ENABLE ROW LEVEL SECURITY;

-- RLS: leitura para usuários autenticados
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='app_features' AND policyname='authenticated_can_read_app_features'
  ) THEN
    CREATE POLICY authenticated_can_read_app_features
    ON public.app_features
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

-- RLS: service role pode gerenciar (insert/update/delete)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='app_features' AND policyname='service_can_manage_app_features'
  ) THEN
    CREATE POLICY service_can_manage_app_features
    ON public.app_features
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Inserir flag auto_deal desativada por padrão
INSERT INTO public.app_features (feature, enabled)
VALUES ('auto_deal', false)
ON CONFLICT (feature) DO NOTHING;

-- 2) Atualizar função do trigger para respeitar kill switch
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
  v_auto_deal_enabled BOOLEAN;
BEGIN
  -- Kill switch: se auto_deal estiver desativado, não cria deal
  SELECT enabled INTO v_auto_deal_enabled
  FROM public.app_features
  WHERE feature = 'auto_deal';
  
  IF COALESCE(v_auto_deal_enabled, false) = false THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se já existe deal para essa empresa
  SELECT EXISTS(
    SELECT 1 FROM public.sdr_deals 
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
    
    -- Criar deal automaticamente (sem colunas inexistentes)
    INSERT INTO public.sdr_deals (
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
      30,
      'enrichment_auto',
      NOW()
    );
    
    -- Log da atividade
    INSERT INTO public.sdr_deal_activities (
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
    FROM public.sdr_deals
    WHERE company_id = NEW.id
    ORDER BY created_at DESC
    LIMIT 1;
    
  END IF;
  
  RETURN NEW;
END;
$function$;