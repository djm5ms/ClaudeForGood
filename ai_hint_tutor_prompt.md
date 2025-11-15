# AI Hint Tutor Platform — MVP Generation Prompt

This Markdown file is a complete prompt for Claude to generate the entire project.  
It is intentionally simplified, structured, and emphasizes *working baseline > feature completeness*.

## Title: Generate a Minimal but Fully Working MVP of the AI Hint Tutor Platform

Claude, I want you to generate the **full codebase** for a minimal, working version of the platform described below.

### Critical Requirements
- We want a **general working project**, not a fully advanced one.
- Architecture must be **open and extensible** so we can expand later.
- If something is too big to implement fully, **provide a functioning stub**.
- The most important thing is that the project **builds, runs, and is cleanly structured**.

# Project Overview — AI Hint Tutor Platform

We want a simple MVP where:

- Teachers create classrooms and upload assignments + answer keys.
- Students ask questions and receive **hints** (never direct answers) from the AI.
- All student questions are logged.
- The system uses Supabase and Claude.

This first version should remain simple and use an architecture that can scale later.

# Tech Stack (Use Exactly This)

- **Next.js 14** (App Router)
- **React + TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **Supabase**
  - PostgreSQL
  - Auth
  - Storage
- **Anthropic Claude API** (Sonnet)
- **Vercel** for deployment

Keep code modular, readable, and future-proof.

# MVP Features to Implement (Simplified)

## 1. Authentication
- Teacher signup/login  
- Student signup/login  
- Store role in `public.users`  
- Use Supabase Auth

## 2. Classrooms
Teachers:
- Create classroom (name + description)

Students:
- See classrooms they’re enrolled in

## 3. Assignments
Teachers:
- Upload assignment PDF  
- Upload answer key PDF  
- Set hint level (1–5)  
- Set max prompts per student  

Students:
- View assignment  
- Ask question  
- Receive hint response via Claude  
  - OK to stub with template responses in first version

## 4. Student Questions
- Save student question  
- Save hint response  
- Increase `prompts_used`

## 5. Database
Use **the exact schema** provided in the README.  
Claude should generate matching TypeScript types.

# 🗄 Database Schema (Source of Truth)

```sql
-- ENUM TYPES
create type user_role as enum ('teacher', 'student');
create type enrollment_status as enum ('active', 'inactive');
create type assignment_status as enum ('not_started', 'in_progress', 'submitted');

-- USERS TABLE
create table public.users (
    id uuid primary key,
    email text not null unique,
    role user_role not null,
    full_name text,
    created_at timestamp with time zone default now()
);

-- CLASSROOMS
create table public.classrooms (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid not null references public.users(id) on delete cascade,
    name text not null,
    description text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- CLASSROOM ENROLLMENTS
create table public.classroom_enrollments (
    id uuid primary key default gen_random_uuid(),
    classroom_id uuid not null references public.classrooms(id) on delete cascade,
    student_id uuid not null references public.users(id) on delete cascade,
    enrolled_at timestamp with time zone default now(),
    status enrollment_status not null default 'active'
);

-- ASSIGNMENTS
create table public.assignments (
    id uuid primary key default gen_random_uuid(),
    classroom_id uuid not null references public.classrooms(id) on delete cascade,
    teacher_id uuid not null references public.users(id) on delete cascade,
    title text not null,
    description text,
    answer_key text,
    assignment_file_url text,
    hint_level integer check (hint_level between 1 and 5),
    teacher_instructions text,
    max_prompts integer default 10,
    created_at timestamp with time zone default now(),
    due_date timestamp with time zone
);

-- STUDENT ASSIGNMENTS
create table public.student_assignments (
    id uuid primary key default gen_random_uuid(),
    student_id uuid not null references public.users(id) on delete cascade,
    assignment_id uuid not null references public.assignments(id) on delete cascade,
    classroom_id uuid not null references public.classrooms(id) on delete cascade,
    prompts_used integer default 0,
    status assignment_status not null default 'not_started',
    created_at timestamp with time zone default now(),
    submitted_at timestamp with time zone
);

-- STUDENT QUESTIONS
create table public.student_questions (
    id uuid primary key default gen_random_uuid(),
    student_id uuid not null references public.users(id) on delete cascade,
    assignment_id uuid not null references public.assignments(id) on delete cascade,
    student_assignment_id uuid not null references public.student_assignments(id) on delete cascade,
    question_text text not null,
    hint_response text,
    created_at timestamp with time zone default now()
);
```

# 🏗 Architecture Requirements

The project structure should look like:

```
app/
  (teacher)/
    dashboard/
    classrooms/
    assignments/
    ...
  (student)/
    dashboard/
    assignments/
    ask/
lib/
  supabaseClient.ts
  claude.ts (stub allowed)
types/
  db.ts (Supabase types)
components/
  ui/
  forms/
  layout/
.env.example
```

# What Claude Must Output

Claude must generate:

1. Complete folder + file tree  
2. All code files (full content, not placeholders)  
3. Working Next.js pages (even if simple)  
4. Supabase client setup  
5. Claude API helper (stub allowed)  
6. Full `.env.example`  
7. Setup instructions  
8. How to run locally  
9. Deployment instructions (Vercel)  

Everything must be runnable immediately after copy/paste.

# ⚠ Final Instructions to Claude

Claude, please:

- Keep everything **simple and working**.
- Use an **open architecture** so we can expand with more features later.
- Stub anything too large to fully implement now (but keep structure).
- The top priority is that the project **builds, runs, and is cleanly organized**.

Now generate the **full working project** following this prompt.
