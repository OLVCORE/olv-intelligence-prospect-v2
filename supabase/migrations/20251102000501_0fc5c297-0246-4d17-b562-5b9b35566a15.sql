-- Tabela para memória do STC Agent (RAG)
CREATE TABLE IF NOT EXISTS stc_agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  mode TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_stc_memory_company ON stc_agent_memory(company_id);
CREATE INDEX IF NOT EXISTS idx_stc_memory_created ON stc_agent_memory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stc_memory_mode ON stc_agent_memory(mode);

-- RLS (Row Level Security)
ALTER TABLE stc_agent_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON stc_agent_memory
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Comentários
COMMENT ON TABLE stc_agent_memory IS 'Memória do STC Agent para aprendizado contínuo (RAG)';
COMMENT ON COLUMN stc_agent_memory.company_id IS 'ID da empresa analisada';
COMMENT ON COLUMN stc_agent_memory.question IS 'Pergunta feita pelo usuário';
COMMENT ON COLUMN stc_agent_memory.answer IS 'Resposta do agente';
COMMENT ON COLUMN stc_agent_memory.metadata IS 'Dados estruturados da análise (JSON)';