-- ========================================
-- SISTEMA DE CONTROLE DE CRÉDITOS APOLLO
-- ========================================

-- 1) Índices únicos para prevenir duplicatas
create unique index if not exists ux_people_apollo 
on public.people (apollo_person_id) 
where apollo_person_id is not null;

create unique index if not exists ux_people_linkedin 
on public.people (linkedin_profile_id) 
where linkedin_profile_id is not null;

create unique index if not exists ux_people_emailhash 
on public.people (email_hash) 
where email_hash is not null;

-- 2) Configuração de créditos Apollo
create table if not exists public.apollo_credit_config (
    id uuid primary key default gen_random_uuid(),
    plan_type text not null default 'trial',
    total_credits int not null default 1000,
    used_credits int not null default 0,
    reset_date timestamptz not null default (now() + interval '14 days'),
    alert_threshold int not null default 200,
    block_threshold int not null default 50,
    trial_ends_at timestamptz not null default (now() + interval '14 days'),
    updated_at timestamptz not null default now()
);

-- Inserir config inicial
insert into public.apollo_credit_config (plan_type, total_credits, used_credits)
values ('trial', 1000, 0)
on conflict (id) do nothing;

-- 3) Histórico de uso de créditos
create table if not exists public.apollo_credit_usage (
    id uuid primary key default gen_random_uuid(),
    company_id uuid references public.companies(id) on delete cascade,
    company_name text,
    organization_id text not null,
    modes text[] not null,
    estimated_credits int not null,
    actual_credits int,
    status text not null,
    error_code text,
    error_message text,
    requested_by uuid references auth.users(id),
    requested_at timestamptz not null default now(),
    completed_at timestamptz
);

create index if not exists idx_credit_usage_company 
on public.apollo_credit_usage(company_id, requested_at desc);

create index if not exists idx_credit_usage_status 
on public.apollo_credit_usage(status, requested_at desc);

-- 4) RLS para créditos
alter table public.apollo_credit_config enable row level security;

drop policy if exists "auth_can_read_credit_config" on public.apollo_credit_config;
create policy "auth_can_read_credit_config"
on public.apollo_credit_config for select to authenticated using (true);

drop policy if exists "service_can_manage_credit_config" on public.apollo_credit_config;
create policy "service_can_manage_credit_config"
on public.apollo_credit_config for all using (true) with check (true);

alter table public.apollo_credit_usage enable row level security;

drop policy if exists "auth_can_read_credit_usage" on public.apollo_credit_usage;
create policy "auth_can_read_credit_usage"
on public.apollo_credit_usage for select to authenticated using (true);

drop policy if exists "service_can_insert_credit_usage" on public.apollo_credit_usage;
create policy "service_can_insert_credit_usage"
on public.apollo_credit_usage for insert with check (true);

-- 5) Função para incrementar créditos
create or replace function public.increment_apollo_credits(credits_consumed int)
returns void
language plpgsql
security definer
as $$
begin
    update public.apollo_credit_config
    set 
        used_credits = used_credits + credits_consumed,
        updated_at = now()
    where id = (select id from public.apollo_credit_config limit 1);
end;
$$;