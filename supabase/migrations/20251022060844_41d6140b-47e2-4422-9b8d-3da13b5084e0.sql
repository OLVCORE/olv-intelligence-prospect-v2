-- ============================================
-- CANVAS MODULE - ESTRUTURA COMPLETA (SEM DUPLICATAS)
-- ============================================

-- 1. Expandir canvas com novos campos
ALTER TABLE public.canvas ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE public.canvas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.canvas ADD COLUMN IF NOT EXISTS owners UUID[] DEFAULT ARRAY[]::UUID[];
ALTER TABLE public.canvas ADD COLUMN IF NOT EXISTS template TEXT;

-- Adicionar constraint se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'canvas_status_check') THEN
    ALTER TABLE public.canvas ADD CONSTRAINT canvas_status_check CHECK (status IN ('active', 'archived', 'template'));
  END IF;
END $$;

-- 2. Criar tabela de blocos individuais
CREATE TABLE IF NOT EXISTS public.canvas_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID NOT NULL REFERENCES public.canvas(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('note', 'insight', 'decision', 'task', 'reference', 'attachment', 'timeline')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_canvas_blocks_canvas_id ON public.canvas_blocks(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_blocks_order ON public.canvas_blocks(canvas_id, order_index);

-- 3. Criar tabela de links com outros módulos
CREATE TABLE IF NOT EXISTS public.canvas_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID NOT NULL REFERENCES public.canvas(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('playbook', 'sequence_run', 'task', 'report', 'insight', 'company')),
  target_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_canvas_links_canvas_id ON public.canvas_links(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_links_target ON public.canvas_links(target_type, target_id);

-- 4. Criar tabela de permissões
CREATE TABLE IF NOT EXISTS public.canvas_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID NOT NULL REFERENCES public.canvas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(canvas_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_canvas_permissions_canvas_user ON public.canvas_permissions(canvas_id, user_id);

-- 5. Criar tabela de atividades (timeline/audit)
CREATE TABLE IF NOT EXISTS public.canvas_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID NOT NULL REFERENCES public.canvas(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.canvas_blocks(id) ON DELETE SET NULL,
  user_id UUID,
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'updated', 'deleted', 'commented', 'version_created', 'linked', 'promoted')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_canvas_activity_canvas_id ON public.canvas_activity(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_activity_created_at ON public.canvas_activity(canvas_id, created_at DESC);

-- 6. RLS para canvas_blocks
ALTER TABLE public.canvas_blocks ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_blocks' AND policyname = 'Authenticated users can read canvas_blocks') THEN
    CREATE POLICY "Authenticated users can read canvas_blocks" ON public.canvas_blocks FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_blocks' AND policyname = 'Authenticated users can create canvas_blocks') THEN
    CREATE POLICY "Authenticated users can create canvas_blocks" ON public.canvas_blocks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_blocks' AND policyname = 'Authenticated users can update canvas_blocks') THEN
    CREATE POLICY "Authenticated users can update canvas_blocks" ON public.canvas_blocks FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_blocks' AND policyname = 'Authenticated users can delete canvas_blocks') THEN
    CREATE POLICY "Authenticated users can delete canvas_blocks" ON public.canvas_blocks FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 7. RLS para canvas_links
ALTER TABLE public.canvas_links ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_links' AND policyname = 'Authenticated users can manage canvas_links') THEN
    CREATE POLICY "Authenticated users can manage canvas_links" ON public.canvas_links FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 8. RLS para canvas_permissions
ALTER TABLE public.canvas_permissions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_permissions' AND policyname = 'Authenticated users can read canvas_permissions') THEN
    CREATE POLICY "Authenticated users can read canvas_permissions" ON public.canvas_permissions FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_permissions' AND policyname = 'Authenticated users can manage their permissions') THEN
    CREATE POLICY "Authenticated users can manage their permissions" ON public.canvas_permissions FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 9. RLS para canvas_activity
ALTER TABLE public.canvas_activity ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_activity' AND policyname = 'Authenticated users can read canvas_activity') THEN
    CREATE POLICY "Authenticated users can read canvas_activity" ON public.canvas_activity FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_activity' AND policyname = 'Service role can manage canvas_activity') THEN
    CREATE POLICY "Service role can manage canvas_activity" ON public.canvas_activity FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 10. Trigger para updated_at em canvas_blocks
CREATE OR REPLACE FUNCTION update_canvas_block_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_canvas_blocks_updated_at ON public.canvas_blocks;
CREATE TRIGGER trigger_canvas_blocks_updated_at
  BEFORE UPDATE ON public.canvas_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_canvas_block_updated_at();

-- 11. Função para criar snapshot de versão
CREATE OR REPLACE FUNCTION create_canvas_version(
  p_canvas_id UUID,
  p_tag TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_version_id UUID;
  v_version_number INTEGER;
  v_snapshot JSONB;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_version_number
  FROM canvas_versions
  WHERE canvas_id = p_canvas_id;
  
  SELECT jsonb_build_object(
    'canvas', row_to_json(c.*),
    'blocks', COALESCE((SELECT jsonb_agg(row_to_json(b.*) ORDER BY b.order_index) FROM canvas_blocks b WHERE b.canvas_id = p_canvas_id), '[]'::jsonb),
    'comments', COALESCE((SELECT jsonb_agg(row_to_json(cm.*) ORDER BY cm.created_at DESC) FROM canvas_comments cm WHERE cm.canvas_id = p_canvas_id), '[]'::jsonb)
  )
  INTO v_snapshot
  FROM canvas c
  WHERE c.id = p_canvas_id;
  
  INSERT INTO canvas_versions (canvas_id, version_number, snapshot, tag, description, created_by)
  VALUES (p_canvas_id, v_version_number, v_snapshot, p_tag, p_description, auth.uid())
  RETURNING id INTO v_version_id;
  
  INSERT INTO canvas_activity (canvas_id, user_id, action_type, description, metadata)
  VALUES (p_canvas_id, auth.uid(), 'version_created', 'Versão ' || v_version_number || ' criada' || COALESCE(': ' || p_tag, ''), jsonb_build_object('version_id', v_version_id, 'version_number', v_version_number, 'tag', p_tag));
  
  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Função para promover decisão para tarefa SDR
CREATE OR REPLACE FUNCTION promote_canvas_decision(
  p_block_id UUID,
  p_target_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_block RECORD;
  v_task_id UUID;
  v_canvas_id UUID;
BEGIN
  SELECT cb.*, c.company_id, c.id as canvas_id
  INTO v_block
  FROM canvas_blocks cb
  JOIN canvas c ON c.id = cb.canvas_id
  WHERE cb.id = p_block_id AND cb.type = 'decision';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bloco de decisão não encontrado';
  END IF;
  
  v_canvas_id := v_block.canvas_id;
  
  IF p_target_type = 'sdr_task' THEN
    INSERT INTO sdr_tasks (title, description, company_id, status, due_date, assigned_to)
    VALUES (v_block.content->>'title', v_block.content->>'why', v_block.company_id, 'todo', COALESCE((v_block.content->>'due_at')::date, (now() + interval '7 days')::date), (v_block.content->>'owner')::uuid)
    RETURNING id INTO v_task_id;
    
    INSERT INTO canvas_links (canvas_id, target_type, target_id, metadata, created_by)
    VALUES (v_canvas_id, 'task', v_task_id, jsonb_build_object('promoted_from_block', p_block_id), auth.uid());
    
    INSERT INTO canvas_activity (canvas_id, block_id, user_id, action_type, description, metadata)
    VALUES (v_canvas_id, p_block_id, auth.uid(), 'promoted', 'Decisão promovida para tarefa SDR', jsonb_build_object('task_id', v_task_id, 'target_type', 'sdr_task'));
    
    RETURN v_task_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Habilitar realtime
DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.canvas_blocks;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.canvas_activity;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.canvas_links;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;