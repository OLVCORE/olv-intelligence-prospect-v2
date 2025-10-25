-- Adicionar coluna de status do CNPJ
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS cnpj_status TEXT 
CHECK (cnpj_status IN ('ativo', 'inativo', 'inexistente', 'pendente'))
DEFAULT 'pendente';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_companies_cnpj_status ON companies(cnpj_status);

-- Comentário explicativo
COMMENT ON COLUMN companies.cnpj_status IS 'Status de validação do CNPJ: ativo (empresa ativa na RF), inativo (empresa suspensa/baixada), inexistente (CNPJ não encontrado na RF), pendente (ainda não validado)';

-- Atualizar empresas existentes para 'pendente' (serão validadas no próximo enriquecimento)
UPDATE companies 
SET cnpj_status = 'pendente' 
WHERE cnpj_status IS NULL;