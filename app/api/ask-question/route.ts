import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateHint } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      assignmentId,
      studentAssignmentId,
      questionText,
      assignmentContext,
      answerKey,
      hintLevel,
      teacherInstructions,
    } = await request.json();

    // Verify student assignment
    const { data: studentAssignment } = await supabase
      .from('student_assignments')
      .select('*, assignment:assignments(max_prompts)')
      .eq('id', studentAssignmentId)
      .eq('student_id', session.user.id)
      .single();

    if (!studentAssignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check if student has prompts remaining
    if (studentAssignment.prompts_used >= studentAssignment.assignment.max_prompts) {
      return NextResponse.json(
        { error: 'You have used all your hints for this assignment' },
        { status: 400 }
      );
    }

    // Generate hint using Claude
    const hintResponse = await generateHint({
      questionText,
      assignmentContext,
      answerKey,
      hintLevel,
      teacherInstructions,
    });

    // Save question and hint to database
    const { error: insertError } = await supabase.from('student_questions').insert({
      student_id: session.user.id,
      assignment_id: assignmentId,
      student_assignment_id: studentAssignmentId,
      question_text: questionText,
      hint_response: hintResponse,
    });

    if (insertError) throw insertError;

    // Update prompts_used and status
    const newPromptsUsed = studentAssignment.prompts_used + 1;
    const { error: updateError } = await supabase
      .from('student_assignments')
      .update({
        prompts_used: newPromptsUsed,
        status: studentAssignment.status === 'not_started' ? 'in_progress' : studentAssignment.status,
      })
      .eq('id', studentAssignmentId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      hint: hintResponse,
      prompts_used: newPromptsUsed,
    });
  } catch (error: any) {
    console.error('Error in ask-question:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process question' },
      { status: 500 }
    );
  }
}
