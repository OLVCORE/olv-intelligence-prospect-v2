-- Corrigir search_path das funções criadas
DROP TRIGGER IF EXISTS update_totvs_products_updated_at ON totvs_products;
DROP TRIGGER IF EXISTS update_pricing_rules_updated_at ON pricing_rules;

-- A função update_updated_at_column já existe e tem o search_path correto
-- Apenas recriar os triggers

CREATE TRIGGER update_totvs_products_updated_at
  BEFORE UPDATE ON totvs_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at
  BEFORE UPDATE ON pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();