-- Create executive_reports table to persist generated reports
CREATE TABLE public.executive_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('company','maturity','fit')),
  content JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure one report per company per type
CREATE UNIQUE INDEX executive_reports_company_type_idx
  ON public.executive_reports(company_id, report_type);

-- Enable RLS
ALTER TABLE public.executive_reports ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Authenticated users can read executive_reports"
  ON public.executive_reports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert executive_reports"
  ON public.executive_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update executive_reports"
  ON public.executive_reports
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Timestamp trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_executive_reports_updated_at
BEFORE UPDATE ON public.executive_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();