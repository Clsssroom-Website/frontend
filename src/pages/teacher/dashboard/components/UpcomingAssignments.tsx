import { Clock } from 'lucide-react';
import type { UpcomingAssignment } from './types';

interface UpcomingAssignmentsProps {
  assignments: UpcomingAssignment[];
}

export function UpcomingAssignments({ assignments }: UpcomingAssignmentsProps) {
  return (
    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Bài tập sắp đến hạn nộp</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3 font-medium">Tên bài tập</th>
              <th className="px-6 py-3 font-medium">Lớp học</th>
              <th className="px-6 py-3 font-medium">Hạn nộp</th>
              <th className="px-6 py-3 font-medium">Tình trạng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {assignments.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{task.title}</td>
                <td className="px-6 py-4 text-gray-600">{task.className}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    {task.dueDate}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    task.status === 'urgent' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    {task.status === 'urgent' ? 'Sắp hết hạn' : 'Sắp tới'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
