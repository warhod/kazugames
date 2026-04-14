-- Track who initiated a loan request and let either participant initiate.

alter table public.game_loans
  add column if not exists requested_by_id uuid references auth.users (id);

update public.game_loans
set requested_by_id = coalesce(requested_by_id, borrower_id)
where requested_by_id is null;

alter table public.game_loans
  alter column requested_by_id set not null;

drop policy if exists "game_loans_insert_borrower" on public.game_loans;
create policy "game_loans_insert_participant"
  on public.game_loans for insert
  to authenticated
  with check (
    (auth.uid() = owner_id or auth.uid() = borrower_id)
    and auth.uid() = requested_by_id
  );
