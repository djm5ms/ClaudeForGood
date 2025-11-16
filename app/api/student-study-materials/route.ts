import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type MaterialType = 'practice-problems' | 'study-guide';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { classroomId, assignmentId, materialType } = await request.json();

    if (!materialType) {
      return NextResponse.json({ error: 'Material type is required' }, { status: 400 });
    }

    // Verify student is enrolled in this classroom
    const { data: enrollment } = await supabase
      .from('classroom_enrollments')
      .select('id')
      .eq('classroom_id', classroomId)
      .eq('student_id', session.user.id)
      .eq('status', 'active')
      .single();

    if (!enrollment) {
      return NextResponse.json({ error: 'You are not enrolled in this classroom' }, { status: 403 });
    }

    // Get classroom info
    const { data: classroom } = await supabase
      .from('classrooms')
      .select('id, name')
      .eq('id', classroomId)
      .single();

    if (!classroom) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    // Get assignment context if specific assignment is selected
    let assignmentContext = '';
    if (assignmentId) {
      const { data: assignment } = await supabase
        .from('assignments')
        .select('description, teacher_instructions')
        .eq('id', assignmentId)
        .single();

      if (assignment) {
        assignmentContext = `
ASSIGNMENT QUESTIONS AND PROBLEMS:
${assignment.description || 'No assignment questions provided'}

${assignment.teacher_instructions ? `GUIDELINES:\n${assignment.teacher_instructions}` : ''}
`;
      }
    }

    // Get all of THIS STUDENT'S questions for this classroom/assignment
    let query = supabase
      .from('student_questions')
      .select(`
        id,
        question_text,
        hint_response,
        created_at,
        assignment:assignments(title, description)
      `)
      .eq('student_id', session.user.id); // IMPORTANT: Only this student's questions

    if (assignmentId) {
      query = query.eq('assignment_id', assignmentId);
    } else {
      // Get all questions from all assignments in this classroom
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, description')
        .eq('classroom_id', classroomId);

      if (assignments && assignments.length > 0) {
        const assignmentIds = assignments.map(a => a.id);
        query = query.in('assignment_id', assignmentIds);

        // Build context from all assignments
        const assignmentContents = assignments
          .map((a, idx) => {
            let content = `ASSIGNMENT ${idx + 1}:\n`;
            if (a.description) content += `Questions:\n${a.description}\n\n`;
            return content;
          })
          .join('\n---\n\n');

        assignmentContext = `
ALL ASSIGNMENT CONTENT:
${assignmentContents}
`;
      }
    }

    const { data: questions } = await query.order('created_at', { ascending: true });

    if (!questions || questions.length === 0) {
      return NextResponse.json({
        error: 'No questions found. You need to ask questions on assignments first to generate personalized study materials.'
      }, { status: 400 });
    }

    // Format questions for Claude - these are all from the same student
    const questionsText = questions.map((q: any, index: number) =>
      `Question ${index + 1} (${q.assignment?.title || 'Assignment'}):\n${q.question_text}\n\nHint you received:\n${q.hint_response || 'No hint response'}\n`
    ).join('\n---\n\n');

    // Generate specific material based on type
    const prompt = buildPrompt(materialType as MaterialType, questionsText, assignmentContext);

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    const materials = textContent && textContent.type === 'text' ? textContent.text : '';

    if (!materials) {
      return NextResponse.json(
        { error: 'Failed to generate materials' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      materials,
      questionsAnalyzed: questions.length,
      materialType,
    });
  } catch (error: any) {
    console.error('Error generating student study materials:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate study materials' },
      { status: 500 }
    );
  }
}

function buildPrompt(materialType: MaterialType, questionsText: string, assignmentContext: string): string {
  const baseContext = `${assignmentContext}

YOUR QUESTIONS AND LEARNING JOURNEY:
${questionsText}

Based on the assignments and YOUR specific questions above, `;

  switch (materialType) {
    case 'practice-problems':
      return `${baseContext}generate 10-15 personalized practice problems that help you master the concepts you asked about.

REQUIREMENTS:
For each problem include:
- Problem number and difficulty (Easy/Medium/Hard/Challenge)
- Clear problem statement targeting concepts you needed help with
- A helpful hint that guides you in the right direction
- Organize by difficulty level (start easy, progress to harder)
- Make sure problems are similar to but NOT identical to the original assignments

Format:
**Problem 1 (Easy)**
[Problem statement]

*Hint:* [Helpful hint]

---

Create the practice problems now, specifically tailored to the areas where you asked questions.`;

    case 'study-guide':
      return `${baseContext}create a comprehensive and personalized study guide.

REQUIREMENTS:
1. **Concepts You Learned** - Explain the main concepts from the topics you asked about
2. **Your Common Challenges** - Based on your questions, what did you struggle with?
3. **Step-by-Step Problem Solving** - Clear strategies for approaching these problems
4. **Important Formulas/Methods** - Key information you need to remember
5. **Self-Study Tips** - How you can continue practicing on your own
6. **Review Questions** - Questions to test your understanding of the topics you asked about

Make it detailed, practical, and directly address YOUR learning journey and the areas where you needed help.

Create the personalized study guide now.`;

    default:
      return baseContext + 'create helpful study materials.';
  }
}
