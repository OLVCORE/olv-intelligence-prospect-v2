-- Adicionar campo phone em decision_makers para salvar telefones do Apollo
ALTER TABLE public.decision_makers
ADD COLUMN IF NOT EXISTS phone text;