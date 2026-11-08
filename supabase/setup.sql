-- Hapi accounts: one private row of saved data per user.
-- Run once in the Supabase SQL Editor.

create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

-- Only signed-in users may reach the table at all; the policies below limit them to their own row.
revoke all on public.user_data from anon;
grant select, insert, update, delete on public.user_data to authenticated;

-- Each person can only see and change their own row.
drop policy if exists "read own data" on public.user_data;
create policy "read own data" on public.user_data for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "insert own data" on public.user_data;
create policy "insert own data" on public.user_data for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "update own data" on public.user_data;
create policy "update own data" on public.user_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "delete own data" on public.user_data;
create policy "delete own data" on public.user_data for delete to authenticated using ((select auth.uid()) = user_id);
