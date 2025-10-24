-- Create call_recordings table
CREATE TABLE IF NOT EXISTS public.call_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT NOT NULL UNIQUE,
  recording_sid TEXT,
  recording_url TEXT,
  transcription TEXT,
  transcription_sid TEXT,
  duration_seconds INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create message_templates table
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  channel TEXT NOT NULL, -- email, whatsapp, sms
  subject TEXT,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for call_recordings
CREATE POLICY "Authenticated users can manage call_recordings"
  ON public.call_recordings
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for message_templates
CREATE POLICY "Authenticated users can manage message_templates"
  ON public.message_templates
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX idx_call_recordings_company ON public.call_recordings(company_id);
CREATE INDEX idx_call_recordings_contact ON public.call_recordings(contact_id);
CREATE INDEX idx_call_recordings_created_at ON public.call_recordings(created_at DESC);
CREATE INDEX idx_message_templates_category ON public.message_templates(category);
CREATE INDEX idx_message_templates_channel ON public.message_templates(channel);

-- Trigger for updated_at
CREATE TRIGGER update_call_recordings_updated_at
  BEFORE UPDATE ON public.call_recordings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();