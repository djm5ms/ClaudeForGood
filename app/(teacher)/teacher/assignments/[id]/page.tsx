import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { BookOpen, Users, MessageSquare, Download, Calendar, FileText } from 'lucide-react';

export default async function AssignmentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  // Get assignment details
  const { data: assignment } = await supabase
    .from('assignments')
    .select(`
      *,
      classroom:classrooms(id, name)
    `)
    .eq('id', params.id)
    .eq('teacher_id', session.user.id)
    .single();

  if (!assignment) {
    redirect('/teacher/assignments');
  }

  // Get student assignments for this assignment
  const { data: studentAssignments } = await supabase
    .from('student_assignments')
    .select(`
      id,
      status,
      submitted_at,
      student:users(id, email, full_name)
    `)
    .eq('assignment_id', params.id)
    .order('submitted_at', { ascending: false });

  // Get all questions for this assignment
  const { data: questions } = await supabase
    .from('student_questions')
    .select(`
      id,
      question_text,
      hint_response,
      created_at,
      student:users(full_name, email)
    `)
    .eq('assignment_id', params.id)
    .order('created_at', { ascending: false });

  const statusCounts = {
    not_started: studentAssignments?.filter(sa => sa.status === 'not_started').length || 0,
    in_progress: studentAssignments?.filter(sa => sa.status === 'in_progress').length || 0,
    submitted: studentAssignments?.filter(sa => sa.status === 'submitted').length || 0,
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">{assignment.title}</h1>
          <Link href={`/teacher/classrooms/${assignment.classroom.id}`}>
            <Button variant="outline" size="sm">View Classroom</Button>
          </Link>
        </div>
        <p className="text-gray-500">
          {assignment.classroom?.name}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Created {formatDate(assignment.created_at)}
        </p>
      </div>

      {/* Assignment Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{studentAssignments?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Not Started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-500">{statusCounts.not_started}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{statusCounts.in_progress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Submitted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{statusCounts.submitted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500 mb-1">Due Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <p className="font-medium">
                  {assignment.due_date ? formatDate(assignment.due_date) : 'No due date'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Hint Level</p>
              <p className="font-medium">{assignment.hint_level || 'Default'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Max Prompts</p>
              <p className="font-medium">{assignment.max_prompts}</p>
            </div>
          </div>

          {assignment.description && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Description / Questions</p>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm whitespace-pre-wrap">{assignment.description}</p>
              </div>
            </div>
          )}

          {assignment.assignment_file_url && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Assignment File</p>
              <a
                href={assignment.assignment_file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <FileText className="w-4 h-4" />
                View Assignment File
                <Download className="w-4 h-4" />
              </a>
            </div>
          )}

          {assignment.teacher_instructions && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Teacher Instructions (for AI hints)</p>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <p className="text-sm whitespace-pre-wrap">{assignment.teacher_instructions}</p>
              </div>
            </div>
          )}

          {assignment.answer_key && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Answer Key</p>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 max-h-64 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{assignment.answer_key}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Student Progress</CardTitle>
          <CardDescription>Track how students are doing on this assignment</CardDescription>
        </CardHeader>
        <CardContent>
          {studentAssignments && studentAssignments.length > 0 ? (
            <div className="space-y-3">
              {studentAssignments.map((sa: any) => (
                <div key={sa.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{sa.student?.full_name || 'No name'}</p>
                    <p className="text-sm text-gray-500">{sa.student?.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        sa.status === 'submitted'
                          ? 'bg-green-100 text-green-800'
                          : sa.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {sa.status.replace('_', ' ')}
                    </span>
                    {sa.submitted_at && (
                      <span className="text-xs text-gray-400">
                        {formatDate(sa.submitted_at)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No students have been assigned this yet</p>
              <p className="text-sm mt-1">Students will appear here once they join the classroom</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Questions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Student Questions ({questions?.length || 0})</CardTitle>
              <CardDescription>All questions students have asked about this assignment</CardDescription>
            </div>
            <Link href={`/teacher/classrooms/${assignment.classroom.id}/insights`}>
              <Button variant="outline" size="sm">
                <BookOpen className="w-4 h-4 mr-2" />
                Generate Study Materials
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {questions && questions.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {questions.map((q: any, index: number) => (
                <div key={q.id} className="border-l-4 border-primary pl-4 pb-4 border-b last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-gray-500">
                      {q.student?.full_name || 'Student'} • {formatDate(q.created_at)}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-2">{q.question_text}</p>
                  {q.hint_response && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-100 mt-2">
                      <p className="text-xs text-blue-700 font-medium mb-1">AI Hint:</p>
                      <p className="text-sm text-blue-900">{q.hint_response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No questions yet</p>
              <p className="text-sm mt-1">Questions will appear here when students ask for hints</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Link href="/teacher/assignments">
          <Button variant="outline">Back to Assignments</Button>
        </Link>
        <Link href={`/teacher/classrooms/${assignment.classroom.id}`}>
          <Button variant="outline">View Classroom</Button>
        </Link>
      </div>
    </div>
  );
}
