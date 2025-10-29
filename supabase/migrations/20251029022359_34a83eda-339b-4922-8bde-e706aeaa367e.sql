-- Adicionar constraints UNIQUE na tabela people para permitir upserts
ALTER TABLE public.people
  ADD CONSTRAINT people_apollo_person_id_key UNIQUE (apollo_person_id),
  ADD CONSTRAINT people_linkedin_profile_id_key UNIQUE (linkedin_profile_id),
  ADD CONSTRAINT people_email_hash_key UNIQUE (email_hash);