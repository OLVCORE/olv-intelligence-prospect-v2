-- Product catalog and pricing rules

-- Create product_catalog table
CREATE TABLE IF NOT EXISTS public.product_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('BÁSICO','INTERMEDIÁRIO','AVANÇADO','ESPECIALIZADO')),
  description TEXT,
  base_price NUMERIC NOT NULL,
  min_price NUMERIC NOT NULL DEFAULT 0,
  is_configurable BOOLEAN NOT NULL DEFAULT false,
  config_options JSONB NOT NULL DEFAULT '{}'::jsonb,
  dependencies TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  recommended_with TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  min_quantity INTEGER NOT NULL DEFAULT 1,
  max_quantity INTEGER,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_product_catalog_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_catalog_updated_at ON public.product_catalog;
CREATE TRIGGER trg_product_catalog_updated_at
BEFORE UPDATE ON public.product_catalog
FOR EACH ROW
EXECUTE FUNCTION public.update_product_catalog_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_catalog_active ON public.product_catalog (active);
CREATE INDEX IF NOT EXISTS idx_product_catalog_category ON public.product_catalog (category);
CREATE INDEX IF NOT EXISTS idx_product_catalog_sku ON public.product_catalog (sku);

-- Enable RLS and policies
ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Anyone can read product_catalog"
  ON public.product_catalog FOR SELECT
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create pricing_rules table
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type TEXT NOT NULL, -- e.g., 'company_size', 'sector', 'campaign'
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  discount_percentage NUMERIC NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.update_pricing_rules_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pricing_rules_updated_at ON public.pricing_rules;
CREATE TRIGGER trg_pricing_rules_updated_at
BEFORE UPDATE ON public.pricing_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_pricing_rules_updated_at();

CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON public.pricing_rules (active);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_priority ON public.pricing_rules (priority DESC);

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Anyone can read pricing_rules"
  ON public.pricing_rules FOR SELECT
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
