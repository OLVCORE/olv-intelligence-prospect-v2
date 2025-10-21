-- Expandir canvas para ser o núcleo de inteligência
-- Adicionar tabela de comentários, tarefas e insights

-- Tabela de comentários e interações no canvas
CREATE TABLE IF NOT EXISTS public.canvas_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id uuid REFERENCES public.canvas(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  type text NOT NULL CHECK (type IN ('comment', 'insight', 'risk', 'hypothesis', 'task')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  assigned_to uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_canvas_comments_canvas_id ON public.canvas_comments(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_comments_type ON public.canvas_comments(type);
CREATE INDEX IF NOT EXISTS idx_canvas_comments_status ON public.canvas_comments(status);

-- Trigger para updated_at
CREATE TRIGGER update_canvas_comments_updated_at
  BEFORE UPDATE ON public.canvas_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para canvas_comments
ALTER TABLE public.canvas_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read canvas_comments"
  ON public.canvas_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create canvas_comments"
  ON public.canvas_comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update canvas_comments"
  ON public.canvas_comments FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete canvas_comments"
  ON public.canvas_comments FOR DELETE
  TO authenticated
  USING (true);

-- Tabela de versões do canvas (para versionamento)
CREATE TABLE IF NOT EXISTS public.canvas_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id uuid REFERENCES public.canvas(id) ON DELETE CASCADE NOT NULL,
  content jsonb NOT NULL,
  version_number integer NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  change_summary text
);

CREATE INDEX IF NOT EXISTS idx_canvas_versions_canvas_id ON public.canvas_versions(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_versions_created_at ON public.canvas_versions(created_at DESC);

ALTER TABLE public.canvas_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read canvas_versions"
  ON public.canvas_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage canvas_versions"
  ON public.canvas_versions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Habilitar Realtime para comentários
ALTER PUBLICATION supabase_realtime ADD TABLE public.canvas_comments;