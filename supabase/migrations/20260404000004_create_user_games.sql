-- Per-user collection entries (status + loanable flag).

do $$
begin
  create type public.game_status as enum (
    'owned',
    'wishlist',
    'playing',
    'completed',
    'abandoned'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.user_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  status public.game_status not null,
  loanable boolean not null default false,
  created_at timestamptz not null default now(),
  constraint user_games_user_game_key unique (user_id, game_id)
);

create index if not exists user_games_user_id_idx on public.user_games (user_id);
create index if not exists user_games_game_id_idx on public.user_games (game_id);

comment on table public.user_games is 'User library: one row per user per game.';

alter table public.user_games enable row level security;

drop policy if exists "user_games_select_own" on public.user_games;
create policy "user_games_select_own"
  on public.user_games for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_games_select_fellow_group_member" on public.user_games;
create policy "user_games_select_fellow_group_member"
  on public.user_games for select
  to authenticated
  using (public.user_shares_group_with(user_id));

drop policy if exists "user_games_insert_own" on public.user_games;
create policy "user_games_insert_own"
  on public.user_games for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_games_update_own" on public.user_games;
create policy "user_games_update_own"
  on public.user_games for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_games_delete_own" on public.user_games;
create policy "user_games_delete_own"
  on public.user_games for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on table public.user_games to authenticated;
