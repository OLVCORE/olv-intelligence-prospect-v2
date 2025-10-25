-- Create table for WhatsApp and other SDR integrations configuration
CREATE TABLE IF NOT EXISTS public.sdr_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_name TEXT NOT NULL,
  provider TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, integration_name)
);

-- Enable RLS
ALTER TABLE public.sdr_integrations ENABLE ROW LEVEL SECURITY;

-- Policies for sdr_integrations
CREATE POLICY "Users can view their own integrations"
  ON public.sdr_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own integrations"
  ON public.sdr_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON public.sdr_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON public.sdr_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_sdr_integrations_updated_at
  BEFORE UPDATE ON public.sdr_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_sdr_integrations_user_id ON public.sdr_integrations(user_id);
CREATE INDEX idx_sdr_integrations_integration_name ON public.sdr_integrations(integration_name);