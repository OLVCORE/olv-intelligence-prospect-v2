-- FASE 1 & 2: Corrigir estrutura de dados e adicionar engine de score ICP

-- 1. Adicionar coluna setor se não existir
ALTER TABLE icp_analysis_results ADD COLUMN IF NOT EXISTS setor TEXT;

-- 2. Função para extrair dados da Receita Federal automaticamente
CREATE OR REPLACE FUNCTION extract_receita_federal_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Extrair dados de raw_analysis.receita_federal.data
  IF NEW.raw_analysis IS NOT NULL AND 
     NEW.raw_analysis->'receita_federal' IS NOT NULL AND
     NEW.raw_analysis->'receita_federal'->'data' IS NOT NULL THEN
    
    -- Dados de localização
    NEW.uf = COALESCE(NEW.uf, NEW.raw_analysis->'receita_federal'->'data'->>'uf');
    NEW.municipio = COALESCE(NEW.municipio, NEW.raw_analysis->'receita_federal'->'data'->>'municipio');
    NEW.porte = COALESCE(NEW.porte, NEW.raw_analysis->'receita_federal'->'data'->>'porte');
    
    -- Dados de contato
    NEW.email = COALESCE(NEW.email, NEW.raw_analysis->'receita_federal'->'data'->>'email');
    NEW.telefone = COALESCE(NEW.telefone, NEW.raw_analysis->'receita_federal'->'data'->>'telefone');
    
    -- CNAE e setor (pegar do array atividade_principal)
    IF NEW.raw_analysis->'receita_federal'->'data'->'atividade_principal' IS NOT NULL THEN
      NEW.cnae_principal = COALESCE(
        NEW.cnae_principal, 
        NEW.raw_analysis->'receita_federal'->'data'->'atividade_principal'->0->>'code'
      );
      NEW.setor = COALESCE(
        NEW.setor,
        NEW.raw_analysis->'receita_federal'->'data'->'atividade_principal'->0->>'text'
      );
    END IF;
    
    -- Website/domain
    IF NEW.website IS NULL AND NEW.raw_analysis->'receita_federal'->'data'->>'fantasia' IS NOT NULL THEN
      NEW.website = NEW.raw_analysis->'receita_federal'->'data'->>'fantasia';
    END IF;
    
    -- Nome fantasia
    IF NEW.nome_fantasia IS NULL AND NEW.raw_analysis->'receita_federal'->'data'->>'fantasia' IS NOT NULL THEN
      NEW.nome_fantasia = NEW.raw_analysis->'receita_federal'->'data'->>'fantasia';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar trigger para extração automática (sem WHEN condition que refere OLD em INSERT)
DROP TRIGGER IF EXISTS trigger_extract_receita_data ON icp_analysis_results;
CREATE TRIGGER trigger_extract_receita_data
  BEFORE INSERT OR UPDATE ON icp_analysis_results
  FOR EACH ROW
  EXECUTE FUNCTION extract_receita_federal_data();

