-- =====================================================
-- MIGRAÇÃO ESTRATÉGICA: GOVERNANÇA E TRANSFORMAÇÃO
-- De "buying_signals/fit" para "governance_signals/gaps"
-- =====================================================

-- 1. Renomear tabela (mantém dados existentes)
ALTER TABLE buying_signals RENAME TO governance_signals;

-- 2. Adicionar novos campos estratégicos
ALTER TABLE governance_signals 
ADD COLUMN IF NOT EXISTS governance_gap_score INTEGER CHECK (governance_gap_score >= 0 AND governance_gap_score <= 100),
ADD COLUMN IF NOT EXISTS transformation_priority TEXT CHECK (transformation_priority IN ('CRITICO', 'ALTO', 'MEDIO', 'BAIXO')),
ADD COLUMN IF NOT EXISTS organizational_maturity_level TEXT CHECK (organizational_maturity_level IN ('INICIAL', 'ESTRUTURANDO', 'GERENCIADO', 'OTIMIZADO', 'INOVADOR')),
ADD COLUMN IF NOT EXISTS requires_consulting BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gap_category TEXT CHECK (gap_category IN ('PROCESSOS', 'TECNOLOGIA', 'PESSOAS', 'GOVERNANCA', 'COMPLIANCE', 'SEGURANCA'));

-- 3. Atualizar signal_types existentes para nova nomenclatura
-- Manter compatibilidade backwards temporária
UPDATE governance_signals 
SET signal_type = 'governance_gap_analysis'
WHERE signal_type = 'totvs_fit_analysis';

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_governance_gap_score ON governance_signals(governance_gap_score DESC);
CREATE INDEX IF NOT EXISTS idx_transformation_priority ON governance_signals(transformation_priority);
CREATE INDEX IF NOT EXISTS idx_requires_consulting ON governance_signals(requires_consulting) WHERE requires_consulting = true;

-- 5. Comentários explicativos
COMMENT ON TABLE governance_signals IS 'Sinais de gaps de governança e oportunidades de transformação organizacional para PMEs';
COMMENT ON COLUMN governance_signals.governance_gap_score IS 'Score de 0-100 indicando gravidade dos gaps (quanto maior, mais gaps críticos)';
COMMENT ON COLUMN governance_signals.transformation_priority IS 'Prioridade de intervenção para transformação organizacional';
COMMENT ON COLUMN governance_signals.requires_consulting IS 'Indica se a empresa precisa de consultoria estratégica imediata';