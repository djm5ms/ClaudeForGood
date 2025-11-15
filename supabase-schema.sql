-- ============================================================
-- AI Hint Tutor Platform - Supabase Database Schema
-- ============================================================
-- Run this SQL in your Supabase SQL Editor to set up the database

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

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_enrollments enable row level security;
alter table public.assignments enable row level security;
alter table public.student_assignments enable row level security;
alter table public.student_questions enable row level security;

-- Users table policies
create policy "Users can view their own data"
    on public.users for select
    using (auth.uid() = id);

create policy "Users can update their own data"
    on public.users for update
    using (auth.uid() = id);

-- Classrooms policies
create policy "Teachers can create classrooms"
    on public.classrooms for insert
    with check (auth.uid() = teacher_id);

create policy "Teachers can view their classrooms"
    on public.classrooms for select
    using (auth.uid() = teacher_id);

create policy "Students can view enrolled classrooms"
    on public.classrooms for select
    using (
        exists (
            select 1 from public.classroom_enrollments
            where classroom_id = classrooms.id
            and student_id = auth.uid()
            and status = 'active'
        )
    );

create policy "Teachers can update their classrooms"
    on public.classrooms for update
    using (auth.uid() = teacher_id);

create policy "Teachers can delete their classrooms"
    on public.classrooms for delete
    using (auth.uid() = teacher_id);

-- Classroom enrollments policies
create policy "Students can view their enrollments"
    on public.classroom_enrollments for select
    using (auth.uid() = student_id);

create policy "Teachers can view enrollments in their classrooms"
    on public.classroom_enrollments for select
    using (
        exists (
            select 1 from public.classrooms
            where id = classroom_enrollments.classroom_id
            and teacher_id = auth.uid()
        )
    );

-- Assignments policies
create policy "Teachers can create assignments"
    on public.assignments for insert
    with check (auth.uid() = teacher_id);

create policy "Teachers can view their assignments"
    on public.assignments for select
    using (auth.uid() = teacher_id);

create policy "Students can view assignments in enrolled classrooms"
    on public.assignments for select
    using (
        exists (
            select 1 from public.classroom_enrollments
            where classroom_id = assignments.classroom_id
            and student_id = auth.uid()
            and status = 'active'
        )
    );

create policy "Teachers can update their assignments"
    on public.assignments for update
    using (auth.uid() = teacher_id);

create policy "Teachers can delete their assignments"
    on public.assignments for delete
    using (auth.uid() = teacher_id);

-- Student assignments policies
create policy "Students can view their assignments"
    on public.student_assignments for select
    using (auth.uid() = student_id);

create policy "Students can insert their assignments"
    on public.student_assignments for insert
    with check (auth.uid() = student_id);

create policy "Students can update their assignments"
    on public.student_assignments for update
    using (auth.uid() = student_id);

create policy "Teachers can view student assignments in their classrooms"
    on public.student_assignments for select
    using (
        exists (
            select 1 from public.classrooms
            where id = student_assignments.classroom_id
            and teacher_id = auth.uid()
        )
    );

-- Student questions policies
create policy "Students can view their questions"
    on public.student_questions for select
    using (auth.uid() = student_id);

create policy "Students can insert their questions"
    on public.student_questions for insert
    with check (auth.uid() = student_id);

create policy "Teachers can view questions in their assignments"
    on public.student_questions for select
    using (
        exists (
            select 1 from public.assignments
            where id = student_questions.assignment_id
            and teacher_id = auth.uid()
        )
    );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Create storage bucket for assignments (run in Supabase Storage UI or via SQL)
-- insert into storage.buckets (id, name, public) values ('assignments', 'assignments', true);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
create index idx_classrooms_teacher_id on public.classrooms(teacher_id);
create index idx_classroom_enrollments_student_id on public.classroom_enrollments(student_id);
create index idx_classroom_enrollments_classroom_id on public.classroom_enrollments(classroom_id);
create index idx_assignments_classroom_id on public.assignments(classroom_id);
create index idx_assignments_teacher_id on public.assignments(teacher_id);
create index idx_student_assignments_student_id on public.student_assignments(student_id);
create index idx_student_assignments_assignment_id on public.student_assignments(assignment_id);
create index idx_student_questions_student_id on public.student_questions(student_id);
create index idx_student_questions_assignment_id on public.student_questions(assignment_id);
create index idx_student_questions_student_assignment_id on public.student_questions(student_assignment_id);
