import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, School } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function ClassroomsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  const { data: classrooms } = await supabase
    .from('classrooms')
    .select('*')
    .eq('teacher_id', session!.user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Classrooms</h1>
          <p className="text-gray-500 mt-1">Manage all your classrooms</p>
        </div>
        <Link href="/teacher/classrooms/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Classroom
          </Button>
        </Link>
      </div>

      {classrooms && classrooms.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classrooms.map((classroom) => (
            <Link key={classroom.id} href={`/teacher/classrooms/${classroom.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <School className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="mt-4">{classroom.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {classroom.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Created {formatDate(classroom.created_at)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <School className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No classrooms yet</h3>
            <p className="text-gray-500 mb-4 text-center">
              Get started by creating your first classroom
            </p>
            <Link href="/teacher/classrooms/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Classroom
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
