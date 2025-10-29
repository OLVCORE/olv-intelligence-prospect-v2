-- ========================================
-- TABELA: Batch Jobs (Lotes de Análise)
-- ========================================
create table if not exists public.icp_batch_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  source text not null,
  status text not null default 'pending',
  total_companies int not null default 0,
  processed_companies int not null default 0,
  qualified_companies int not null default 0,
  disqualified_companies int not null default 0,
  errors int not null default 0,
  region text,
  sector text,
  niche text,
  file_url text,
  report_url text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_batch_jobs_user on public.icp_batch_jobs(user_id, created_at desc);
create index if not exists idx_batch_jobs_status on public.icp_batch_jobs(status, created_at desc);
create index if not exists idx_batch_jobs_niche on public.icp_batch_jobs(niche, created_at desc);

-- ========================================
-- TABELA: Batch Companies (Empresas do Lote)
-- ========================================
create table if not exists public.icp_batch_companies (
  id uuid primary key default gen_random_uuid(),
  batch_job_id uuid not null references public.icp_batch_jobs(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  company_name text not null,
  cnpj text,
  domain text,
  region text,
  sector text,
  niche text,
  status text not null default 'pending',
  totvs_score int,
  totvs_status text,
  totvs_disqualification_reason text,
  totvs_evidences jsonb default '[]'::jsonb,
  totvs_methodology jsonb default '{}'::jsonb,
  intent_score int,
  intent_confidence text,
  intent_signals jsonb default '[]'::jsonb,
  intent_methodology jsonb default '{}'::jsonb,
  platforms_scanned text[] default array[]::text[],
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_batch_companies_job on public.icp_batch_companies(batch_job_id, created_at desc);
create index if not exists idx_batch_companies_niche on public.icp_batch_companies(niche, created_at desc);

-- ========================================
-- TABELA: Similar Companies (Empresas Similares)
-- ========================================
create table if not exists public.similar_companies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  similar_company_external_id text not null,
  similar_name text not null,
  location text,
  employees_min int,
  employees_max int,
  similarity_score decimal(5,2),
  source text not null default 'apollo',
  created_at timestamptz not null default now()
);

create index if not exists idx_similar_companies_company on public.similar_companies(company_id, similarity_score desc);

-- ========================================
-- TABELA: Nichos (Segmentação Detalhada)
-- ========================================
create table if not exists public.niches (
  id uuid primary key default gen_random_uuid(),
  sector text not null,
  niche_name text not null,
  description text,
  keywords text[] not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_niches_sector_name on public.niches(sector, niche_name);

-- Inserir nichos padrão (Agro)
insert into public.niches (sector, niche_name, description, keywords) values
  ('Agro', 'Cultivo de Grãos', 'Cultivo de soja, milho, trigo, etc.', array['soja', 'milho', 'trigo', 'grãos', 'cultivo', 'plantio']),
  ('Agro', 'Maquinário Agrícola', 'Venda e manutenção de tratores, colheitadeiras, etc.', array['trator', 'colheitadeira', 'maquinário', 'equipamento agrícola', 'implementos']),
  ('Agro', 'Insumos Agrícolas', 'Sementes, adubos, fertilizantes, defensivos', array['sementes', 'adubo', 'fertilizante', 'defensivo', 'agrotóxico', 'insumo']),
  ('Agro', 'Pecuária', 'Criação de gado, suínos, aves, etc.', array['gado', 'pecuária', 'bovino', 'suíno', 'avicultura', 'criação']),
  ('Agro', 'Agroindústria', 'Processamento de produtos agrícolas', array['agroindústria', 'processamento', 'beneficiamento', 'industrialização']),
  ('Agro', 'Distribuição Agrícola', 'Distribuição de produtos agrícolas', array['distribuição', 'logística agrícola', 'armazenagem', 'cooperativa'])
on conflict do nothing;

-- ========================================
-- RLS POLICIES
-- ========================================
alter table public.icp_batch_jobs enable row level security;
alter table public.icp_batch_companies enable row level security;
alter table public.similar_companies enable row level security;
alter table public.niches enable row level security;

drop policy if exists "users_read_own_batch_jobs" on public.icp_batch_jobs;
create policy "users_read_own_batch_jobs" on public.icp_batch_jobs 
  for all to authenticated using (auth.uid() = user_id);

drop policy if exists "users_read_batch_companies" on public.icp_batch_companies;
create policy "users_read_batch_companies" on public.icp_batch_companies 
  for select to authenticated using (
    exists (
      select 1 from public.icp_batch_jobs
      where icp_batch_jobs.id = icp_batch_companies.batch_job_id
      and icp_batch_jobs.user_id = auth.uid()
    )
  );

drop policy if exists "users_read_similar_companies" on public.similar_companies;
create policy "users_read_similar_companies" on public.similar_companies 
  for select to authenticated using (true);

drop policy if exists "service_manage_similar_companies" on public.similar_companies;
create policy "service_manage_similar_companies" on public.similar_companies 
  for all to authenticated using (true);

drop policy if exists "users_read_niches" on public.niches;
create policy "users_read_niches" on public.niches 
  for select to authenticated using (true);

-- Adicionar coluna methodology nas tabelas de detecção existentes
alter table public.totvs_usage_detection 
  add column if not exists methodology jsonb default '{}'::jsonb;

alter table public.intent_signals_detection 
  add column if not exists methodology jsonb default '{}'::jsonb;