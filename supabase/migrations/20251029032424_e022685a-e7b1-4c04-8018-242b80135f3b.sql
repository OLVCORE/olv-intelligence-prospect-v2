-- ========================================
-- RLS Policies para People, Similar e Company People
-- ========================================

-- Habilitar RLS
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.similar_companies ENABLE ROW LEVEL SECURITY;

-- Permitir leitura autenticada de pessoas vinculadas
DROP POLICY IF EXISTS "read_people_authenticated" ON public.people;
CREATE POLICY "read_people_authenticated"
ON public.people
FOR SELECT
TO authenticated
USING (true);

-- Permitir leitura de vínculos empresa-pessoa
DROP POLICY IF EXISTS "read_company_people_authenticated" ON public.company_people;
CREATE POLICY "read_company_people_authenticated"
ON public.company_people
FOR SELECT
TO authenticated
USING (true);

-- Permitir leitura de empresas similares
DROP POLICY IF EXISTS "read_similar_companies_authenticated" ON public.similar_companies;
CREATE POLICY "read_similar_companies_authenticated"
ON public.similar_companies
FOR SELECT
TO authenticated
USING (true);

-- Permitir service role gerenciar tudo (para enrich-apollo)
CREATE POLICY "service_can_manage_people"
ON public.people
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "service_can_manage_company_people"
ON public.company_people
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "service_can_manage_similar"
ON public.similar_companies
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);