-- ✅ MIGRATION: Sistema Completo de Account Strategy & Personas

-- 1️⃣ BUYER PERSONAS (Biblioteca de Personas)
CREATE TABLE buyer_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'CEO', 'CFO', 'CTO', 'Gerente TI', etc.
  seniority TEXT NOT NULL, -- 'C-Level', 'Diretoria', 'Gerência', 'Coordenação'
  department TEXT, -- 'Financeiro', 'TI', 'Operações', etc.
  
  -- Características comportamentais
  communication_style TEXT, -- 'Direto', 'Analítico', 'Relacionamento', 'Visionário'
  decision_factors JSONB DEFAULT '[]'::jsonb, -- ['ROI', 'Segurança', 'Inovação']
  pain_points JSONB DEFAULT '[]'::jsonb, -- Dores específicas
  motivators JSONB DEFAULT '[]'::jsonb, -- O que motiva essa persona
  objections JSONB DEFAULT '[]'::jsonb, -- Objeções típicas
  
  -- Canais e abordagem
  preferred_channels JSONB DEFAULT '[]'::jsonb, -- ['email', 'whatsapp', 'linkedin']
  best_approach TEXT, -- Estratégia de abordagem recomendada
  meeting_style TEXT, -- Como essa persona prefere reuniões
  
  -- Conteúdo de apoio
  key_messages JSONB DEFAULT '[]'::jsonb, -- Mensagens-chave para essa persona
  content_preferences TEXT[], -- Tipos de conteúdo que ressoam
  
  -- Metadados
  is_default BOOLEAN DEFAULT false, -- Personas padrão do sistema
  custom_data JSONB DEFAULT '{}'::jsonb, -- Campos customizados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2️⃣ ACCOUNT STRATEGIES (Estratégias por Empresa)
