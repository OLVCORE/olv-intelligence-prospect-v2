-- Add schedule_name to monitoring config
ALTER TABLE public.intelligence_monitoring_config
ADD COLUMN IF NOT EXISTS schedule_name TEXT;

-- Optional: simple index if we will search by name often
CREATE INDEX IF NOT EXISTS idx_monitoring_config_schedule_name ON public.intelligence_monitoring_config (schedule_name);
