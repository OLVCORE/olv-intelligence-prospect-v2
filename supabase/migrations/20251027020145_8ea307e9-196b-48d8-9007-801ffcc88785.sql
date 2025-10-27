-- Tabela de Battle Cards específicos por empresa
CREATE TABLE IF NOT EXISTS public.company_battle_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Competidor detectado
  competitor_name TEXT NOT NULL,
  competitor_type TEXT CHECK (competitor_type IN ('erp', 'legacy', 'spreadsheet', 'other')),
  detection_confidence INTEGER CHECK (detection_confidence >= 0 AND detection_confidence <= 100),
  
  -- Estratégia e insights
  win_strategy TEXT NOT NULL,
  objection_handling JSONB DEFAULT '[]'::jsonb,
  proof_points JSONB DEFAULT '[]'::jsonb,
  totvs_advantages TEXT[] DEFAULT ARRAY[]::TEXT[],
  next_steps TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Contexto usado na geração
  context_snapshot JSONB,
  
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_company_battle_cards_company ON public.company_battle_cards(company_id);
CREATE INDEX IF NOT EXISTS idx_company_battle_cards_generated ON public.company_battle_cards(generated_at DESC);

-- RLS
ALTER TABLE public.company_battle_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage company_battle_cards"
  ON public.company_battle_cards FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_company_battle_cards_updated_at
  BEFORE UPDATE ON public.company_battle_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();