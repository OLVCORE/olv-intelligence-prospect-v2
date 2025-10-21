-- Tabela para armazenar Canvas Colaborativos
CREATE TABLE public.canvas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Novo Canvas',
  content jsonb NOT NULL DEFAULT '{"blocks": []}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_edited_by uuid,
  is_template boolean DEFAULT false,
  tags text[] DEFAULT ARRAY[]::text[]
);

-- Índices para performance
CREATE INDEX idx_canvas_company_id ON public.canvas(company_id);
CREATE INDEX idx_canvas_created_at ON public.canvas(created_at DESC);
CREATE INDEX idx_canvas_tags ON public.canvas USING GIN(tags);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_canvas_updated_at
  BEFORE UPDATE ON public.canvas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.canvas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can read canvas"
  ON public.canvas FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create canvas"
  ON public.canvas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update canvas"
  ON public.canvas FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete canvas"
  ON public.canvas FOR DELETE
  USING (true);

-- Habilitar Realtime para colaboração em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.canvas;