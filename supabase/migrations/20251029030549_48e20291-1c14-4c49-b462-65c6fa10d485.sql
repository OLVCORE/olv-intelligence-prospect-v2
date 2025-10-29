-- Políticas RLS para permitir leitura de people e company_people

-- People: permitir leitura para usuários autenticados
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_people_if_linked" ON public.people;
CREATE POLICY "read_people_authenticated"
ON public.people
FOR SELECT
TO authenticated
USING (true);

-- Company People: permitir leitura para usuários autenticados
ALTER TABLE public.company_people ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_company_people_auth" ON public.company_people;
CREATE POLICY "read_company_people_authenticated"
ON public.company_people
FOR SELECT
TO authenticated
USING (true);

-- Similar Companies: permitir leitura para usuários autenticados
ALTER TABLE public.similar_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_similar_companies_authenticated"
ON public.similar_companies
FOR SELECT
TO authenticated
USING (true);