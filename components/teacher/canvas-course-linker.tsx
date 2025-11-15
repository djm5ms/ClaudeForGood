'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Link2, Link2Off, RefreshCw } from 'lucide-react';

interface CanvasCourseLinkerProps {
  classroomId: string;
  currentCanvasCourseId: string | null;
  onLinked?: () => void;
}

export function CanvasCourseLinker({ classroomId, currentCanvasCourseId, onLinked }: CanvasCourseLinkerProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(currentCanvasCourseId || '');
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCanvasCourses();
  }, []);

  useEffect(() => {
    setSelectedCourseId(currentCanvasCourseId || '');
  }, [currentCanvasCourseId]);

  const loadCanvasCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/canvas/courses');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load Canvas courses');
      }

      setCourses(data.courses || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load Canvas courses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    setLinking(true);
    try {
      const response = await fetch('/api/canvas/link-classroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId,
          canvasCourseId: selectedCourseId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link classroom');
      }

      toast({
        title: 'Success!',
        description: data.message,
      });

      if (onLinked) {
        onLinked();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to link classroom to Canvas',
        variant: 'destructive',
      });
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    setSelectedCourseId('');
    setLinking(true);
    try {
      const response = await fetch('/api/canvas/link-classroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId,
          canvasCourseId: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unlink classroom');
      }

      toast({
        title: 'Success!',
        description: 'Classroom unlinked from Canvas course',
      });

      if (onLinked) {
        onLinked();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unlink classroom',
        variant: 'destructive',
      });
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Link to Canvas Course</label>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadCanvasCourses}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Select
            value={selectedCourseId}
            onValueChange={setSelectedCourseId}
            disabled={loading || linking}
          >
            <SelectTrigger>
              <SelectValue placeholder={loading ? 'Loading courses...' : 'Select a Canvas course'} />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.name} {course.course_code ? `(${course.course_code})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentCanvasCourseId && selectedCourseId === currentCanvasCourseId ? (
          <Button
            variant="outline"
            onClick={handleUnlink}
            disabled={linking}
          >
            <Link2Off className="w-4 h-4 mr-2" />
            Unlink
          </Button>
        ) : (
          <Button
            onClick={handleLink}
            disabled={!selectedCourseId || linking || selectedCourseId === currentCanvasCourseId}
          >
            <Link2 className="w-4 h-4 mr-2" />
            {linking ? 'Linking...' : 'Link'}
          </Button>
        )}
      </div>

      {currentCanvasCourseId && (
        <p className="text-xs text-green-600">
          ✓ This classroom is linked to a Canvas course
        </p>
      )}
    </div>
  );
}
