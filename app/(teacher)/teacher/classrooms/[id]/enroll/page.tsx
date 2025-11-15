'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function EnrollStudentPage() {
  const params = useParams();
  const classroomId = params.id as string;
  const [studentEmail, setStudentEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [classroom, setClassroom] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();

  useEffect(() => {
    loadClassroom();
  }, []);

  const loadClassroom = async () => {
    const { data } = await supabase
      .from('classrooms')
      .select('*')
      .eq('id', classroomId)
      .single();

    if (data) setClassroom(data);
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Find student by email
      const { data: student, error: findError } = await supabase
        .from('users')
        .select('id, role')
        .eq('email', studentEmail.toLowerCase().trim())
        .single();

      if (findError || !student) {
        throw new Error('Student not found. Make sure they have created an account.');
      }

      if (student.role !== 'student') {
        throw new Error('This user is not a student.');
      }

      // Check if already enrolled
      const { data: existing } = await supabase
        .from('classroom_enrollments')
        .select('id')
        .eq('classroom_id', classroomId)
        .eq('student_id', student.id)
        .single();

      if (existing) {
        throw new Error('Student is already enrolled in this classroom.');
      }

      // Enroll the student
      const { error: enrollError } = await supabase
        .from('classroom_enrollments')
        .insert({
          classroom_id: classroomId,
          student_id: student.id,
          status: 'active',
        });

      if (enrollError) throw enrollError;

      // Create student_assignment records for all existing assignments
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id')
        .eq('classroom_id', classroomId);

      if (assignments && assignments.length > 0) {
        const studentAssignments = assignments.map((assignment) => ({
          student_id: student.id,
          assignment_id: assignment.id,
          classroom_id: classroomId,
          status: 'not_started' as const,
          prompts_used: 0,
        }));

        await supabase.from('student_assignments').insert(studentAssignments);
      }

      toast({
        title: 'Success',
        description: 'Student enrolled successfully!',
      });

      setStudentEmail('');
      router.push(`/teacher/classrooms/${classroomId}`);
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to enroll student',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!classroom) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Enroll Student</h1>
        <p className="text-gray-500 mt-1">Add a student to {classroom.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>
            Enter the email address of the student you want to enroll
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEnroll} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Student Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                required
              />
              <p className="text-sm text-gray-500">
                The student must have already created an account with this email
              </p>
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Enrolling...' : 'Enroll Student'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
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
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>1. The student must first create an account (as a Student role)</p>
          <p>2. Enter their exact email address above</p>
          <p>3. They will be enrolled and can see all assignments in this classroom</p>
          <p>4. They will automatically get access to all current and future assignments</p>
        </CardContent>
      </Card>
    </div>
  );
}
