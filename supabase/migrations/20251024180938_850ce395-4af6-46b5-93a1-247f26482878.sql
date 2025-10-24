-- Tabela de oportunidades SDR (pipeline real)
CREATE TABLE IF NOT EXISTS public.sdr_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  canvas_id UUID REFERENCES public.canvas(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  value NUMERIC NOT NULL DEFAULT 0,
  probability INTEGER NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  next_action TEXT,
  next_action_date TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES auth.users(id),
  won_date TIMESTAMP WITH TIME ZONE,
  lost_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.sdr_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage opportunities"
  ON public.sdr_opportunities FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Índices
CREATE INDEX idx_sdr_opportunities_company ON public.sdr_opportunities(company_id);
CREATE INDEX idx_sdr_opportunities_stage ON public.sdr_opportunities(stage);
CREATE INDEX idx_sdr_opportunities_assigned ON public.sdr_opportunities(assigned_to);
CREATE INDEX idx_sdr_opportunities_created ON public.sdr_opportunities(created_at);

-- Trigger updated_at
CREATE TRIGGER update_sdr_opportunities_updated_at
  BEFORE UPDATE ON public.sdr_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir oportunidades a partir das conversas existentes
INSERT INTO public.sdr_opportunities (
  company_id,
  contact_id,
  conversation_id,
  title,
  stage,
  value,
  probability,
  next_action_date
)
SELECT 
  c.company_id,
  c.contact_id,
  c.id,
  COALESCE(comp.name || ' - Oportunidade', 'Nova Oportunidade'),
  CASE 
    WHEN c.status = 'open' THEN 'contacted'
    WHEN c.status = 'pending' THEN 'qualified'
    WHEN c.status = 'closed' THEN 'won'
    ELSE 'new'
  END,
  CASE 
    WHEN c.priority = 'high' THEN 120000
    WHEN c.priority = 'medium' THEN 75000
    ELSE 30000
  END,
  CASE 
    WHEN c.status = 'open' THEN 40
    WHEN c.status = 'pending' THEN 60
    WHEN c.status = 'closed' THEN 100
    ELSE 20
  END,
  NOW() + INTERVAL '7 days'
FROM public.conversations c
LEFT JOIN public.companies comp ON c.company_id = comp.id
WHERE c.company_id IS NOT NULL
ON CONFLICT DO NOTHING;