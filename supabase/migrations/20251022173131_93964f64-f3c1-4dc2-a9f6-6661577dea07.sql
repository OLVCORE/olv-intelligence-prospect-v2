-- Tabela para armazenar interações da IA para aprendizado contínuo (RAG dinâmico)
CREATE TABLE IF NOT EXISTS public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON public.ai_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_question ON public.ai_interactions USING gin(to_tsvector('portuguese', question));
CREATE INDEX IF NOT EXISTS idx_ai_interactions_answer ON public.ai_interactions USING gin(to_tsvector('portuguese', answer));

-- RLS policies (público para leitura, mas apenas sistema pode escrever)
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ler interações da IA"
  ON public.ai_interactions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Sistema pode inserir interações"
  ON public.ai_interactions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_ai_interactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_interactions_updated_at
  BEFORE UPDATE ON public.ai_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_interactions_updated_at();

-- Comentários
COMMENT ON TABLE public.ai_interactions IS 'Armazena interações com a IA para aprendizado contínuo e melhoria do RAG';
COMMENT ON COLUMN public.ai_interactions.question IS 'Pergunta feita pelo usuário';
COMMENT ON COLUMN public.ai_interactions.answer IS 'Resposta gerada pela IA';
COMMENT ON COLUMN public.ai_interactions.metadata IS 'Metadados adicionais (contexto, empresa relacionada, etc.)';
