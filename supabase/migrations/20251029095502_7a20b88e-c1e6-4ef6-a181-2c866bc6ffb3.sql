-- ============================================
-- DADOS GEOGRÁFICOS COMPLETOS DO BRASIL
-- ============================================

-- Tabela de Estados (27 UFs)
CREATE TABLE IF NOT EXISTS public.br_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state_code TEXT NOT NULL UNIQUE,
  state_name TEXT NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Mesorregiões
CREATE TABLE IF NOT EXISTS public.br_mesoregions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state_code TEXT NOT NULL REFERENCES public.br_states(state_code),
  mesoregion_code TEXT NOT NULL UNIQUE,
  mesoregion_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Microrregiões
CREATE TABLE IF NOT EXISTS public.br_microregions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mesoregion_code TEXT NOT NULL REFERENCES public.br_mesoregions(mesoregion_code),
  microregion_code TEXT NOT NULL UNIQUE,
  microregion_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Municípios (5570 municípios)
CREATE TABLE IF NOT EXISTS public.br_municipalities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  municipality_code TEXT NOT NULL UNIQUE,
  municipality_name TEXT NOT NULL,
  state_code TEXT NOT NULL REFERENCES public.br_states(state_code),
  microregion_code TEXT REFERENCES public.br_microregions(microregion_code),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  population INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_br_mesoregions_state ON public.br_mesoregions(state_code);
CREATE INDEX IF NOT EXISTS idx_br_microregions_meso ON public.br_microregions(mesoregion_code);
CREATE INDEX IF NOT EXISTS idx_br_municipalities_state ON public.br_municipalities(state_code);
CREATE INDEX IF NOT EXISTS idx_br_municipalities_micro ON public.br_municipalities(microregion_code);
CREATE INDEX IF NOT EXISTS idx_br_municipalities_name ON public.br_municipalities(municipality_name);

-- RLS Policies (dados públicos de geografia)
ALTER TABLE public.br_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.br_mesoregions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.br_microregions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.br_municipalities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Geographic data is public" ON public.br_states FOR SELECT USING (true);
CREATE POLICY "Geographic data is public" ON public.br_mesoregions FOR SELECT USING (true);
CREATE POLICY "Geographic data is public" ON public.br_microregions FOR SELECT USING (true);
CREATE POLICY "Geographic data is public" ON public.br_municipalities FOR SELECT USING (true);

-- ============================================
-- CONFIGURAÇÃO DE MONITORAMENTO AUTOMÁTICO
-- ============================================

CREATE TABLE IF NOT EXISTS public.intelligence_monitoring_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Filtros Geográficos
  target_regions TEXT[] DEFAULT ARRAY['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'],
  target_states TEXT[],
  target_mesoregions TEXT[],
  target_microregions TEXT[],
  target_municipalities TEXT[],
  
  -- Filtros de Negócio
  target_sectors TEXT[],
  target_niches TEXT[],
  min_employees INTEGER DEFAULT 10,
  max_employees INTEGER DEFAULT 10000,
  min_revenue DECIMAL(15,2),
  max_revenue DECIMAL(15,2),
  
  -- Configurações de Monitoramento
  is_active BOOLEAN DEFAULT true,
  check_frequency_hours INTEGER DEFAULT 24 CHECK (check_frequency_hours >= 1),
  
  -- Keywords
  keywords_whitelist TEXT[],
  keywords_blacklist TEXT[],
  
  -- Sinais de Interesse
  monitor_funding BOOLEAN DEFAULT true,
  monitor_leadership_changes BOOLEAN DEFAULT true,
  monitor_expansion BOOLEAN DEFAULT true,
  monitor_tech_adoption BOOLEAN DEFAULT true,
  monitor_partnerships BOOLEAN DEFAULT true,
  monitor_market_entry BOOLEAN DEFAULT true,
  monitor_digital_transformation BOOLEAN DEFAULT true,
  monitor_competitor_mentions BOOLEAN DEFAULT true,
  
  -- Displacement Tracking
  competitor_names TEXT[] DEFAULT ARRAY['SAP', 'Oracle', 'Microsoft Dynamics', 'Salesforce', 'Senior', 'Linx', 'Omie', 'Bling'],
  
  -- Timestamps
  last_check_at TIMESTAMP WITH TIME ZONE,
  next_check_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_intelligence_config_user ON public.intelligence_monitoring_config(user_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_config_active ON public.intelligence_monitoring_config(is_active);
CREATE INDEX IF NOT EXISTS idx_intelligence_config_next_check ON public.intelligence_monitoring_config(next_check_at);

ALTER TABLE public.intelligence_monitoring_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own config"
  ON public.intelligence_monitoring_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own config"
  ON public.intelligence_monitoring_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own config"
  ON public.intelligence_monitoring_config FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_intelligence_monitoring_config_updated_at
  BEFORE UPDATE ON public.intelligence_monitoring_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERIR DADOS DOS 27 ESTADOS
-- ============================================

INSERT INTO public.br_states (state_code, state_name, region) VALUES
  -- Norte
  ('AC', 'Acre', 'Norte'),
  ('AP', 'Amapá', 'Norte'),
  ('AM', 'Amazonas', 'Norte'),
  ('PA', 'Pará', 'Norte'),
  ('RO', 'Rondônia', 'Norte'),
  ('RR', 'Roraima', 'Norte'),
  ('TO', 'Tocantins', 'Norte'),
  
  -- Nordeste
  ('AL', 'Alagoas', 'Nordeste'),
  ('BA', 'Bahia', 'Nordeste'),
  ('CE', 'Ceará', 'Nordeste'),
  ('MA', 'Maranhão', 'Nordeste'),
  ('PB', 'Paraíba', 'Nordeste'),
  ('PE', 'Pernambuco', 'Nordeste'),
  ('PI', 'Piauí', 'Nordeste'),
  ('RN', 'Rio Grande do Norte', 'Nordeste'),
  ('SE', 'Sergipe', 'Nordeste'),
  
  -- Centro-Oeste
  ('DF', 'Distrito Federal', 'Centro-Oeste'),
  ('GO', 'Goiás', 'Centro-Oeste'),
  ('MT', 'Mato Grosso', 'Centro-Oeste'),
  ('MS', 'Mato Grosso do Sul', 'Centro-Oeste'),
  
  -- Sudeste
  ('ES', 'Espírito Santo', 'Sudeste'),
  ('MG', 'Minas Gerais', 'Sudeste'),
  ('RJ', 'Rio de Janeiro', 'Sudeste'),
  ('SP', 'São Paulo', 'Sudeste'),
  
  -- Sul
  ('PR', 'Paraná', 'Sul'),
  ('RS', 'Rio Grande do Sul', 'Sul'),
  ('SC', 'Santa Catarina', 'Sul')
ON CONFLICT (state_code) DO NOTHING;