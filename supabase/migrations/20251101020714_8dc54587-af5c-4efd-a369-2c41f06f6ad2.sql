-- ================================================
-- CORREÇÃO: Adicionar search_path em funções SECURITY DEFINER
-- ================================================
-- Issue: Funções SECURITY DEFINER sem search_path explícito podem ser
-- vulneráveis a ataques de manipulação do schema search path
-- 
-- Solução: Definir search_path = 'public' em todas as funções sensíveis
-- ================================================

-- 1. FUNÇÕES DE CÁLCULO - Adicionar search_path
ALTER FUNCTION public.calculate_deal_health_score(deal_id uuid) 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.calculate_engagement_score(p_company_id uuid) 
SET search_path = 'public';

ALTER FUNCTION public.calculate_intent_score(company_uuid uuid) 
SET search_path = 'public';

ALTER FUNCTION public.calculate_lead_score(p_company_id uuid) 
SET search_path = 'public';

ALTER FUNCTION public.calculate_size_score(p_company_id uuid) 
SET search_path = 'public';

-- 2. FUNÇÕES DE QUERY - Adicionar search_path
ALTER FUNCTION public.get_hot_leads(min_intent_score integer) 
SET search_path = 'public';

ALTER FUNCTION public.get_companies_for_monitoring_check(batch_limit integer) 
SET search_path = 'public';

ALTER FUNCTION public.recalculate_all_lead_scores(batch_size integer) 
SET search_path = 'public';

-- 3. FUNÇÕES DE OPERAÇÃO - Adicionar search_path
ALTER FUNCTION public.cleanup_orphaned_deals() 
SET search_path = 'public';

ALTER FUNCTION public.create_canvas_version(p_canvas_id uuid, p_tag text, p_description text) 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.promote_canvas_decision(p_block_id uuid, p_target_type text) 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.get_next_report_version(p_company_id uuid, p_report_type text) 
SET search_path = 'public', 'pg_temp';

-- 4. TRIGGERS - Adicionar search_path
ALTER FUNCTION public.auto_create_deal_after_enrichment() 
SET search_path = 'public';

ALTER FUNCTION public.auto_recalculate_lead_score() 
SET search_path = 'public';

ALTER FUNCTION public.auto_update_deal_priority() 
SET search_path = 'public';

ALTER FUNCTION public.recalc_score_on_activity() 
SET search_path = 'public';

ALTER FUNCTION public.log_deal_stage_change() 
SET search_path = 'public';

ALTER FUNCTION public.increment_interaction_counter() 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.update_days_in_stage() 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.update_source_stats() 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.update_sdr_deals_updated_at() 
SET search_path = 'public';

ALTER FUNCTION public.update_sdr_updated_at() 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.update_sdr_workflows_updated_at() 
SET search_path = 'public';

-- 5. OUTRAS FUNÇÕES IMPORTANTES
ALTER FUNCTION public.update_canvas_block_updated_at() 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.update_product_catalog_updated_at() 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.update_pricing_rules_updated_at() 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.update_company_totvs_score() 
SET search_path = 'public';

ALTER FUNCTION public.update_user_search_preferences_updated_at() 
SET search_path = 'public';

ALTER FUNCTION public.update_ai_interactions_updated_at() 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.update_bitrix_config_updated_at() 
SET search_path = 'public';

ALTER FUNCTION public.update_updated_at_column() 
SET search_path = 'public';

ALTER FUNCTION public.set_updated_at() 
SET search_path = 'public';

-- ================================================
-- NOTA: search_path já está definido corretamente em:
-- ================================================
-- 
-- ✅ has_role(uuid, app_role) 
--    → SET search_path = 'public' (já definido)
--
-- ✅ handle_new_user() 
--    → SET search_path = 'public' (já definido)
--
-- ================================================

COMMENT ON FUNCTION public.calculate_lead_score IS 
'Calcula lead score ponderado. SECURITY INVOKER + search_path para máxima segurança.';