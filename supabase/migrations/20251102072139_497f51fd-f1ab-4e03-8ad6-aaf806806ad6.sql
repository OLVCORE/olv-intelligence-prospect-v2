-- Tabela para armazenar histórico de conversas do STC Agent
CREATE TABLE IF NOT EXISTS public.stc_agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.suggested_companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'agent')),
  content TEXT NOT NULL,
  data JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_stc_conversations_company_id ON public.stc_agent_conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_stc_conversations_created_at ON public.stc_agent_conversations(created_at);

-- RLS Policies (todos podem ver e criar conversas de qualquer empresa por enquanto)
ALTER TABLE public.stc_agent_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de conversas"
  ON public.stc_agent_conversations
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção de conversas"
  ON public.stc_agent_conversations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de conversas"
  ON public.stc_agent_conversations
  FOR UPDATE
  USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_stc_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stc_conversations_updated_at
  BEFORE UPDATE ON public.stc_agent_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stc_conversations_updated_at();

-- Comentários
COMMENT ON TABLE public.stc_agent_conversations IS 'Histórico de conversas do STC Agent por empresa';
COMMENT ON COLUMN public.stc_agent_conversations.company_id IS 'ID da empresa relacionada à conversa';
COMMENT ON COLUMN public.stc_agent_conversations.role IS 'Quem enviou a mensagem: user ou agent';
COMMENT ON COLUMN public.stc_agent_conversations.content IS 'Conteúdo da mensagem';
COMMENT ON COLUMN public.stc_agent_conversations.data IS 'Dados estruturados retornados pelo agente (evidências, decisores, etc)';
COMMENT ON COLUMN public.stc_agent_conversations.metadata IS 'Metadados adicionais (tokens, custo, etc)';