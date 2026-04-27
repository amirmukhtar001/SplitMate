create table if not exists public.loans (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null default 0,
  note text default '',
  payments jsonb not null default '[]'::jsonb,
  loan_date text,
  reminder_date timestamptz,
  reminder_repeat text not null default 'NONE',
  loan_direction text not null default 'RECEIVABLE',
  is_paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  notification_id text,
  language text not null default 'roman_urdu'
);

alter table public.loans
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.loans
  alter column user_id set default auth.uid();

alter table public.loans
  add column if not exists loan_direction text not null default 'RECEIVABLE';

alter table public.loans
  drop constraint if exists loans_loan_direction_check;

alter table public.loans
  add constraint loans_loan_direction_check
  check (loan_direction in ('RECEIVABLE', 'PAYABLE'));

create index if not exists idx_loans_user_id on public.loans(user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_loans_updated_at on public.loans;
create trigger trg_loans_updated_at
before update on public.loans
for each row
execute function public.set_updated_at();

alter table public.loans enable row level security;

drop policy if exists "loans_select_all" on public.loans;
drop policy if exists "loans_insert_all" on public.loans;
drop policy if exists "loans_update_all" on public.loans;
drop policy if exists "loans_delete_all" on public.loans;

drop policy if exists "loans_select_own" on public.loans;
create policy "loans_select_own"
on public.loans
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "loans_insert_own" on public.loans;
create policy "loans_insert_own"
on public.loans
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "loans_update_own" on public.loans;
create policy "loans_update_own"
on public.loans
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "loans_delete_own" on public.loans;
create policy "loans_delete_own"
on public.loans
for delete
to authenticated
using (user_id = auth.uid());
