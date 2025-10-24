-- ====================================
-- MÓDULOS 7 & 8: COMPETITIVO + VALUE TRACKING
-- ====================================

-- Tabela de análise Win/Loss
CREATE TABLE IF NOT EXISTS public.win_loss_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  account_strategy_id UUID REFERENCES public.account_strategies(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quote_history(id) ON DELETE SET NULL,
  
  -- Resultado
  outcome TEXT NOT NULL CHECK (outcome IN ('won', 'lost', 'ongoing')),
  deal_value NUMERIC(15,2),
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- Competição
  competitors_faced TEXT[] DEFAULT ARRAY[]::TEXT[],
  primary_competitor TEXT,
  
  -- Análise
  win_reasons JSONB DEFAULT '[]',
  loss_reasons JSONB DEFAULT '[]',
  key_differentiators JSONB DEFAULT '[]',
  
  -- Feedback
  customer_feedback TEXT,
  internal_notes TEXT,
  
  -- Categorização
  deal_stage_lost TEXT,
  competitive_intensity TEXT CHECK (competitive_intensity IN ('low', 'medium', 'high', 'extreme')),
  
  -- Lições aprendidas
  lessons_learned JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de rastreamento de valor
CREATE TABLE IF NOT EXISTS public.value_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  account_strategy_id UUID REFERENCES public.account_strategies(id) ON DELETE CASCADE,
  
  -- Baseline (valores prometidos)
  promised_roi NUMERIC(5,2) NOT NULL,
  promised_payback_months INTEGER NOT NULL,
  promised_annual_savings NUMERIC(15,2) NOT NULL,
  promised_efficiency_gain NUMERIC(5,2) DEFAULT 0,
  promised_revenue_growth NUMERIC(5,2) DEFAULT 0,
  baseline_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Realizações (valores entregues)
  realized_roi NUMERIC(5,2) DEFAULT 0,
  realized_payback_months INTEGER,
  realized_annual_savings NUMERIC(15,2) DEFAULT 0,
  realized_efficiency_gain NUMERIC(5,2) DEFAULT 0,
  realized_revenue_growth NUMERIC(5,2) DEFAULT 0,
  last_measured_at TIMESTAMP WITH TIME ZONE,
  
  -- Marcos de progresso
  milestones JSONB DEFAULT '[]',
  
  -- Análise de desvios
  variance_analysis JSONB DEFAULT '{}',
  risk_flags JSONB DEFAULT '[]',
  
  -- Status
  tracking_status TEXT DEFAULT 'active' CHECK (tracking_status IN ('active', 'paused', 'completed', 'cancelled')),
  health_score NUMERIC(3,2) DEFAULT 1.0,
  
  -- Próxima revisão
  next_review_date DATE,
  review_frequency TEXT DEFAULT 'quarterly' CHECK (review_frequency IN ('monthly', 'quarterly', 'biannual', 'annual')),
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de marcos de valor
CREATE TABLE IF NOT EXISTS public.value_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value_tracking_id UUID REFERENCES public.value_tracking(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações do marco
  milestone_name TEXT NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,
  completed_date DATE,
  
  -- Valor esperado
  expected_value NUMERIC(15,2),
  actual_value NUMERIC(15,2),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed', 'at_risk')),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Responsável
  owner_id UUID REFERENCES auth.users(id),
  
  -- Notas
  notes TEXT,
  blockers JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_win_loss_company ON public.win_loss_analysis(company_id);
CREATE INDEX IF NOT EXISTS idx_win_loss_outcome ON public.win_loss_analysis(outcome);
CREATE INDEX IF NOT EXISTS idx_win_loss_closed ON public.win_loss_analysis(closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_value_tracking_company ON public.value_tracking(company_id);
CREATE INDEX IF NOT EXISTS idx_value_tracking_status ON public.value_tracking(tracking_status);
CREATE INDEX IF NOT EXISTS idx_value_milestones_tracking ON public.value_milestones(value_tracking_id);

-- RLS Policies
ALTER TABLE public.win_loss_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.value_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.value_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage win_loss_analysis"
  ON public.win_loss_analysis FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage value_tracking"
  ON public.value_tracking FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage value_milestones"
  ON public.value_milestones FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Triggers
CREATE TRIGGER update_win_loss_analysis_updated_at
  BEFORE UPDATE ON public.win_loss_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_value_tracking_updated_at
  BEFORE UPDATE ON public.value_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_value_milestones_updated_at
  BEFORE UPDATE ON public.value_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir battle cards para produtos TOTVS vs competidores
INSERT INTO public.battle_cards (competitor_id, totvs_product_sku, feature_comparison, pricing_comparison, win_strategy, objection_handling, proof_points) 
SELECT 
  c.id,
  'TOTVS-PROTHEUS-STD',
  '{"totvs": ["Módulos fiscais brasileiros nativos", "Customização simplificada", "Suporte local 24/7"], "competitor": ["Módulos genéricos", "Customização complexa", "Suporte internacional"]}'::jsonb,
  '{"totvs_price": "35000-50000", "competitor_price": "80000-150000", "totvs_advantage": "Até 60% mais econômico"}'::jsonb,
  CASE 
    WHEN c.name = 'SAP' THEN 'Enfatizar agilidade de implementação (3-6 meses vs 12-18 meses SAP) e custo total até 60% menor. Foco em empresas médias que não precisam da complexidade SAP.'
    WHEN c.name = 'Oracle' THEN 'Destacar independência de vendor lock-in, maior flexibilidade de customização e conhecimento profundo do mercado brasileiro. TCO significativamente menor.'
    WHEN c.name = 'Microsoft Dynamics' THEN 'Vantagem competitiva em módulos fiscais brasileiros e integrações específicas para o mercado local. Melhor relação custo-benefício para médias empresas.'
    ELSE 'Solução completa ERP integrada vs soluções pontuais'
  END,
  '[
    {"objection": "SAP é líder de mercado", "response": "SAP é excelente para grandes corporações multinacionais, mas TOTVS é líder no Brasil para empresas médias, com 40% de market share. Implementação 3x mais rápida e custo 60% menor."},
    {"objection": "Já usamos Microsoft", "response": "A integração Office é valiosa, mas TOTVS oferece módulos fiscais brasileiros muito superiores e suporte local dedicado. Economia de 40% no TCO total."}
  ]'::jsonb,
  '[
    {"type": "case_study", "title": "Empresa Similar - Setor X", "result": "ROI de 180% em 18 meses"},
    {"type": "metric", "title": "40% Market Share Brasil", "source": "IDC 2024"},
    {"type": "testimonial", "title": "Cliente Referência", "quote": "Implementação 4 meses vs 14 meses do anterior"}
  ]'::jsonb
FROM public.competitors c
WHERE c.active = true;
