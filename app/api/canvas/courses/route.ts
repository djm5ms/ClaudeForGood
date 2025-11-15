import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCanvasCourses } from '@/lib/canvas';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a teacher
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can access Canvas courses' }, { status: 403 });
    }

    const courses = await getCanvasCourses();

    return NextResponse.json({ courses });
  } catch (error: any) {
    console.error('Error fetching Canvas courses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Canvas courses' },
      { status: 500 }
    );
  }
}
