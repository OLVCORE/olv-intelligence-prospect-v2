-- Tabela para tracking de empresas monitoradas
CREATE TABLE IF NOT EXISTS public.company_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  last_totvs_check_at TIMESTAMPTZ,
  last_intent_check_at TIMESTAMPTZ,
  last_totvs_score INTEGER,
  last_intent_score INTEGER,
  check_frequency_hours INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_company_monitoring_active ON public.company_monitoring(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_company_monitoring_company ON public.company_monitoring(company_id);
CREATE INDEX IF NOT EXISTS idx_company_monitoring_checks ON public.company_monitoring(last_totvs_check_at, last_intent_check_at) WHERE is_active = true;

-- RLS para company_monitoring
ALTER TABLE public.company_monitoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own monitoring"
  ON public.company_monitoring FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own monitoring"
  ON public.company_monitoring FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monitoring"
  ON public.company_monitoring FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monitoring"
  ON public.company_monitoring FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_company_monitoring_updated_at
  BEFORE UPDATE ON public.company_monitoring
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar extensões necessárias para cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Função auxiliar para buscar empresas que precisam de verificação
CREATE OR REPLACE FUNCTION public.get_companies_for_monitoring_check()
RETURNS TABLE (
  monitoring_id UUID,
  company_id UUID,
  company_name TEXT,
  company_domain TEXT,
  company_cnpj TEXT,
  user_id UUID,
  last_totvs_score INTEGER,
  last_intent_score INTEGER,
  hours_since_last_check INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id AS monitoring_id,
    c.id AS company_id,
    c.name AS company_name,
    c.domain AS company_domain,
    c.cnpj AS company_cnpj,
    cm.user_id,
    cm.last_totvs_score,
    cm.last_intent_score,
    EXTRACT(EPOCH FROM (NOW() - COALESCE(
      LEAST(cm.last_totvs_check_at, cm.last_intent_check_at),
      NOW() - INTERVAL '999 days'
    )))::INTEGER / 3600 AS hours_since_last_check
  FROM public.company_monitoring cm
  JOIN public.companies c ON c.id = cm.company_id
  WHERE cm.is_active = true
    AND (
      cm.last_totvs_check_at IS NULL 
      OR cm.last_intent_check_at IS NULL
      OR (NOW() - LEAST(cm.last_totvs_check_at, cm.last_intent_check_at)) >= (cm.check_frequency_hours || ' hours')::INTERVAL
    )
  ORDER BY 
    COALESCE(cm.last_totvs_check_at, '1970-01-01'::TIMESTAMPTZ) ASC,
    COALESCE(cm.last_intent_check_at, '1970-01-01'::TIMESTAMPTZ) ASC
  LIMIT 50;
END;
$$;

-- Agendar cron job para rodar todo dia às 2h da manhã (horário de Brasília UTC-3 = 5h UTC)
-- Nota: O cron job chama a edge function que processa as empresas
SELECT cron.schedule(
  'company-monitoring-daily-check',
  '0 5 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/company-monitoring-cron',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvYXh6cHdsdXJwZHVhbnprZnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY3MjEsImV4cCI6MjA3NjU2MjcyMX0.k5Zv_wnficuIrQZQjfppo66RR3mJNwR00kKT76ceK8g"}'::jsonb,
        body:=json_build_object('scheduled_run', true, 'timestamp', NOW()::text)::jsonb
    ) as request_id;
  $$
);