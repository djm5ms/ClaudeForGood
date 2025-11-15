'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

interface QuestionFormProps {
  assignmentId: string;
  studentAssignmentId: string;
  assignmentContext: string;
  answerKey: string | null;
  hintLevel: number;
  teacherInstructions: string | null;
}

export function QuestionForm({
  assignmentId,
  studentAssignmentId,
  assignmentContext,
  answerKey,
  hintLevel,
  teacherInstructions,
}: QuestionFormProps) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/ask-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          studentAssignmentId,
          questionText: question,
          assignmentContext,
          answerKey,
          hintLevel,
          teacherInstructions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get hint');
      }

      toast({
        title: 'Hint received!',
        description: 'Check the question history below for your hint.',
      });

      setQuestion('');
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to get hint',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        placeholder="Ask your question here... (e.g., I'm stuck on problem 3. What concept should I review?)"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={4}
        disabled={loading}
        required
      />
      <Button type="submit" disabled={loading || !question.trim()}>
        {loading ? 'Getting hint...' : 'Get Hint'}
      </Button>
    </form>
  );
}
