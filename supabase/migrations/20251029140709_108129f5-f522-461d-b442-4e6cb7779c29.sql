-- Adicionar colunas para monitoramento específico e nicho customizado (se não existirem)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intelligence_monitoring_config' AND column_name = 'custom_niche') THEN
    ALTER TABLE intelligence_monitoring_config ADD COLUMN custom_niche TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intelligence_monitoring_config' AND column_name = 'target_cities') THEN
    ALTER TABLE intelligence_monitoring_config ADD COLUMN target_cities TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intelligence_monitoring_config' AND column_name = 'target_niches') THEN
    ALTER TABLE intelligence_monitoring_config ADD COLUMN target_niches TEXT[];
  END IF;
END $$;

-- Criar índice para busca de nicho customizado
CREATE INDEX IF NOT EXISTS idx_monitoring_config_custom_niche 
ON intelligence_monitoring_config(custom_niche) WHERE custom_niche IS NOT NULL;