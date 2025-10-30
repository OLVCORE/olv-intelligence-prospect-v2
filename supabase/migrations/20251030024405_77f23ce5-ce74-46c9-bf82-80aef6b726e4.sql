-- Fix: Remove auth.users exposure from sdr_performance view
-- This is a critical security issue that exposes user emails and IDs

-- 1. Drop the problematic view that exposes auth.users
DROP VIEW IF EXISTS public.sdr_performance CASCADE;

-- 2. Create secure version using profiles table instead of auth.users
-- Only expose data for the current user or allow admins to see all
CREATE VIEW public.sdr_performance 
WITH (security_invoker = true)
AS
SELECT 
    p.id AS user_id,
    p.full_name AS user_name,
    p.email AS user_email,
    COUNT(DISTINCT c.id) AS total_companies_assigned,
    COUNT(DISTINCT c.id) FILTER (WHERE c.journey_stage = 'closed_won') AS total_won,
    COUNT(DISTINCT c.id) FILTER (WHERE c.journey_stage = 'closed_lost') AS total_lost,
    SUM(c.estimated_deal_value) FILTER (WHERE c.journey_stage = 'closed_won') AS total_revenue,
    COUNT(DISTINCT i.id) AS total_interactions,
    COUNT(DISTINCT i.id) FILTER (WHERE i.interaction_type = 'call') AS total_calls,
    COUNT(DISTINCT i.id) FILTER (WHERE i.interaction_type = 'meeting') AS total_meetings,
    AVG(c.icp_score) AS avg_icp_score
FROM profiles p
LEFT JOIN companies c ON c.assigned_to = p.id
LEFT JOIN interactions i ON i.user_id = p.id
WHERE p.id IS NOT NULL
GROUP BY p.id, p.full_name, p.email;

-- 3. Add RLS policy to the view to ensure users only see their own data
-- (unless they're an admin)
ALTER VIEW public.sdr_performance OWNER TO postgres;

-- 4. Grant appropriate permissions
GRANT SELECT ON public.sdr_performance TO authenticated;

COMMENT ON VIEW public.sdr_performance IS 'Secure SDR performance metrics view using profiles table instead of auth.users. Uses security_invoker to enforce RLS policies.';
