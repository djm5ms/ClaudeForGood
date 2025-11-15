import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { classroomId, canvasCourseId } = await request.json();

    if (!classroomId) {
      return NextResponse.json({ error: 'Classroom ID is required' }, { status: 400 });
    }

    // Verify teacher owns this classroom
    const { data: classroom } = await supabase
      .from('classrooms')
      .select('id')
      .eq('id', classroomId)
      .eq('teacher_id', session.user.id)
      .single();

    if (!classroom) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    // Update classroom with Canvas course ID
    const { error } = await supabase
      .from('classrooms')
      .update({ canvas_course_id: canvasCourseId })
      .eq('id', classroomId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: canvasCourseId
        ? 'Classroom linked to Canvas course'
        : 'Canvas course unlinked from classroom',
    });
  } catch (error: any) {
    console.error('Error linking classroom to Canvas:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to link classroom to Canvas' },
      { status: 500 }
    );
  }
}
