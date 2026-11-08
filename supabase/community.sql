-- Hapi community: public profiles, likes, ratings with reviews by year, and comments.
-- Run once in the Supabase SQL Editor, after setup.sql.
-- Everyone can read; only signed-in users can write, and only their own rows.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  opportunity_id text not null check (char_length(opportunity_id) <= 80),
  created_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  opportunity_id text not null check (char_length(opportunity_id) <= 80),
  rating smallint not null check (rating between 1 and 5),
  year smallint not null check (year between 2000 and 2100),
  body text not null check (char_length(body) between 10 and 1500),
  created_at timestamptz not null default now(),
  unique (user_id, opportunity_id, year)
);

create table if not exists public.comments (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  opportunity_id text not null check (char_length(opportunity_id) <= 80),
  parent_id bigint references public.comments (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists likes_opp on public.likes (opportunity_id);
create index if not exists reviews_opp on public.reviews (opportunity_id);
create index if not exists comments_opp on public.comments (opportunity_id);

alter table public.profiles enable row level security;
alter table public.likes enable row level security;
alter table public.reviews enable row level security;
alter table public.comments enable row level security;

grant select on public.profiles, public.likes, public.reviews, public.comments to anon, authenticated;
grant insert, update, delete on public.profiles, public.likes, public.reviews, public.comments to authenticated;

-- Read: everyone. Write: only your own rows.
do $$
declare t text;
begin
  foreach t in array array['profiles', 'likes', 'reviews', 'comments'] loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "own insert" on public.%I', t);
    execute format('create policy "own insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('drop policy if exists "own update" on public.%I', t);
    execute format('create policy "own update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('drop policy if exists "own delete" on public.%I', t);
    execute format('create policy "own delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- Likes, average rating and review count per opportunity.
create or replace view public.opportunity_stats with (security_invoker = true) as
select o.opportunity_id,
       coalesce(l.likes, 0) as likes,
       r.avg_rating,
       coalesce(r.reviews, 0) as reviews
from (select opportunity_id from public.likes union select opportunity_id from public.reviews) o
left join (select opportunity_id, count(*) as likes from public.likes group by opportunity_id) l using (opportunity_id)
left join (select opportunity_id, round(avg(rating)::numeric, 1) as avg_rating, count(*) as reviews from public.reviews group by opportunity_id) r using (opportunity_id);

grant select on public.opportunity_stats to anon, authenticated;
