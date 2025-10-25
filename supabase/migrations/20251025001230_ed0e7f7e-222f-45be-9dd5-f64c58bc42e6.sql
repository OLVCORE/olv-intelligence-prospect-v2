-- FASE 5: API & Webhooks Tables

-- API Keys table
CREATE TABLE IF NOT EXISTS public.sdr_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks table
CREATE TABLE IF NOT EXISTS public.sdr_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  event_type TEXT NOT NULL,
  secret TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook logs table
CREATE TABLE IF NOT EXISTS public.sdr_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES public.sdr_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  status_code INTEGER,
  success BOOLEAN,
  response_body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.sdr_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sdr_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies - API Keys
CREATE POLICY "Users can view their own API keys" ON public.sdr_api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys" ON public.sdr_api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" ON public.sdr_api_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" ON public.sdr_api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies - Webhooks
CREATE POLICY "Users can view their own webhooks" ON public.sdr_webhooks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhooks" ON public.sdr_webhooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhooks" ON public.sdr_webhooks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhooks" ON public.sdr_webhooks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies - Webhook Logs
CREATE POLICY "Users can view their webhook logs" ON public.sdr_webhook_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sdr_webhooks
      WHERE sdr_webhooks.id = webhook_id
      AND sdr_webhooks.user_id = auth.uid()
    )
  );

-- RLS Policies - Notifications
CREATE POLICY "Users can view their own notifications" ON public.sdr_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.sdr_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.sdr_notifications
  FOR INSERT WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_sdr_api_keys_updated_at
  BEFORE UPDATE ON public.sdr_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sdr_updated_at();

CREATE TRIGGER update_sdr_webhooks_updated_at
  BEFORE UPDATE ON public.sdr_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sdr_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sdr_api_keys_user_id ON public.sdr_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_sdr_api_keys_key ON public.sdr_api_keys(key);
CREATE INDEX IF NOT EXISTS idx_sdr_webhooks_user_id ON public.sdr_webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_sdr_webhooks_event_type ON public.sdr_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_sdr_webhook_logs_webhook_id ON public.sdr_webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_sdr_notifications_user_id ON public.sdr_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sdr_notifications_is_read ON public.sdr_notifications(is_read);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.sdr_notifications;