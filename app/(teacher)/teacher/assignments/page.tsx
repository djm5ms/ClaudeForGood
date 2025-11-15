import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function AssignmentsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  const { data: assignments } = await supabase
    .from('assignments')
    .select(`
      *,
      classroom:classrooms(name)
    `)
    .eq('teacher_id', session!.user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Assignments</h1>
          <p className="text-gray-500 mt-1">Manage all your assignments</p>
        </div>
        <Link href="/teacher/assignments/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Assignment
          </Button>
        </Link>
      </div>

      {assignments && assignments.length > 0 ? (
        <div className="grid gap-4">
          {assignments.map((assignment: any) => (
            <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{assignment.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {assignment.classroom?.name}
                    </CardDescription>
                  </div>
                  <Link href={`/teacher/assignments/${assignment.id}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Hint Level</p>
                    <p className="font-medium">{assignment.hint_level || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Max Prompts</p>
                    <p className="font-medium">{assignment.max_prompts}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Due Date</p>
                    <p className="font-medium">
                      {assignment.due_date ? formatDate(assignment.due_date) : 'No due date'}
                    </p>
                  </div>
                </div>
                {assignment.description && (
                  <p className="text-sm text-gray-600 mt-4 line-clamp-2">
                    {assignment.description}
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
            <p className="text-gray-500 mb-4 text-center">
              Get started by creating your first assignment
            </p>
            <Link href="/teacher/assignments/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
