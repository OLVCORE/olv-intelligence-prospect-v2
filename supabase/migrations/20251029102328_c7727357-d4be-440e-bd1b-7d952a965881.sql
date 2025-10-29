-- ⚙️ ATIVAR EXTENSÕES NECESSÁRIAS PARA CRON
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 🔧 AGENDAR AUTO-INTELLIGENCE-MONITOR PARA RODAR A CADA 1 HORA (24/7)
-- Remove agendamento antigo se existir
SELECT cron.unschedule('auto-intelligence-monitor-hourly');

-- Criar novo agendamento (a cada 1 hora)
SELECT cron.schedule(
  'auto-intelligence-monitor-hourly',
  '0 * * * *', -- A cada hora (minuto 0)
  $$
  SELECT
    net.http_post(
        url:='https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/auto-intelligence-monitor',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvYXh6cHdsdXJwZHVhbnprZnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY3MjEsImV4cCI6MjA3NjU2MjcyMX0.k5Zv_wnficuIrQZQjfppo66RR3mJNwR00kKT76ceK8g"}'::jsonb,
        body:=concat('{"triggered_by": "cron", "time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- ✅ Verificar agendamentos ativos
SELECT * FROM cron.job;