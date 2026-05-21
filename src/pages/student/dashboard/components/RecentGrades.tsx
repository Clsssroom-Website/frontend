import { Award, MessageSquare } from 'lucide-react';
import type { RecentGrade } from './types';

interface RecentGradesProps {
  grades: RecentGrade[];
}

export function RecentGrades({ grades }: RecentGradesProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">Điểm số mới nhất</h2>
        <p className="text-xs text-gray-500 mt-1">Bài tập giáo viên đã chấm điểm</p>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3 max-h-[360px] overflow-y-auto custom-scrollbar">
        {grades.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-gray-400">
            <Award className="w-10 h-10 mb-2 stroke-[1.5]" />
            <p className="text-sm font-medium">Chưa có bài tập nào được chấm điểm.</p>
          </div>
        ) : (
          grades.map((g) => (
            <div key={g.submissionId} className="border border-gray-100 p-4 rounded-xl hover:border-gray-300 hover:shadow-sm transition bg-white flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{g.assignmentTitle}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{g.className}</p>
                </div>
                <div className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100 font-bold text-sm shrink-0 flex items-center gap-1 shadow-sm">
                  {g.score}
                  <span className="text-xs text-emerald-500 font-medium">/10</span>
                </div>
              </div>
              
              {g.comment && (
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs text-gray-600 flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <p className="italic leading-relaxed truncate-2-lines">{g.comment}</p>
                </div>
              )}
              
              <div className="text-[10px] text-gray-400 flex items-center justify-between mt-1 border-t border-gray-50 pt-2">
                <span>Đã chấm ngày:</span>
                <span className="font-medium">
                  {g.gradedAt ? new Date(g.gradedAt).toLocaleDateString('vi-VN') : 'Không rõ'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
