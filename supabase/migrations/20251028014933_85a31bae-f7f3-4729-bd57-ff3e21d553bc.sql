-- ETAPA 2: Migração de dados de apollo_person_metadata para colunas dedicadas
-- SEGURO: Apenas cópia de dados, não deleta nada, usa COALESCE para não sobrescrever

UPDATE public.decision_makers
SET 
  headline = COALESCE(headline, apollo_person_metadata->>'headline'),
  city = COALESCE(city, apollo_person_metadata->>'city'),
  state = COALESCE(state, apollo_person_metadata->>'state'),
  country = COALESCE(country, apollo_person_metadata->>'country'),
  twitter_url = COALESCE(twitter_url, apollo_person_metadata->>'twitter_url'),
  facebook_url = COALESCE(facebook_url, apollo_person_metadata->>'facebook_url'),
  github_url = COALESCE(github_url, apollo_person_metadata->>'github_url'),
  organization_data = COALESCE(
    organization_data,
    jsonb_build_object(
      'organization_name', apollo_person_metadata->>'organization_name',
      'organization_id', apollo_person_metadata->>'organization_id'
    )
  )
WHERE apollo_person_metadata IS NOT NULL
  AND apollo_person_metadata != '{}'::jsonb;