-- Run this once in Supabase: Dashboard > SQL Editor > New query > paste > Run

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Admin',
  email text not null unique,
  password text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.interns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text not null,
  department text not null,
  joining_date date not null,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  password text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  assigned_to uuid not null references public.interns (id) on delete cascade,
  deadline date not null,
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High')),
  status text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Completed')),
  submission jsonb,          -- {description, githubUrl, documentUrl, submittedAt, reviewStatus, feedback, reviewedAt}
  submitted_at timestamptz,  -- mirrors submission.submittedAt, used for sorting
  created_at timestamptz not null default now()
);

create index if not exists tasks_assigned_to_idx on public.tasks (assigned_to);
create index if not exists tasks_status_idx on public.tasks (status);

-- Lock the tables down. Only the Express API (service role key) can read or write them;
-- the public anon key gets no access because no policies exist.
alter table public.admins enable row level security;
alter table public.interns enable row level security;
alter table public.tasks enable row level security;
