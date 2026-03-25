-- Create library_resources table
create table if not exists public.library_resources (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  resource_type text not null check (resource_type in ('book', 'journal')),
  author text not null,
  publisher text,
  publication_year int,
  identifier_code text,
  category text,
  description text,
  total_copies int not null check (total_copies >= 1),
  available_copies int not null check (available_copies >= 0 and available_copies <= total_copies),
  created_at timestamptz not null default now()
);

-- Create resource_borrow_transactions table
create table if not exists public.resource_borrow_transactions (
  id uuid primary key default uuid_generate_v4(),
  resource_id uuid not null references public.library_resources(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  borrowed_at timestamptz not null default now(),
  due_at timestamptz,
  returned_at timestamptz,
  status text not null default 'borrowed' check (status in ('borrowed', 'returned', 'overdue')),
  created_at timestamptz not null default now()
);

-- Create indexes
create index if not exists idx_library_resources_search on public.library_resources(title, author, category);
create index if not exists idx_borrow_tx_student_status on public.resource_borrow_transactions(student_id, status);

-- Enable RLS
alter table public.library_resources enable row level security;
alter table public.resource_borrow_transactions enable row level security;

-- RLS Policies for library_resources
drop policy if exists "Library resources readable by authenticated" on public.library_resources;
drop policy if exists "Library resources managed by admins" on public.library_resources;

create policy "Library resources readable by authenticated"
on public.library_resources
for select
to authenticated
using (true);

create policy "Library resources managed by admins"
on public.library_resources
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- RLS Policies for resource_borrow_transactions
drop policy if exists "Students read own borrow history" on public.resource_borrow_transactions;
drop policy if exists "Students create own borrow entries" on public.resource_borrow_transactions;
drop policy if exists "Borrow entries managed by admins" on public.resource_borrow_transactions;

create policy "Students read own borrow history"
on public.resource_borrow_transactions
for select
to authenticated
using (student_id = auth.uid() or public.is_admin(auth.uid()));

create policy "Students create own borrow entries"
on public.resource_borrow_transactions
for insert
to authenticated
with check (student_id = auth.uid());

create policy "Borrow entries managed by admins"
on public.resource_borrow_transactions
for update
to authenticated
using (public.is_admin(auth.uid()));

-- Insert sample data
insert into public.library_resources(
  title,
  resource_type,
  author,
  publisher,
  publication_year,
  identifier_code,
  category,
  description,
  total_copies,
  available_copies
)
values
  (
    'Robbins and Cotran Pathologic Basis of Disease',
    'book',
    'Kumar, Abbas, Aster',
    'Elsevier',
    2020,
    'ISBN 9780323531139',
    'Pathology',
    'Core pathology textbook used in medicine training.',
    6,
    6
  ),
  (
    'Harrison''s Principles of Internal Medicine',
    'book',
    'Jameson et al.',
    'McGraw Hill',
    2022,
    'ISBN 9781264268504',
    'Internal Medicine',
    'Comprehensive internal medicine reference.',
    5,
    4
  ),
  (
    'The Lancet',
    'journal',
    'The Lancet Editorial Team',
    'Elsevier',
    2026,
    'ISSN 0140-6736',
    'General Medicine',
    'Peer-reviewed weekly medical journal.',
    12,
    12
  )
on conflict do nothing;
