-- Deduplicate and enforce unique CNPJ in quarantine and companies

-- 1) Remove duplicated CNPJs in icp_analysis_results (keep most recent by id)
WITH ranked AS (
  SELECT id, cnpj, ROW_NUMBER() OVER (PARTITION BY cnpj ORDER BY id DESC) AS rn
  FROM public.icp_analysis_results
  WHERE cnpj IS NOT NULL
)
DELETE FROM public.icp_analysis_results i
USING ranked r
WHERE i.id = r.id AND r.rn > 1;

-- 2) Ensure unique constraint on icp_analysis_results.cnpj
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'icp_analysis_results_cnpj_unique'
  ) THEN
    ALTER TABLE public.icp_analysis_results
    ADD CONSTRAINT icp_analysis_results_cnpj_unique UNIQUE (cnpj);
  END IF;
END $$;

-- 3) Ensure unique constraint on companies.cnpj (optional but recommended)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_cnpj_unique'
  ) THEN
    ALTER TABLE public.companies
    ADD CONSTRAINT companies_cnpj_unique UNIQUE (cnpj);
  END IF;
END $$;