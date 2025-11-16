'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Download, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Assignment {
  id: string;
  title: string;
}

export default function StudyGuidePage() {
  const params = useParams();
  const classroomId = params.id as string;
  const supabase = createClientComponentClient();

  const [assignmentId, setAssignmentId] = useState<string>('all');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [generatedMaterials, setGeneratedMaterials] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionsAnalyzed, setQuestionsAnalyzed] = useState<number>(0);

  useEffect(() => {
    async function fetchAssignments() {
      const { data } = await supabase
        .from('assignments')
        .select('id, title')
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false });

      if (data) {
        setAssignments(data);
      }
    }
    fetchAssignments();
  }, [classroomId, supabase]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/student-study-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classroomId,
          assignmentId: assignmentId === 'all' ? null : assignmentId,
          materialType: 'study-guide',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedMaterials(data.materials);
        setQuestionsAnalyzed(data.questionsAnalyzed);
      } else {
        alert('Error generating materials: ' + data.error);
      }
    } catch (error) {
      console.error('Error generating materials:', error);
      alert('Error generating materials. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedMaterials], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-guide-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/student/classrooms/${classroomId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Classroom
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            Generate Study Guide
          </CardTitle>
          <CardDescription className="text-base">
            Create a personalized study guide based on your learning journey, focusing on topics where you asked questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Filter by Assignment (Optional)
              </label>
              <Select value={assignmentId} onValueChange={setAssignmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignments</SelectItem>
                  {assignments.map((assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id}>
                      {assignment.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-2">
                Generate a comprehensive study guide from all assignments or focus on a specific one.
              </p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Study Guide...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Generate Study Guide
                </>
              )}
            </Button>
          </div>

          {generatedMaterials && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Generated Study Guide</h3>
                  <p className="text-sm text-gray-500">
                    Based on {questionsAnalyzed} question{questionsAnalyzed !== 1 ? 's' : ''} you asked
                  </p>
                </div>
                <Button onClick={handleDownload} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 max-h-[600px] overflow-y-auto">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: generatedMaterials
                      .split('\n')
                      .map(line => {
                        if (line.startsWith('# ')) {
                          return `<h1 class="text-2xl font-bold mb-4">${line.slice(2)}</h1>`;
                        } else if (line.startsWith('## ')) {
                          return `<h2 class="text-xl font-bold mb-3 mt-6">${line.slice(3)}</h2>`;
                        } else if (line.startsWith('### ')) {
                          return `<h3 class="text-lg font-semibold mb-2 mt-4">${line.slice(4)}</h3>`;
                        } else if (line.startsWith('**') && line.endsWith('**')) {
                          return `<p class="font-bold mb-2">${line.slice(2, -2)}</p>`;
                        } else if (line.trim() === '') {
                          return '<br />';
                        } else {
                          return `<p class="mb-2">${line}</p>`;
                        }
                      })
                      .join('')
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
