-- Tabela de configurações de integrações
CREATE TABLE IF NOT EXISTS public.integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'sms', 'telegram')),
  provider TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  last_health_check TIMESTAMP WITH TIME ZONE,
  health_status JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, channel, provider)
);

-- Índices para performance
CREATE INDEX idx_integration_configs_user_id ON public.integration_configs(user_id);
CREATE INDEX idx_integration_configs_status ON public.integration_configs(status);
CREATE INDEX idx_integration_configs_channel ON public.integration_configs(channel);

-- RLS policies
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own integrations"
  ON public.integration_configs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_integration_configs_updated_at
  BEFORE UPDATE ON public.integration_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de webhooks recebidos (para debugging)
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  provider TEXT NOT NULL,
  payload JSONB NOT NULL,
  headers JSONB,
  processed BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at);
CREATE INDEX idx_webhook_logs_processed ON public.webhook_logs(processed);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhook logs"
  ON public.webhook_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Adicionar campos de metadata nas messages
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS webhook_id UUID REFERENCES public.webhook_logs(id);

-- Realtime para messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;