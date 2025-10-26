-- Adicionar coluna source à tabela decision_makers
ALTER TABLE public.decision_makers 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.decision_makers.source IS 'Origem do decisor: apollo, phantombuster, manual, etc.';