-- Optional stable label from signup email local-part (shown to groupmates when display_name is empty).

alter table public.profiles
  add column if not exists account_hint text;

comment on column public.profiles.account_hint is
  'Local-part of signup email at account creation; for group list labels until display_name is set.';

-- Backfill from auth (migration runs as postgres).
update public.profiles p
set account_hint = nullif(trim(split_part(coalesce(u.email, ''), '@', 1)), '')
from auth.users u
where p.user_id = u.id
  and (p.account_hint is null or btrim(p.account_hint) = '');

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  hint text;
begin
  hint := nullif(trim(split_part(coalesce(new.email, ''), '@', 1)), '');
  insert into public.profiles (user_id, account_hint)
  values (new.id, hint)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
