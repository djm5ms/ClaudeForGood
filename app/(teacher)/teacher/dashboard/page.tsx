import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, School, Users } from 'lucide-react';

export default async function TeacherDashboard() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Get stats
  const { count: classroomCount } = await supabase
    .from('classrooms')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', session!.user.id);

  const { count: assignmentCount } = await supabase
    .from('assignments')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', session!.user.id);

  // Get recent classrooms
  const { data: recentClassrooms } = await supabase
    .from('classrooms')
    .select('*')
    .eq('teacher_id', session!.user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your classrooms and assignments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classrooms</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classroomCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignmentCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Classrooms</CardTitle>
            <CardDescription>Your most recently created classrooms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentClassrooms && recentClassrooms.length > 0 ? (
              recentClassrooms.map((classroom) => (
                <div key={classroom.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{classroom.name}</p>
                    <p className="text-sm text-gray-500">{classroom.description}</p>
                  </div>
                  <Link href={`/teacher/classrooms/${classroom.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No classrooms yet</p>
                <Link href="/teacher/classrooms">
                  <Button className="mt-4">Create your first classroom</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/teacher/classrooms/new">
              <Button className="w-full" variant="outline">
                <School className="w-4 h-4 mr-2" />
                Create New Classroom
              </Button>
            </Link>
            <Link href="/teacher/assignments/new">
              <Button className="w-full" variant="outline">
                <BookOpen className="w-4 h-4 mr-2" />
                Create New Assignment
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
