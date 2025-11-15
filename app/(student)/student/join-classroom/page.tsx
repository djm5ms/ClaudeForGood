'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function JoinClassroomPage() {
  const [classroomId, setClassroomId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Verify classroom exists
      const { data: classroom, error: classroomError } = await supabase
        .from('classrooms')
        .select('id, name, description')
        .eq('id', classroomId.trim())
        .single();

      if (classroomError || !classroom) {
        throw new Error('Classroom not found. Please check the classroom ID.');
      }

      // Check if already enrolled
      const { data: existing } = await supabase
        .from('classroom_enrollments')
        .select('id')
        .eq('classroom_id', classroomId.trim())
        .eq('student_id', session.user.id)
        .single();

      if (existing) {
        throw new Error('You are already enrolled in this classroom.');
      }

      // Enroll the student
      const { error: enrollError } = await supabase
        .from('classroom_enrollments')
        .insert({
          classroom_id: classroomId.trim(),
          student_id: session.user.id,
          status: 'active',
        });

      if (enrollError) throw enrollError;

      // Create student_assignment records for all existing assignments
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id')
        .eq('classroom_id', classroomId.trim());

      if (assignments && assignments.length > 0) {
        const studentAssignments = assignments.map((assignment) => ({
          student_id: session.user.id,
          assignment_id: assignment.id,
          classroom_id: classroomId.trim(),
          status: 'not_started' as const,
          prompts_used: 0,
        }));

        await supabase.from('student_assignments').insert(studentAssignments);
      }

      toast({
        title: 'Success!',
        description: `You have joined ${classroom.name}`,
      });

      router.push('/student/dashboard');
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to join classroom',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Join a Classroom</h1>
        <p className="text-gray-500 mt-1">Enter the classroom ID provided by your teacher</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Classroom ID</CardTitle>
          <CardDescription>
            Your teacher will provide you with a unique classroom ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="classroomId">Classroom ID *</Label>
              <Input
                id="classroomId"
                placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                required
              />
              <p className="text-sm text-gray-500">
                This is a unique identifier that looks like a series of numbers and letters
              </p>
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={loading || !classroomId.trim()}>
                {loading ? 'Joining...' : 'Join Classroom'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/student/dashboard')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to get a Classroom ID</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>1. Your teacher will share the classroom ID with you</p>
          <p>2. It might be shared via email, learning management system, or in class</p>
          <p>3. Copy the entire ID exactly as provided (including dashes)</p>
          <p>4. Paste it into the field above and click "Join Classroom"</p>
        </CardContent>
      </Card>
    </div>
  );
}
