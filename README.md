# AI Hint Tutor Platform

## Overview
A web platform where teachers create classrooms with assignments and answer keys. Students interact with an AI that provides hints instead of direct answers, encouraging critical thinking.

## Core Features

### Teacher Tools
- Create classrooms and upload assignments with answer keys
- Upload PowerPoints/slides for AI context
- Customize AI hint levels to monitor how much information students get from prompts-- should scale so that students gradually get more information as  they are stuck on a question
- Add custom instructions from teachers
- Set prompt limits per student
- Auto-generated slideshows, pdfs, and practice problems of most-asked questions for review sessions

### Student Experience
- Get hints and guidance (never direct answers)
- Limited prompts encourage thoughtful questions
- Get access to generated material to improve learning

## How It Works
1. Teacher uploads assignment + answer key + materials
2. Teacher configures AI hint level and prompt limits
3. Students ask questions, AI provides guided hints using materials
4. System tracks all questions
5. Platform generates FAQ slideshow from common questions and gives teachers analytical information from that
6. Teacher reviews questions and awards partial credit to students if they desire to do that

## Key Benefits
- **For Teachers**: Auto-identify misconceptions, save time, get usable review materials
- **For Students**: Learn question-asking skills, get help anytime, credit for learning process

## Technical Challenges
- Prevent prompt jailbreaking (students bypassing hint-only mode)
- Secure answer key handling (AI context only, never exposed)
- LLM API cost management
- Question clustering for analytics

## Notes for first implementation
- solve the core components of the class and do not try to do anything super complicated as we will query further to do that

## Tech Stack

**Frontend & Backend:**
- Next.js 14 (App Router) + React + TypeScript + Tailwind CSS

**Database & Auth:**
- Supabase (PostgreSQL + built-in authentication)

**LLM Integration:**
- Anthropic Claude API (Sonnet for cost/speed balance)

**File Storage:**
- Supabase Storage (for PDFs, PowerPoints, answer keys)

**UI Components:**
- shadcn/ui (optional but makes things look polished fast)

**Deployment:**
- Vercel

**Key Libraries:**
- `pdf-parse` or `pdfjs-dist` for PDF text extraction
- `@supabase/supabase-js` for database/auth
- `@anthropic-ai/sdk` for Claude API

## Database Schema

### Supabase SQL Setup

Run this SQL in your Supabase SQL Editor to create all tables:

```sql
-- ============================================================
-- ENUM TYPES
-- ============================================================
-- User roles
create type user_role as enum ('teacher', 'student');
-- Enrollment status
create type enrollment_status as enum ('active', 'inactive');
-- Assignment progress status
create type assignment_status as enum ('not_started', 'in_progress', 'submitted');

-- ============================================================
-- USERS TABLE
-- ============================================================
-- NOTE: This complements supabase.auth.users — it's your metadata table.
create table public.users (
    id uuid primary key,
    email text not null unique,
    role user_role not null,
    full_name text,
    created_at timestamp with time zone default now()
);

-- ============================================================
-- CLASSROOMS
-- ============================================================
create table public.classrooms (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid not null references public.users(id) on delete cascade,
    name text not null,
    description text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- ============================================================
-- CLASSROOM ENROLLMENTS
-- ============================================================
create table public.classroom_enrollments (
    id uuid primary key default gen_random_uuid(),
    classroom_id uuid not null references public.classrooms(id) on delete cascade,
    student_id uuid not null references public.users(id) on delete cascade,
    enrolled_at timestamp with time zone default now(),
    status enrollment_status not null default 'active'
);

-- ============================================================
-- ASSIGNMENTS
-- ============================================================
create table public.assignments (
    id uuid primary key default gen_random_uuid(),
    classroom_id uuid not null references public.classrooms(id) on delete cascade,
    teacher_id uuid not null references public.users(id) on delete cascade,
    title text not null,
    description text,
    answer_key text, -- extracted text (not the PDF itself)
    assignment_file_url text, -- Supabase Storage URL
    hint_level integer check (hint_level between 1 and 5),
    teacher_instructions text,
    max_prompts integer default 10,
    created_at timestamp with time zone default now(),
    due_date timestamp with time zone
);

-- ============================================================
-- STUDENT ASSIGNMENTS
-- ============================================================
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

-- ============================================================
-- STUDENT QUESTIONS
-- ============================================================
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

### Key Schema Notes

**Enum Types:**
- `user_role`: 'teacher' | 'student'
- `enrollment_status`: 'active' | 'inactive'
- `assignment_status`: 'not_started' | 'in_progress' | 'submitted'

**Answer Key Handling:**
Teachers upload answer keys as PDFs. Processing flow:
1. Upload PDF to Supabase Storage
2. Make Claude API call with PDF (using document/base64 format)
3. Extract text content from Claude's response
4. Store extracted text in `answer_key` field
5. Use this text in system prompts when providing student hints

**Cascading Deletes:**
- Deleting a user removes all their classrooms, enrollments, assignments, and questions
- Deleting a classroom removes all enrollments and assignments
- Deleting an assignment removes all student assignments and questions

### File Storage Structure (Supabase Storage)
```
assignments/
  ├── {assignment_id}/
      ├── assignment.pdf
      └── materials/
          ├── lecture1.pptx
          └── lecture2.pdf

answer-keys/
  └── {assignment_id}/
      └── answer-key.pdf
```

## Next Steps
Ready for implementation - everything in one monorepo, TypeScript everywhere, deploy with `git push`.
