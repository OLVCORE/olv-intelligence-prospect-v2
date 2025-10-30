-- ============================================
-- NÍVEL 1: BANCO DE LEADS (Pool)
-- ============================================
CREATE TABLE IF NOT EXISTS leads_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados da empresa
  cnpj TEXT UNIQUE NOT NULL,
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
  origem TEXT CHECK (origem IN ('icp_individual', 'icp_massa', 'empresas_aqui', 'manual')) NOT NULL,
  
  -- Score ICP
  icp_score INTEGER,
  temperatura TEXT CHECK (temperatura IN ('hot', 'warm', 'cold')),
  
  -- Verificação TOTVS
  is_cliente_totvs BOOLEAN DEFAULT false,
  totvs_check_date TIMESTAMPTZ,
  
  -- Status (sempre 'pool' neste nível)
  status TEXT DEFAULT 'pool' CHECK (status = 'pool'),
  
  -- Dados brutos
  raw_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para leads_pool
CREATE INDEX IF NOT EXISTS idx_leads_pool_cnpj ON leads_pool(cnpj);
CREATE INDEX IF NOT EXISTS idx_leads_pool_origem ON leads_pool(origem);
CREATE INDEX IF NOT EXISTS idx_leads_pool_icp_score ON leads_pool(icp_score);
CREATE INDEX IF NOT EXISTS idx_leads_pool_temperatura ON leads_pool(temperatura);

-- RLS para leads_pool
ALTER TABLE leads_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage leads_pool"
ON leads_pool
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- NÍVEL 2: EMPRESAS QUALIFICADAS
-- ============================================
CREATE TABLE IF NOT EXISTS leads_qualified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência ao pool
  lead_pool_id UUID REFERENCES leads_pool(id) ON DELETE CASCADE,
  
  -- Dados da empresa (desnormalizados para performance)
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  uf TEXT,
  municipio TEXT,
  porte TEXT,
  website TEXT,
  email TEXT,
  telefone TEXT,
  
  -- Score ICP
  icp_score INTEGER,
  temperatura TEXT,
  
  -- Status
  status TEXT DEFAULT 'qualificada' CHECK (status IN ('qualificada', 'em_analise', 'aprovada')),
  
  -- Motivo da qualificação
  motivo_qualificacao TEXT,
  
  -- Quem selecionou
  selected_by UUID,
  selected_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para leads_qualified
CREATE INDEX IF NOT EXISTS idx_leads_qualified_cnpj ON leads_qualified(cnpj);
CREATE INDEX IF NOT EXISTS idx_leads_qualified_status ON leads_qualified(status);
CREATE INDEX IF NOT EXISTS idx_leads_qualified_pool ON leads_qualified(lead_pool_id);

-- RLS para leads_qualified
ALTER TABLE leads_qualified ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage leads_qualified"
ON leads_qualified
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- NÍVEL 3: PIPELINE ATIVO (companies existente)
-- ============================================
-- Adicionar colunas na tabela companies existente
ALTER TABLE companies ADD COLUMN IF NOT EXISTS lead_qualified_id UUID REFERENCES leads_qualified(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pipeline_status TEXT DEFAULT 'ativo' CHECK (pipeline_status IN ('ativo', 'trabalhando', 'pausado', 'ganho', 'perdido'));

-- Índice
CREATE INDEX IF NOT EXISTS idx_companies_pipeline_status ON companies(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_companies_lead_qualified_id ON companies(lead_qualified_id);