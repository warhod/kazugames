-- Per-user public profile for group lending UX (display name, friend code, Nintendo link).

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  friend_code text,
  nintendo_profile_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Optional identity shown to groupmates (not auth secrets).';

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute procedure public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_groupmate" on public.profiles;
create policy "profiles_select_own_or_groupmate"
  on public.profiles for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.user_shares_group_with(user_id)
  );

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles for delete
  to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on table public.profiles to authenticated;

-- Backfill rows for existing auth users (idempotent).
insert into public.profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- New signups: ensure a profile row exists.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

comment on function public.handle_new_user_profile() is
  'Creates an empty profiles row for new auth.users (SECURITY DEFINER).';

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();
