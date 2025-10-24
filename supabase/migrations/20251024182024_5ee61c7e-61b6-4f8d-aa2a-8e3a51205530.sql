-- Habilitar realtime para sdr_opportunities
ALTER TABLE public.sdr_opportunities REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sdr_opportunities;