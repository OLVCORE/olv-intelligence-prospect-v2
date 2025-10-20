-- Enable RLS on all tables (they already have policies but let's ensure it's enabled)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_makers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buying_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_maturity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Drop all existing public policies
DROP POLICY IF EXISTS "Public read access on companies" ON public.companies;
DROP POLICY IF EXISTS "Public insert access on companies" ON public.companies;
DROP POLICY IF EXISTS "Public update access on companies" ON public.companies;

DROP POLICY IF EXISTS "Public read access on decision_makers" ON public.decision_makers;
DROP POLICY IF EXISTS "Public insert access on decision_makers" ON public.decision_makers;
DROP POLICY IF EXISTS "Public update access on decision_makers" ON public.decision_makers;

DROP POLICY IF EXISTS "Public read access on buying_signals" ON public.buying_signals;
DROP POLICY IF EXISTS "Public insert access on buying_signals" ON public.buying_signals;

DROP POLICY IF EXISTS "Public read access on digital_maturity" ON public.digital_maturity;
DROP POLICY IF EXISTS "Public insert access on digital_maturity" ON public.digital_maturity;
DROP POLICY IF EXISTS "Public update access on digital_maturity" ON public.digital_maturity;

DROP POLICY IF EXISTS "Public read access on search_history" ON public.search_history;
DROP POLICY IF EXISTS "Public insert access on search_history" ON public.search_history;

-- Create new authenticated-only policies for companies
CREATE POLICY "Authenticated users can read companies"
ON public.companies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert companies"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update companies"
ON public.companies FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Service role has full access
CREATE POLICY "Service role can manage companies"
ON public.companies FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create new authenticated-only policies for decision_makers
CREATE POLICY "Authenticated users can read decision_makers"
ON public.decision_makers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert decision_makers"
ON public.decision_makers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update decision_makers"
ON public.decision_makers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage decision_makers"
ON public.decision_makers FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create new authenticated-only policies for buying_signals
CREATE POLICY "Authenticated users can read buying_signals"
ON public.buying_signals FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage buying_signals"
ON public.buying_signals FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create new authenticated-only policies for digital_maturity
CREATE POLICY "Authenticated users can read digital_maturity"
ON public.digital_maturity FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage digital_maturity"
ON public.digital_maturity FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create new authenticated-only policies for search_history
CREATE POLICY "Authenticated users can read search_history"
ON public.search_history FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage search_history"
ON public.search_history FOR ALL
TO service_role
USING (true)
WITH CHECK (true);