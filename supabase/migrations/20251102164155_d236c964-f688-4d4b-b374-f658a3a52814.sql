-- Adicionar colunas para cache de relatórios de análise
-- Isso evitará consumo excessivo de créditos ao reabrir análises

-- Coluna para indicar se relatório foi salvo
ALTER TABLE public.icp_analysis_results 
ADD COLUMN IF NOT EXISTS relatorio_salvo BOOLEAN DEFAULT false;

-- Coluna para data do último relatório
ALTER TABLE public.icp_analysis_results 
ADD COLUMN IF NOT EXISTS relatorio_gerado_em TIMESTAMPTZ;

-- Coluna para armazenar resultado da análise TOTVS
ALTER TABLE public.icp_analysis_results 
ADD COLUMN IF NOT EXISTS stc_result JSONB;

-- Índice para otimizar queries de relatórios salvos
CREATE INDEX IF NOT EXISTS idx_icp_relatorio_salvo 
ON public.icp_analysis_results(relatorio_salvo) 
WHERE relatorio_salvo = true;