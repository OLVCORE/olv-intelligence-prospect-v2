-- ============================================
-- LEAD SCORING AUTOMÁTICO - Sistema Completo
-- ============================================

-- 1. Adicionar campo lead_score nas empresas
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
ADD COLUMN IF NOT EXISTS lead_score_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Adicionar campo lead_score nos deals
ALTER TABLE public.sdr_deals 
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_companies_lead_score ON public.companies(lead_score DESC) WHERE lead_score > 0;
CREATE INDEX IF NOT EXISTS idx_sdr_deals_lead_score ON public.sdr_deals(lead_score DESC) WHERE lead_score > 0;

-- 4. Função para calcular engajamento de uma empresa
CREATE OR REPLACE FUNCTION public.calculate_engagement_score(p_company_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activities_count INTEGER;
  v_touchpoints_count INTEGER;
  v_conversations_count INTEGER;
  v_recent_activity_days INTEGER;
  v_score INTEGER := 0;
BEGIN
  -- Contar atividades dos últimos 90 dias
  SELECT COUNT(*) INTO v_activities_count
  FROM public.activities
  WHERE company_id = p_company_id
    AND activity_date > now() - interval '90 days';
  
  -- Contar touchpoints dos últimos 90 dias
  SELECT COUNT(*) INTO v_touchpoints_count
  FROM public.account_touchpoints
  WHERE company_id = p_company_id
    AND completed_at > now() - interval '90 days';
  
  -- Contar conversas ativas
  SELECT COUNT(*) INTO v_conversations_count
  FROM public.conversations
  WHERE company_id = p_company_id
    AND status IN ('open', 'pending')
    AND updated_at > now() - interval '30 days';
  
  -- Dias desde última atividade
  SELECT EXTRACT(DAY FROM (now() - MAX(GREATEST(
    COALESCE(a.activity_date, '1970-01-01'::timestamptz),
    COALESCE(t.completed_at, '1970-01-01'::timestamptz),
    COALESCE(c.updated_at, '1970-01-01'::timestamptz)
  ))))::INTEGER
  INTO v_recent_activity_days
  FROM public.companies comp
  LEFT JOIN public.activities a ON a.company_id = comp.id
  LEFT JOIN public.account_touchpoints t ON t.company_id = comp.id
  LEFT JOIN public.conversations c ON c.company_id = comp.id
  WHERE comp.id = p_company_id;
  
  -- Calcular score (0-100)
  v_score := LEAST(100, 
    (v_activities_count * 5) + 
    (v_touchpoints_count * 8) + 
    (v_conversations_count * 15) +
    CASE 
      WHEN v_recent_activity_days IS NULL OR v_recent_activity_days > 90 THEN 0
      WHEN v_recent_activity_days <= 7 THEN 30
      WHEN v_recent_activity_days <= 30 THEN 20
      WHEN v_recent_activity_days <= 60 THEN 10
      ELSE 5
    END
  );
  
  RETURN v_score;
END;
$$;

-- 5. Função para calcular score de tamanho/receita
CREATE OR REPLACE FUNCTION public.calculate_size_score(p_company_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employees INTEGER;
  v_revenue TEXT;
  v_score INTEGER := 0;
BEGIN
  SELECT employees, revenue INTO v_employees, v_revenue
  FROM public.companies
  WHERE id = p_company_id;
  
  -- Score baseado em número de funcionários (0-60 pontos)
  IF v_employees IS NOT NULL THEN
    v_score := CASE 
      WHEN v_employees >= 1000 THEN 60
      WHEN v_employees >= 500 THEN 50
      WHEN v_employees >= 200 THEN 40
      WHEN v_employees >= 100 THEN 30
      WHEN v_employees >= 50 THEN 20
      ELSE 10
    END;
  END IF;
  
  -- Bonus por receita declarada (0-40 pontos)
  IF v_revenue IS NOT NULL AND v_revenue != '' THEN
    v_score := v_score + CASE 
      WHEN v_revenue ILIKE '%bilhão%' OR v_revenue ILIKE '%billion%' THEN 40
      WHEN v_revenue ILIKE '%milhão%' OR v_revenue ILIKE '%million%' THEN 30
      WHEN v_revenue ILIKE '%mil%' OR v_revenue ILIKE '%thousand%' THEN 20
      ELSE 15
    END;
  END IF;
  
  RETURN LEAST(100, v_score);
END;
$$;

-- 6. FUNÇÃO PRINCIPAL: Calcular Lead Score Completo
CREATE OR REPLACE FUNCTION public.calculate_lead_score(p_company_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_maturity_score INTEGER := 0;
  v_intent_score INTEGER := 0;
  v_totvs_fit_score INTEGER := 0;
  v_engagement_score INTEGER := 0;
  v_size_score INTEGER := 0;
  v_final_score INTEGER;
BEGIN
  -- 1. Maturidade Digital (0-100) - Peso 25%
  SELECT COALESCE(digital_maturity_score::INTEGER, 0)
  INTO v_maturity_score
  FROM public.companies
  WHERE id = p_company_id;
  
  -- 2. Sinais de Intenção (0-100) - Peso 30%
  SELECT COALESCE(public.calculate_intent_score(p_company_id), 0)
  INTO v_intent_score;
  
  -- 3. Fit com TOTVS (0-100) - Peso 20%
  SELECT COALESCE(totvs_detection_score, 0)
  INTO v_totvs_fit_score
  FROM public.companies
  WHERE id = p_company_id;
  
  -- 4. Engajamento (0-100) - Peso 15%
  v_engagement_score := public.calculate_engagement_score(p_company_id);
  
  -- 5. Tamanho/Receita (0-100) - Peso 10%
  v_size_score := public.calculate_size_score(p_company_id);
  
  -- Calcular score final ponderado
  v_final_score := ROUND(
    (v_maturity_score * 0.25) +
    (v_intent_score * 0.30) +
    (v_totvs_fit_score * 0.20) +
    (v_engagement_score * 0.15) +
    (v_size_score * 0.10)
  )::INTEGER;
  
  -- Atualizar score na empresa
  UPDATE public.companies
  SET 
    lead_score = v_final_score,
    lead_score_updated_at = now()
  WHERE id = p_company_id;
  
  -- Atualizar score em deals ativos dessa empresa
  UPDATE public.sdr_deals
  SET lead_score = v_final_score
  WHERE company_id = p_company_id
    AND status = 'open';
  
  RETURN v_final_score;
END;
$$;

-- 7. Trigger: Recalcular score quando empresa for atualizada
CREATE OR REPLACE FUNCTION public.auto_recalculate_lead_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_score INTEGER;
BEGIN
  -- Recalcular apenas se campos relevantes mudaram
  IF (
    NEW.digital_maturity_score IS DISTINCT FROM OLD.digital_maturity_score OR
    NEW.totvs_detection_score IS DISTINCT FROM OLD.totvs_detection_score OR
    NEW.employees IS DISTINCT FROM OLD.employees OR
    NEW.revenue IS DISTINCT FROM OLD.revenue
  ) THEN
    v_new_score := public.calculate_lead_score(NEW.id);
    
    -- Se virou hot lead (score > 75), criar notificação
    IF v_new_score >= 75 AND COALESCE(OLD.lead_score, 0) < 75 THEN
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        metadata,
        created_at
      )
      SELECT 
        auth.uid(),
        'hot_lead',
        '🔥 Hot Lead Detectado!',
        'A empresa ' || NEW.name || ' atingiu score de ' || v_new_score || ' pontos.',
        jsonb_build_object(
          'company_id', NEW.id,
          'company_name', NEW.name,
          'lead_score', v_new_score,
          'previous_score', COALESCE(OLD.lead_score, 0)
        ),
        now()
      WHERE auth.uid() IS NOT NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_recalculate_lead_score
  AFTER UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_recalculate_lead_score();

-- 8. Trigger: Recalcular quando houver nova atividade
CREATE OR REPLACE FUNCTION public.recalc_score_on_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.calculate_lead_score(NEW.company_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_recalc_score_on_activity
  AFTER INSERT OR UPDATE ON public.activities
  FOR EACH ROW
  WHEN (NEW.company_id IS NOT NULL)
  EXECUTE FUNCTION public.recalc_score_on_activity();

CREATE TRIGGER trigger_recalc_score_on_touchpoint
  AFTER INSERT OR UPDATE ON public.account_touchpoints
  FOR EACH ROW
  WHEN (NEW.company_id IS NOT NULL)
  EXECUTE FUNCTION public.recalc_score_on_activity();

-- 9. Trigger: Atualizar prioridade do deal baseado no score
CREATE OR REPLACE FUNCTION public.auto_update_deal_priority()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.lead_score >= 75 THEN
    NEW.priority := 'high';
  ELSIF NEW.lead_score >= 50 THEN
    NEW.priority := 'medium';
  ELSE
    NEW.priority := 'low';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_update_deal_priority
  BEFORE INSERT OR UPDATE OF lead_score ON public.sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_update_deal_priority();

-- 10. Função utilitária: Recalcular scores de todas empresas (batch)
CREATE OR REPLACE FUNCTION public.recalculate_all_lead_scores(batch_size INTEGER DEFAULT 100)
RETURNS TABLE(
  company_id UUID,
  company_name TEXT,
  old_score INTEGER,
  new_score INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH companies_to_update AS (
    SELECT 
      c.id,
      c.name,
      COALESCE(c.lead_score, 0) as old_score
    FROM public.companies c
    WHERE c.is_disqualified = false
    ORDER BY c.updated_at DESC
    LIMIT batch_size
  )
  SELECT 
    ctu.id,
    ctu.name,
    ctu.old_score,
    public.calculate_lead_score(ctu.id) as new_score
  FROM companies_to_update ctu;
END;
$$;