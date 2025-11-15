-- ============================================================
-- Canvas Integration Migration
-- ============================================================
-- Run this SQL in your Supabase SQL Editor to add Canvas integration
-- This adds the ability to link classrooms to Canvas courses

-- Add canvas_course_id column to classrooms table
ALTER TABLE public.classrooms
ADD COLUMN canvas_course_id text;

-- Add index for canvas_course_id lookups
CREATE INDEX idx_classrooms_canvas_course_id ON public.classrooms(canvas_course_id);

-- Add a comment to document the field
COMMENT ON COLUMN public.classrooms.canvas_course_id IS 'Canvas LMS course ID for syncing materials';
