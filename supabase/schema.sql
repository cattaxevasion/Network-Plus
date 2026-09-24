-- Network+ 60-Day Tracker: cloud storage.
-- Run once in Supabase: SQL Editor → New query → paste → Run.
--
-- One row per signed-in user, holding the whole app state as JSON.
-- `version` goes up by one on every save, so a stale device can't overwrite newer data.

create table if not exists public.app_data (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb not null,
  version    integer not null default 1,
  updated_at timestamptz not null default now(),
  -- guard against abuse: the real data is well under 1 MB
  constraint app_data_size check (pg_column_size(data) < 1000000)
);

-- Row Level Security: only the signed-in owner can see or change their row.
alter table public.app_data enable row level security;

drop policy if exists "Owner can read" on public.app_data;
drop policy if exists "Owner can insert" on public.app_data;
drop policy if exists "Owner can update" on public.app_data;
drop policy if exists "Owner can delete" on public.app_data;

create policy "Owner can read" on public.app_data
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owner can insert" on public.app_data
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owner can update" on public.app_data
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owner can delete" on public.app_data
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Not signed in = no access at all (even before RLS is checked).
revoke all on public.app_data from anon;
grant select, insert, update, delete on public.app_data to authenticated;
