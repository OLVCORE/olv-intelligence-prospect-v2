-- 1. LIMPAR DEALS ÓRFÃOS (sem company_id ou com company_id inválido)
DELETE FROM sdr_deals 
WHERE company_id IS NULL 
   OR company_id NOT IN (SELECT id FROM companies);

-- 2. ADICIONAR CASCADE DELETE na foreign key
-- Primeiro, dropar a constraint existente se houver
ALTER TABLE sdr_deals 
DROP CONSTRAINT IF EXISTS sdr_deals_company_id_fkey;

-- Recriar com CASCADE DELETE
ALTER TABLE sdr_deals 
ADD CONSTRAINT sdr_deals_company_id_fkey 
FOREIGN KEY (company_id) 
REFERENCES companies(id) 
ON DELETE CASCADE;

-- 3. CRIAR FUNÇÃO para limpar deals órfãos automaticamente
CREATE OR REPLACE FUNCTION cleanup_orphaned_deals()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Deletar deals sem company_id ou com company_id inválido
  DELETE FROM sdr_deals 
  WHERE company_id IS NULL 
     OR company_id NOT IN (SELECT id FROM companies);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_orphaned_deals() IS 
'Limpa deals órfãos (sem company_id ou com company_id inválido). Retorna quantidade deletada.';