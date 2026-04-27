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

-- SplitMate tables
create table if not exists public.groups (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.members (
  id text primary key,
  owner_user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  group_id text not null references public.groups(id) on delete cascade,
  name text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  group_id text not null references public.groups(id) on delete cascade,
  title text not null,
  amount numeric not null default 0,
  paid_by text not null references public.members(id) on delete cascade,
  split_type text not null default 'equal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expense_splits (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  expense_id text not null references public.expenses(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  amount numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settlements (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  group_id text not null references public.groups(id) on delete cascade,
  from_member text not null references public.members(id) on delete cascade,
  to_member text not null references public.members(id) on delete cascade,
  amount numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_groups_user_id on public.groups(user_id);
create index if not exists idx_members_owner_user_id on public.members(owner_user_id);
create index if not exists idx_members_group_id on public.members(group_id);
create index if not exists idx_expenses_user_id on public.expenses(user_id);
create index if not exists idx_expenses_group_id on public.expenses(group_id);
create index if not exists idx_expense_splits_user_id on public.expense_splits(user_id);
create index if not exists idx_expense_splits_expense_id on public.expense_splits(expense_id);
create index if not exists idx_settlements_user_id on public.settlements(user_id);
create index if not exists idx_settlements_group_id on public.settlements(group_id);

drop trigger if exists trg_groups_updated_at on public.groups;
create trigger trg_groups_updated_at before update on public.groups for each row execute function public.set_updated_at();

drop trigger if exists trg_members_updated_at on public.members;
create trigger trg_members_updated_at before update on public.members for each row execute function public.set_updated_at();

drop trigger if exists trg_expenses_updated_at on public.expenses;
create trigger trg_expenses_updated_at before update on public.expenses for each row execute function public.set_updated_at();

drop trigger if exists trg_expense_splits_updated_at on public.expense_splits;
create trigger trg_expense_splits_updated_at
before update on public.expense_splits
for each row execute function public.set_updated_at();

drop trigger if exists trg_settlements_updated_at on public.settlements;
create trigger trg_settlements_updated_at
before update on public.settlements
for each row execute function public.set_updated_at();

alter table public.groups enable row level security;
alter table public.members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;

drop policy if exists "groups_select_own" on public.groups;
create policy "groups_select_own" on public.groups for select to authenticated using (user_id = auth.uid());
drop policy if exists "groups_insert_own" on public.groups;
create policy "groups_insert_own" on public.groups for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "groups_update_own" on public.groups;
create policy "groups_update_own" on public.groups for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "groups_delete_own" on public.groups;
create policy "groups_delete_own" on public.groups for delete to authenticated using (user_id = auth.uid());

drop policy if exists "members_select_own" on public.members;
create policy "members_select_own" on public.members for select to authenticated using (owner_user_id = auth.uid());
drop policy if exists "members_insert_own" on public.members;
create policy "members_insert_own" on public.members for insert to authenticated with check (owner_user_id = auth.uid());
drop policy if exists "members_update_own" on public.members;
create policy "members_update_own" on public.members for update to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
drop policy if exists "members_delete_own" on public.members;
create policy "members_delete_own" on public.members for delete to authenticated using (owner_user_id = auth.uid());

drop policy if exists "expenses_select_own" on public.expenses;
create policy "expenses_select_own" on public.expenses for select to authenticated using (user_id = auth.uid());
drop policy if exists "expenses_insert_own" on public.expenses;
create policy "expenses_insert_own" on public.expenses for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "expenses_update_own" on public.expenses;
create policy "expenses_update_own" on public.expenses for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "expenses_delete_own" on public.expenses;
create policy "expenses_delete_own" on public.expenses for delete to authenticated using (user_id = auth.uid());

drop policy if exists "expense_splits_select_own" on public.expense_splits;
create policy "expense_splits_select_own" on public.expense_splits for select to authenticated using (user_id = auth.uid());
drop policy if exists "expense_splits_insert_own" on public.expense_splits;
create policy "expense_splits_insert_own" on public.expense_splits for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "expense_splits_update_own" on public.expense_splits;
create policy "expense_splits_update_own" on public.expense_splits for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "expense_splits_delete_own" on public.expense_splits;
create policy "expense_splits_delete_own" on public.expense_splits for delete to authenticated using (user_id = auth.uid());

drop policy if exists "settlements_select_own" on public.settlements;
create policy "settlements_select_own" on public.settlements for select to authenticated using (user_id = auth.uid());
drop policy if exists "settlements_insert_own" on public.settlements;
create policy "settlements_insert_own" on public.settlements for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "settlements_update_own" on public.settlements;
create policy "settlements_update_own" on public.settlements for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "settlements_delete_own" on public.settlements;
create policy "settlements_delete_own" on public.settlements for delete to authenticated using (user_id = auth.uid());
