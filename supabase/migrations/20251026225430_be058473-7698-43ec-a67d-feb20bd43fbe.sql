-- Remover versão antiga da função sem parâmetros
DROP FUNCTION IF EXISTS public.get_companies_for_monitoring_check();

-- Criar nova versão otimizada para 5000 empresas com parâmetro batch_limit
CREATE OR REPLACE FUNCTION public.get_companies_for_monitoring_check(batch_limit INTEGER DEFAULT 500)
RETURNS TABLE(
  monitoring_id uuid,
  company_id uuid,
  company_name text,
  company_domain text,
  company_cnpj text,
  user_id uuid,
  last_totvs_score integer,
  last_intent_score integer,
  hours_since_last_check integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id AS monitoring_id,
    c.id AS company_id,
    c.name AS company_name,
    c.domain AS company_domain,
    c.cnpj AS company_cnpj,
    cm.user_id,
    cm.last_totvs_score,
    cm.last_intent_score,
    EXTRACT(EPOCH FROM (NOW() - COALESCE(
      LEAST(cm.last_totvs_check_at, cm.last_intent_check_at),
      NOW() - INTERVAL '999 days'
    )))::INTEGER / 3600 AS hours_since_last_check
  FROM public.company_monitoring cm
  JOIN public.companies c ON c.id = cm.company_id
  WHERE cm.is_active = true
    AND (
      -- Nunca verificadas (prioridade máxima)
      cm.last_totvs_check_at IS NULL 
      OR cm.last_intent_check_at IS NULL
      -- Ou já passou o tempo da frequência configurada
      OR (NOW() - LEAST(cm.last_totvs_check_at, cm.last_intent_check_at)) >= (cm.check_frequency_hours || ' hours')::INTERVAL
    )
  ORDER BY 
    -- Prioridade 1: Empresas nunca verificadas
    CASE WHEN cm.last_totvs_check_at IS NULL OR cm.last_intent_check_at IS NULL THEN 0 ELSE 1 END,
    -- Prioridade 2: Empresas com alto score de intenção (hot leads)
    COALESCE(cm.last_intent_score, 0) DESC,
    -- Prioridade 3: Tempo desde última verificação (mais antigas primeiro)
    COALESCE(cm.last_totvs_check_at, '1970-01-01'::TIMESTAMPTZ) ASC,
    COALESCE(cm.last_intent_check_at, '1970-01-01'::TIMESTAMPTZ) ASC
  LIMIT batch_limit;
END;
$$;

-- Adicionar índices para performance com 5000+ empresas
CREATE INDEX IF NOT EXISTS idx_company_monitoring_active_priority 
ON public.company_monitoring(is_active, last_intent_score DESC, last_totvs_check_at ASC) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_company_monitoring_check_times 
ON public.company_monitoring(last_totvs_check_at, last_intent_check_at) 
WHERE is_active = true;

COMMENT ON FUNCTION public.get_companies_for_monitoring_check IS 'Retorna empresas para verificação com priorização inteligente: 1) Nunca verificadas, 2) Alto score de intenção, 3) Mais antigas. Suporta até 5000+ empresas com performance otimizada.';