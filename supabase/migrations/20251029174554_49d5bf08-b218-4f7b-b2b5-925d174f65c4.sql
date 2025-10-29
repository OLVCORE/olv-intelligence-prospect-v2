-- Adicionar colunas de pipeline à tabela companies
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS deal_stage TEXT DEFAULT 'discovery' CHECK (deal_stage IN (
  'discovery',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
  'nurturing'
)),
ADD COLUMN IF NOT EXISTS deal_value DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS deal_probability INTEGER CHECK (deal_probability >= 0 AND deal_probability <= 100),
ADD COLUMN IF NOT EXISTS expected_close_date DATE,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS days_in_stage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS next_follow_up_date DATE,
ADD COLUMN IF NOT EXISTS next_follow_up_action TEXT,
ADD COLUMN IF NOT EXISTS deal_notes TEXT;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_companies_deal_stage ON public.companies(deal_stage);
CREATE INDEX IF NOT EXISTS idx_companies_expected_close ON public.companies(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_companies_next_follow_up ON public.companies(next_follow_up_date);
CREATE INDEX IF NOT EXISTS idx_companies_last_activity ON public.companies(last_activity_at);

-- Trigger para atualizar days_in_stage
CREATE OR REPLACE FUNCTION update_days_in_stage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF OLD.deal_stage IS DISTINCT FROM NEW.deal_stage THEN
    NEW.stage_changed_at = now();
    NEW.days_in_stage = 0;
  ELSE
    NEW.days_in_stage = EXTRACT(DAY FROM (now() - NEW.stage_changed_at));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_days_in_stage ON public.companies;
CREATE TRIGGER trigger_update_days_in_stage
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_days_in_stage();