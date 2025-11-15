'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CanvasCourseLinker } from './canvas-course-linker';
import { BookOpen } from 'lucide-react';

interface ClassroomCanvasSectionProps {
  classroomId: string;
  canvasCourseId: string | null;
}

export function ClassroomCanvasSection({ classroomId, canvasCourseId }: ClassroomCanvasSectionProps) {
  const handleLinked = () => {
    // Refresh the page to show updated Canvas link status
    window.location.reload();
  };

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600" />
          <CardTitle>Canvas Integration</CardTitle>
        </div>
        <CardDescription>
          Link this classroom to a Canvas course to automatically push generated study materials
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CanvasCourseLinker
          classroomId={classroomId}
          currentCanvasCourseId={canvasCourseId}
          onLinked={handleLinked}
        />
      </CardContent>
    </Card>
  );
}
