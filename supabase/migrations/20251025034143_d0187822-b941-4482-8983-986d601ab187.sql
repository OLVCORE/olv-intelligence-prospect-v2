-- Tabela de configuração de sincronização Bitrix24
CREATE TABLE IF NOT EXISTS public.bitrix_sync_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  domain TEXT,
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('olv_to_bitrix', 'bitrix_to_olv', 'bidirectional')),
  auto_sync BOOLEAN DEFAULT true,
  sync_interval_minutes INTEGER DEFAULT 15,
  field_mapping JSONB DEFAULT '{}'::jsonb,
  last_sync TIMESTAMPTZ,
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de log de sincronizações Bitrix24
CREATE TABLE IF NOT EXISTS public.bitrix_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES public.bitrix_sync_config(id) ON DELETE CASCADE,
  sync_direction TEXT NOT NULL,
  records_synced INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bitrix_sync_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitrix_sync_log ENABLE ROW LEVEL SECURITY;

-- Policies para bitrix_sync_config
CREATE POLICY "Users can view own Bitrix config"
  ON public.bitrix_sync_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Bitrix config"
  ON public.bitrix_sync_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Bitrix config"
  ON public.bitrix_sync_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own Bitrix config"
  ON public.bitrix_sync_config FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para bitrix_sync_log
CREATE POLICY "Users can view own Bitrix sync logs"
  ON public.bitrix_sync_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bitrix_sync_config
      WHERE bitrix_sync_config.id = bitrix_sync_log.config_id
      AND bitrix_sync_config.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert Bitrix sync logs"
  ON public.bitrix_sync_log FOR INSERT
  WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_bitrix_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bitrix_sync_config_updated_at
  BEFORE UPDATE ON public.bitrix_sync_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bitrix_config_updated_at();

-- Índices para performance
CREATE INDEX idx_bitrix_config_user ON public.bitrix_sync_config(user_id);
CREATE INDEX idx_bitrix_log_config ON public.bitrix_sync_log(config_id);
CREATE INDEX idx_bitrix_log_created ON public.bitrix_sync_log(created_at DESC);