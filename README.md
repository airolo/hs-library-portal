# Health Sciences Library Portal

Full-stack web application for a College of Medicine Health Sciences Library, built with React + TypeScript and Supabase (Auth + PostgreSQL + RLS).

## Features

Student features:
- Email authentication (login/register)
- Dashboard with announcements and quick links
- Attendance logging (manual time in/time out fallback)
- Research repository search and filtering
- Book/resource request submission with status tracking
- Announcements and events viewing
- Discussion room reservation booking

Admin features:
- Analytics dashboard (daily/monthly visits, active program, average stay duration)
- Attendance log monitoring
- Research repository management (create/approve/reject)
- Resource request management (approve/reject)
- Announcement/event management (create/update/delete)
- Discussion room reservation management (approve/reject)

## Tech Stack

- Frontend: React, TypeScript, Vite, React Router
- Forms and utilities: react-hook-form, zod, date-fns
- Backend: Supabase Auth and PostgreSQL
- Security: Row Level Security policies in SQL schema

## Project Structure

```text
src/
  components/
    auth/
    layout/
    ui/
  contexts/
  lib/
  pages/
    admin/
    auth/
    student/
  routes/
  services/
  types/
  utils/
supabase/
  schema.sql
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root and set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_RESEARCH_BUCKET` (existing public storage bucket for research PDFs)

Example:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_RESEARCH_BUCKET=research-pdfs
```

3. Apply database schema:
- Open Supabase SQL editor.
- Run [supabase/schema.sql](supabase/schema.sql).

4. Create an admin account:
- Register a user (or create via Supabase Auth).
- Update `public.profiles.role` to `admin` for that user.

5. Run the app:

```bash
npm run dev
```

## Database and RBAC

Schema and RLS policies are in [supabase/schema.sql](supabase/schema.sql).

Role-based control:
- Students can access and mutate only their own attendance, requests, and reservations.
- Admins can manage announcements, research, requests, rooms, and monitor all attendance.

## Build

```bash
npm run build
```
