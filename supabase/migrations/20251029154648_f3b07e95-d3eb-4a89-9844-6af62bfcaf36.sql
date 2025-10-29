-- ============================================
-- DIA 1: ARQUITETURA DE DADOS - FUNDAÇÃO SÓLIDA
-- ============================================

-- 1. TABELA: leads_sources (Fontes de Captura)
CREATE TABLE IF NOT EXISTS public.leads_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  source_name TEXT NOT NULL UNIQUE CHECK (source_name IN (
    'upload_manual',
    'empresas_aqui',
    'linkedin_sales_navigator',
    'apollo_io',
    'google_search',
    'indicacao_website',
    'indicacao_parceiro',
    'lookalike_ai',
    'web_scraping_custom',
    'api_integration'
  )),
  
  -- Configuração
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5, -- 1-10 (10 = maior prioridade)
  
  -- Credenciais (encriptadas)
  api_credentials JSONB,
  
  -- Configurações específicas
  config JSONB,
  
  -- Estatísticas
  total_captured INTEGER DEFAULT 0,
  total_approved INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_leads_sources_active ON public.leads_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_leads_sources_priority ON public.leads_sources(priority DESC);

-- RLS
ALTER TABLE public.leads_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all sources" ON public.leads_sources;
CREATE POLICY "Users can view all sources"
  ON public.leads_sources FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can modify sources" ON public.leads_sources;
CREATE POLICY "Only admins can modify sources"
  ON public.leads_sources FOR ALL
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

