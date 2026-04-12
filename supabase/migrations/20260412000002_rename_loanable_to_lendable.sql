-- Align naming: "lendable" in code and API matches the DB column.

alter table public.user_games rename column loanable to lendable;

comment on column public.user_games.lendable is
  'Whether this title is offered for borrowing (synced from status rules on update).';
