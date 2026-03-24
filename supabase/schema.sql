create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('student', 'admin')),
  program text,
  year_level int,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  event_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance_logs (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  time_in timestamptz,
  time_out timestamptz,
  source text not null default 'manual' check (source in ('manual', 'qr')),
  created_at timestamptz not null default now(),
  unique (student_id, date)
);

create table if not exists public.research_repository (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  abstract text not null,
  program text not null,
  year int not null,
  keywords text[] not null default '{}',
  author text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  file_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.resource_requests (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  resource_type text not null,
  details text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'fulfilled')),
  admin_notes text,
  created_at timestamptz not null default now()
);

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

create table if not exists public.discussion_rooms (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  capacity int not null default 6,
  location text not null,
  is_active boolean not null default true
);

create table if not exists public.room_reservations (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.discussion_rooms(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  reservation_date date not null,
  start_time time not null,
  end_time time not null,
  purpose text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists idx_research_program_year on public.research_repository(program, year);
create index if not exists idx_research_keywords on public.research_repository using gin (keywords);
create index if not exists idx_attendance_student_date on public.attendance_logs(student_id, date desc);
create index if not exists idx_reservation_schedule on public.room_reservations(room_id, reservation_date, start_time);
create index if not exists idx_library_resources_search on public.library_resources(title, author, category);
create index if not exists idx_borrow_tx_student_status on public.resource_borrow_transactions(student_id, status);

alter table public.profiles enable row level security;
alter table public.announcements enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.research_repository enable row level security;
alter table public.resource_requests enable row level security;
alter table public.library_resources enable row level security;
alter table public.resource_borrow_transactions enable row level security;
alter table public.discussion_rooms enable row level security;
alter table public.room_reservations enable row level security;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p where p.id = uid and p.role = 'admin'
  );
$$;

create policy "Users can read own profile"
on public.profiles
for select
using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id);

create policy "Allow profile insert for authenticated"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "Announcements readable by authenticated users"
on public.announcements
for select
to authenticated
using (true);

create policy "Announcements managed by admins"
on public.announcements
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Students can read own attendance"
on public.attendance_logs
for select
to authenticated
using (student_id = auth.uid() or public.is_admin(auth.uid()));

create policy "Students can write own attendance"
on public.attendance_logs
for insert
to authenticated
with check (student_id = auth.uid());

create policy "Students can update own attendance"
on public.attendance_logs
for update
to authenticated
using (student_id = auth.uid() or public.is_admin(auth.uid()));

create policy "Research readable by authenticated"
on public.research_repository
for select
to authenticated
using (status = 'approved' or public.is_admin(auth.uid()));

create policy "Research managed by admins"
on public.research_repository
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Students can read own requests"
on public.resource_requests
for select
to authenticated
using (student_id = auth.uid() or public.is_admin(auth.uid()));

create policy "Students can create own requests"
on public.resource_requests
for insert
to authenticated
with check (student_id = auth.uid());

create policy "Requests update by admins"
on public.resource_requests
for update
to authenticated
using (public.is_admin(auth.uid()));

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

create policy "Rooms visible to authenticated"
on public.discussion_rooms
for select
to authenticated
using (true);

create policy "Rooms managed by admins"
on public.discussion_rooms
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Students can read own reservations"
on public.room_reservations
for select
to authenticated
using (student_id = auth.uid() or public.is_admin(auth.uid()));

create policy "Students can insert own reservations"
on public.room_reservations
for insert
to authenticated
with check (student_id = auth.uid());

create policy "Reservations managed by admins"
on public.room_reservations
for update
to authenticated
using (public.is_admin(auth.uid()));

insert into public.discussion_rooms(name, capacity, location)
values
  ('Anatomy Collaboration Room', 8, '2F East Wing'),
  ('Physiology Discussion Hub', 10, '2F West Wing'),
  ('Clinical Skills Meeting Room', 12, '3F Learning Commons')
on conflict (name) do nothing;

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
