-- Create table for per-module progressive saves of Account Strategy work
create table if not exists public.account_strategy_modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  company_id uuid null references public.companies(id) on delete cascade,
  account_strategy_id uuid null references public.account_strategies(id) on delete cascade,
  module text not null check (module in ('roi','cpq','scenarios','proposals','competitive','value','consultoria_olv')),
  title text null,
  data jsonb not null default '{}'::jsonb,
  is_draft boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_strategy_or_company check (
    account_strategy_id is not null or company_id is not null
  )
);

-- Unique constraints per module per user per context
create unique index if not exists account_strategy_modules_unique_strategy
  on public.account_strategy_modules (user_id, account_strategy_id, module)
  where account_strategy_id is not null;

create unique index if not exists account_strategy_modules_unique_company
  on public.account_strategy_modules (user_id, company_id, module)
  where account_strategy_id is null and company_id is not null;

-- Trigger to update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger account_strategy_modules_set_updated_at
before update on public.account_strategy_modules
for each row execute function public.set_updated_at();

-- Enable RLS and policies
alter table public.account_strategy_modules enable row level security;

-- Basic owner-based policies
create policy "Users can read their module drafts" on public.account_strategy_modules
for select using (auth.uid() = user_id);

create policy "Users can insert their module drafts" on public.account_strategy_modules
for insert with check (auth.uid() = user_id);

create policy "Users can update their module drafts" on public.account_strategy_modules
for update using (auth.uid() = user_id);

create policy "Users can delete their module drafts" on public.account_strategy_modules
for delete using (auth.uid() = user_id);
