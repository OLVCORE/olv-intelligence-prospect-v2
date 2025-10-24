-- Corrigir warnings de segurança: adicionar search_path nas funções

-- 1. Corrigir update_sdr_updated_at
DROP FUNCTION IF EXISTS public.update_sdr_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_sdr_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER 
   SET search_path = public, pg_temp;

-- 2. Corrigir update_canvas_block_updated_at
DROP FUNCTION IF EXISTS public.update_canvas_block_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_canvas_block_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
   SET search_path = public, pg_temp;

-- 3. Corrigir create_canvas_version
DROP FUNCTION IF EXISTS public.create_canvas_version(uuid, text, text) CASCADE;
CREATE OR REPLACE FUNCTION public.create_canvas_version(
  p_canvas_id uuid, 
  p_tag text DEFAULT NULL, 
  p_description text DEFAULT NULL
)
RETURNS uuid AS $$
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
$$ LANGUAGE plpgsql 
   SECURITY DEFINER 
   SET search_path = public, pg_temp;

-- 4. Corrigir promote_canvas_decision
DROP FUNCTION IF EXISTS public.promote_canvas_decision(uuid, text) CASCADE;
CREATE OR REPLACE FUNCTION public.promote_canvas_decision(
  p_block_id uuid, 
  p_target_type text
)
RETURNS uuid AS $$
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
$$ LANGUAGE plpgsql 
   SECURITY DEFINER 
   SET search_path = public, pg_temp;

-- 5. Corrigir update_ai_interactions_updated_at
DROP FUNCTION IF EXISTS public.update_ai_interactions_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_ai_interactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
   SET search_path = public, pg_temp;

-- 6. Corrigir get_next_report_version (da migração anterior)
DROP FUNCTION IF EXISTS public.get_next_report_version(uuid, text) CASCADE;
CREATE OR REPLACE FUNCTION public.get_next_report_version(
  p_company_id UUID, 
  p_report_type TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_version
  FROM public.executive_reports_versions
  WHERE company_id = p_company_id AND report_type = p_report_type;
  
  RETURN v_next_version;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER 
   SET search_path = public, pg_temp;