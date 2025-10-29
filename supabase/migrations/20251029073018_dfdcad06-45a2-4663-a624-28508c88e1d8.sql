-- ========================================
-- TABELA: Detecção de Uso TOTVS
-- ========================================
create table if not exists public.totvs_usage_detection (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    company_name text not null,
    score int not null,
    status text not null,
    evidences jsonb not null default '[]'::jsonb,
    sources_checked int not null default 5,
    checked_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create index if not exists idx_totvs_detection_company 
on public.totvs_usage_detection(company_id, checked_at desc);

-- ========================================
-- TABELA: Sinais de Intenção de Compra
-- ========================================
create table if not exists public.intent_signals_detection (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    company_name text not null,
    score int not null,
    signals jsonb not null default '[]'::jsonb,
    sources_checked int not null default 4,
    checked_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create index if not exists idx_intent_detection_company 
on public.intent_signals_detection(company_id, checked_at desc);

-- ========================================
-- RLS (Row Level Security)
-- ========================================
alter table public.totvs_usage_detection enable row level security;

drop policy if exists "read_totvs_detection_auth" on public.totvs_usage_detection;
create policy "read_totvs_detection_auth"
on public.totvs_usage_detection for select to authenticated using (true);

drop policy if exists "insert_totvs_detection_service" on public.totvs_usage_detection;
create policy "insert_totvs_detection_service"
on public.totvs_usage_detection for insert with check (true);

alter table public.intent_signals_detection enable row level security;

drop policy if exists "read_intent_detection_auth" on public.intent_signals_detection;
create policy "read_intent_detection_auth"
on public.intent_signals_detection for select to authenticated using (true);

drop policy if exists "insert_intent_detection_service" on public.intent_signals_detection;
create policy "insert_intent_detection_service"
on public.intent_signals_detection for insert with check (true);