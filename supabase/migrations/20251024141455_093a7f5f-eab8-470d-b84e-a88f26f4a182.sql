-- ====================================
-- FASE 3: CENÁRIOS & PROPOSAL BUILDER
-- ====================================

-- Tabela de análise de cenários
CREATE TABLE IF NOT EXISTS public.scenario_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  account_strategy_id UUID REFERENCES public.account_strategies(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quote_history(id) ON DELETE SET NULL,
  
  -- Cenários
  best_case JSONB NOT NULL DEFAULT '{}',
  expected_case JSONB NOT NULL DEFAULT '{}',
  worst_case JSONB NOT NULL DEFAULT '{}',
  
  -- Análise de sensibilidade
  sensitivity_analysis JSONB DEFAULT '[]',
  risk_factors JSONB DEFAULT '[]',
  assumptions JSONB DEFAULT '[]',
  
  -- Métricas comparativas
  probability_best NUMERIC(3,2) DEFAULT 0.20,
  probability_expected NUMERIC(3,2) DEFAULT 0.60,
  probability_worst NUMERIC(3,2) DEFAULT 0.20,
  
  -- Recomendação
  recommended_scenario TEXT DEFAULT 'expected',
  confidence_level NUMERIC(3,2) DEFAULT 0.75,
  key_insights JSONB DEFAULT '[]',
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de propostas visuais
CREATE TABLE IF NOT EXISTS public.visual_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  account_strategy_id UUID REFERENCES public.account_strategies(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quote_history(id) ON DELETE SET NULL,
  scenario_id UUID REFERENCES public.scenario_analysis(id) ON DELETE SET NULL,
  
  -- Informações básicas
  title TEXT NOT NULL,
  proposal_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'sent', 'accepted', 'rejected')),
  
  -- Conteúdo estruturado
  sections JSONB NOT NULL DEFAULT '[]',
  template_id TEXT DEFAULT 'standard',
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1e40af',
  secondary_color TEXT DEFAULT '#f59e0b',
  
  -- Arquivos gerados
  pdf_url TEXT,
  presentation_url TEXT,
  
  -- Tracking
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  
  -- E-signature
  requires_signature BOOLEAN DEFAULT false,
  signed_at TIMESTAMP WITH TIME ZONE,
  signed_by_name TEXT,
  signed_by_email TEXT,
  signature_ip TEXT,
  
  -- Validade
  valid_until TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de competidores
CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('ERP', 'CRM', 'BPM', 'HCM', 'BI', 'Outros')),
  
  -- Informações
  website TEXT,
  description TEXT,
  
  -- Posicionamento
  market_position TEXT CHECK (market_position IN ('leader', 'challenger', 'nicher', 'follower')),
  target_market TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Pricing
  pricing_model TEXT,
  avg_deal_size NUMERIC(15,2),
  
  -- Strengths & Weaknesses
  strengths JSONB DEFAULT '[]',
  weaknesses JSONB DEFAULT '[]',
  
  -- TOTVS comparison
  totvs_advantages JSONB DEFAULT '[]',
  
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de battle cards (análise competitiva)
CREATE TABLE IF NOT EXISTS public.battle_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE NOT NULL,
  totvs_product_sku TEXT NOT NULL,
  
  -- Comparação
  feature_comparison JSONB NOT NULL DEFAULT '{}',
  pricing_comparison JSONB NOT NULL DEFAULT '{}',
  
  -- Estratégia
  win_strategy TEXT,
  objection_handling JSONB DEFAULT '[]',
  proof_points JSONB DEFAULT '[]',
  
  -- Cases de sucesso
  win_stories JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_scenario_analysis_company ON public.scenario_analysis(company_id);
CREATE INDEX IF NOT EXISTS idx_scenario_analysis_strategy ON public.scenario_analysis(account_strategy_id);
CREATE INDEX IF NOT EXISTS idx_visual_proposals_company ON public.visual_proposals(company_id);
CREATE INDEX IF NOT EXISTS idx_visual_proposals_status ON public.visual_proposals(status);
CREATE INDEX IF NOT EXISTS idx_visual_proposals_created ON public.visual_proposals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitors_category ON public.competitors(category);
CREATE INDEX IF NOT EXISTS idx_battle_cards_competitor ON public.battle_cards(competitor_id);

-- RLS Policies
ALTER TABLE public.scenario_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage scenario_analysis"
  ON public.scenario_analysis FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage visual_proposals"
  ON public.visual_proposals FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read competitors"
  ON public.competitors FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read battle_cards"
  ON public.battle_cards FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Triggers
CREATE TRIGGER update_scenario_analysis_updated_at
  BEFORE UPDATE ON public.scenario_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visual_proposals_updated_at
  BEFORE UPDATE ON public.visual_proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitors_updated_at
  BEFORE UPDATE ON public.competitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_battle_cards_updated_at
  BEFORE UPDATE ON public.battle_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir competidores principais
INSERT INTO public.competitors (name, category, market_position, description, strengths, weaknesses, totvs_advantages) VALUES
  (
    'SAP',
    'ERP',
    'leader',
    'Líder global em ERP empresarial',
    '["Marca forte", "Escala global", "Integração completa"]',
    '["Complexidade", "Custo elevado", "Implementação demorada"]',
    '["Custo menor", "Implementação mais rápida", "Suporte local superior", "Flexibilidade"]'
  ),
  (
    'Oracle',
    'ERP',
    'leader',
    'Plataforma integrada de aplicações empresariais',
    '["Cloud nativo", "Database integrado", "Portfolio amplo"]',
    '["Custo de licenciamento", "Vendor lock-in", "Complexidade"]',
    '["Melhor custo-benefício", "Menor dependência de vendor", "Suporte em português"]'
  ),
  (
    'Microsoft Dynamics',
    'ERP',
    'challenger',
    'Suite de gestão empresarial Microsoft',
    '["Integração com Office", "Cloud Azure", "Marca Microsoft"]',
    '["Customização limitada", "Menos módulos específicos para Brasil"]',
    '["Melhor adequação fiscal brasileira", "Módulos específicos locais", "Preço competitivo"]'
  ),
  (
    'Salesforce',
    'CRM',
    'leader',
    'Plataforma líder em CRM cloud',
    '["Melhor CRM", "Ecosistema AppExchange", "Inovação"]',
    '["Custo por usuário alto", "Não é ERP completo"]',
    '["Solução integrada ERP+CRM", "Custo total menor", "Gestão unificada"]'
  );
