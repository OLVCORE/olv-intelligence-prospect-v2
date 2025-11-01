-- Fix Security Definer Views
-- These views need to use security_invoker = true to enforce RLS policies of the querying user
-- rather than the view creator

-- 1. Fix buying_signals_summary view
DROP VIEW IF EXISTS public.buying_signals_summary CASCADE;

CREATE VIEW public.buying_signals_summary
WITH (security_invoker = true)
AS
SELECT 
  company_id,
  COUNT(*) as total_signals,
  COUNT(*) FILTER (WHERE status = 'new') as new_signals,
  COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_signals,
  COUNT(*) FILTER (WHERE priority = 'high') as high_priority_signals,
  AVG(confidence_score) as avg_confidence,
  MAX(detected_at) as last_signal_date,
  json_agg(DISTINCT signal_type) as signal_types
FROM public.buying_signals
GROUP BY company_id;

-- 2. Fix pipeline_overview view
DROP VIEW IF EXISTS public.pipeline_overview CASCADE;

CREATE VIEW public.pipeline_overview
WITH (security_invoker = true)
AS
SELECT 
  journey_stage,
  temperature,
  COUNT(*) as total_companies,
  SUM(estimated_deal_value) as total_pipeline_value,
  AVG(icp_score) as avg_icp_score,
  COUNT(*) FILTER (WHERE assigned_to IS NOT NULL) as assigned_count,
  COUNT(*) FILTER (WHERE next_action_date IS NOT NULL) as with_next_action
FROM public.companies
WHERE journey_stage NOT IN ('closed_won', 'closed_lost')
GROUP BY journey_stage, temperature;

-- 3. Fix source_performance view
DROP VIEW IF EXISTS public.source_performance CASCADE;

CREATE VIEW public.source_performance
WITH (security_invoker = true)
AS
SELECT 
  ls.source_name,
  ls.is_active,
  ls.priority,
  COUNT(lq.id) as total_captured,
  COUNT(lq.id) FILTER (WHERE lq.validation_status = 'approved') as total_approved,
  COUNT(lq.id) FILTER (WHERE lq.validation_status = 'rejected') as total_rejected,
  AVG(lq.auto_score) as avg_auto_score,
  COUNT(c.id) as total_converted_to_companies,
  COUNT(c.id) FILTER (WHERE c.journey_stage = 'closed_won') as total_won
FROM public.leads_sources ls
LEFT JOIN public.leads_quarantine lq ON lq.source_id = ls.id
LEFT JOIN public.companies c ON c.quarantine_id = lq.id
GROUP BY ls.id, ls.source_name, ls.is_active, ls.priority;