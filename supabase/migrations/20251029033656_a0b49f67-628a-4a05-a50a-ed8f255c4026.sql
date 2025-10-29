
-- Habilitar RLS nas novas tabelas
ALTER TABLE public.company_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_updates ENABLE ROW LEVEL SECURITY;
