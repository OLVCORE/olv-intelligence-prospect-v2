-- Adicionar coluna para rastrear último enriquecimento automático
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS apollo_last_enriched_at TIMESTAMPTZ;

-- Criar índice para otimizar busca de empresas a enriquecer
CREATE INDEX IF NOT EXISTS idx_companies_auto_enrich 
ON public.companies(apollo_organization_id, apollo_last_enriched_at)
WHERE apollo_organization_id IS NOT NULL;

-- Adicionar comentário
COMMENT ON COLUMN public.companies.apollo_last_enriched_at IS 'Timestamp do último enriquecimento automático via Apollo';
