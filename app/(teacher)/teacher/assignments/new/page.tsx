'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Classroom } from '@/types/db';

export default function NewAssignmentPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [classroomId, setClassroomId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [answerKey, setAnswerKey] = useState('');
  const [teacherInstructions, setTeacherInstructions] = useState('');
  const [hintLevel, setHintLevel] = useState('3');
  const [maxPrompts, setMaxPrompts] = useState('10');
  const [dueDate, setDueDate] = useState('');
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();

  useEffect(() => {
    loadClassrooms();
  }, []);

  const loadClassrooms = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('classrooms')
      .select('*')
      .eq('teacher_id', session.user.id)
      .order('name');

    if (data) setClassrooms(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAssignmentFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      let fileUrl = null;

      // Upload file if provided
      if (assignmentFile) {
        const fileExt = assignmentFile.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('assignments')
          .upload(fileName, assignmentFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('assignments')
          .getPublicUrl(fileName);
        fileUrl = publicUrl;
      }

      const { error } = await supabase.from('assignments').insert({
        classroom_id: classroomId,
        teacher_id: session.user.id,
        title,
        description,
        answer_key: answerKey,
        teacher_instructions: teacherInstructions,
        hint_level: parseInt(hintLevel),
        max_prompts: parseInt(maxPrompts),
        due_date: dueDate || null,
        assignment_file_url: fileUrl,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment created successfully!',
      });

      router.push('/teacher/assignments');
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create assignment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Assignment</h1>
        <p className="text-gray-500 mt-1">Set up a new assignment for your students</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details for your assignment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="classroom">Classroom *</Label>
              <Select value={classroomId} onValueChange={setClassroomId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a classroom" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map((classroom) => (
                    <SelectItem key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Assignment Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Chapter 5 Homework"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the assignment..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Assignment File (PDF)</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Hint Configuration</CardTitle>
            <CardDescription>Configure how the AI provides hints to students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hintLevel">Hint Level (1-5) *</Label>
              <Select value={hintLevel} onValueChange={setHintLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1 - Minimal hints</SelectItem>
                  <SelectItem value="2">Level 2 - Gentle guidance</SelectItem>
                  <SelectItem value="3">Level 3 - Moderate help</SelectItem>
                  <SelectItem value="4">Level 4 - Detailed guidance</SelectItem>
                  <SelectItem value="5">Level 5 - Very detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxPrompts">Max Prompts per Student *</Label>
              <Input
                id="maxPrompts"
                type="number"
                min="1"
                max="100"
                value={maxPrompts}
                onChange={(e) => setMaxPrompts(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answerKey">Answer Key</Label>
              <Textarea
                id="answerKey"
                placeholder="Enter the answer key (will be used by AI for context, not shown to students)"
                value={answerKey}
                onChange={(e) => setAnswerKey(e.target.value)}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacherInstructions">Instructions for AI</Label>
              <Textarea
                id="teacherInstructions"
                placeholder="Special instructions for how the AI should provide hints for this assignment..."
                value={teacherInstructions}
                onChange={(e) => setTeacherInstructions(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading || !classroomId}>
            {loading ? 'Creating...' : 'Create Assignment'}
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
    </div>
  );
}
