-- Create ICP evidence, scraping log, and criteria scores tables with RLS and indexes
-- 1) icp_evidence
CREATE TABLE IF NOT EXISTS public.icp_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.icp_analysis_results(id) ON DELETE CASCADE,
  cnpj TEXT NOT NULL,
  criterio TEXT NOT NULL,
  categoria TEXT CHECK (categoria IN ('tecnologia','tamanho','financeiro','digital','reputacao','sinais_compra')),
  evidencia TEXT NOT NULL,
  fonte_url TEXT NOT NULL,
  fonte_nome TEXT NOT NULL,
  dados_extraidos JSONB,
  pontos_atribuidos INTEGER,
  peso_criterio DECIMAL(4,2),
  confiabilidade TEXT CHECK (confiabilidade IN ('alta','media','baixa')) DEFAULT 'media',
  scraped_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.icp_evidence ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='icp_evidence' AND policyname='auth_can_read_icp_evidence'
  ) THEN
    CREATE POLICY auth_can_read_icp_evidence ON public.icp_evidence
      FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='icp_evidence' AND policyname='auth_can_insert_icp_evidence'
  ) THEN
    CREATE POLICY auth_can_insert_icp_evidence ON public.icp_evidence
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_icp_evidence_analysis ON public.icp_evidence(analysis_id);
CREATE INDEX IF NOT EXISTS idx_icp_evidence_cnpj ON public.icp_evidence(cnpj);
CREATE INDEX IF NOT EXISTS idx_icp_evidence_criterio ON public.icp_evidence(criterio);
CREATE INDEX IF NOT EXISTS idx_icp_evidence_categoria ON public.icp_evidence(categoria);


-- 2) icp_scraping_log
CREATE TABLE IF NOT EXISTS public.icp_scraping_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.icp_analysis_results(id) ON DELETE CASCADE,
  cnpj TEXT NOT NULL,
  plataforma TEXT NOT NULL,
  url_buscada TEXT NOT NULL,
  status TEXT CHECK (status IN ('sucesso','erro','timeout','bloqueado')) NOT NULL,
  dados_encontrados BOOLEAN DEFAULT false,
  tempo_resposta_ms INTEGER,
  erro_mensagem TEXT,
  html_content TEXT,
  json_response JSONB,
  scraped_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.icp_scraping_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='icp_scraping_log' AND policyname='auth_can_read_icp_scraping_log'
  ) THEN
    CREATE POLICY auth_can_read_icp_scraping_log ON public.icp_scraping_log
      FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='icp_scraping_log' AND policyname='auth_can_insert_icp_scraping_log'
  ) THEN
    CREATE POLICY auth_can_insert_icp_scraping_log ON public.icp_scraping_log
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_scraping_log_analysis ON public.icp_scraping_log(analysis_id);
CREATE INDEX IF NOT EXISTS idx_scraping_log_cnpj ON public.icp_scraping_log(cnpj);
CREATE INDEX IF NOT EXISTS idx_scraping_log_plataforma ON public.icp_scraping_log(plataforma);
CREATE INDEX IF NOT EXISTS idx_scraping_log_status ON public.icp_scraping_log(status);


-- 3) icp_criteria_scores
CREATE TABLE IF NOT EXISTS public.icp_criteria_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.icp_analysis_results(id) ON DELETE CASCADE,
  cnpj TEXT NOT NULL,
  criterio_nome TEXT NOT NULL,
  criterio_descricao TEXT,
  categoria TEXT,
  pontos_obtidos INTEGER NOT NULL,
  pontos_maximos INTEGER NOT NULL,
  peso DECIMAL(4,2) NOT NULL,
  atendido BOOLEAN NOT NULL,
  numero_evidencias INTEGER DEFAULT 0,
  evidencias_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.icp_criteria_scores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='icp_criteria_scores' AND policyname='auth_can_read_icp_criteria_scores'
  ) THEN
    CREATE POLICY auth_can_read_icp_criteria_scores ON public.icp_criteria_scores
      FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='icp_criteria_scores' AND policyname='auth_can_insert_icp_criteria_scores'
  ) THEN
    CREATE POLICY auth_can_insert_icp_criteria_scores ON public.icp_criteria_scores
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_criteria_scores_analysis ON public.icp_criteria_scores(analysis_id);
CREATE INDEX IF NOT EXISTS idx_criteria_scores_cnpj ON public.icp_criteria_scores(cnpj);
CREATE INDEX IF NOT EXISTS idx_criteria_scores_atendido ON public.icp_criteria_scores(atendido);
