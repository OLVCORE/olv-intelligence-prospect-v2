-- ✅ Tabela de presença digital (redes sociais, web)
CREATE TABLE IF NOT EXISTS public.digital_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  linkedin_data JSONB,
  instagram_data JSONB,
  facebook_data JSONB,
  twitter_data JSONB,
  youtube_data JSONB,
  website_metrics JSONB,
  overall_score NUMERIC,
  social_score NUMERIC,
  web_score NUMERIC,
  engagement_score NUMERIC,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ✅ Tabela de dados jurídicos
CREATE TABLE IF NOT EXISTS public.legal_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  jusbrasil_data JSONB,
  ceis_data JSONB,
  cnep_data JSONB,
  total_processes INTEGER DEFAULT 0,
  active_processes INTEGER DEFAULT 0,
  risk_level TEXT,
  legal_health_score NUMERIC,
  last_checked TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ✅ Tabela de dados financeiros
CREATE TABLE IF NOT EXISTS public.financial_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  credit_score NUMERIC,
  serasa_data JSONB,
  scpc_data JSONB,
  financial_indicators JSONB,
  risk_classification TEXT,
  payment_history JSONB,
  debt_indicators JSONB,
  predictive_risk_score NUMERIC,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ✅ Tabela de reputação e avaliações
CREATE TABLE IF NOT EXISTS public.reputation_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  reclame_aqui_data JSONB,
  google_reviews_data JSONB,
  trustpilot_data JSONB,
  overall_rating NUMERIC,
  total_reviews INTEGER DEFAULT 0,
  sentiment_score NUMERIC,
  reputation_score NUMERIC,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ✅ Tabela de menções na mídia
CREATE TABLE IF NOT EXISTS public.news_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  title TEXT NOT NULL,
  source TEXT,
  url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  sentiment TEXT,
  sentiment_score NUMERIC,
  content_summary TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ✅ Tabela de riscos identificados
CREATE TABLE IF NOT EXISTS public.risks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  risk_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT,
  source TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'active',
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ✅ Tabela de insights gerados pela IA
CREATE TABLE IF NOT EXISTS public.insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT,
  confidence_score NUMERIC,
  generated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ✅ Tabela de pitches gerados
CREATE TABLE IF NOT EXISTS public.pitches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  pitch_type TEXT NOT NULL,
  content TEXT NOT NULL,
  target_persona TEXT,
  confidence_score NUMERIC,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ✅ Enable RLS em todas as tabelas
ALTER TABLE public.digital_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitches ENABLE ROW LEVEL SECURITY;

-- ✅ Políticas RLS para digital_presence
CREATE POLICY "Authenticated users can read digital_presence"
  ON public.digital_presence FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage digital_presence"
  ON public.digital_presence FOR ALL
  USING (true)
  WITH CHECK (true);

-- ✅ Políticas RLS para legal_data
CREATE POLICY "Authenticated users can read legal_data"
  ON public.legal_data FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage legal_data"
  ON public.legal_data FOR ALL
  USING (true)
  WITH CHECK (true);

-- ✅ Políticas RLS para financial_data
CREATE POLICY "Authenticated users can read financial_data"
  ON public.financial_data FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage financial_data"
  ON public.financial_data FOR ALL
  USING (true)
  WITH CHECK (true);

-- ✅ Políticas RLS para reputation_data
CREATE POLICY "Authenticated users can read reputation_data"
  ON public.reputation_data FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage reputation_data"
  ON public.reputation_data FOR ALL
  USING (true)
  WITH CHECK (true);

-- ✅ Políticas RLS para news_mentions
CREATE POLICY "Authenticated users can read news_mentions"
  ON public.news_mentions FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage news_mentions"
  ON public.news_mentions FOR ALL
  USING (true)
  WITH CHECK (true);

-- ✅ Políticas RLS para risks
CREATE POLICY "Authenticated users can read risks"
  ON public.risks FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage risks"
  ON public.risks FOR ALL
  USING (true)
  WITH CHECK (true);

-- ✅ Políticas RLS para insights
CREATE POLICY "Authenticated users can read insights"
  ON public.insights FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage insights"
  ON public.insights FOR ALL
  USING (true)
  WITH CHECK (true);

-- ✅ Políticas RLS para pitches
CREATE POLICY "Authenticated users can read pitches"
  ON public.pitches FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage pitches"
  ON public.pitches FOR ALL
  USING (true)
  WITH CHECK (true);

-- ✅ Índices para performance
CREATE INDEX IF NOT EXISTS idx_digital_presence_company ON public.digital_presence(company_id);
CREATE INDEX IF NOT EXISTS idx_legal_data_company ON public.legal_data(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_data_company ON public.financial_data(company_id);
CREATE INDEX IF NOT EXISTS idx_reputation_data_company ON public.reputation_data(company_id);
CREATE INDEX IF NOT EXISTS idx_news_mentions_company ON public.news_mentions(company_id);
CREATE INDEX IF NOT EXISTS idx_risks_company ON public.risks(company_id);
CREATE INDEX IF NOT EXISTS idx_insights_company ON public.insights(company_id);
CREATE INDEX IF NOT EXISTS idx_pitches_company ON public.pitches(company_id);