import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createCanvasPage, uploadCanvasFile, markdownToCanvasHtml } from '@/lib/canvas';

type PushMethod = 'page' | 'file' | 'both';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { classroomId, materials, materialType, pushMethod = 'both' } = await request.json();

    if (!classroomId || !materials || !materialType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get classroom and verify it has a Canvas course linked
    const { data: classroom } = await supabase
      .from('classrooms')
      .select('id, name, canvas_course_id')
      .eq('id', classroomId)
      .eq('teacher_id', session.user.id)
      .single();

    if (!classroom) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    if (!classroom.canvas_course_id) {
      return NextResponse.json(
        { error: 'This classroom is not linked to a Canvas course. Please link it first.' },
        { status: 400 }
      );
    }

    const materialTypeNames: Record<string, string> = {
      'slides': 'Presentation Slides',
      'practice-problems': 'Practice Problems',
      'study-guide': 'Study Guide',
      'lesson-plan': 'Lesson Plan',
    };

    const title = `${materialTypeNames[materialType] || 'Study Materials'} - ${classroom.name}`;
    const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.md`;

    const results: any = {};

    try {
      // Push as Canvas Page (HTML)
      if (pushMethod === 'page' || pushMethod === 'both') {
        const htmlContent = markdownToCanvasHtml(materials);
        const pageResult = await createCanvasPage({
          courseId: classroom.canvas_course_id,
          title,
          body: htmlContent,
          published: true,
        });
        results.page = {
          url: pageResult.html_url,
          title: pageResult.title,
        };
      }

      // Push as File (Markdown)
      if (pushMethod === 'file' || pushMethod === 'both') {
        const fileResult = await uploadCanvasFile({
          courseId: classroom.canvas_course_id,
          fileName,
          content: materials,
          contentType: 'text/markdown',
        });
        results.file = {
          url: fileResult.url,
          fileName: fileResult.display_name,
        };
      }

      return NextResponse.json({
        success: true,
        message: 'Materials pushed to Canvas successfully',
        results,
      });
    } catch (canvasError: any) {
      console.error('Canvas API error:', canvasError);
      return NextResponse.json(
        {
          error: 'Failed to push to Canvas',
          details: canvasError.message,
          hint: 'Check that your Canvas API key is valid and has the required permissions',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error pushing materials to Canvas:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to push materials to Canvas' },
      { status: 500 }
    );
  }
}
