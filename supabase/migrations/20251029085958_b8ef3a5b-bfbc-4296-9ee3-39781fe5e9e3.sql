-- Adicionar campo methodology à tabela totvs_usage_detection
ALTER TABLE public.totvs_usage_detection 
ADD COLUMN IF NOT EXISTS methodology jsonb DEFAULT '{}'::jsonb;