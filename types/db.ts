// Database Types based on Supabase Schema

export type UserRole = 'teacher' | 'student';
export type EnrollmentStatus = 'active' | 'inactive';
export type AssignmentStatus = 'not_started' | 'in_progress' | 'submitted';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
}

export interface Classroom {
  id: string;
  teacher_id: string;
  name: string;
  description: string | null;
  canvas_course_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassroomEnrollment {
  id: string;
  classroom_id: string;
  student_id: string;
  enrolled_at: string;
  status: EnrollmentStatus;
}

export interface Assignment {
  id: string;
  classroom_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  answer_key: string | null;
  assignment_file_url: string | null;
  hint_level: number | null;
  teacher_instructions: string | null;
  max_prompts: number;
  created_at: string;
  due_date: string | null;
}

export interface StudentAssignment {
  id: string;
  student_id: string;
  assignment_id: string;
  classroom_id: string;
  prompts_used: number;
  status: AssignmentStatus;
  created_at: string;
  submitted_at: string | null;
}

export interface StudentQuestion {
  id: string;
  student_id: string;
  assignment_id: string;
  student_assignment_id: string;
  question_text: string;
  hint_response: string | null;
  created_at: string;
}

// Extended types with joined data for convenience
export interface ClassroomWithTeacher extends Classroom {
  teacher: User;
}

export interface AssignmentWithClassroom extends Assignment {
  classroom: Classroom;
}

export interface StudentAssignmentWithDetails extends StudentAssignment {
  assignment: Assignment;
  classroom: Classroom;
}
