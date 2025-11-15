import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { BookOpen, Users } from 'lucide-react';
import { CopyClassroomId } from '@/components/teacher/copy-classroom-id';

export default async function ClassroomDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  // Get classroom details
  const { data: classroom } = await supabase
    .from('classrooms')
    .select('*')
    .eq('id', params.id)
    .eq('teacher_id', session.user.id)
    .single();

  if (!classroom) {
    redirect('/teacher/classrooms');
  }

  // Get assignments for this classroom
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('classroom_id', params.id)
    .order('created_at', { ascending: false });

  // Get enrolled students
  const { data: enrollments } = await supabase
    .from('classroom_enrollments')
    .select(`
      id,
      enrolled_at,
      status,
      student:users(id, email, full_name)
    `)
    .eq('classroom_id', params.id)
    .eq('status', 'active');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{classroom.name}</h1>
        <p className="text-gray-500 mt-1">{classroom.description || 'No description'}</p>
        <p className="text-sm text-gray-400 mt-2">Created {formatDate(classroom.created_at)}</p>
      </div>

      {/* Classroom ID Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">Share this Classroom ID with your students</p>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-white px-3 py-2 rounded border border-blue-200 font-mono">
                  {classroom.id}
                </code>
                <CopyClassroomId classroomId={classroom.id} />
              </div>
              <p className="text-xs text-blue-700 mt-2">
                Students can use this ID to join your classroom from their dashboard
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Students Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Enrolled Students</CardTitle>
                <CardDescription>Students in this classroom</CardDescription>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {enrollments && enrollments.length > 0 ? (
              <div className="space-y-3">
                {enrollments.map((enrollment: any) => (
                  <div key={enrollment.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{enrollment.student.full_name || 'No name'}</p>
                      <p className="text-sm text-gray-500">{enrollment.student.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(enrollment.enrolled_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No students enrolled yet</p>
                <p className="text-sm mt-1">Students will appear here once enrolled</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignments Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Assignments</CardTitle>
                <CardDescription>Assignments in this classroom</CardDescription>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {assignments && assignments.length > 0 ? (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="border-b pb-2 last:border-0">
                    <Link href={`/teacher/assignments/${assignment.id}`}>
                      <p className="font-medium hover:text-primary">{assignment.title}</p>
                    </Link>
                    <p className="text-sm text-gray-500">
                      Due: {assignment.due_date ? formatDate(assignment.due_date) : 'No due date'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No assignments yet</p>
                <Link href="/teacher/assignments/new">
                  <Button className="mt-2" size="sm">Create Assignment</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Link href="/teacher/classrooms">
          <Button variant="outline">Back to Classrooms</Button>
        </Link>
        <Link href={`/teacher/classrooms/${params.id}/enroll`}>
          <Button variant="outline">Enroll Students</Button>
        </Link>
        <Link href={`/teacher/classrooms/${params.id}/insights`}>
          <Button>
            <BookOpen className="w-4 h-4 mr-2" />
            View Insights & Generate Materials
          </Button>
        </Link>
      </div>
    </div>
  );
}
