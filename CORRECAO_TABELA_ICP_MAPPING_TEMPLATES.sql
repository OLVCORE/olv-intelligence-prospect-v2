-- ============================================================================
-- CORREÇÃO: Tabela icp_mapping_templates faltando
-- ============================================================================
-- Data: 04/11/2025
-- Objetivo: Criar tabela para templates de mapeamento CSV do ICP
-- Erro: 404 - icp_mapping_templates não existe
-- ============================================================================

-- 1. Criar tabela
CREATE TABLE IF NOT EXISTS public.icp_mapping_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_template TEXT NOT NULL,
    descricao TEXT,
    mappings JSONB NOT NULL DEFAULT '[]'::jsonb,
    custom_fields TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    total_colunas INTEGER NOT NULL DEFAULT 0,
    ultima_utilizacao TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_icp_mapping_templates_user_id 
    ON public.icp_mapping_templates(user_id);

CREATE INDEX IF NOT EXISTS idx_icp_mapping_templates_ultima_utilizacao 
    ON public.icp_mapping_templates(ultima_utilizacao DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_icp_mapping_templates_criado_em 
    ON public.icp_mapping_templates(criado_em DESC);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.icp_mapping_templates ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS: Usuário só vê seus próprios templates
DROP POLICY IF EXISTS "Users can view their own templates" ON public.icp_mapping_templates;
CREATE POLICY "Users can view their own templates"
    ON public.icp_mapping_templates
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own templates" ON public.icp_mapping_templates;
CREATE POLICY "Users can insert their own templates"
    ON public.icp_mapping_templates
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own templates" ON public.icp_mapping_templates;
CREATE POLICY "Users can update their own templates"
    ON public.icp_mapping_templates
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own templates" ON public.icp_mapping_templates;
CREATE POLICY "Users can delete their own templates"
    ON public.icp_mapping_templates
    FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Trigger para atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION public.update_icp_mapping_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_icp_mapping_templates_updated_at ON public.icp_mapping_templates;
CREATE TRIGGER trigger_icp_mapping_templates_updated_at
    BEFORE UPDATE ON public.icp_mapping_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_icp_mapping_templates_updated_at();

-- 6. Comentários para documentação
COMMENT ON TABLE public.icp_mapping_templates IS 
    'Templates de mapeamento CSV para análise ICP. Permite salvar configurações de mapeamento de colunas.';

COMMENT ON COLUMN public.icp_mapping_templates.mappings IS 
    'Array JSON com mapeamento de colunas: [{ csvColumn, targetField, transform }]';

COMMENT ON COLUMN public.icp_mapping_templates.custom_fields IS 
    'Array de campos customizados adicionados pelo usuário';

COMMENT ON COLUMN public.icp_mapping_templates.ultima_utilizacao IS 
    'Timestamp da última vez que o template foi usado (para ordenar por mais usado)';

-- ============================================================================
-- INSTRUÇÕES DE USO:
-- ============================================================================
-- 1. Abra o Supabase Dashboard: https://supabase.com/dashboard
-- 2. Vá em SQL Editor
-- 3. Cole este script completo
-- 4. Clique em "Run"
-- 5. Recarregue a aplicação (F5)
-- ============================================================================

-- ============================================================================
-- TESTE OPCIONAL (descomentar para testar):
-- ============================================================================
-- SELECT * FROM public.icp_mapping_templates;
-- ============================================================================

