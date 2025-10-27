-- Create sdr_workflows table for custom workflow automation
CREATE TABLE IF NOT EXISTS public.sdr_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  conditions JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sdr_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own workflows
CREATE POLICY "Users can view own workflows"
  ON public.sdr_workflows
  FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create own workflows"
  ON public.sdr_workflows
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own workflows"
  ON public.sdr_workflows
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own workflows"
  ON public.sdr_workflows
  FOR DELETE
  USING (auth.uid() = created_by);

-- Indexes for performance
CREATE INDEX idx_sdr_workflows_created_by ON public.sdr_workflows(created_by);
CREATE INDEX idx_sdr_workflows_trigger_type ON public.sdr_workflows(trigger_type);
CREATE INDEX idx_sdr_workflows_is_active ON public.sdr_workflows(is_active);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_sdr_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sdr_workflows_updated_at
  BEFORE UPDATE ON public.sdr_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sdr_workflows_updated_at();