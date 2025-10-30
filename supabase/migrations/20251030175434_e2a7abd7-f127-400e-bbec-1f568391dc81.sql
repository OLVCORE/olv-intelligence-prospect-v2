-- Tabela temporária para resultados de análise ICP antes de mover para o pool
CREATE TABLE IF NOT EXISTS icp_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados da empresa
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  uf TEXT,
  municipio TEXT,
  porte TEXT,
  cnae_principal TEXT,
  website TEXT,
  email TEXT,
  telefone TEXT,
  
  -- Origem
  origem TEXT CHECK (origem IN ('upload_massa', 'icp_individual', 'icp_massa')),
  
  -- Resultado da análise
  icp_score INTEGER,
  temperatura TEXT CHECK (temperatura IN ('hot', 'warm', 'cold')),
  is_cliente_totvs BOOLEAN DEFAULT false,
  totvs_check_date TIMESTAMPTZ,
  totvs_evidences JSONB DEFAULT '[]'::jsonb,
  motivo_descarte TEXT,
  
  -- Status
  moved_to_pool BOOLEAN DEFAULT false,
  reviewed BOOLEAN DEFAULT false,
  
  -- Dados completos da análise
  raw_data JSONB,
  analysis_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_icp_results_cnpj ON icp_analysis_results(cnpj);
CREATE INDEX idx_icp_results_moved ON icp_analysis_results(moved_to_pool);
CREATE INDEX idx_icp_results_totvs ON icp_analysis_results(is_cliente_totvs);
CREATE INDEX idx_icp_results_score ON icp_analysis_results(icp_score DESC);
CREATE INDEX idx_icp_results_origem ON icp_analysis_results(origem);
CREATE INDEX idx_icp_results_reviewed ON icp_analysis_results(reviewed);

-- RLS Policies
ALTER TABLE icp_analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read icp_analysis_results"
  ON icp_analysis_results FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert icp_analysis_results"
  ON icp_analysis_results FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update icp_analysis_results"
  ON icp_analysis_results FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete icp_analysis_results"
  ON icp_analysis_results FOR DELETE
  USING (auth.uid() IS NOT NULL);