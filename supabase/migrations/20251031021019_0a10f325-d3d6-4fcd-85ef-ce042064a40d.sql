-- Adicionar constraint UNIQUE ao CNPJ para prevenir duplicatas
-- Primeiro, remover duplicatas existentes (manter o mais recente)
DELETE FROM leads_qualified a
USING leads_qualified b
WHERE a.id < b.id 
  AND a.cnpj = b.cnpj;

-- Adicionar constraint UNIQUE no CNPJ
ALTER TABLE leads_qualified 
ADD CONSTRAINT leads_qualified_cnpj_unique UNIQUE (cnpj);

-- Criar índice para melhorar performance de queries por CNPJ
CREATE INDEX IF NOT EXISTS idx_leads_qualified_cnpj ON leads_qualified(cnpj);

-- Adicionar coluna para armazenar evidências da análise (se não existir)
ALTER TABLE leads_qualified 
ADD COLUMN IF NOT EXISTS evidencias JSONB DEFAULT '[]'::jsonb;

-- Criar índice GIN para busca eficiente em evidências
CREATE INDEX IF NOT EXISTS idx_leads_qualified_evidencias ON leads_qualified USING GIN (evidencias);