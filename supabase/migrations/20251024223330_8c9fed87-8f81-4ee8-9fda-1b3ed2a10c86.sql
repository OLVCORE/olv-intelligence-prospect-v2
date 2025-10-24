-- =====================================================
-- SPRINT 2: KANBAN + BITRIX24 - Estrutura de Dados
-- =====================================================

-- Tabela de Deals (Negócios/Oportunidades)
CREATE TABLE IF NOT EXISTS sdr_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT, -- ID no Bitrix24 ou outro CRM
  title TEXT NOT NULL,
  description TEXT,
  
  -- Relacionamentos
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Pipeline & Estágio
  pipeline_id UUID, -- Para múltiplos pipelines no futuro
  stage TEXT NOT NULL DEFAULT 'lead',
  stage_order INTEGER DEFAULT 0,
  
  -- Valores
  value NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'abandoned')),
  lost_reason TEXT,
  won_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  source TEXT, -- cold_call, inbound, referral, etc
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Sync Bitrix24
  bitrix24_synced_at TIMESTAMP WITH TIME ZONE,
  bitrix24_data JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_sdr_deals_company ON sdr_deals(company_id);
CREATE INDEX idx_sdr_deals_contact ON sdr_deals(contact_id);
CREATE INDEX idx_sdr_deals_assigned ON sdr_deals(assigned_to);
CREATE INDEX idx_sdr_deals_stage ON sdr_deals(stage);
CREATE INDEX idx_sdr_deals_status ON sdr_deals(status);
CREATE INDEX idx_sdr_deals_external ON sdr_deals(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_sdr_deals_close_date ON sdr_deals(expected_close_date) WHERE expected_close_date IS NOT NULL;

-- Tabela de Estágios Customizáveis
CREATE TABLE IF NOT EXISTS sdr_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE, -- lead, qualification, proposal, etc
  order_index INTEGER NOT NULL,
  color TEXT DEFAULT '#6366f1',
  probability_default INTEGER DEFAULT 0,
  is_closed BOOLEAN DEFAULT FALSE,
  is_won BOOLEAN DEFAULT FALSE,
  automation_rules JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para ordenação
CREATE INDEX idx_pipeline_stages_order ON sdr_pipeline_stages(order_index);

-- Inserir estágios padrão
INSERT INTO sdr_pipeline_stages (name, key, order_index, color, probability_default, is_closed, is_won) VALUES
  ('Lead', 'lead', 0, '#6366f1', 10, false, false),
  ('Qualificação', 'qualification', 1, '#8b5cf6', 25, false, false),
  ('Proposta', 'proposal', 2, '#ec4899', 50, false, false),
  ('Negociação', 'negotiation', 3, '#f59e0b', 75, false, false),
  ('Fechamento', 'closing', 4, '#10b981', 90, false, false),
  ('Ganho', 'won', 5, '#22c55e', 100, true, true),
  ('Perdido', 'lost', 6, '#ef4444', 0, true, false)
ON CONFLICT (key) DO NOTHING;

-- Tabela de Atividades do Deal
CREATE TABLE IF NOT EXISTS sdr_deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES sdr_deals(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- stage_change, note, call, email, meeting
  description TEXT,
  old_value JSONB,
  new_value JSONB,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_deal_activities_deal ON sdr_deal_activities(deal_id);
CREATE INDEX idx_deal_activities_type ON sdr_deal_activities(activity_type);
CREATE INDEX idx_deal_activities_created ON sdr_deal_activities(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_sdr_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sdr_deals_updated_at
  BEFORE UPDATE ON sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_sdr_deals_updated_at();

-- Trigger para registrar mudanças de estágio
CREATE OR REPLACE FUNCTION log_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO sdr_deal_activities (deal_id, activity_type, description, old_value, new_value, created_by)
    VALUES (
      NEW.id,
      'stage_change',
      'Estágio alterado de ' || OLD.stage || ' para ' || NEW.stage,
      jsonb_build_object('stage', OLD.stage),
      jsonb_build_object('stage', NEW.stage),
      auth.uid()
    );
    
    NEW.last_activity_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_deal_stage_change
  BEFORE UPDATE ON sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION log_deal_stage_change();

-- RLS Policies
ALTER TABLE sdr_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_deal_activities ENABLE ROW LEVEL SECURITY;

-- Policies para sdr_deals
CREATE POLICY "Authenticated users can read deals"
  ON sdr_deals FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert deals"
  ON sdr_deals FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update deals"
  ON sdr_deals FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete deals"
  ON sdr_deals FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Policies para pipeline_stages
CREATE POLICY "Anyone can read pipeline stages"
  ON sdr_pipeline_stages FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage pipeline stages"
  ON sdr_pipeline_stages FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Policies para deal_activities
CREATE POLICY "Authenticated users can read deal activities"
  ON sdr_deal_activities FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert deal activities"
  ON sdr_deal_activities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Comentários para documentação
COMMENT ON TABLE sdr_deals IS 'Negócios/Oportunidades do pipeline de vendas';
COMMENT ON TABLE sdr_pipeline_stages IS 'Estágios customizáveis do pipeline';
COMMENT ON TABLE sdr_deal_activities IS 'Histórico de atividades e mudanças dos deals';
