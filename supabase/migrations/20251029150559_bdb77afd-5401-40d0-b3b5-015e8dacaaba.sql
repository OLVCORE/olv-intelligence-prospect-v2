-- Permitir múltiplos monitoramentos por usuário
-- 1) Remover unicidade antiga (user_id)
ALTER TABLE public.intelligence_monitoring_config
  DROP CONSTRAINT IF EXISTS intelligence_monitoring_config_user_id_key;

-- 2) Garantir unicidade por (user_id, schedule_name) para evitar nomes duplicados por usuário
-- Observação: schedule_name pode ser NULL; NULLs são distintos em Postgres
ALTER TABLE public.intelligence_monitoring_config
  ADD CONSTRAINT intelligence_monitoring_config_user_name_unique
  UNIQUE (user_id, schedule_name);

-- Índice auxiliar opcional já existe para schedule_name; manter como está
