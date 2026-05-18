import type { ClassSummary } from './types';

interface MyClassesTableProps {
  classes: ClassSummary[];
}

export function MyClassesTable({ classes }: MyClassesTableProps) {
  return (
    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Lớp học của tôi</h2>
        <button className="text-sm text-blue-600 hover:underline font-medium">Xem tất cả</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3 font-medium">Lớp</th>
              <th className="px-6 py-3 font-medium">Join Code</th>
              <th className="px-6 py-3 font-medium">Học sinh</th>
              <th className="px-6 py-3 font-medium">Bài tập</th>
              <th className="px-6 py-3 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {classes.map((cls) => (
              <tr key={cls.classId} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{cls.className}</td>
                <td className="px-6 py-4">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">
                    {cls.joinCode || '-'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">{cls.studentCount}</td>
                <td className="px-6 py-4 text-gray-600">{cls.assignmentCount}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    cls.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {cls.status === 'ACTIVE' ? 'Đang hoạt động' : (cls.status || 'Đã lưu trữ')}
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
