import { CheckCircle2, ChevronRight } from 'lucide-react';
import type { SubmissionToGrade } from './types';

interface SubmissionsToGradeProps {
  submissions: SubmissionToGrade[];
}

export function SubmissionsToGrade({ submissions }: SubmissionsToGradeProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Bài nộp cần chấm điểm</h2>
        <p className="text-xs text-gray-500 mt-1">Chỉ hiển thị bài tự luận</p>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        {submissions.map((sub) => (
          <div key={sub.submissionId} className="border border-gray-100 p-3 rounded-lg hover:border-gray-300 transition-colors flex items-start gap-3 cursor-pointer">
            <div className="bg-orange-50 text-orange-500 p-2 rounded-md">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{sub.assignmentTitle}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{sub.studentName} • {sub.className}</p>
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('vi-VN') : 'Không rõ'}
            </span>
          </div>
        ))}
        {submissions.length > 0 && (
          <button className="mt-auto pt-2 w-full text-center text-sm text-blue-600 hover:underline flex items-center justify-center">
            Xem tất cả bài nộp <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        )}
      </div>
    </div>
  );
}
