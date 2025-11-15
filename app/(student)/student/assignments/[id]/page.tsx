import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';
import { QuestionForm } from '@/components/student/question-form';
import { QuestionHistory } from '@/components/student/question-history';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

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
      classroom:classrooms(name)
    `)
    .eq('id', params.id)
    .single();

  if (!assignment) {
    redirect('/student/assignments');
  }

  // Get or create student assignment
  let { data: studentAssignment } = await supabase
    .from('student_assignments')
    .select('*')
    .eq('student_id', session.user.id)
    .eq('assignment_id', params.id)
    .single();

  if (!studentAssignment) {
    // Create student assignment if it doesn't exist
    const { data: newSA } = await supabase
      .from('student_assignments')
      .insert({
        student_id: session.user.id,
        assignment_id: params.id,
        classroom_id: assignment.classroom_id,
        status: 'not_started',
      })
      .select()
      .single();
    studentAssignment = newSA;
  }

  // Get question history
  const { data: questions } = await supabase
    .from('student_questions')
    .select('*')
    .eq('student_assignment_id', studentAssignment.id)
    .order('created_at', { ascending: true });

  const canAskMore = studentAssignment.prompts_used < assignment.max_prompts;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{assignment.title}</h1>
        <p className="text-gray-500 mt-1">{assignment.classroom.name}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignment.description && (
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-gray-600">{assignment.description}</p>
              </div>
            )}
            {assignment.assignment_file_url && (
              <div>
                <h4 className="font-medium mb-2">Assignment File</h4>
                <Link href={assignment.assignment_file_url} target="_blank">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Assignment PDF
                  </Button>
                </Link>
              </div>
            )}
            {assignment.due_date && (
              <div>
                <h4 className="font-medium mb-2">Due Date</h4>
                <p className="text-gray-600">{formatDate(assignment.due_date)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                studentAssignment.status === 'submitted' ? 'bg-green-100 text-green-800' :
                studentAssignment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {studentAssignment.status.replace('_', ' ')}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Hints Used</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${(studentAssignment.prompts_used / assignment.max_prompts) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {studentAssignment.prompts_used} / {assignment.max_prompts}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Hint Level</p>
              <p className="font-medium">Level {assignment.hint_level || 3}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ask a Question</CardTitle>
          <CardDescription>
            Get hints to help you solve the problem (never direct answers)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canAskMore ? (
            <QuestionForm
              assignmentId={params.id}
              studentAssignmentId={studentAssignment.id}
              assignmentContext={assignment.description || assignment.title}
              answerKey={assignment.answer_key}
              hintLevel={assignment.hint_level || 3}
              teacherInstructions={assignment.teacher_instructions}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="font-medium">You have used all your hints for this assignment</p>
              <p className="text-sm mt-2">Contact your teacher if you need additional help</p>
            </div>
          )}
        </CardContent>
      </Card>

      {questions && questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Question History</CardTitle>
            <CardDescription>Your previous questions and hints</CardDescription>
          </CardHeader>
          <CardContent>
            <QuestionHistory questions={questions} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
