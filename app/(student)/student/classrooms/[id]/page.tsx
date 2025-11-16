import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, BookOpen, FileText, Lightbulb } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ClassroomDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ClassroomDetailPage({ params }: ClassroomDetailPageProps) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Get classroom details
  const { data: classroom, error: classroomError } = await supabase
    .from('classrooms')
    .select('*')
    .eq('id', params.id)
    .single();

  if (classroomError || !classroom) {
    redirect('/student/dashboard');
  }

  // Verify student is enrolled
  const { data: enrollment } = await supabase
    .from('classroom_enrollments')
    .select('*')
    .eq('classroom_id', params.id)
    .eq('student_id', session.user.id)
    .eq('status', 'active')
    .single();

  if (!enrollment) {
    redirect('/student/dashboard');
  }

  // Get all assignments for this classroom
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('classroom_id', params.id)
    .order('created_at', { ascending: false });

  // Get student's assignment statuses
  const { data: studentAssignments } = await supabase
    .from('student_assignments')
    .select('*')
    .eq('classroom_id', params.id)
    .eq('student_id', session.user.id);

  // Create a map of assignment statuses
  const assignmentStatusMap = new Map(
    studentAssignments?.map((sa: any) => [sa.assignment_id, sa]) || []
  );

  // Count student's questions for this classroom
  const { count: questionCount } = await supabase
    .from('student_questions')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', session.user.id)
    .in('assignment_id', assignments?.map((a: any) => a.id) || []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/student/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{classroom.name}</CardTitle>
          {classroom.description && (
            <CardDescription className="text-base mt-2">
              {classroom.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {assignments?.length || 0} Assignments
            </div>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              {questionCount || 0} Questions Asked
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Study Materials</h2>
          <p className="text-gray-500 mt-1">Generate practice problems and study guides based on your work</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Practice Problems
            </CardTitle>
            <CardDescription>
              Generate practice problems based on the questions you've asked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/student/classrooms/${params.id}/practice-problems`}>
              <Button className="w-full">
                Generate Practice Problems
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Study Guide
            </CardTitle>
            <CardDescription>
              Create a personalized study guide from your learning journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/student/classrooms/${params.id}/study-guide`}>
              <Button className="w-full">
                Generate Study Guide
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Assignments</h2>
        {assignments && assignments.length > 0 ? (
          <div className="space-y-4">
            {assignments.map((assignment: any) => {
              const studentAssignment = assignmentStatusMap.get(assignment.id);
              const status = studentAssignment?.status || 'not_started';
              const promptsUsed = studentAssignment?.prompts_used || 0;

              return (
                <Card key={assignment.id}>
                  <CardContent className="flex items-center justify-between pt-6">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{assignment.title}</h3>
                      {assignment.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}
                      {assignment.due_date && (
                        <p className="text-sm text-gray-500 mt-1">
                          Due: {formatDate(assignment.due_date)}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status === 'submitted' ? 'bg-green-100 text-green-800' :
                          status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {status.replace('_', ' ')}
                        </span>
                        {studentAssignment && (
                          <span className="text-gray-500">
                            {promptsUsed} / {assignment.max_prompts} prompts used
                          </span>
                        )}
                      </div>
                    </div>
                    <Link href={`/student/assignments/${assignment.id}`}>
                      <Button variant={status === 'not_started' ? 'default' : 'outline'}>
                        {status === 'not_started' ? 'Start' : status === 'submitted' ? 'View' : 'Continue'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12 text-gray-500">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p>No assignments yet</p>
              <p className="text-sm mt-2">Check back later for new assignments</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
