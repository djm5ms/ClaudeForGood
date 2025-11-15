'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Copy } from 'lucide-react';

interface CopyClassroomIdProps {
  classroomId: string;
}

export function CopyClassroomId({ classroomId }: CopyClassroomIdProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(classroomId);
    toast({
      title: 'Copied!',
      description: 'Classroom ID copied to clipboard',
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      <Copy className="w-3 h-3 mr-1" />
      Copy
    </Button>
  );
}
