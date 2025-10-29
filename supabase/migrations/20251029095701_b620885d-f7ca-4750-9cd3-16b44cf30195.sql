-- ============================================
-- CRON JOB PARA MONITORAMENTO AUTOMÁTICO
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agendar execução automática da edge function a cada 6 horas
SELECT cron.schedule(
  'auto-intelligence-monitor-job',
  '0 */6 * * *', -- A cada 6 horas
  $$
  SELECT net.http_post(
    url:='https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/auto-intelligence-monitor',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvYXh6cHdsdXJwZHVhbnprZnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY3MjEsImV4cCI6MjA3NjU2MjcyMX0.k5Zv_wnficuIrQZQjfppo66RR3mJNwR00kKT76ceK8g"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);