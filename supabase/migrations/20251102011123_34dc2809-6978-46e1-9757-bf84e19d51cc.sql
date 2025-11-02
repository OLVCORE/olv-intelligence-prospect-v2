-- Tabela para histórico de verificações STC
CREATE TABLE IF NOT EXISTS stc_verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  status TEXT NOT NULL,
  confidence TEXT NOT NULL,
  triple_matches INTEGER DEFAULT 0,
  double_matches INTEGER DEFAULT 0,
  single_matches INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  evidences JSONB DEFAULT '[]'::jsonb,
  sources_consulted INTEGER DEFAULT 0,
  queries_executed INTEGER DEFAULT 0,
  verification_duration_ms INTEGER,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stc_history_company ON stc_verification_history(company_id);
CREATE INDEX IF NOT EXISTS idx_stc_history_status ON stc_verification_history(status);
CREATE INDEX IF NOT EXISTS idx_stc_history_created ON stc_verification_history(created_at DESC);

ALTER TABLE stc_verification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to view stc history" 
ON stc_verification_history FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated to insert stc history" 
ON stc_verification_history FOR INSERT 
TO authenticated 
WITH CHECK (true);

COMMENT ON TABLE stc_verification_history IS 'Histórico completo de todas as verificações STC realizadas';

-- Tabela de empresas descartadas
CREATE TABLE IF NOT EXISTS discarded_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  discard_reason_id TEXT NOT NULL,
  discard_reason_label TEXT NOT NULL,
  discard_reason_description TEXT,
  discard_category TEXT NOT NULL,
  stc_status TEXT,
  stc_confidence TEXT,
  stc_triple_matches INTEGER DEFAULT 0,
  stc_double_matches INTEGER DEFAULT 0,
  stc_total_score INTEGER DEFAULT 0,
  discarded_by UUID REFERENCES auth.users(id),
  discarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  original_icp_score INTEGER,
  original_icp_temperature TEXT
);

CREATE INDEX IF NOT EXISTS idx_discarded_company ON discarded_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_discarded_reason ON discarded_companies(discard_reason_id);
CREATE INDEX IF NOT EXISTS idx_discarded_category ON discarded_companies(discard_category);
CREATE INDEX IF NOT EXISTS idx_discarded_date ON discarded_companies(discarded_at DESC);

ALTER TABLE discarded_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to manage discarded" 
ON discarded_companies FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

COMMENT ON TABLE discarded_companies IS 'Histórico completo de empresas descartadas com motivos e analytics';