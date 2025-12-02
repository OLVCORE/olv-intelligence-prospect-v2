-- ========================================
-- 🔄 RESET COMPLETO - COMEÇAR DO ZERO
-- ========================================
-- Execute no Supabase SQL Editor

-- ========================================
-- PASSO 1: CRIAR TABELA simple_totvs_checks
-- ========================================
CREATE TABLE IF NOT EXISTS public.simple_totvs_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  domain TEXT,
  status TEXT NOT NULL,
  confidence TEXT NOT NULL,
  confidence_percent INTEGER,
  triple_matches INTEGER DEFAULT 0,
  double_matches INTEGER DEFAULT 0,
  single_matches INTEGER DEFAULT 0,
  total_weight INTEGER DEFAULT 0,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  from_cache BOOLEAN DEFAULT FALSE,
  searched_sources INTEGER,
  total_queries INTEGER,
  execution_time TEXT
);

CREATE INDEX IF NOT EXISTS idx_simple_totvs_checks_company_id ON public.simple_totvs_checks(company_id);
CREATE INDEX IF NOT EXISTS idx_simple_totvs_checks_company_name ON public.simple_totvs_checks(company_name);
CREATE INDEX IF NOT EXISTS idx_simple_totvs_checks_cnpj ON public.simple_totvs_checks(cnpj);
CREATE INDEX IF NOT EXISTS idx_simple_totvs_checks_status ON public.simple_totvs_checks(status);
CREATE INDEX IF NOT EXISTS idx_simple_totvs_checks_created_at ON public.simple_totvs_checks(created_at DESC);

ALTER TABLE public.simple_totvs_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "simple_totvs_checks_select" ON public.simple_totvs_checks FOR SELECT USING (true);
CREATE POLICY "simple_totvs_checks_insert" ON public.simple_totvs_checks FOR INSERT WITH CHECK (true);
CREATE POLICY "simple_totvs_checks_update" ON public.simple_totvs_checks FOR UPDATE USING (true);
CREATE POLICY "simple_totvs_checks_delete" ON public.simple_totvs_checks FOR DELETE USING (true);

-- ========================================
-- PASSO 2: LIMPAR DADOS DE VERIFICAÇÕES
-- ========================================

-- Opção A: DELETAR APENAS VERIFICAÇÕES (RECOMENDADO)
-- Mantém empresas cadastradas, deleta apenas resultados

-- 1. Limpar cache de verificações TOTVS
DELETE FROM simple_totvs_checks;

-- 2. Limpar status TOTVS das empresas
UPDATE companies 
SET totvs_status = NULL, 
    totvs_confidence = NULL,
    totvs_checked_at = NULL,
    totvs_triple_matches = NULL,
    totvs_double_matches = NULL
WHERE totvs_status IS NOT NULL;

-- 3. Limpar resultados ICP
DELETE FROM icp_analysis_results;

-- 4. Limpar histórico de verificações STC
DELETE FROM stc_verification_history;

-- 5. Limpar empresas similares
DELETE FROM similar_companies;

-- ✅ RESULTADO: 
-- - Empresas MANTIDAS (dados cadastrais preservados)
-- - Verificações DELETADAS (precisa reprocessar)

-- ========================================
-- OU OPÇÃO B: DELETAR TUDO (MAIS DRÁSTICO)
-- ========================================
-- Descomente as linhas abaixo se quiser deletar TUDO

-- DELETE FROM companies; -- ⚠️ DELETA TUDO (CASCADE)

-- ========================================
-- PASSO 3: VERIFICAR LIMPEZA
-- ========================================

-- Ver quantas empresas sobraram
SELECT COUNT(*) as total_empresas FROM companies;

-- Ver status das empresas (deveria ser tudo NULL)
SELECT 
  COUNT(*) as total,
  COUNT(totvs_status) as com_status_totvs
FROM companies;

-- Ver se cache está vazio
SELECT COUNT(*) as cache_entries FROM simple_totvs_checks;

-- ✅ Esperado:
-- - total_empresas: número de empresas que você tinha (se Opção A)
-- - com_status_totvs: 0
-- - cache_entries: 0