-- 4. Função para calcular Score ICP na quarentena
CREATE OR REPLACE FUNCTION calculate_icp_score_quarantine(p_analysis_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_score INTEGER := 0;
  v_porte_score INTEGER := 0;
  v_setor_score INTEGER := 0;
  v_localizacao_score INTEGER := 0;
  v_totvs_score INTEGER := 0;
  v_dados_score INTEGER := 0;
  
  v_record RECORD;
BEGIN
  -- Buscar dados do registro
  SELECT * INTO v_record
  FROM icp_analysis_results
  WHERE id = p_analysis_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- 1. Score de Porte (0-30 pontos)
  IF v_record.porte IS NOT NULL THEN
    CASE 
      WHEN v_record.porte ILIKE '%GRANDE%' OR v_record.porte ILIKE '%DEMAIS%' THEN 
        v_porte_score := 30;
      WHEN v_record.porte ILIKE '%MEDIO%' OR v_record.porte ILIKE '%MÉDIO%' THEN 
        v_porte_score := 20;
      WHEN v_record.porte ILIKE '%PEQUENO%' THEN 
        v_porte_score := 10;
      ELSE 
        v_porte_score := 5;
    END CASE;
  END IF;
  
  -- 2. Score de Setor (0-25 pontos) - Setores prioritários
  IF v_record.setor IS NOT NULL OR v_record.cnae_principal IS NOT NULL THEN
    -- Indústria, tecnologia, serviços corporativos = alta prioridade
    IF v_record.setor ILIKE '%INDUSTRIA%' OR 
       v_record.setor ILIKE '%INDÚSTRIA%' OR
       v_record.setor ILIKE '%MANUFATURA%' OR
       v_record.setor ILIKE '%TECNOLOGIA%' OR
       v_record.setor ILIKE '%SOFTWARE%' OR
       v_record.setor ILIKE '%LOGISTICA%' OR
       v_record.setor ILIKE '%LOGÍSTICA%' THEN
      v_setor_score := 25;
    -- Comércio, varejo = média prioridade  
    ELSIF v_record.setor ILIKE '%COMERCIO%' OR 
          v_record.setor ILIKE '%COMÉRCIO%' OR
          v_record.setor ILIKE '%VAREJO%' THEN
      v_setor_score := 15;
    -- Outros setores
    ELSE
      v_setor_score := 10;
    END IF;
  END IF;
  
  -- 3. Score de Localização (0-15 pontos) - Estados prioritários
  IF v_record.uf IS NOT NULL THEN
    CASE v_record.uf
      WHEN 'SP' THEN v_localizacao_score := 15;
      WHEN 'RJ', 'MG', 'PR', 'RS', 'SC' THEN v_localizacao_score := 12;
      WHEN 'BA', 'PE', 'CE', 'GO', 'DF' THEN v_localizacao_score := 8;
      ELSE v_localizacao_score := 5;
    END CASE;
  END IF;
  
  -- 4. Score TOTVS (0-10 pontos)
  -- Se NÃO é cliente TOTVS = mais pontos (prospect válido)
  IF v_record.is_cliente_totvs = false THEN
    v_totvs_score := 10;
  ELSIF v_record.is_cliente_totvs IS NULL THEN
    v_totvs_score := 5; -- Ainda não verificado
  ELSE
    v_totvs_score := 0; -- Já é cliente
  END IF;
  
  -- 5. Score de Dados Completos (0-20 pontos)
  v_dados_score := 0;
  
  IF v_record.raw_analysis IS NOT NULL THEN
    -- Receita Federal completa
    IF v_record.raw_analysis->'receita_federal' IS NOT NULL THEN
      v_dados_score := v_dados_score + 5;
    END IF;
    
    -- Apollo/Enriquecimento 360
    IF v_record.raw_analysis->'apollo' IS NOT NULL OR 
       v_record.raw_analysis->'enrichment_360' IS NOT NULL THEN
      v_dados_score := v_dados_score + 5;
    END IF;
    
    -- Website identificado
    IF v_record.website IS NOT NULL AND v_record.website != '' THEN
      v_dados_score := v_dados_score + 5;
    END IF;
    
    -- Email e telefone
    IF v_record.email IS NOT NULL OR v_record.telefone IS NOT NULL THEN
      v_dados_score := v_dados_score + 5;
    END IF;
  END IF;
  
  -- Calcular score final (máximo 100)
  v_score := LEAST(
    v_porte_score + v_setor_score + v_localizacao_score + v_totvs_score + v_dados_score,
    100
  );
  
  -- Atualizar score e temperatura
  UPDATE icp_analysis_results
  SET 
    icp_score = v_score,
    temperatura = CASE
      WHEN v_score >= 75 THEN 'hot'
      WHEN v_score >= 50 THEN 'warm'
      ELSE 'cold'
    END
  WHERE id = p_analysis_id;
  
  RETURN v_score;
END;
$$;

-- 5. Atualizar registros existentes para extrair dados
UPDATE icp_analysis_results
SET updated_at = NOW()
WHERE raw_analysis->'receita_federal' IS NOT NULL
  AND status = 'pendente';

-- 6. Recalcular scores para todos os registros pendentes
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT id FROM icp_analysis_results 
    WHERE status = 'pendente' 
    ORDER BY created_at DESC
  LOOP
    PERFORM calculate_icp_score_quarantine(r.id);
  END LOOP;
END $$;