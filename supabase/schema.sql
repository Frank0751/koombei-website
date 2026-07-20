-- KoomBei Circle membership schema
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
--
-- Design: a `profiles` row is created by the member themselves the first time
-- they log in (see js/auth.js / pages/members.html), always starting
-- unapproved. Members have NO update or delete access at all - the only way
-- `approved` ever becomes true is you changing it yourself in the Table
-- Editor. This is what makes "Circle members = clients we actually approved"
-- a real guarantee rather than an honor system.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  organisation text,
  whatsapp text,
  project text,
  referred_by text,
  message text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Members can create exactly one row for themselves, and it must start
-- unapproved - they cannot insert a row that's already approved=true.
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id and approved = false);

-- Members can read only their own row (so they can see their own
-- pending/approved status) - never anyone else's.
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- Deliberately no UPDATE or DELETE policy for the `authenticated` role.
-- Members cannot edit their row after creating it (including `approved`) -
-- only you can, via the Table Editor or SQL Editor, using your own
-- dashboard login (which bypasses RLS as the project owner).
