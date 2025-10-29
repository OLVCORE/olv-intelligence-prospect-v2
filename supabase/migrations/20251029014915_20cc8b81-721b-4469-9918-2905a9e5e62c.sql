-- Adicionar foreign keys para permitir joins do Supabase
ALTER TABLE public.company_people
    ADD CONSTRAINT fk_company_people_company 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_company_people_person 
    FOREIGN KEY (person_id) REFERENCES public.people(id) ON DELETE CASCADE;

ALTER TABLE public.similar_companies
    ADD CONSTRAINT fk_similar_companies_company 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.company_news
    ADD CONSTRAINT fk_company_news_company 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.company_jobs
    ADD CONSTRAINT fk_company_jobs_company 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.company_technologies
    ADD CONSTRAINT fk_company_technologies_company 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.company_insights
    ADD CONSTRAINT fk_company_insights_company 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.company_updates
    ADD CONSTRAINT fk_company_updates_company 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;