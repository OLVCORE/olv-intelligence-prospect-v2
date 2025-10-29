-- ============================================
-- SPRINT 1: TRIGGER EVENTS & BUYING SIGNALS
-- ============================================

-- Tabela de sinais de compra detectados
CREATE TABLE IF NOT EXISTS public.buying_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'funding_round',
    'leadership_change', 
    'expansion',
    'technology_adoption',
    'partnership',
    'market_entry',
    'digital_transformation',
    'linkedin_activity',
    'job_posting',
    'competitor_mention',
    'negative_review'
  )),
  signal_title TEXT NOT NULL,
  signal_description TEXT,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  source_url TEXT,
  source_type TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'contacted', 'closed', 'ignored')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_buying_signals_company ON public.buying_signals(company_id);
CREATE INDEX IF NOT EXISTS idx_buying_signals_type ON public.buying_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_buying_signals_status ON public.buying_signals(status);
CREATE INDEX IF NOT EXISTS idx_buying_signals_detected ON public.buying_signals(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_buying_signals_priority ON public.buying_signals(priority);

-- RLS Policies
ALTER TABLE public.buying_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all buying signals"
  ON public.buying_signals FOR SELECT
  USING (true);

CREATE POLICY "Users can insert buying signals"
  ON public.buying_signals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update buying signals"
  ON public.buying_signals FOR UPDATE
  USING (true);

-- Tabela de oportunidades de competitive displacement
CREATE TABLE IF NOT EXISTS public.displacement_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  competitor_type TEXT,
  displacement_reason TEXT NOT NULL,
  evidence TEXT,
  opportunity_score DECIMAL(3,2) CHECK (opportunity_score >= 0 AND opportunity_score <= 1),
  estimated_revenue DECIMAL(15,2),
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'won', 'lost', 'ignored')),
  assigned_to UUID REFERENCES auth.users(id),
  next_action TEXT,
  next_action_date DATE,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_displacement_company ON public.displacement_opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_displacement_competitor ON public.displacement_opportunities(competitor_name);
CREATE INDEX IF NOT EXISTS idx_displacement_status ON public.displacement_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_displacement_score ON public.displacement_opportunities(opportunity_score DESC);

-- RLS Policies
ALTER TABLE public.displacement_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all displacement opportunities"
  ON public.displacement_opportunities FOR SELECT
  USING (true);

CREATE POLICY "Users can insert displacement opportunities"
  ON public.displacement_opportunities FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update displacement opportunities"
  ON public.displacement_opportunities FOR UPDATE
  USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_buying_signals_updated_at
  BEFORE UPDATE ON public.buying_signals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_displacement_opportunities_updated_at
  BEFORE UPDATE ON public.displacement_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- View para dashboard de sinais (agregado)
CREATE OR REPLACE VIEW public.buying_signals_summary AS
SELECT 
  company_id,
  COUNT(*) as total_signals,
  COUNT(*) FILTER (WHERE status = 'new') as new_signals,
  COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_signals,
  COUNT(*) FILTER (WHERE priority = 'high') as high_priority_signals,
  AVG(confidence_score) as avg_confidence,
  MAX(detected_at) as last_signal_date,
  json_agg(DISTINCT signal_type) as signal_types
FROM public.buying_signals
GROUP BY company_id;