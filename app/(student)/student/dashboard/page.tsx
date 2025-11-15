import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle, Clock, School } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function StudentDashboard() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Get enrolled classrooms
  const { data: enrollments } = await supabase
    .from('classroom_enrollments')
    .select(`
      classroom:classrooms(*)
    `)
    .eq('student_id', session!.user.id)
    .eq('status', 'active');

  // Get student assignments with details
  const { data: studentAssignments } = await supabase
    .from('student_assignments')
    .select(`
      *,
      assignment:assignments(*),
      classroom:classrooms(name)
    `)
    .eq('student_id', session!.user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Calculate stats
  const totalAssignments = studentAssignments?.length || 0;
  const completedAssignments = studentAssignments?.filter((sa: any) => sa.status === 'submitted').length || 0;
  const inProgressAssignments = studentAssignments?.filter((sa: any) => sa.status === 'in_progress').length || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-gray-500 mt-1">Track your assignments and progress</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Classrooms</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressAssignments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedAssignments}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Assignments</CardTitle>
          <CardDescription>Your latest assignments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {studentAssignments && studentAssignments.length > 0 ? (
            studentAssignments.map((sa: any) => (
              <div key={sa.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="flex-1">
                  <h4 className="font-medium">{sa.assignment.title}</h4>
                  <p className="text-sm text-gray-500">{sa.classroom.name}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      sa.status === 'submitted' ? 'bg-green-100 text-green-800' :
                      sa.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {sa.status.replace('_', ' ')}
                    </span>
                    <span className="text-gray-500">
                      {sa.prompts_used} / {sa.assignment.max_prompts} prompts used
                    </span>
                  </div>
                </div>
                <Link href={`/student/assignments/${sa.assignment_id}`}>
                  <Button variant="outline" size="sm">
                    {sa.status === 'not_started' ? 'Start' : 'Continue'}
                  </Button>
                </Link>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p>No assignments yet</p>
              <p className="text-sm mt-2">Check back later for new assignments</p>
            </div>
          )}
        </CardContent>
      </Card>

      {enrollments && enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Classrooms</CardTitle>
            <CardDescription>Classrooms you are enrolled in</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {enrollments.map((enrollment: any) => (
              <Card key={enrollment.classroom.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{enrollment.classroom.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {enrollment.classroom.description || 'No description'}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
