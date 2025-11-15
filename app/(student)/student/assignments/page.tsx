import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function StudentAssignmentsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  const { data: studentAssignments } = await supabase
    .from('student_assignments')
    .select(`
      *,
      assignment:assignments(*),
      classroom:classrooms(name)
    `)
    .eq('student_id', session!.user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Assignments</h1>
        <p className="text-gray-500 mt-1">View and work on your assignments</p>
      </div>

      {studentAssignments && studentAssignments.length > 0 ? (
        <div className="grid gap-4">
          {studentAssignments.map((sa: any) => (
            <Card key={sa.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{sa.assignment.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {sa.classroom.name}
                    </CardDescription>
                  </div>
                  <Link href={`/student/assignments/${sa.assignment_id}`}>
                    <Button variant="outline" size="sm">
                      {sa.status === 'not_started' ? 'Start' : sa.status === 'submitted' ? 'View' : 'Continue'}
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      sa.status === 'submitted' ? 'bg-green-100 text-green-800' :
                      sa.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {sa.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500">Prompts Used</p>
                    <p className="font-medium">{sa.prompts_used} / {sa.assignment.max_prompts}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Due Date</p>
                    <p className="font-medium">
                      {sa.assignment.due_date ? formatDate(sa.assignment.due_date) : 'No due date'}
                    </p>
                  </div>
                </div>
                {sa.assignment.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {sa.assignment.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
            <p className="text-gray-500 text-center">
              You will see your assignments here when your teacher assigns them
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
