-- Tabela de empresas
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  domain TEXT,
  website TEXT,
  industry TEXT,
  employees INTEGER,
  revenue TEXT,
  location JSONB,
  linkedin_url TEXT,
  technologies TEXT[],
  digital_maturity_score NUMERIC,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de decisores
CREATE TABLE public.decision_makers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  linkedin_url TEXT,
  department TEXT,
  seniority TEXT,
  verified_email BOOLEAN DEFAULT false,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de sinais de compra
CREATE TABLE public.buying_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  description TEXT,
  source TEXT,
  confidence_score NUMERIC,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de maturidade digital
CREATE TABLE public.digital_maturity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  infrastructure_score NUMERIC,
  systems_score NUMERIC,
  processes_score NUMERIC,
  security_score NUMERIC,
  innovation_score NUMERIC,
  overall_score NUMERIC,
  analysis_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de buscas
CREATE TABLE public.search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  filters JSONB,
  results_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX idx_companies_domain ON public.companies(domain);
CREATE INDEX idx_decision_makers_company ON public.decision_makers(company_id);
CREATE INDEX idx_decision_makers_email ON public.decision_makers(email);
CREATE INDEX idx_buying_signals_company ON public.buying_signals(company_id);
CREATE INDEX idx_digital_maturity_company ON public.digital_maturity(company_id);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_makers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buying_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_maturity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS públicas (todos podem ler e inserir)
CREATE POLICY "Public read access on companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Public insert access on companies" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access on companies" ON public.companies FOR UPDATE USING (true);

CREATE POLICY "Public read access on decision_makers" ON public.decision_makers FOR SELECT USING (true);
CREATE POLICY "Public insert access on decision_makers" ON public.decision_makers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access on decision_makers" ON public.decision_makers FOR UPDATE USING (true);

CREATE POLICY "Public read access on buying_signals" ON public.buying_signals FOR SELECT USING (true);
CREATE POLICY "Public insert access on buying_signals" ON public.buying_signals FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access on digital_maturity" ON public.digital_maturity FOR SELECT USING (true);
CREATE POLICY "Public insert access on digital_maturity" ON public.digital_maturity FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access on digital_maturity" ON public.digital_maturity FOR UPDATE USING (true);

CREATE POLICY "Public read access on search_history" ON public.search_history FOR SELECT USING (true);
CREATE POLICY "Public insert access on search_history" ON public.search_history FOR INSERT WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_decision_makers_updated_at
BEFORE UPDATE ON public.decision_makers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_digital_maturity_updated_at
BEFORE UPDATE ON public.digital_maturity
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();