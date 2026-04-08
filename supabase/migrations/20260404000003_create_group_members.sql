-- Group membership (many-to-many users <-> groups).

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  constraint group_members_group_user_key unique (group_id, user_id)
);

create index if not exists group_members_user_id_idx on public.group_members (user_id);
create index if not exists group_members_group_id_idx on public.group_members (group_id);

comment on table public.group_members is 'Who belongs to which group.';

-- RLS helpers: policies must not subquery group_members directly (infinite recursion).
create or replace function public.is_group_member(_group_id uuid, _user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = _group_id
      and user_id = _user_id
  );
$$;

comment on function public.is_group_member(uuid, uuid) is
  'True if _user_id is in _group_id. SECURITY DEFINER bypasses RLS for policy checks.';

create or replace function public.user_shares_group_with(_peer_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_members a
    inner join public.group_members b on a.group_id = b.group_id
    where a.user_id = (select auth.uid())
      and b.user_id = _peer_user_id
  );
$$;

comment on function public.user_shares_group_with(uuid) is
  'True if peer shares a group with auth.uid(). SECURITY DEFINER bypasses RLS.';

revoke all on function public.is_group_member(uuid, uuid) from public;
revoke all on function public.user_shares_group_with(uuid) from public;

grant execute on function public.is_group_member(uuid, uuid) to authenticated;
grant execute on function public.user_shares_group_with(uuid) to authenticated;

alter table public.group_members enable row level security;

drop policy if exists "group_members_select_same_group" on public.group_members;
create policy "group_members_select_same_group"
  on public.group_members for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_group_member(group_id, (select auth.uid()))
  );

drop policy if exists "group_members_insert_authenticated" on public.group_members;
create policy "group_members_insert_authenticated"
  on public.group_members for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "group_members_delete_owner_or_self" on public.group_members;
create policy "group_members_delete_owner_or_self"
  on public.group_members for delete
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.groups g
      where g.id = group_members.group_id
        and g.owner_id = auth.uid()
    )
  );

grant select, insert, delete on table public.group_members to authenticated;
