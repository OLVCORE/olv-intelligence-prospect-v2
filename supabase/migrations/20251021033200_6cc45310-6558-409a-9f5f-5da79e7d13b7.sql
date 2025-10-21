-- ✅ FASE 5.2: Otimização de Queries - Adicionar Indexes

-- Indexes para companies
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON public.companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON public.companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON public.companies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_digital_maturity_score ON public.companies(digital_maturity_score DESC);

-- Indexes para decision_makers
CREATE INDEX IF NOT EXISTS idx_decision_makers_company_id ON public.decision_makers(company_id);
CREATE INDEX IF NOT EXISTS idx_decision_makers_email ON public.decision_makers(email);
CREATE INDEX IF NOT EXISTS idx_decision_makers_verified_email ON public.decision_makers(verified_email);
CREATE INDEX IF NOT EXISTS idx_decision_makers_seniority ON public.decision_makers(seniority);

-- Indexes para canvas
CREATE INDEX IF NOT EXISTS idx_canvas_company_id ON public.canvas(company_id);
CREATE INDEX IF NOT EXISTS idx_canvas_created_by ON public.canvas(created_by);
CREATE INDEX IF NOT EXISTS idx_canvas_updated_at ON public.canvas(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_canvas_tags ON public.canvas USING GIN(tags);

-- Indexes para canvas_comments
CREATE INDEX IF NOT EXISTS idx_canvas_comments_canvas_id ON public.canvas_comments(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_comments_user_id ON public.canvas_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_comments_status ON public.canvas_comments(status);
CREATE INDEX IF NOT EXISTS idx_canvas_comments_type ON public.canvas_comments(type);

-- Indexes para buying_signals
CREATE INDEX IF NOT EXISTS idx_buying_signals_company_id ON public.buying_signals(company_id);
CREATE INDEX IF NOT EXISTS idx_buying_signals_signal_type ON public.buying_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_buying_signals_detected_at ON public.buying_signals(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_buying_signals_confidence_score ON public.buying_signals(confidence_score DESC);

-- Indexes para digital_maturity
CREATE INDEX IF NOT EXISTS idx_digital_maturity_company_id ON public.digital_maturity(company_id);
CREATE INDEX IF NOT EXISTS idx_digital_maturity_overall_score ON public.digital_maturity(overall_score DESC);

-- Indexes para search_history
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at DESC);

-- Indexes para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Index composto para queries comuns
CREATE INDEX IF NOT EXISTS idx_companies_industry_maturity ON public.companies(industry, digital_maturity_score DESC);
CREATE INDEX IF NOT EXISTS idx_decision_makers_company_verified ON public.decision_makers(company_id, verified_email);