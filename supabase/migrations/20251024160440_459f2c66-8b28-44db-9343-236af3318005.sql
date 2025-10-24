-- Tabela para configuração de sincronização automática com Google Sheets
CREATE TABLE IF NOT EXISTS public.google_sheets_sync_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sheet_url TEXT NOT NULL,
  sync_frequency_minutes INTEGER NOT NULL DEFAULT 60,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS para sync_config
ALTER TABLE public.google_sheets_sync_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver sua própria config"
  ON public.google_sheets_sync_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir sua própria config"
  ON public.google_sheets_sync_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar sua própria config"
  ON public.google_sheets_sync_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar sua própria config"
  ON public.google_sheets_sync_config FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_google_sheets_sync_config_updated_at
  BEFORE UPDATE ON public.google_sheets_sync_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índice para melhorar performance
CREATE INDEX idx_google_sheets_sync_config_user_id ON public.google_sheets_sync_config(user_id);
CREATE INDEX idx_google_sheets_sync_config_active ON public.google_sheets_sync_config(is_active) WHERE is_active = true;