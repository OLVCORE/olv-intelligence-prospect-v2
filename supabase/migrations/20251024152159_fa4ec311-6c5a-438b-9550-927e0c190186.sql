-- Adicionar colunas para enriquecimento manual nos competitors
ALTER TABLE competitors 
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS catalog_url TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Criar storage bucket para documentos competitivos
INSERT INTO storage.buckets (id, name, public)
VALUES ('competitive-docs', 'competitive-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Policies para competitive-docs bucket
CREATE POLICY "Authenticated users can view competitive docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'competitive-docs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload competitive docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'competitive-docs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update competitive docs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'competitive-docs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete competitive docs"
ON storage.objects FOR DELETE
USING (bucket_id = 'competitive-docs' AND auth.uid() IS NOT NULL);

-- Criar tabela para diagnósticos de SDR
CREATE TABLE IF NOT EXISTS sdr_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  sdr_user_id UUID,
  diagnostic_file_path TEXT NOT NULL,
  diagnostic_summary JSONB DEFAULT '{}'::jsonb,
  technologies_found JSONB DEFAULT '[]'::jsonb,
  gaps_identified JSONB DEFAULT '[]'::jsonb,
  recommended_products JSONB DEFAULT '[]'::jsonb,
  competitive_analysis JSONB DEFAULT '{}'::jsonb,
  ai_insights TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS policies para sdr_diagnostics
ALTER TABLE sdr_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read diagnostics"
ON sdr_diagnostics FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert diagnostics"
ON sdr_diagnostics FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update diagnostics"
ON sdr_diagnostics FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Permitir INSERT/UPDATE em competitors para usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can read competitors" ON competitors;
CREATE POLICY "Authenticated users can manage competitors"
ON competitors FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_sdr_diagnostics_company ON sdr_diagnostics(company_id);
CREATE INDEX IF NOT EXISTS idx_sdr_diagnostics_created ON sdr_diagnostics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitors_active ON competitors(active) WHERE active = true;