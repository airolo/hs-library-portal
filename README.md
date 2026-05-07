# Health Sciences Library Portal

Full-stack Health Sciences Library portal built with React + TypeScript, Vite, and Supabase (Auth + PostgreSQL + RLS). The app provides role-based student and admin workflows for browsing resources, submitting requests and feedback, and managing portal content.

## Features

Student features:
- Email authentication (login/register)
- Dashboard with latest announcements and notifications
- Browse books/journals with search and filtering
- Search and filter the thesis in Unpublished Materials
- Submit book and journal suggestions with request tracking
- Track suggestion details, status updates, and admin notes in a scrollable table
- Submit feedback and issue reports with a personal report history
- Track feedback descriptions, status, and admin responses in a scrollable table
- View announcements and events

Admin features:
- Dashboard with registered students, pending requests, feedback, and announcements
- Manage student users and portal activity
- Research repository management with create, approve, and reject actions
- Books/Journals suggestion management with approve, reject, and admin notes
- Announcement and event management with create, update, and delete actions
- Feedback and issue management with resolve actions and admin responses
- Excel import support for Books/Journals and Thesis Management
- Search filtering on large request and feedback management tables

## Tech Stack

- Frontend: React, TypeScript, Vite, React Router
- UI patterns: reusable cards, modal dialogs, tables, and responsive layouts
- Data import: xlsx for Excel-based bulk import
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
  hooks/
  lib/
  pages/
    admin/
    auth/
    student/
  routes/
  services/
  types/
  utils/
    excelImport.ts
supabase/
  library-resources-only.sql
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
- If you only want the library resources seed and table setup, run [supabase/library-resources-only.sql](supabase/library-resources-only.sql).

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
- Students can view resources, submit requests, track their requests, and send feedback.
- Admins can manage announcements, research, requests, feedback, attendance, and room-related workflows.

## Recent Updates

- Request tracking now includes details and admin notes for book and journal suggestions.
- Feedback reports now include descriptions plus admin responses.
- Large request and feedback tables include scrollable table containers for better usability.
- Admin request and feedback management pages include search filtering.
- Books/Journals and Thesis Management support Excel import.

## Build

```bash
npm run build
```
