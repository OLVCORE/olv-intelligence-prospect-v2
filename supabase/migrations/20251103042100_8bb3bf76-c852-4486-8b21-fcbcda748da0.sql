-- Adicionar campo para salvar relatório completo
ALTER TABLE stc_verification_history 
ADD COLUMN IF NOT EXISTS full_report JSONB DEFAULT '{}'::jsonb;

-- Adicionar índice para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_stc_history_company_created 
ON stc_verification_history(company_id, created_at DESC);

COMMENT ON COLUMN stc_verification_history.full_report IS 'Relatório TOTVS completo com todas evidências para reabertura sem nova consulta';