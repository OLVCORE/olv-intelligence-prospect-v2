-- FASE 1: Corrigir estrutura da tabela simple_totvs_checks
-- Adicionar campos faltantes que a edge function precisa salvar
ALTER TABLE public.simple_totvs_checks
  ADD COLUMN IF NOT EXISTS triple_matches INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS double_matches INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_weight INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS cnpj TEXT,
  ADD COLUMN IF NOT EXISTS domain TEXT;

-- Criar índices para performance nas buscas
CREATE INDEX IF NOT EXISTS idx_simple_totvs_triple 
  ON simple_totvs_checks(triple_matches DESC);
CREATE INDEX IF NOT EXISTS idx_simple_totvs_double 
  ON simple_totvs_checks(double_matches DESC);
CREATE INDEX IF NOT EXISTS idx_simple_totvs_company 
  ON simple_totvs_checks(company_name);

-- Limpar cache antigo (mais de 7 dias) para forçar novas verificações
DELETE FROM simple_totvs_checks 
WHERE checked_at < NOW() - INTERVAL '7 days';