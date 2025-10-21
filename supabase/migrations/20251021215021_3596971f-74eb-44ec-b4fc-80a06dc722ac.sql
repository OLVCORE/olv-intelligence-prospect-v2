-- =====================================================
-- MÓDULO SDR - Schema Completo
-- =====================================================

-- Contatos (pessoa física ou ponto de contato)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  channel JSONB DEFAULT '{"whatsapp": false, "email": false}'::jsonb,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_company ON public.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);

-- Conversas (thread)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  channel TEXT CHECK (channel IN ('whatsapp','email')) NOT NULL,
  status TEXT CHECK (status IN ('open','pending','closed','archived')) DEFAULT 'open',
  assigned_to UUID,
  priority TEXT CHECK (priority IN ('high','medium','low')) DEFAULT 'medium',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  sla_due_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_company ON public.conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact ON public.conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned ON public.conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversations_sla ON public.conversations(sla_due_at);

-- Mensagens
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  direction TEXT CHECK (direction IN ('in','out')) NOT NULL,
  channel TEXT CHECK (channel IN ('whatsapp','email')) NOT NULL,
  from_id TEXT,
  to_id TEXT,
  body TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  provider_message_id TEXT,
  status TEXT CHECK (status IN ('sent','delivered','read','failed')) DEFAULT 'sent',
  raw JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_provider ON public.messages(provider_message_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_provider_unique ON public.messages(provider_message_id) WHERE provider_message_id IS NOT NULL;

-- Regras de filas/roteamento
CREATE TABLE IF NOT EXISTS public.sdr_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  assign_to UUID,
  priority TEXT CHECK (priority IN ('high','medium','low')) DEFAULT 'medium',
  sla_minutes INT DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Templates
CREATE TABLE IF NOT EXISTS public.sdr_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT CHECK (channel IN ('whatsapp','email')) NOT NULL,
  language TEXT DEFAULT 'pt-BR',
  subject TEXT,
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sequências
CREATE TABLE IF NOT EXISTS public.sdr_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sdr_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES public.sdr_sequences(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  day_offset INT NOT NULL DEFAULT 0,
  channel TEXT CHECK (channel IN ('whatsapp','email')) NOT NULL,
  template_id UUID REFERENCES public.sdr_templates(id) ON DELETE SET NULL,
  stop_on_reply BOOLEAN DEFAULT true,
  skip_weekends BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sequence_steps_sequence ON public.sdr_sequence_steps(sequence_id, step_order);

-- Execuções de sequência (inscrições)
CREATE TABLE IF NOT EXISTS public.sdr_sequence_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES public.sdr_sequences(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  current_step INT DEFAULT 0,
  status TEXT CHECK (status IN ('running','paused','completed','stopped')) DEFAULT 'running',
  last_sent_at TIMESTAMPTZ,
  next_due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sequence_runs_next_due ON public.sdr_sequence_runs(next_due_at) WHERE status = 'running';

-- Tarefas
CREATE TABLE IF NOT EXISTS public.sdr_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo','doing','done')) DEFAULT 'todo',
  due_date DATE,
  assigned_to UUID,
  reminders JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.sdr_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.sdr_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_company ON public.sdr_tasks(company_id);

-- Auditoria leve
CREATE TABLE IF NOT EXISTS public.sdr_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  user_id UUID,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.sdr_audit(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.sdr_audit(created_at);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_sdr_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_routing_rules_updated_at BEFORE UPDATE ON public.sdr_routing_rules
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.sdr_templates
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_sequences_updated_at BEFORE UPDATE ON public.sdr_sequences
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_sequence_runs_updated_at BEFORE UPDATE ON public.sdr_sequence_runs
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.sdr_tasks
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_sequence_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_audit ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read/write (para POC)
CREATE POLICY "Authenticated users can manage contacts" ON public.contacts
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage conversations" ON public.conversations
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage messages" ON public.messages
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage routing_rules" ON public.sdr_routing_rules
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage templates" ON public.sdr_templates
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage sequences" ON public.sdr_sequences
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage sequence_steps" ON public.sdr_sequence_steps
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage sequence_runs" ON public.sdr_sequence_runs
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage tasks" ON public.sdr_tasks
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read audit" ON public.sdr_audit
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Service role pode tudo (para webhooks)
CREATE POLICY "Service role can manage contacts" ON public.contacts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage conversations" ON public.conversations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage messages" ON public.messages
  FOR ALL USING (true) WITH CHECK (true);