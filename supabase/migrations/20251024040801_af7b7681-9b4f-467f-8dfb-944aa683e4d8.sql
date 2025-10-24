-- Tabela de Metas (Goals)
CREATE TABLE IF NOT EXISTS public.sales_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id),
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'semestral', 'annual')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Metas por tipo
  proposals_target INTEGER NOT NULL DEFAULT 0,
  sales_target INTEGER NOT NULL DEFAULT 0,
  revenue_target NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  -- Metas por produto (JSONB com estrutura flexível)
  product_targets JSONB DEFAULT '[]'::jsonb,
  
  -- Resultados atuais
  proposals_achieved INTEGER NOT NULL DEFAULT 0,
  sales_achieved INTEGER NOT NULL DEFAULT 0,
  revenue_achieved NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  -- Status e progresso
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  progress_percentage NUMERIC(5,2) DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sales_goals_period ON public.sales_goals(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_sales_goals_type ON public.sales_goals(period_type);
CREATE INDEX IF NOT EXISTS idx_sales_goals_status ON public.sales_goals(status);

-- RLS Policies
ALTER TABLE public.sales_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage sales_goals"
  ON public.sales_goals
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Tabela de Atividades/Logs de Ocorrências
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id),
  
  -- Relacionamentos
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  decision_maker_id UUID REFERENCES public.decision_makers(id) ON DELETE SET NULL,
  
  -- Tipo e detalhes da atividade
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'call', 'meeting', 'email', 'whatsapp', 'linkedin', 
    'demo', 'proposal', 'follow_up', 'note', 'other'
  )),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Informações de contato
  contact_person TEXT,
  contact_role TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  
  -- Resultado e próximos passos
  outcome TEXT,
  next_steps TEXT,
  next_action_date DATE,
  
  -- Metadata
  duration_minutes INTEGER,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  activity_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_activities_company ON public.activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_contact ON public.activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_date ON public.activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_creator ON public.activities(created_by);

-- RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage activities"
  ON public.activities
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sales_goals_updated_at
  BEFORE UPDATE ON public.sales_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();