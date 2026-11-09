-- Anonymous usage counting for the Hapi statistics page.
-- Run once in the Supabase SQL editor, after setup.sql and community.sql.
--
-- Privacy: a row only says what kind of thing happened (e.g. "a profile from Albania", "a hackathon was saved").
-- No user id, name, email or IP is stored. Nobody can read single rows; the page only gets totals.

create table if not exists public.usage_events (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('profile', 'save', 'find_more', 'cost_plan', 'invoice', 'chat', 'survey', 'ai_check')),
  detail text check (detail is null or char_length(detail) <= 60),
  created_at timestamptz not null default now()
);

alter table public.usage_events enable row level security;

drop policy if exists "anyone can count an event" on public.usage_events;
create policy "anyone can count an event" on public.usage_events for insert to anon, authenticated with check (true);
-- No select policy: single rows cannot be read through the API.

grant insert on public.usage_events to anon, authenticated;

-- Totals only. security definer lets it count rows that the caller cannot read.
create or replace function public.hapi_stats()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'profiles', (select count(*) from usage_events where kind = 'profile'),
    'accounts', (select count(*) from user_data),
    'countries', coalesce((
      select json_agg(json_build_object('country', detail, 'n', n) order by n desc)
      from (select coalesce(nullif(detail, ''), 'Not given') as detail, count(*) as n from usage_events where kind = 'profile' group by 1) c
    ), '[]'::json),
    'saves', (select count(*) from usage_events where kind = 'save'),
    'saveTypes', coalesce((
      select json_agg(json_build_object('type', detail, 'n', n) order by n desc)
      from (select detail, count(*) as n from usage_events where kind = 'save' and detail is not null group by detail) t
    ), '[]'::json),
    'findMore', (select count(*) from usage_events where kind = 'find_more'),
    'chats', (select count(*) from usage_events where kind = 'chat'),
    'costPlans', (select count(*) from usage_events where kind = 'cost_plan'),
    'invoices', (select count(*) from usage_events where kind = 'invoice'),
    'surveyYes', (select count(*) from usage_events where kind = 'survey' and detail = 'yes'),
    'surveyNo', (select count(*) from usage_events where kind = 'survey' and detail = 'no'),
    'aiChecks', (select count(*) from usage_events where kind = 'ai_check'),
    'aiChanges', coalesce((
      select json_object_agg(detail, n)
      from (select detail, count(*) as n from usage_events where kind = 'ai_check' group by detail) a
    ), '{}'::json),
    'since', (select min(created_at) from usage_events)
  );
$$;

grant execute on function public.hapi_stats() to anon, authenticated;
