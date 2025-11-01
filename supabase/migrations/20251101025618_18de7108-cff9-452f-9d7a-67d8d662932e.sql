-- Add cnpj_status column to icp_analysis_results
ALTER TABLE public.icp_analysis_results ADD COLUMN IF NOT EXISTS cnpj_status TEXT;

-- Update extract_receita_federal_data function to extract and store cnpj_status
CREATE OR REPLACE FUNCTION public.extract_receita_federal_data()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Extract setor (CNAE principal description)
  IF NEW.raw_analysis->'receita_federal'->'data'->'cnae_fiscal'->>'descricao' IS NOT NULL THEN
    NEW.setor := NEW.raw_analysis->'receita_federal'->'data'->'cnae_fiscal'->>'descricao';
  END IF;

  -- Extract UF
  IF NEW.raw_analysis->'receita_federal'->'data'->>'uf' IS NOT NULL THEN
    NEW.uf := NEW.raw_analysis->'receita_federal'->'data'->>'uf';
  END IF;

  -- Extract município
  IF NEW.raw_analysis->'receita_federal'->'data'->>'municipio' IS NOT NULL THEN
    NEW.municipio := NEW.raw_analysis->'receita_federal'->'data'->>'municipio';
  END IF;

  -- CRITICAL: Extract CNPJ status (situacao) and map to our status values
  IF NEW.raw_analysis->'receita_federal'->'data'->>'situacao' IS NOT NULL THEN
    DECLARE
      v_situacao TEXT := LOWER(TRIM(NEW.raw_analysis->'receita_federal'->'data'->>'situacao'));
    BEGIN
      NEW.cnpj_status := CASE
        WHEN v_situacao LIKE '%ativa%' OR v_situacao = 'ativa' THEN 'ativa'
        WHEN v_situacao LIKE '%inapta%' OR v_situacao LIKE '%suspensa%' OR v_situacao = 'inapta' OR v_situacao = 'suspensa' THEN 'inativo'
        WHEN v_situacao LIKE '%baixada%' OR v_situacao = 'baixada' THEN 'inexistente'
        ELSE 'pendente'
      END;
    END;
  ELSE
    -- If no situacao is available, set as pendente
    NEW.cnpj_status := 'pendente';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update existing records with CNPJ status based on raw_analysis
UPDATE public.icp_analysis_results
SET cnpj_status = CASE
  WHEN LOWER(TRIM(raw_analysis->'receita_federal'->'data'->>'situacao')) LIKE '%ativa%' 
    OR LOWER(TRIM(raw_analysis->'receita_federal'->'data'->>'situacao')) = 'ativa' THEN 'ativa'
  WHEN LOWER(TRIM(raw_analysis->'receita_federal'->'data'->>'situacao')) LIKE '%inapta%' 
    OR LOWER(TRIM(raw_analysis->'receita_federal'->'data'->>'situacao')) LIKE '%suspensa%'
    OR LOWER(TRIM(raw_analysis->'receita_federal'->'data'->>'situacao')) = 'inapta'
    OR LOWER(TRIM(raw_analysis->'receita_federal'->'data'->>'situacao')) = 'suspensa' THEN 'inativo'
  WHEN LOWER(TRIM(raw_analysis->'receita_federal'->'data'->>'situacao')) LIKE '%baixada%'
    OR LOWER(TRIM(raw_analysis->'receita_federal'->'data'->>'situacao')) = 'baixada' THEN 'inexistente'
  ELSE 'pendente'
END
WHERE raw_analysis->'receita_federal'->'data'->>'situacao' IS NOT NULL;