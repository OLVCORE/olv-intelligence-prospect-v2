-- ============================================
-- EMAIL SEQUENCES & AUTOMATION
-- ============================================

-- Tabela de sequências de email
CREATE TABLE IF NOT EXISTS public.email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'stage_change', 'deal_created', 'time_based')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabela de steps das sequências
CREATE TABLE IF NOT EXISTS public.email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  subject TEXT NOT NULL,
  body_template TEXT NOT NULL,
  delay_days INTEGER NOT NULL DEFAULT 0,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  send_time TEXT, -- formato: "09:00" para enviar sempre às 9h
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sequence_id, step_order)
);

-- Tabela de enrollment (quem está na sequência)
CREATE TABLE IF NOT EXISTS public.email_sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.decision_makers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'unsubscribed')),
  current_step INTEGER DEFAULT 1,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabela de emails enviados
CREATE TABLE IF NOT EXISTS public.email_sequence_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.email_sequence_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.email_sequence_steps(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'clicked', 'replied', 'bounced')),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- ACTIVITY TIMELINE UNIFICADA
-- ============================================

-- Tabela unificada de atividades (já existe, vamos estender)
-- Adicionar campos para unificar diferentes tipos de interação
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS channel TEXT; -- email, call, whatsapp, meeting, note
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS direction TEXT; -- inbound, outbound
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS sentiment TEXT; -- positive, neutral, negative
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS recording_url TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS email_thread_id TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT;

-- ============================================
-- DEAL HEALTH SCORE & RISK ALERTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.deal_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Fatores do score
  engagement_score INTEGER DEFAULT 0,
  velocity_score INTEGER DEFAULT 0,
  stakeholder_score INTEGER DEFAULT 0,
  activity_score INTEGER DEFAULT 0,
  
  -- Alertas e recomendações
  risk_factors JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(company_id, calculated_at)
);

-- ============================================
-- SMART TASKS & AUTOMATION
-- ============================================

CREATE TABLE IF NOT EXISTS public.smart_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL, -- follow_up, proposal, meeting, call, email, custom
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  
  -- Relações
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.decision_makers(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  
  -- Automação
  auto_created BOOLEAN DEFAULT false,
  trigger_type TEXT, -- stage_change, inactivity, sequence, manual
  trigger_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Datas
  due_date TIMESTAMPTZ NOT NULL,
  reminder_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contexto
  context JSONB DEFAULT '{}'::jsonb,
  ai_suggestions JSONB DEFAULT '[]'::jsonb
);

-- ============================================
-- CONVERSATION INTELLIGENCE
-- ============================================

CREATE TABLE IF NOT EXISTS public.conversation_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  
  -- Análise de sentimento
  overall_sentiment TEXT, -- positive, neutral, negative
  sentiment_score NUMERIC(3,2), -- -1.0 a 1.0
  sentiment_timeline JSONB DEFAULT '[]'::jsonb,
  
  -- Objeções detectadas
  objections_detected JSONB DEFAULT '[]'::jsonb,
  
  -- Next best actions
  suggested_actions JSONB DEFAULT '[]'::jsonb,
  
  -- Keywords e tópicos
  key_topics JSONB DEFAULT '[]'::jsonb,
  keywords JSONB DEFAULT '[]'::jsonb,
  
  -- Metrics
  talk_time_ratio JSONB, -- {rep: 60, client: 40}
  questions_asked INTEGER DEFAULT 0,
  
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- PLAYBOOKS CONTEXTUAIS
-- ============================================

CREATE TABLE IF NOT EXISTS public.playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  playbook_type TEXT NOT NULL, -- discovery, demo, negotiation, objection_handling, closing
  trigger_conditions JSONB DEFAULT '{}'::jsonb, -- quando mostrar
  
  -- Conteúdo
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  talk_tracks JSONB DEFAULT '[]'::jsonb,
  objection_responses JSONB DEFAULT '[]'::jsonb,
  questions_to_ask JSONB DEFAULT '[]'::jsonb,
  
  -- Battle cards integradas
  competitor_intel JSONB DEFAULT '[]'::jsonb,
  
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- MEETING SCHEDULER
-- ============================================

CREATE TABLE IF NOT EXISTS public.meeting_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  
  -- Disponibilidade
  availability_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  
  -- Configurações
  buffer_time_minutes INTEGER DEFAULT 0,
  max_bookings_per_day INTEGER,
  advance_notice_hours INTEGER DEFAULT 24,
  
  -- Integrações
  calendar_integration TEXT, -- google, outlook
  meeting_location TEXT, -- zoom, teams, meet, presencial
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meeting_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_link_id UUID NOT NULL REFERENCES public.meeting_links(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id),
  contact_id UUID REFERENCES public.decision_makers(id),
  
  -- Informações da reunião
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  attendee_phone TEXT,
  notes TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  confirmation_sent_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  
  -- Dados da reunião
  meeting_url TEXT,
  meeting_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_email_sequences_status ON public.email_sequences(status);
CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_company ON public.email_sequence_enrollments(company_id);
CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_status ON public.email_sequence_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_next_send ON public.email_sequence_enrollments(next_send_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_deal_health_scores_company ON public.deal_health_scores(company_id);
CREATE INDEX IF NOT EXISTS idx_deal_health_scores_risk ON public.deal_health_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_smart_tasks_assigned ON public.smart_tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_smart_tasks_due ON public.smart_tasks(due_date) WHERE status IN ('pending', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_smart_tasks_company ON public.smart_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_activity ON public.conversation_analysis(activity_id);
CREATE INDEX IF NOT EXISTS idx_meeting_bookings_link ON public.meeting_bookings(meeting_link_id);
CREATE INDEX IF NOT EXISTS idx_meeting_bookings_scheduled ON public.meeting_bookings(scheduled_at);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Email Sequences
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage email sequences" ON public.email_sequences FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.email_sequence_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage sequence steps" ON public.email_sequence_steps FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.email_sequence_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage enrollments" ON public.email_sequence_enrollments FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.email_sequence_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view messages" ON public.email_sequence_messages FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Deal Health Scores
ALTER TABLE public.deal_health_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view health scores" ON public.deal_health_scores FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Smart Tasks
ALTER TABLE public.smart_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage tasks" ON public.smart_tasks FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Conversation Analysis
ALTER TABLE public.conversation_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view analysis" ON public.conversation_analysis FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Playbooks
ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view playbooks" ON public.playbooks FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Meeting Links & Bookings
ALTER TABLE public.meeting_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own meeting links" ON public.meeting_links FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.meeting_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view bookings" ON public.meeting_bookings FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_email_sequences_updated_at ON public.email_sequences;
CREATE TRIGGER update_email_sequences_updated_at BEFORE UPDATE ON public.email_sequences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_sequence_steps_updated_at ON public.email_sequence_steps;
CREATE TRIGGER update_email_sequence_steps_updated_at BEFORE UPDATE ON public.email_sequence_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_smart_tasks_updated_at ON public.smart_tasks;
CREATE TRIGGER update_smart_tasks_updated_at BEFORE UPDATE ON public.smart_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_playbooks_updated_at ON public.playbooks;
CREATE TRIGGER update_playbooks_updated_at BEFORE UPDATE ON public.playbooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_links_updated_at ON public.meeting_links;
CREATE TRIGGER update_meeting_links_updated_at BEFORE UPDATE ON public.meeting_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_bookings_updated_at ON public.meeting_bookings;
CREATE TRIGGER update_meeting_bookings_updated_at BEFORE UPDATE ON public.meeting_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();