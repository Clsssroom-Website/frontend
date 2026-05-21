import { Clock, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { UpcomingAssignment } from './types';

interface UpcomingAssignmentsProps {
  assignments: UpcomingAssignment[];
}

export function UpcomingAssignments({ assignments }: UpcomingAssignmentsProps) {
  const navigate = useNavigate();

  return (
    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">Bài tập cần hoàn thành</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3 font-medium">Tên bài tập</th>
              <th className="px-6 py-3 font-medium">Lớp học</th>
              <th className="px-6 py-3 font-medium">Hạn nộp</th>
              <th className="px-6 py-3 font-medium">Độ khẩn cấp</th>
              <th className="px-6 py-3 font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 font-medium">
                  🎉 Tuyệt vời! Bạn không có bài tập nào cần làm.
                </td>
              </tr>
            ) : (
              assignments.map((task) => (
                <tr key={task.assignmentId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">{task.title}</td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{task.className}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">
                        {new Date(task.deadline).toLocaleDateString('vi-VN')} {new Date(task.deadline).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm border ${
                      task.urgency === 'urgent' 
                        ? 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse' 
                        : 'bg-sky-50 text-sky-700 border-sky-100'
                    }`}>
                      {task.urgency === 'urgent' ? 'Sắp hết hạn' : 'Đang diễn ra'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => navigate(`/student/classes/${task.classId}`, { state: { activeTab: 'classwork', assignmentId: task.assignmentId } })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition text-xs shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Làm bài
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
