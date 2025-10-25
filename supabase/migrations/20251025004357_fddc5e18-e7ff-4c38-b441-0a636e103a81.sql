-- ========================================
-- FASE 1: Adicionar campos faltantes em sdr_deals
-- ========================================

-- Adicionar foreign keys para quote e proposal
ALTER TABLE sdr_deals 
ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quote_history(id),
ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES visual_proposals(id),
ADD COLUMN IF NOT EXISTS assigned_sales_rep UUID REFERENCES profiles(id);

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_sdr_deals_quote_id ON sdr_deals(quote_id);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_proposal_id ON sdr_deals(proposal_id);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_assigned_sales_rep ON sdr_deals(assigned_sales_rep);

-- ========================================
-- FASE 2: Criar tabela de handoffs (SDR → Vendedor)
-- ========================================

CREATE TABLE IF NOT EXISTS sdr_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES sdr_deals(id) ON DELETE CASCADE,
  from_sdr UUID REFERENCES profiles(id),
  to_sales_rep UUID NOT NULL REFERENCES profiles(id),
  handoff_notes TEXT,
  checklist JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  handoff_date TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies para sdr_handoffs
ALTER TABLE sdr_handoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read handoffs" 
ON sdr_handoffs FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create handoffs" 
ON sdr_handoffs FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update handoffs" 
ON sdr_handoffs FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- ========================================
-- FASE 3: Criar tabela de aprovações de desconto
-- ========================================

CREATE TABLE IF NOT EXISTS deal_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES sdr_deals(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quote_history(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  discount_requested NUMERIC(5,2) NOT NULL,
  justification TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approval_level TEXT CHECK (approval_level IN ('manager', 'director', 'vp')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

-- RLS policies para deal_approvals
ALTER TABLE deal_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read approvals" 
ON deal_approvals FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create approvals" 
ON deal_approvals FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update approvals" 
ON deal_approvals FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- ========================================
-- FASE 4: Criar tabela de onboarding pós-venda
-- ========================================

CREATE TABLE IF NOT EXISTS customer_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES sdr_deals(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  onboarding_status TEXT DEFAULT 'scheduled' CHECK (onboarding_status IN ('scheduled', 'in_progress', 'completed', 'on_hold')),
  kickoff_date DATE,
  go_live_date DATE,
  assigned_csm UUID REFERENCES profiles(id),
  implementation_plan JSONB DEFAULT '{}'::jsonb,
  milestones JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies para customer_onboarding
ALTER TABLE customer_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage onboarding" 
ON customer_onboarding FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_customer_onboarding_updated_at
BEFORE UPDATE ON customer_onboarding
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- FASE 5: Trigger de auto-criação de Deal após enrichment
-- ========================================

CREATE OR REPLACE FUNCTION auto_create_deal_after_enrichment()
RETURNS TRIGGER AS $$
DECLARE
  v_deal_exists BOOLEAN;
  v_priority TEXT;
  v_value NUMERIC;
BEGIN
  -- Verificar se já existe deal para essa empresa
  SELECT EXISTS(
    SELECT 1 FROM sdr_deals 
    WHERE company_id = NEW.id 
    AND status IN ('open', 'won')
  ) INTO v_deal_exists;
  
  -- Se já existe deal ativo, não criar outro
  IF v_deal_exists THEN
    RETURN NEW;
  END IF;
  
  -- Se empresa foi enriquecida (tem maturity score), criar deal automaticamente
  IF NEW.digital_maturity_score IS NOT NULL AND OLD.digital_maturity_score IS NULL THEN
    
    -- Calcular prioridade baseada no score
    v_priority := CASE 
      WHEN NEW.digital_maturity_score >= 70 THEN 'high'
      WHEN NEW.digital_maturity_score >= 50 THEN 'medium'
      ELSE 'low'
    END;
    
    -- Estimar valor baseado em tamanho da empresa
    v_value := CASE 
      WHEN NEW.employees IS NOT NULL AND NEW.employees > 500 THEN 100000
      WHEN NEW.employees IS NOT NULL AND NEW.employees > 100 THEN 50000
      ELSE 25000
    END;
    
    -- Criar deal automaticamente
    INSERT INTO sdr_deals (
      company_id,
      title,
      stage,
      priority,
      status,
      value,
      probability,
      next_action,
      next_action_date,
      source,
      created_at
    ) VALUES (
      NEW.id,
      'Prospecção - ' || NEW.name,
      'discovery',
      v_priority,
      'open',
      v_value,
      30, -- Probabilidade inicial
      'Iniciar pesquisa e identificar decisores',
      NOW() + INTERVAL '2 days',
      'enrichment_auto',
      NOW()
    );
    
    -- Log da atividade
    INSERT INTO sdr_deal_activities (
      deal_id,
      activity_type,
      description,
      created_by
    )
    SELECT 
      id,
      'deal_created',
      'Deal criado automaticamente após enriquecimento 360°',
      auth.uid()
    FROM sdr_deals
    WHERE company_id = NEW.id
    ORDER BY created_at DESC
    LIMIT 1;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_auto_create_deal ON companies;
CREATE TRIGGER trigger_auto_create_deal
AFTER UPDATE ON companies
FOR EACH ROW
EXECUTE FUNCTION auto_create_deal_after_enrichment();

-- ========================================
-- FASE 6: Adicionar foreign keys em visual_proposals
-- ========================================

ALTER TABLE visual_proposals
ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quote_history(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_visual_proposals_quote_id ON visual_proposals(quote_id);

-- ========================================
-- FASE 7: Adicionar campo deal_id em quote_history
-- ========================================

ALTER TABLE quote_history
ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES sdr_deals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_quote_history_deal_id ON quote_history(deal_id);