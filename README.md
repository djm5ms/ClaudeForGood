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

## MVP Implementation Complete!

This is a **working MVP** with all core features implemented. The application is ready to run locally or deploy to Vercel.

---

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works)
- An Anthropic API key

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the database schema (provided below in this README)
3. Go to Settings > API to get your project URL and anon key
4. Create a storage bucket named `assignments` (Settings > Storage)

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
# Copy from .env.example
cp .env.example .env.local
```

Then fill in your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Create Test Accounts

1. Go to `/auth/signup`
2. Create a teacher account (select "Teacher" role)
3. Create a student account (select "Student" role)

---

## Deployment to Vercel

### Quick Deploy

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add your environment variables in Vercel project settings
4. Deploy!

### Environment Variables for Production

Make sure to add all variables from `.env.example` in your Vercel project settings.

---

## Project Structure

```
├── app/
│   ├── (teacher)/              # Teacher route group
│   │   └── teacher/
│   │       ├── dashboard/      # Teacher dashboard
│   │       ├── classrooms/     # Classroom management
│   │       └── assignments/    # Assignment creation
│   ├── (student)/              # Student route group
│   │   └── student/
│   │       ├── dashboard/      # Student dashboard
│   │       └── assignments/    # View and work on assignments
│   ├── auth/                   # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── api/
│   │   └── ask-question/       # API route for AI hints
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/                 # Navigation components
│   └── student/                # Student-specific components
├── lib/
│   ├── supabase/               # Supabase client setup
│   ├── claude.ts               # Claude API integration
│   └── utils.ts                # Utility functions
├── types/
│   └── db.ts                   # TypeScript types
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

---

## How to Use the Platform

### As a Teacher

1. **Create a Classroom**
   - Go to Dashboard > Create Classroom
   - Add a name and description

2. **Create an Assignment**
   - Go to Assignments > Create Assignment
   - Select a classroom
   - Add title, description, and optional PDF file
   - Set hint level (1-5) - controls how detailed hints are
   - Set max prompts per student
   - Add answer key (used by AI for context, never shown to students)
   - Add optional teacher instructions for the AI

3. **Enroll Students** (Manual enrollment for MVP)
   - Currently, you need to manually add student enrollments via Supabase dashboard
   - Future versions will include invite codes/links

### As a Student

1. **View Assignments**
   - See all your assignments on the Dashboard or Assignments page

2. **Work on an Assignment**
   - Click on an assignment to view details
   - Read the assignment description and download the PDF if available
   - Ask questions in the question form

3. **Get AI Hints**
   - Type your question clearly
   - The AI will provide hints based on the hint level set by your teacher
   - The AI will NEVER give you direct answers, only guidance
   - You can see all your previous questions and hints in the Question History

---

## Features Implemented in MVP

✅ User authentication (teacher/student roles)
✅ Classroom creation and management
✅ Assignment creation with PDF upload
✅ AI hint configuration (hint levels 1-5)
✅ Prompt limits per student
✅ Student question/answer interface
✅ AI-powered hint generation using Claude
✅ Question history tracking
✅ Progress tracking (prompts used, assignment status)
✅ Responsive UI with Tailwind CSS
✅ Type-safe with TypeScript

---

## Future Enhancements

The following features are planned for future versions:

- Classroom invite codes for easy student enrollment
- Teacher view of all student questions
- Analytics dashboard for teachers
- Auto-generated FAQ slideshows from common questions
- Bulk PDF text extraction for answer keys
- Support for PowerPoint slides as context
- Partial credit system
- Question clustering and analytics
- Advanced anti-jailbreak measures
- Export functionality for questions/answers

---

## Troubleshooting

### "Can't find module" errors
Make sure you've run `npm install`

### Supabase connection errors
- Verify your `.env.local` has correct values
- Check that your Supabase project is active
- Ensure you've run the database schema SQL

### Claude API errors
- Verify your Anthropic API key is correct
- Check you have credits in your Anthropic account
- The free tier has rate limits

### Build errors
- Delete `.next` folder and `node_modules`
- Run `npm install` again
- Run `npm run build` to test production build

---

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **AI**: Anthropic Claude (Sonnet 4.5)
- **Deployment**: Vercel

---

## License

This project is for educational purposes.
