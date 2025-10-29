-- ============================================
-- HABILITAR REALTIME PARA MONITORAMENTO
-- ============================================

-- Habilitar realtime para intelligence_monitoring_config
ALTER TABLE public.intelligence_monitoring_config REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.intelligence_monitoring_config;

-- Habilitar realtime para buying_signals (detectar novos sinais em tempo real)
ALTER TABLE public.buying_signals REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.buying_signals;

-- Habilitar realtime para displacement_opportunities
ALTER TABLE public.displacement_opportunities REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.displacement_opportunities;