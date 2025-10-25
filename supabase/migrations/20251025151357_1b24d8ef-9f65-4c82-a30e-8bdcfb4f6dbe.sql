-- Apply search_path security fix to catalog functions (no IF EXISTS on ALTER FUNCTION)

ALTER FUNCTION public.update_product_catalog_updated_at() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.update_pricing_rules_updated_at() SET search_path = 'public', 'pg_temp';