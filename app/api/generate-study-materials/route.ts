import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type MaterialType = 'slides' | 'practice-problems' | 'study-guide' | 'lesson-plan';

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

    // Verify teacher owns this classroom
    const { data: classroom } = await supabase
      .from('classrooms')
      .select('id, name')
      .eq('id', classroomId)
      .eq('teacher_id', session.user.id)
      .single();

    if (!classroom) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    // Get assignment context if specific assignment is selected
    let assignmentContext = '';
    if (assignmentId) {
      const { data: assignment } = await supabase
        .from('assignments')
        .select('description, answer_key, teacher_instructions')
        .eq('id', assignmentId)
        .single();

      if (assignment) {
        assignmentContext = `
ASSIGNMENT QUESTIONS AND PROBLEMS:
${assignment.description || 'No assignment questions provided'}

SOLUTIONS AND ANSWER KEY:
${assignment.answer_key || 'No answer key provided'}

${assignment.teacher_instructions ? `ADDITIONAL TEACHING NOTES:\n${assignment.teacher_instructions}` : ''}
`;
      }
    }

    // Get all student questions for this classroom/assignment
    let query = supabase
      .from('student_questions')
      .select(`
        id,
        question_text,
        hint_response,
        created_at,
        student:users(full_name, email),
        assignment:assignments(title, description)
      `);

    if (assignmentId) {
      query = query.eq('assignment_id', assignmentId);
    } else {
      // Get all questions from all assignments in this classroom
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, description, answer_key')
        .eq('classroom_id', classroomId);

      if (assignments && assignments.length > 0) {
        const assignmentIds = assignments.map(a => a.id);
        query = query.in('assignment_id', assignmentIds);

        // Build context from all assignments - focus on actual content
        const assignmentContents = assignments
          .map((a, idx) => {
            let content = `ASSIGNMENT ${idx + 1}:\n`;
            if (a.description) content += `Questions:\n${a.description}\n\n`;
            if (a.answer_key) content += `Solutions:\n${a.answer_key}\n`;
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
        error: 'No questions found. Students need to ask questions first.'
      }, { status: 400 });
    }

    // Format questions for Claude
    const questionsText = questions.map((q: any, index: number) =>
      `Question ${index + 1} (from ${q.student?.full_name || 'Student'}):\n${q.question_text}\n`
    ).join('\n');

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
    console.error('Error generating study materials:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate study materials' },
      { status: 500 }
    );
  }
}

function buildPrompt(materialType: MaterialType, questionsText: string, assignmentContext: string): string {
  const baseContext = `${assignmentContext}

STUDENT QUESTIONS ANALYZED:
${questionsText}

Based on the assignment context and student questions above, `;

  switch (materialType) {
    case 'slides':
      return `${baseContext}create a presentation with 8-12 slides in Markdown format.

REQUIREMENTS:
- Each slide should have a clear heading (use ## for slide titles)
- Include 3-5 bullet points per slide
- Focus on concepts students struggled with (based on their questions)
- Include visual descriptions or diagrams where helpful
- Make slides practical and directly address common misconceptions
- Use a logical flow that builds understanding

Format each slide clearly with:
## Slide Title
- Bullet point 1
- Bullet point 2
...

Create comprehensive presentation slides now.`;

    case 'practice-problems':
      return `${baseContext}generate 10-15 practice problems that address the concepts students struggled with.

REQUIREMENTS:
For each problem include:
- Problem number and difficulty (Easy/Medium/Hard/Challenge)
- Clear problem statement based on what students asked about
- A helpful hint that guides without giving away the answer
- Organize by difficulty level (start easy, progress to harder)

Format:
**Problem 1 (Easy)**
[Problem statement]

*Hint:* [Helpful hint]

---

Create the practice problems now.`;

    case 'study-guide':
      return `${baseContext}create a comprehensive study guide.

REQUIREMENTS:
1. **Key Concepts** - List and explain the main concepts students need to understand
2. **Common Mistakes** - Based on student questions, what errors do they make?
3. **Step-by-Step Strategies** - How should students approach these types of problems?
4. **Important Formulas/Methods** - What do they need to remember?
5. **Practice Tips** - How can students practice and check their understanding?
6. **FAQ** - Answer the most common questions students asked

Make it detailed, practical, and directly address what students struggled with.

Create the study guide now.`;

    case 'lesson-plan':
      return `${baseContext}create a detailed lesson plan for a review session.

REQUIREMENTS:
1. **Learning Objectives** - What should students master by the end?
2. **Materials Needed** - What do you need for the lesson?
3. **Warm-Up Activity (5-10 min)** - How to start the review
4. **Main Lesson (30-40 min)** - Teaching sequence addressing student struggles
   - Break into 3-4 segments
   - Include examples that address common questions
   - Interactive elements or discussion prompts
5. **Practice Activity (15-20 min)** - Hands-on work for students
6. **Assessment** - How to check for understanding
7. **Closure (5 min)** - Summary and takeaways

Base the lesson on the actual concepts students asked about. Make it actionable and ready to teach.

Create the lesson plan now.`;

    default:
      return baseContext + 'create helpful study materials.';
  }
}
