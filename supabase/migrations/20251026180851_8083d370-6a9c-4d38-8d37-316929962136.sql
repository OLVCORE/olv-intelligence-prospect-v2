-- Criar tabela para salvar drafts de módulos da estratégia de conta
CREATE TABLE IF NOT EXISTS public.account_strategy_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  account_strategy_id UUID REFERENCES public.account_strategies(id) ON DELETE CASCADE,
  module TEXT NOT NULL CHECK (module IN ('roi', 'cpq', 'scenarios', 'proposals', 'competitive', 'value', 'consultoria_olv')),
  title TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_draft BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_account_strategy_modules_user ON public.account_strategy_modules(user_id);
CREATE INDEX IF NOT EXISTS idx_account_strategy_modules_company ON public.account_strategy_modules(company_id);
CREATE INDEX IF NOT EXISTS idx_account_strategy_modules_strategy ON public.account_strategy_modules(account_strategy_id);
CREATE INDEX IF NOT EXISTS idx_account_strategy_modules_module ON public.account_strategy_modules(module);

-- RLS policies
ALTER TABLE public.account_strategy_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar seus próprios módulos"
  ON public.account_strategy_modules
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios módulos"
  ON public.account_strategy_modules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios módulos"
  ON public.account_strategy_modules
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios módulos"
  ON public.account_strategy_modules
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_account_strategy_modules_updated_at
  BEFORE UPDATE ON public.account_strategy_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();