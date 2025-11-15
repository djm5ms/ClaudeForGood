'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, FileText, BookOpen, ListChecks, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ClassroomInsightsPage() {
  const params = useParams();
  const classroomId = params.id as string;
  const [classroom, setClassroom] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>('all');
  const [materialType, setMaterialType] = useState<string>('slides');
  const [questions, setQuestions] = useState<any[]>([]);
  const [materials, setMaterials] = useState<string>('');
  const [generatedType, setGeneratedType] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (classroom) {
      loadQuestions();
    }
  }, [selectedAssignment, classroom]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get classroom
      const { data: classroomData } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', classroomId)
        .single();

      if (classroomData) setClassroom(classroomData);

      // Get assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('id, title')
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false });

      if (assignmentsData) setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      let query = supabase
        .from('student_questions')
        .select(`
          id,
          question_text,
          hint_response,
          created_at,
          student:users(full_name, email),
          assignment:assignments(title)
        `);

      if (selectedAssignment === 'all') {
        const assignmentIds = assignments.map(a => a.id);
        if (assignmentIds.length > 0) {
          query = query.in('assignment_id', assignmentIds);
        }
      } else {
        query = query.eq('assignment_id', selectedAssignment);
      }

      const { data } = await query.order('created_at', { ascending: false });
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const handleGenerate = async () => {
    if (questions.length === 0) {
      toast({
        title: 'No questions found',
        description: 'Students need to ask questions before you can generate materials.',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/generate-study-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId,
          assignmentId: selectedAssignment === 'all' ? null : selectedAssignment,
          materialType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate materials');
      }

      setMaterials(data.materials);
      setGeneratedType(data.materialType);
      toast({
        title: 'Success!',
        description: `Generated ${getMaterialTypeName(data.materialType)} from ${data.questionsAnalyzed} questions`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate materials',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const getMaterialTypeName = (type: string) => {
    const names: Record<string, string> = {
      'slides': 'Presentation Slides',
      'practice-problems': 'Practice Problems',
      'study-guide': 'Study Guide',
      'lesson-plan': 'Lesson Plan',
    };
    return names[type] || 'Materials';
  };

  const downloadMarkdown = () => {
    if (!materials) return;

    const fileName = `${getMaterialTypeName(generatedType).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.md`;
    const blob = new Blob([materials], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded!',
      description: `${fileName} has been downloaded`,
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!classroom) {
    return <div>Classroom not found</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Student Insights & Study Materials</h1>
        <p className="text-gray-500 mt-1">{classroom.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Study Materials</CardTitle>
          <CardDescription>
            AI will analyze student questions and create slides, practice problems, and study guides
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Assignment</label>
              <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignments ({assignments.length})</SelectItem>
                  {assignments.map((assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id}>
                      {assignment.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Material Type</label>
              <Select value={materialType} onValueChange={setMaterialType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slides">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Presentation Slides
                    </div>
                  </SelectItem>
                  <SelectItem value="practice-problems">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4" />
                      Practice Problems
                    </div>
                  </SelectItem>
                  <SelectItem value="study-guide">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Study Guide
                    </div>
                  </SelectItem>
                  <SelectItem value="lesson-plan">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Lesson Plan
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">
                {questions.length} student question{questions.length !== 1 ? 's' : ''} available
              </p>
            </div>
            <p className="text-xs text-blue-700">
              The AI will analyze these questions to identify common struggles and create targeted materials
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || questions.length === 0}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Generating Materials...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate {getMaterialTypeName(materialType)}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {materials && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Generated {getMaterialTypeName(generatedType)}</CardTitle>
                <CardDescription>
                  Ready to share with students or use for review sessions
                </CardDescription>
              </div>
              <Button onClick={downloadMarkdown} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download Markdown
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-ul:my-4 prose-li:my-2 prose-strong:text-gray-900 prose-strong:font-semibold prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm">
              <ReactMarkdown>{materials}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Student Questions ({questions.length})</CardTitle>
            <CardDescription>All questions from {selectedAssignment === 'all' ? 'all assignments' : 'selected assignment'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {questions.map((q: any, index: number) => (
                <div key={q.id} className="border-l-4 border-primary pl-4 pb-4 border-b last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-gray-500">
                      Question #{index + 1} • {q.student?.full_name || 'Student'}
                    </p>
                    <p className="text-xs text-gray-400">{q.assignment?.title}</p>
                  </div>
                  <p className="text-sm text-gray-900">{q.question_text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Back to Classroom
        </Button>
      </div>
    </div>
  );
}
