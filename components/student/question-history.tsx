import { formatDateTime } from '@/lib/utils';
import { StudentQuestion } from '@/types/db';

interface QuestionHistoryProps {
  questions: StudentQuestion[];
}

export function QuestionHistory({ questions }: QuestionHistoryProps) {
  // Reverse to show most recent first
  const reversedQuestions = [...questions].reverse();

  return (
    <div className="space-y-6">
      {reversedQuestions.map((q, index) => (
        <div key={q.id} className="border-l-4 border-primary pl-4">
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-500">
              Question #{questions.length - index} • {formatDateTime(q.created_at)}
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Your Question:</p>
              <p className="mt-1 text-gray-900">{q.question_text}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900">AI Hint:</p>
              <p className="mt-1 text-blue-800 whitespace-pre-wrap">
                {q.hint_response || 'No hint generated'}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
