-- Migration: Adicionar colunas Apollo completas em decision_makers
-- SEGURO: Todas as colunas são NULLABLE, não quebra dados existentes
-- FOCO: Apenas Apollo/decisores, nenhuma outra tabela é tocada

ALTER TABLE public.decision_makers
ADD COLUMN IF NOT EXISTS headline TEXT NULL,
ADD COLUMN IF NOT EXISTS city TEXT NULL,
ADD COLUMN IF NOT EXISTS state TEXT NULL,
ADD COLUMN IF NOT EXISTS country TEXT NULL,
ADD COLUMN IF NOT EXISTS functions TEXT[] NULL,
ADD COLUMN IF NOT EXISTS subdepartments TEXT[] NULL,
ADD COLUMN IF NOT EXISTS education JSONB NULL,
ADD COLUMN IF NOT EXISTS organization_data JSONB NULL,
ADD COLUMN IF NOT EXISTS apollo_last_enriched_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS revealed_for_current_team BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS twitter_url TEXT NULL,
ADD COLUMN IF NOT EXISTS facebook_url TEXT NULL,
ADD COLUMN IF NOT EXISTS github_url TEXT NULL;

-- Índices para performance (apenas se não existirem)
CREATE INDEX IF NOT EXISTS idx_decision_makers_headline ON public.decision_makers USING gin(to_tsvector('portuguese', COALESCE(headline, '')));
CREATE INDEX IF NOT EXISTS idx_decision_makers_city ON public.decision_makers(city);
CREATE INDEX IF NOT EXISTS idx_decision_makers_state ON public.decision_makers(state);
CREATE INDEX IF NOT EXISTS idx_decision_makers_functions ON public.decision_makers USING gin(functions);
CREATE INDEX IF NOT EXISTS idx_decision_makers_apollo_enriched ON public.decision_makers(apollo_last_enriched_at DESC);

-- Comentários de documentação
COMMENT ON COLUMN public.decision_makers.headline IS 'LinkedIn headline do decisor';
COMMENT ON COLUMN public.decision_makers.city IS 'Cidade do decisor';
COMMENT ON COLUMN public.decision_makers.state IS 'Estado do decisor';
COMMENT ON COLUMN public.decision_makers.country IS 'País do decisor';
COMMENT ON COLUMN public.decision_makers.functions IS 'Funções/áreas do decisor (Finance, Sales, etc)';
COMMENT ON COLUMN public.decision_makers.subdepartments IS 'Sub-departamentos do decisor';
COMMENT ON COLUMN public.decision_makers.education IS 'Histórico educacional do decisor (escolas, graduações)';
COMMENT ON COLUMN public.decision_makers.organization_data IS 'Dados da organização atual do decisor';
COMMENT ON COLUMN public.decision_makers.apollo_last_enriched_at IS 'Última vez que foi enriquecido pelo Apollo';
COMMENT ON COLUMN public.decision_makers.revealed_for_current_team IS 'Lead revelado para o time no Apollo';
COMMENT ON COLUMN public.decision_makers.twitter_url IS 'Perfil do Twitter do decisor';
COMMENT ON COLUMN public.decision_makers.facebook_url IS 'Perfil do Facebook do decisor';
COMMENT ON COLUMN public.decision_makers.github_url IS 'Perfil do GitHub do decisor';