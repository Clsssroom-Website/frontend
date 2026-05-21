import { useNavigate } from 'react-router-dom';
import type { EnrolledClass } from './types';

interface MyClassesTableProps {
  classes: EnrolledClass[];
}

export function MyClassesTable({ classes }: MyClassesTableProps) {
  const navigate = useNavigate();

  return (
    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">Lớp học của tôi</h2>
        <button 
          onClick={() => navigate('/student/classes')}
          className="text-sm text-indigo-600 hover:underline font-medium"
        >
          Xem tất cả
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3 font-medium">Lớp học</th>
              <th className="px-6 py-3 font-medium">Giáo viên</th>
              <th className="px-6 py-3 font-medium text-center">Sĩ số</th>
              <th className="px-6 py-3 font-medium text-center">Bài tập</th>
              <th className="px-6 py-3 font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {classes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 font-medium">
                  Bạn chưa tham gia lớp học nào.
                </td>
              </tr>
            ) : (
              classes.map((cls) => (
                <tr key={cls.classId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">{cls.className}</td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{cls.teacherName || 'Chưa phân công'}</td>
                  <td className="px-6 py-4 text-gray-600 text-center">{cls.studentCount} học sinh</td>
                  <td className="px-6 py-4 text-gray-600 text-center">{cls.assignmentCount} bài</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => navigate(`/student/classes/${cls.classId}`)}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-600 font-medium rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition text-xs"
                    >
                      Vào học
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
