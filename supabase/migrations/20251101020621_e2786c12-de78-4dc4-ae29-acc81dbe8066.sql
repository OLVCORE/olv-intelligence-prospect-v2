-- ================================================
-- CORREÇÃO DE SEGURANÇA: Remover SECURITY DEFINER desnecessário
-- ================================================
-- Issue: Funções com SECURITY DEFINER executam com privilégios do criador,
-- não do usuário. Isso pode levar a escalação de privilégios.
-- 
-- Solução: Alterar para SECURITY INVOKER onde não é necessário privilégio elevado
-- ================================================

-- 1. FUNÇÕES DE CÁLCULO - Não precisam de privilégios elevados
-- Essas funções apenas calculam scores baseados em dados que o usuário já tem acesso

ALTER FUNCTION public.calculate_deal_health_score(deal_id uuid) 
SECURITY INVOKER;

ALTER FUNCTION public.calculate_engagement_score(p_company_id uuid) 
SECURITY INVOKER;

ALTER FUNCTION public.calculate_intent_score(company_uuid uuid) 
SECURITY INVOKER;

ALTER FUNCTION public.calculate_lead_score(p_company_id uuid) 
SECURITY INVOKER;

ALTER FUNCTION public.calculate_size_score(p_company_id uuid) 
SECURITY INVOKER;

-- 2. FUNÇÕES DE QUERY - Devem respeitar RLS do usuário

ALTER FUNCTION public.get_hot_leads(min_intent_score integer) 
SECURITY INVOKER;

ALTER FUNCTION public.get_companies_for_monitoring_check(batch_limit integer) 
SECURITY INVOKER;

ALTER FUNCTION public.recalculate_all_lead_scores(batch_size integer) 
SECURITY INVOKER;

-- 3. FUNÇÕES DE OPERAÇÃO - Devem usar permissões do usuário

ALTER FUNCTION public.cleanup_orphaned_deals() 
SECURITY INVOKER;

ALTER FUNCTION public.create_canvas_version(p_canvas_id uuid, p_tag text, p_description text) 
SECURITY INVOKER;

ALTER FUNCTION public.promote_canvas_decision(p_block_id uuid, p_target_type text) 
SECURITY INVOKER;

ALTER FUNCTION public.get_next_report_version(p_company_id uuid, p_report_type text) 
SECURITY INVOKER;

-- ================================================
-- NOTA: As seguintes funções PERMANECEM como SECURITY DEFINER
-- porque são necessárias para operações específicas:
-- ================================================
-- 
-- ✅ has_role(uuid, app_role) 
--    → Recomendação oficial Supabase para evitar recursão RLS
--
-- ✅ handle_new_user() 
--    → Precisa criar registros durante signup (auth trigger)
--
-- ✅ increment_apollo_credits(integer) 
--    → Operação sensível de créditos, deve ser controlada
--
-- ✅ Todas as funções de TRIGGER (auto_*, update_*, log_*, etc.)
--    → Triggers são executados automaticamente após validação RLS
--    → São seguros porque já passaram pela política de segurança
--
-- ================================================

-- Comentário de auditoria
COMMENT ON FUNCTION public.calculate_deal_health_score IS 
'Calcula health score do deal. SECURITY INVOKER para respeitar RLS do usuário.';

COMMENT ON FUNCTION public.get_hot_leads IS 
'Busca hot leads. SECURITY INVOKER para que cada usuário veja apenas suas empresas conforme RLS.';

COMMENT ON FUNCTION public.recalculate_all_lead_scores IS 
'Recalcula lead scores em batch. SECURITY INVOKER para respeitar permissões do usuário.';