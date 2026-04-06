create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

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
  location text not null default 'Unassigned shelf',
  program text not null,
  year int not null,
  keywords text[] not null default '{}',
  author text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  file_url text,
  created_at timestamptz not null default now()
);

alter table public.research_repository
add column if not exists location text not null default 'Unassigned shelf';

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
  call_number text,
  category text,
  description text,
  total_copies int not null check (total_copies >= 1),
  available_copies int not null check (available_copies >= 0 and available_copies <= total_copies),
  created_at timestamptz not null default now()
);

alter table public.library_resources
add column if not exists call_number text;

alter table public.library_resources
drop column if exists location,
drop column if exists publisher,
drop column if exists publication_year,
drop column if exists identifier_code;

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

drop table if exists public.room_reservations cascade;
drop table if exists public.discussion_rooms cascade;

create table if not exists public.feedback_reports (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('book_request', 'journal_access', 'repository_issue', 'general_feedback', 'bug_report')),
  description text not null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'new' check (status in ('new', 'in_review', 'resolved', 'closed')),
  admin_response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.feedback_reports
drop column if exists subject;

create index if not exists idx_research_program_year on public.research_repository(program, year);
create index if not exists idx_research_keywords on public.research_repository using gin (keywords);
create index if not exists idx_attendance_student_date on public.attendance_logs(student_id, date desc);
create index if not exists idx_feedback_student_status on public.feedback_reports(student_id, status, created_at desc);
create index if not exists idx_library_resources_search on public.library_resources(title, author, category);
create index if not exists idx_borrow_tx_student_status on public.resource_borrow_transactions(student_id, status);

alter table public.profiles enable row level security;
alter table public.announcements enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.research_repository enable row level security;
alter table public.resource_requests enable row level security;
alter table public.library_resources enable row level security;
alter table public.resource_borrow_transactions enable row level security;
alter table public.feedback_reports enable row level security;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p where p.id = uid and p.role = 'admin'
  );
$$;

create or replace function public.admin_reset_user_password(target_user_id uuid, new_password text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_admin(auth.uid()) then
    raise exception 'Only admins can reset passwords';
  end if;

  if length(trim(coalesce(new_password, ''))) < 8 then
    raise exception 'Password must be at least 8 characters long';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = target_user_id
      and p.role = 'student'
  ) then
    raise exception 'Target student account not found';
  end if;

  update auth.users
  set encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  where id = target_user_id;

  if not found then
    raise exception 'Authentication account not found';
  end if;
end;
$$;

revoke all on function public.admin_reset_user_password(uuid, text) from public;
grant execute on function public.admin_reset_user_password(uuid, text) to authenticated;

create policy "Users can read own profile"
on public.profiles
for select
using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id);

create policy "Profiles managed by admins"
on public.profiles
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Profiles deletable by admins"
on public.profiles
for delete
to authenticated
using (public.is_admin(auth.uid()));

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

create policy "Requests delete by admins"
on public.resource_requests
for delete
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

create policy "Students can read own feedback reports"
on public.feedback_reports
for select
to authenticated
using (student_id = auth.uid() or public.is_admin(auth.uid()));

create policy "Students can insert own feedback reports"
on public.feedback_reports
for insert
to authenticated
with check (student_id = auth.uid());

create policy "Feedback reports managed by admins"
on public.feedback_reports
for update
to authenticated
using (public.is_admin(auth.uid()));

create policy "Feedback reports deletable by admins"
on public.feedback_reports
for delete
to authenticated
using (public.is_admin(auth.uid()));

insert into public.library_resources(
  title,
  resource_type,
  author,
  call_number,
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
    'QZ 4 R635 2020',
    'Pathology',
    'Core pathology textbook used in medicine training.',
    6,
    6
  ),
  (
    'Harrison''s Principles of Internal Medicine',
    'book',
    'Jameson et al.',
    'WB 115 H322 2022',
    'Internal Medicine',
    'Comprehensive internal medicine reference.',
    5,
    4
  ),
  (
    'The Lancet',
    'journal',
    'The Lancet Editorial Team',
    'PER W1 LA787',
    'General Medicine',
    'Peer-reviewed weekly medical journal.',
    12,
    12
  )
on conflict do nothing;