-- 2. TABELA: leads_quarantine (Quarentena Inteligente)
CREATE TABLE IF NOT EXISTS public.leads_quarantine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados Básicos
  name TEXT NOT NULL,
  cnpj TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  
  -- Origem
  source_id UUID REFERENCES public.leads_sources(id),
  source_metadata JSONB, -- Dados brutos da fonte
  
  -- Classificação Inicial
  sector TEXT,
  niche TEXT,
  state TEXT,
  city TEXT,
  region TEXT CHECK (region IN ('Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul')),
  
  -- Porte
  employees INTEGER,
  revenue DECIMAL(15,2),
  company_size TEXT CHECK (company_size IN ('micro', 'pequena', 'media', 'grande')),
  
  -- Validações Automáticas
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN (
    'pending',      -- Aguardando validação
    'validating',   -- Em processo de validação
    'approved',     -- Aprovado para qualificação ICP
    'rejected',     -- Rejeitado (fora do ICP)
    'duplicate',    -- Duplicado
    'invalid_data'  -- Dados inválidos
  )),
  
  -- Scores de Validação
  cnpj_valid BOOLEAN DEFAULT false,
  cnpj_status TEXT, -- 'ativa', 'suspensa', 'baixada'
  website_active BOOLEAN DEFAULT false,
  website_ssl BOOLEAN DEFAULT false,
  has_linkedin BOOLEAN DEFAULT false,
  has_email BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  
  -- Score Automático (0-100)
  auto_score INTEGER DEFAULT 0,
  validation_score INTEGER DEFAULT 0,
  data_quality_score INTEGER DEFAULT 0,
  
  -- Enriquecimento Automático
  enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN (
    'pending',
    'in_progress',
    'completed',
    'failed'
  )),
  enriched_data JSONB, -- Dados enriquecidos (Apollo, LinkedIn, etc)
  
  -- Detecção de Tecnologias
  technologies_detected JSONB, -- [{"name": "SAP", "confidence": 0.8}]
  has_totvs BOOLEAN,
  totvs_products JSONB,
  competitor_erp TEXT,
  
  -- Sinais de Intenção
  buying_signals JSONB, -- [{"signal": "hiring_erp_analyst", "date": "2024-01-15"}]
  intent_score INTEGER DEFAULT 0,
  
  -- Timestamps
  captured_at TIMESTAMPTZ DEFAULT now(),
  validated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  
  -- Auditoria
  validated_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  notes TEXT,
  
  -- Controle
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_cnpj_in_quarantine UNIQUE(cnpj),
  CONSTRAINT check_score_range CHECK (auto_score >= 0 AND auto_score <= 100)
);

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_quarantine_status ON public.leads_quarantine(validation_status);
CREATE INDEX IF NOT EXISTS idx_quarantine_source ON public.leads_quarantine(source_id);
CREATE INDEX IF NOT EXISTS idx_quarantine_captured ON public.leads_quarantine(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_quarantine_cnpj ON public.leads_quarantine(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quarantine_score ON public.leads_quarantine(auto_score DESC);
CREATE INDEX IF NOT EXISTS idx_quarantine_sector_state ON public.leads_quarantine(sector, state);

-- Índice GIN para busca em JSONB
CREATE INDEX IF NOT EXISTS idx_quarantine_enriched_data ON public.leads_quarantine USING GIN (enriched_data);
CREATE INDEX IF NOT EXISTS idx_quarantine_technologies ON public.leads_quarantine USING GIN (technologies_detected);

-- RLS
ALTER TABLE public.leads_quarantine ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all quarantine leads" ON public.leads_quarantine;
CREATE POLICY "Users can view all quarantine leads"
  ON public.leads_quarantine FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert quarantine leads" ON public.leads_quarantine;
CREATE POLICY "Users can insert quarantine leads"
  ON public.leads_quarantine FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update quarantine leads" ON public.leads_quarantine;
CREATE POLICY "Users can update quarantine leads"
  ON public.leads_quarantine FOR UPDATE
  USING (true);

-- 3. Atualizar tabela companies existente com novas colunas
ALTER TABLE public.companies
-- Origem
ADD COLUMN IF NOT EXISTS lead_source_id UUID REFERENCES public.leads_sources(id),
ADD COLUMN IF NOT EXISTS quarantine_id UUID REFERENCES public.leads_quarantine(id),

-- Scores ICP
ADD COLUMN IF NOT EXISTS icp_score INTEGER DEFAULT 0 CHECK (icp_score >= 0 AND icp_score <= 100),
ADD COLUMN IF NOT EXISTS icp_score_breakdown JSONB, -- {"sector": 30, "size": 25, "region": 20, ...}
ADD COLUMN IF NOT EXISTS temperature TEXT CHECK (temperature IN ('hot', 'warm', 'cold')),

-- Jornada de Vendas
ADD COLUMN IF NOT EXISTS journey_stage TEXT DEFAULT 'new' CHECK (journey_stage IN (
  'new',                -- Recém qualificado
  'sdr_assigned',       -- Atribuído a SDR
  'researching',        -- SDR pesquisando
  'outreach_planned',   -- Abordagem planejada
  'first_contact',      -- Primeiro contato feito
  'follow_up',          -- Follow-up em andamento
  'meeting_scheduled',  -- Reunião agendada
  'meeting_done',       -- Reunião realizada
  'demo_scheduled',     -- Demo agendada
  'demo_done',          -- Demo realizada
  'proposal_preparing', -- Preparando proposta
  'proposal_sent',      -- Proposta enviada
  'negotiating',        -- Em negociação
  'contract_sent',      -- Contrato enviado
  'closed_won',         -- Fechado (ganho)
  'closed_lost',        -- Fechado (perdido)
  'nurturing',          -- Em nutrição (cold leads)
  'on_hold'             -- Em espera
)),

-- Atribuição
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,

-- Datas Importantes
ADD COLUMN IF NOT EXISTS first_contact_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS meeting_scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS demo_scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS proposal_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,

-- Próximas Ações
ADD COLUMN IF NOT EXISTS next_action TEXT,
ADD COLUMN IF NOT EXISTS next_action_date DATE,
ADD COLUMN IF NOT EXISTS next_action_owner UUID REFERENCES auth.users(id),

-- Proposta Comercial
ADD COLUMN IF NOT EXISTS estimated_deal_value DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS proposed_products JSONB, -- ["TOTVS Protheus", "TOTVS Fluig"]
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS payment_terms TEXT,

-- Motivo de Perda (se closed_lost)
ADD COLUMN IF NOT EXISTS loss_reason TEXT CHECK (loss_reason IN (
  'price',
  'competitor',
  'timing',
  'no_budget',
  'no_decision',
  'not_interested',
  'other'
)),
ADD COLUMN IF NOT EXISTS loss_details TEXT,
ADD COLUMN IF NOT EXISTS competitor_won TEXT,

-- Histórico de Interações (contador)
ADD COLUMN IF NOT EXISTS total_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_emails INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_meetings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_whatsapp INTEGER DEFAULT 0;

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_companies_temperature ON public.companies(temperature);
CREATE INDEX IF NOT EXISTS idx_companies_journey ON public.companies(journey_stage);
CREATE INDEX IF NOT EXISTS idx_companies_icp_score ON public.companies(icp_score DESC);
CREATE INDEX IF NOT EXISTS idx_companies_assigned ON public.companies(assigned_to);
CREATE INDEX IF NOT EXISTS idx_companies_next_action_date ON public.companies(next_action_date);
CREATE INDEX IF NOT EXISTS idx_companies_source ON public.companies(lead_source_id);

-- 4. TABELA: interactions (Histórico de Interações)
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Tipo de Interação
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'call',
    'email',
    'whatsapp',
    'linkedin_message',
    'meeting',
    'demo',
    'proposal_sent',
    'contract_sent',
    'note',
    'task',
    'status_change'
  )),
  
  -- Detalhes
  subject TEXT,
  description TEXT,
  outcome TEXT CHECK (outcome IN (
    'successful',
    'no_answer',
    'voicemail',
    'callback_requested',
    'not_interested',
    'interested',
    'meeting_scheduled',
    'other'
  )),
  
  -- Duração (para calls e meetings)
  duration_minutes INTEGER,
  
  -- Sentimento (análise de IA)
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score DECIMAL(3,2), -- -1.0 a 1.0
  
  -- Próxima Ação Sugerida
  next_action_suggested TEXT,
  next_action_date_suggested DATE,
  
  -- Anexos
  attachments JSONB, -- [{"name": "proposta.pdf", "url": "..."}]
  
  -- Metadata
  metadata JSONB, -- Dados extras (email_id, call_recording_url, etc)
  
  -- Timestamps
  interaction_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_interactions_company ON public.interactions(company_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON public.interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON public.interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON public.interactions(interaction_date DESC);

-- RLS
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all interactions" ON public.interactions;
CREATE POLICY "Users can view all interactions"
  ON public.interactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own interactions" ON public.interactions;
CREATE POLICY "Users can insert their own interactions"
  ON public.interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own interactions" ON public.interactions;
CREATE POLICY "Users can update their own interactions"
  ON public.interactions FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. TABELA: icp_analysis_history (Histórico de Análises ICP)
CREATE TABLE IF NOT EXISTS public.icp_analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Análise
  analysis_version INTEGER NOT NULL DEFAULT 1,
  icp_score INTEGER NOT NULL,
  temperature TEXT NOT NULL,
  score_breakdown JSONB NOT NULL,
  
  -- Detecções
  has_totvs BOOLEAN,
  totvs_products JSONB,
  competitor_erp TEXT,
  technologies_detected JSONB,
  
  -- Sinais de Intenção
  buying_signals JSONB,
  intent_score INTEGER,
  
  -- Proposta de Valor Gerada (IA)
  value_proposition TEXT,
  pain_points JSONB,
  recommended_products JSONB,
  estimated_roi TEXT,
  
  -- Metadata
  analysis_duration_ms INTEGER,
  ai_model_used TEXT,
  
  -- Auditoria
  analyzed_by UUID REFERENCES auth.users(id),
  analyzed_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint
  UNIQUE(company_id, analysis_version)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_icp_history_company ON public.icp_analysis_history(company_id);
CREATE INDEX IF NOT EXISTS idx_icp_history_score ON public.icp_analysis_history(icp_score DESC);
CREATE INDEX IF NOT EXISTS idx_icp_history_date ON public.icp_analysis_history(analyzed_at DESC);

-- RLS
ALTER TABLE public.icp_analysis_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all analysis history" ON public.icp_analysis_history;
CREATE POLICY "Users can view all analysis history"
  ON public.icp_analysis_history FOR SELECT
  USING (true);

-- 6. FUNCTIONS E TRIGGERS

-- Function: Atualizar updated_at automaticamente (atualiza se já existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_leads_sources_updated_at ON public.leads_sources;
CREATE TRIGGER update_leads_sources_updated_at
  BEFORE UPDATE ON public.leads_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_quarantine_updated_at ON public.leads_quarantine;
CREATE TRIGGER update_leads_quarantine_updated_at
  BEFORE UPDATE ON public.leads_quarantine
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Incrementar contador de interações
CREATE OR REPLACE FUNCTION increment_interaction_counter()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.interaction_type = 'call' THEN
    UPDATE public.companies
    SET total_calls = COALESCE(total_calls, 0) + 1,
        last_contact_at = NEW.interaction_date
    WHERE id = NEW.company_id;
  ELSIF NEW.interaction_type = 'email' THEN
    UPDATE public.companies
    SET total_emails = COALESCE(total_emails, 0) + 1,
        last_contact_at = NEW.interaction_date
    WHERE id = NEW.company_id;
  ELSIF NEW.interaction_type = 'meeting' THEN
    UPDATE public.companies
    SET total_meetings = COALESCE(total_meetings, 0) + 1,
        last_contact_at = NEW.interaction_date
    WHERE id = NEW.company_id;
  ELSIF NEW.interaction_type = 'whatsapp' THEN
    UPDATE public.companies
    SET total_whatsapp = COALESCE(total_whatsapp, 0) + 1,
        last_contact_at = NEW.interaction_date
    WHERE id = NEW.company_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_interaction_counter ON public.interactions;
CREATE TRIGGER trigger_increment_interaction_counter
  AFTER INSERT ON public.interactions
  FOR EACH ROW
  EXECUTE FUNCTION increment_interaction_counter();

-- Function: Atualizar estatísticas de fonte
CREATE OR REPLACE FUNCTION update_source_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.validation_status = 'approved' AND OLD.validation_status != 'approved' THEN
    UPDATE public.leads_sources
    SET total_approved = COALESCE(total_approved, 0) + 1,
        success_rate = (COALESCE(total_approved, 0) + 1)::DECIMAL / NULLIF(total_captured, 0) * 100
    WHERE id = NEW.source_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_source_stats ON public.leads_quarantine;
CREATE TRIGGER trigger_update_source_stats
  AFTER UPDATE ON public.leads_quarantine
  FOR EACH ROW
  EXECUTE FUNCTION update_source_stats();

-- 7. VIEWS ANALÍTICAS

-- View: Pipeline Overview
CREATE OR REPLACE VIEW public.pipeline_overview AS
SELECT 
  journey_stage,
  temperature,
  COUNT(*) as total_companies,
  SUM(estimated_deal_value) as total_pipeline_value,
  AVG(icp_score) as avg_icp_score,
  COUNT(*) FILTER (WHERE assigned_to IS NOT NULL) as assigned_count,
  COUNT(*) FILTER (WHERE next_action_date IS NOT NULL) as with_next_action
FROM public.companies
WHERE journey_stage NOT IN ('closed_won', 'closed_lost')
GROUP BY journey_stage, temperature;

-- View: SDR Performance
CREATE OR REPLACE VIEW public.sdr_performance AS
SELECT 
  u.id as user_id,
  u.email as user_email,
  COUNT(DISTINCT c.id) as total_companies_assigned,
  COUNT(DISTINCT c.id) FILTER (WHERE c.journey_stage = 'closed_won') as total_won,
  COUNT(DISTINCT c.id) FILTER (WHERE c.journey_stage = 'closed_lost') as total_lost,
  SUM(c.estimated_deal_value) FILTER (WHERE c.journey_stage = 'closed_won') as total_revenue,
  COUNT(DISTINCT i.id) as total_interactions,
  COUNT(DISTINCT i.id) FILTER (WHERE i.interaction_type = 'call') as total_calls,
  COUNT(DISTINCT i.id) FILTER (WHERE i.interaction_type = 'meeting') as total_meetings,
  AVG(c.icp_score) as avg_icp_score
FROM auth.users u
LEFT JOIN public.companies c ON c.assigned_to = u.id
LEFT JOIN public.interactions i ON i.user_id = u.id
GROUP BY u.id, u.email;

-- View: Source Performance
CREATE OR REPLACE VIEW public.source_performance AS
SELECT 
  ls.source_name,
  ls.is_active,
  ls.priority,
  COUNT(lq.id) as total_captured,
  COUNT(lq.id) FILTER (WHERE lq.validation_status = 'approved') as total_approved,
  COUNT(lq.id) FILTER (WHERE lq.validation_status = 'rejected') as total_rejected,
  AVG(lq.auto_score) as avg_auto_score,
  COUNT(c.id) as total_converted_to_companies,
  COUNT(c.id) FILTER (WHERE c.journey_stage = 'closed_won') as total_won
FROM public.leads_sources ls
LEFT JOIN public.leads_quarantine lq ON lq.source_id = ls.id
LEFT JOIN public.companies c ON c.quarantine_id = lq.id
GROUP BY ls.id, ls.source_name, ls.is_active, ls.priority;