CREATE TABLE account_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES buyer_personas(id),
  decision_maker_id UUID REFERENCES decision_makers(id),
  
  -- Status e controle
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'paused', 'won', 'lost'
  current_stage TEXT DEFAULT 'cold_outreach', -- Etapa atual do relacionamento
  priority TEXT DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
  
  -- Estratégia gerada pela IA
  value_proposition TEXT, -- Proposta de valor personalizada
  approach_strategy TEXT, -- Estratégia de abordagem
  expected_timeline TEXT, -- Timeline esperado (ex: '3-6 meses')
  
  -- Gaps e oportunidades
  identified_gaps JSONB DEFAULT '[]'::jsonb, -- Gaps identificados na empresa
  recommended_products JSONB DEFAULT '[]'::jsonb, -- Produtos TOTVS recomendados
  transformation_roadmap JSONB DEFAULT '{}'::jsonb, -- Roadmap de transformação
  
  -- ROI e business case
  projected_roi NUMERIC, -- ROI projetado em %
  investment_required NUMERIC, -- Investimento necessário
  payback_period TEXT, -- Período de retorno
  annual_value NUMERIC, -- Valor anual estimado
  
  -- Stakeholders e relacionamento
  stakeholder_map JSONB DEFAULT '[]'::jsonb, -- Mapa de stakeholders
  relationship_score INTEGER DEFAULT 0, -- Score de relacionamento (0-100)
  engagement_level TEXT DEFAULT 'cold', -- 'cold', 'warm', 'hot', 'champion'
  
  -- Tracking
  last_touchpoint_at TIMESTAMPTZ,
  next_action_due TIMESTAMPTZ,
  
  -- IA gerada
  ai_insights JSONB DEFAULT '{}'::jsonb, -- Insights gerados pela IA
  ai_recommendations JSONB DEFAULT '[]'::jsonb, -- Recomendações da IA
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3️⃣ ACCOUNT TOUCHPOINTS (Histórico de Interações)
CREATE TABLE account_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_strategy_id UUID REFERENCES account_strategies(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Tipo de touchpoint
  stage TEXT NOT NULL, -- 'cold_outreach', 'first_meeting', 'diagnosis', 'proposal', 'negotiation', 'closing'
  touchpoint_type TEXT NOT NULL, -- 'email', 'whatsapp', 'call', 'meeting', 'proposal', 'demo'
  channel TEXT, -- Canal utilizado
  
  -- Conteúdo
  subject TEXT, -- Assunto (para emails)
  content TEXT, -- Conteúdo/notas da interação
  outcome TEXT, -- Resultado da interação
  sentiment TEXT, -- 'positive', 'neutral', 'negative'
  
  -- Métricas
  response_received BOOLEAN DEFAULT false,
  response_time_hours INTEGER, -- Tempo de resposta em horas
  meeting_duration_minutes INTEGER, -- Duração de reunião
  
  -- Próximos passos
  next_steps TEXT, -- Próximos passos acordados
  next_action_owner UUID REFERENCES auth.users(id), -- Responsável
  next_action_due TIMESTAMPTZ, -- Prazo
  
  -- Anexos e recursos
  attachments JSONB DEFAULT '[]'::jsonb, -- Arquivos anexados
  related_tasks JSONB DEFAULT '[]'::jsonb, -- Tasks relacionadas
  
  -- Tracking
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4️⃣ BUSINESS CASES (Propostas Comerciais Geradas)
CREATE TABLE business_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_strategy_id UUID REFERENCES account_strategies(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Versão e status
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected'
  
  -- Análise situacional
  current_situation TEXT, -- Situação atual da empresa
  identified_problems JSONB DEFAULT '[]'::jsonb, -- Problemas identificados
  business_impact TEXT, -- Impacto nos negócios
  
  -- Solução proposta
  proposed_solution TEXT, -- Solução completa proposta
  implementation_phases JSONB DEFAULT '[]'::jsonb, -- Fases de implementação
  products_included JSONB DEFAULT '[]'::jsonb, -- Produtos incluídos
  
  -- Financeiro
  investment_breakdown JSONB DEFAULT '{}'::jsonb, -- Detalhamento do investimento
  roi_calculation JSONB DEFAULT '{}'::jsonb, -- Cálculo detalhado de ROI
  payment_terms TEXT, -- Condições de pagamento
  
  -- Benefícios e riscos
  expected_benefits JSONB DEFAULT '[]'::jsonb, -- Benefícios esperados
  risk_mitigation JSONB DEFAULT '[]'::jsonb, -- Mitigação de riscos
  success_metrics JSONB DEFAULT '[]'::jsonb, -- Métricas de sucesso
  
  -- Case studies e provas sociais
  similar_cases JSONB DEFAULT '[]'::jsonb, -- Casos similares
  testimonials JSONB DEFAULT '[]'::jsonb, -- Depoimentos
  
  -- Documentos gerados
  proposal_url TEXT, -- URL do documento gerado
  presentation_url TEXT, -- URL da apresentação
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5️⃣ INDEXES para Performance
CREATE INDEX idx_account_strategies_company ON account_strategies(company_id);
CREATE INDEX idx_account_strategies_status ON account_strategies(status);
CREATE INDEX idx_account_strategies_stage ON account_strategies(current_stage);
CREATE INDEX idx_touchpoints_strategy ON account_touchpoints(account_strategy_id);
CREATE INDEX idx_touchpoints_completed ON account_touchpoints(completed_at);
CREATE INDEX idx_business_cases_strategy ON business_cases(account_strategy_id);
CREATE INDEX idx_business_cases_status ON business_cases(status);

-- 6️⃣ TRIGGERS para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_buyer_personas_updated_at
  BEFORE UPDATE ON buyer_personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_strategies_updated_at
  BEFORE UPDATE ON account_strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_cases_updated_at
  BEFORE UPDATE ON business_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7️⃣ RLS POLICIES
ALTER TABLE buyer_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_cases ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (authenticated users)
CREATE POLICY "Authenticated users can manage buyer_personas"
  ON buyer_personas FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage account_strategies"
  ON account_strategies FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage account_touchpoints"
  ON account_touchpoints FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage business_cases"
  ON business_cases FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 8️⃣ PERSONAS PADRÃO (Seed Data)
INSERT INTO buyer_personas (name, role, seniority, department, communication_style, decision_factors, pain_points, motivators, objections, preferred_channels, is_default) VALUES
('CEO Visionário', 'CEO', 'C-Level', 'Executivo', 'Direto e Estratégico', 
 '["ROI", "Crescimento", "Competitividade", "Inovação"]'::jsonb,
 '["Crescimento estagnado", "Falta de controle estratégico", "Concorrência agressiva"]'::jsonb,
 '["Liderar mercado", "Transformação digital", "Legacy empresarial"]'::jsonb,
 '["Custo elevado", "Tempo de implementação", "Resistência da equipe"]'::jsonb,
 '["email", "reunião presencial"]'::jsonb,
 true),

('CFO Analítico', 'CFO', 'C-Level', 'Financeiro', 'Analítico e Data-Driven', 
 '["ROI", "Redução de custos", "Compliance", "Previsibilidade"]'::jsonb,
 '["Falta de controle financeiro", "Processos manuais", "Erros contábeis"]'::jsonb,
 '["Eficiência operacional", "Controle total", "Redução de riscos"]'::jsonb,
 '["Payback longo", "Risco financeiro", "Custo oculto"]'::jsonb,
 '["email", "apresentação com dados"]'::jsonb,
 true),

('CTO Inovador', 'CTO', 'C-Level', 'Tecnologia', 'Técnico e Visionário', 
 '["Tecnologia", "Escalabilidade", "Segurança", "Integração"]'::jsonb,
 '["Infraestrutura legada", "Falta de integração", "Vulnerabilidades"]'::jsonb,
 '["Stack moderno", "Automação", "Inovação contínua"]'::jsonb,
 '["Complexidade técnica", "Vendor lock-in", "Suporte inadequado"]'::jsonb,
 '["email", "demo técnica", "linkedin"]'::jsonb,
 true),

('Gerente TI Operacional', 'Gerente TI', 'Gerência', 'Tecnologia', 'Prático e Solucionador', 
 '["Facilidade de uso", "Suporte", "Implementação rápida", "Treinamento"]'::jsonb,
 '["Equipe sobrecarregada", "Sistemas instáveis", "Falta de suporte"]'::jsonb,
 '["Simplificar operação", "Ter mais tempo", "Reduzir chamados"]'::jsonb,
 '["Curva de aprendizado", "Falta de recursos", "Resistência da equipe"]'::jsonb,
 '["whatsapp", "email", "call"]'::jsonb,
 true);

-- ✅ MIGRATION COMPLETA: Sistema de Account Strategy & Personas criado!