import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle, Clock, School } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  // Get ALL student assignments with details (remove limit)
  const { data: studentAssignments } = await supabase
    .from('student_assignments')
    .select(`
      *,
      assignment:assignments(*),
      classroom:classrooms(name)
    `)
    .eq('student_id', session!.user.id)
    .order('created_at', { ascending: false });

  // Calculate stats and filter assignments
  const totalAssignments = studentAssignments?.length || 0;
  const completedAssignmentsList = studentAssignments?.filter((sa: any) => sa.status === 'submitted') || [];
  const inProgressAssignmentsList = studentAssignments?.filter((sa: any) => sa.status === 'in_progress') || [];
  const notStartedAssignmentsList = studentAssignments?.filter((sa: any) => sa.status === 'not_started') || [];

  const completedAssignments = completedAssignmentsList.length;
  const inProgressAssignments = inProgressAssignmentsList.length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-gray-500 mt-1">Track your assignments and progress</p>
        </div>
        <Link href="/student/join-classroom">
          <Button>
            <School className="w-4 h-4 mr-2" />
            Join Classroom
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="classrooms" className="space-y-6">
        <TabsList className="grid w-full md:w-[600px] grid-cols-3">
          <TabsTrigger value="classrooms" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            My Classrooms ({enrollments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            In Progress ({inProgressAssignments})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed ({completedAssignments})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classrooms" className="space-y-4">
          {enrollments && enrollments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {enrollments.map((enrollment: any) => (
                <Link key={enrollment.classroom.id} href={`/student/classrooms/${enrollment.classroom.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="text-lg">{enrollment.classroom.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {enrollment.classroom.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12 text-gray-500">
                <School className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p>No classrooms yet</p>
                <p className="text-sm mt-2">Join a classroom to get started</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4">
          {inProgressAssignmentsList.length > 0 ? (
            <div className="space-y-4">
              {inProgressAssignmentsList.map((sa: any) => (
                <Card key={sa.id}>
                  <CardContent className="flex items-center justify-between pt-6">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{sa.assignment.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{sa.classroom.name}</p>
                      {sa.assignment.due_date && (
                        <p className="text-sm text-gray-500 mt-1">
                          Due: {formatDate(sa.assignment.due_date)}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          In Progress
                        </span>
                        <span className="text-gray-500">
                          {sa.prompts_used} / {sa.assignment.max_prompts} prompts used
                        </span>
                      </div>
                    </div>
                    <Link href={`/student/assignments/${sa.assignment_id}`}>
                      <Button>Continue</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12 text-gray-500">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p>No assignments in progress</p>
                <p className="text-sm mt-2">Start working on an assignment to see it here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedAssignmentsList.length > 0 ? (
            <div className="space-y-4">
              {completedAssignmentsList.map((sa: any) => (
                <Card key={sa.id}>
                  <CardContent className="flex items-center justify-between pt-6">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{sa.assignment.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{sa.classroom.name}</p>
                      {sa.submitted_at && (
                        <p className="text-sm text-gray-500 mt-1">
                          Submitted: {formatDate(sa.submitted_at)}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </span>
                        <span className="text-gray-500">
                          {sa.prompts_used} / {sa.assignment.max_prompts} prompts used
                        </span>
                      </div>
                    </div>
                    <Link href={`/student/assignments/${sa.assignment_id}`}>
                      <Button variant="outline">View</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12 text-gray-500">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p>No completed assignments</p>
                <p className="text-sm mt-2">Complete an assignment to see it here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
