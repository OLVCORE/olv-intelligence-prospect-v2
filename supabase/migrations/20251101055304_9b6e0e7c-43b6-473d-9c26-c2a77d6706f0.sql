-- ========================================
-- FASE 1: Limpeza de Cache Corrupto
-- Adiciona logic_version para invalidar verificações antigas
-- ========================================

-- Adicionar coluna logic_version em simple_totvs_checks
ALTER TABLE simple_totvs_checks 
ADD COLUMN IF NOT EXISTS logic_version INTEGER DEFAULT 1;

-- Adicionar coluna logic_version em icp_analysis_results
ALTER TABLE icp_analysis_results 
ADD COLUMN IF NOT EXISTS logic_version INTEGER DEFAULT 1;

-- Marcar todas as verificações existentes como versão 1 (antiga/inválida)
UPDATE simple_totvs_checks 
SET logic_version = 1 
WHERE logic_version IS NULL;

UPDATE icp_analysis_results 
SET logic_version = 1 
WHERE logic_version IS NULL AND totvs_check_status IS NOT NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_simple_totvs_checks_logic_version 
ON simple_totvs_checks(logic_version);

CREATE INDEX IF NOT EXISTS idx_icp_analysis_logic_version 
ON icp_analysis_results(logic_version);

-- Comentários para documentação
COMMENT ON COLUMN simple_totvs_checks.logic_version IS 'Versão da lógica de decisão: 1=antiga (inválida), 2=nova (unificada V2)';
COMMENT ON COLUMN icp_analysis_results.logic_version IS 'Versão da lógica de decisão: 1=antiga (inválida), 2=nova (unificada V2)';