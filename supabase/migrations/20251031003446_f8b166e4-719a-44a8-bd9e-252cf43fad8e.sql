-- Tabela para salvar templates de mapeamento de colunas CSV
CREATE TABLE IF NOT EXISTS public.icp_mapping_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_template TEXT NOT NULL,
  descricao TEXT,
  mappings JSONB NOT NULL, -- Array de { csvColumn, systemField, status, confidence }
  custom_fields TEXT[] DEFAULT '{}', -- Array de campos customizados
  total_colunas INTEGER NOT NULL DEFAULT 0,
  ultima_utilizacao TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.icp_mapping_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver seus próprios templates"
ON public.icp_mapping_templates
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios templates"
ON public.icp_mapping_templates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios templates"
ON public.icp_mapping_templates
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios templates"
ON public.icp_mapping_templates
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_icp_mapping_templates_updated_at
BEFORE UPDATE ON public.icp_mapping_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_icp_mapping_templates_user_id ON public.icp_mapping_templates(user_id);
CREATE INDEX idx_icp_mapping_templates_ultima_utilizacao ON public.icp_mapping_templates(ultima_utilizacao DESC);