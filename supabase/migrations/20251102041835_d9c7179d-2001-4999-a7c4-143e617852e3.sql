-- Adicionar colunas para rastreamento de descoberta e enriquecimento
ALTER TABLE suggested_companies 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS discovered_from_company_id UUID REFERENCES suggested_companies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS similarity_score INTEGER DEFAULT 0 CHECK (similarity_score >= 0 AND similarity_score <= 100),
ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'in_progress', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_suggested_companies_source ON suggested_companies(source);
CREATE INDEX IF NOT EXISTS idx_suggested_companies_discovered_from ON suggested_companies(discovered_from_company_id);
CREATE INDEX IF NOT EXISTS idx_suggested_companies_enrichment_status ON suggested_companies(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_suggested_companies_similarity_score ON suggested_companies(similarity_score DESC);

-- Comentários para documentação
COMMENT ON COLUMN suggested_companies.source IS 'Origem da empresa: manual, similar_company_discovery, web_search, etc';
COMMENT ON COLUMN suggested_companies.discovered_from_company_id IS 'ID da empresa que originou esta descoberta';
COMMENT ON COLUMN suggested_companies.similarity_score IS 'Score de similaridade (0-100) em relação à empresa origem';
COMMENT ON COLUMN suggested_companies.enrichment_status IS 'Status do processo de enriquecimento: pending, in_progress, completed, failed';
COMMENT ON COLUMN suggested_companies.discovered_at IS 'Data/hora em que a empresa foi descoberta';