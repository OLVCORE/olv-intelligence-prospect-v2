-- ============================================
-- TABELA DE DOCUMENTOS ANEXADOS ÀS EMPRESAS
-- ============================================
CREATE TABLE IF NOT EXISTS company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referências
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  quarantine_id UUID REFERENCES icp_analysis_results(id) ON DELETE CASCADE,
  
  -- Tipo de documento
  tipo TEXT CHECK (tipo IN ('totvs_verification', 'similar_companies', 'analysis_360', 'proposal', 'contract', 'other')) NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  
  -- Arquivo
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT DEFAULT 'application/pdf',
  
  -- Conteúdo extraído (para busca)
  content_text TEXT,
  
  -- Metadados
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_documents_company ON company_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_quarantine ON company_documents(quarantine_id);
CREATE INDEX IF NOT EXISTS idx_documents_tipo ON company_documents(tipo);
CREATE INDEX IF NOT EXISTS idx_documents_status ON company_documents(status);

-- RLS Policies
ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver documentos"
  ON company_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir documentos"
  ON company_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar documentos"
  ON company_documents FOR UPDATE
  TO authenticated
  USING (true);