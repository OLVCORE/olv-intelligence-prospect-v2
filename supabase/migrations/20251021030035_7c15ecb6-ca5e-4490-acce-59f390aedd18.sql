-- ============================================
-- FASE 4: AUTENTICAÇÃO E SEGURANÇA
-- Implementação completa de auth, profiles e roles
-- ============================================

-- 1. Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'viewer');

-- 2. Criar tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Criar tabela de roles (separada por segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 4. Enable RLS em profiles e user_roles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Criar função security definer para verificar roles (evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 6. Função para criar perfil automaticamente ao signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Inserir role padrão (user)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- 7. Trigger para executar handle_new_user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. Trigger para atualizar updated_at em profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS POLICIES - PROFILES
-- ============================================

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- ============================================
-- RLS POLICIES - USER_ROLES
-- ============================================

-- Usuários podem ver suas próprias roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins podem ver todas as roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Apenas admins podem inserir/atualizar/deletar roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ATUALIZAR RLS POLICIES - COMPANIES
-- ============================================

-- Manter policies existentes mas adicionar verificação de auth
DROP POLICY IF EXISTS "Authenticated users can read companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON public.companies;

CREATE POLICY "Authenticated users can read companies"
ON public.companies
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- ATUALIZAR RLS POLICIES - DECISION_MAKERS
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can read decision_makers" ON public.decision_makers;
DROP POLICY IF EXISTS "Authenticated users can insert decision_makers" ON public.decision_makers;
DROP POLICY IF EXISTS "Authenticated users can update decision_makers" ON public.decision_makers;

CREATE POLICY "Authenticated users can read decision_makers"
ON public.decision_makers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert decision_makers"
ON public.decision_makers
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update decision_makers"
ON public.decision_makers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- ATUALIZAR RLS POLICIES - CANVAS
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can read canvas" ON public.canvas;
DROP POLICY IF EXISTS "Authenticated users can create canvas" ON public.canvas;
DROP POLICY IF EXISTS "Authenticated users can update canvas" ON public.canvas;
DROP POLICY IF EXISTS "Authenticated users can delete canvas" ON public.canvas;

CREATE POLICY "Authenticated users can read canvas"
ON public.canvas
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create canvas"
ON public.canvas
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update canvas"
ON public.canvas
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete canvas"
ON public.canvas
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);