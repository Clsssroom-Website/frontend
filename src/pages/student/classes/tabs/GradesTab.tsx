import { useEffect, useState } from "react";

import { Award, AlertCircle } from "lucide-react";

interface Grade {
  gradeId: string;
  assignmentId: string;
  score: number | null;
  comment: string | null;
  gradedAt: string;
  Assignments: {
    title: string;
    deadline: string;
  };
}

interface GradesTabProps {
  classId: string;
}



export default function StudentGradesTab({ classId }: GradesTabProps) {
  const [grades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Thêm API GET /students/classes/:classId/grades ở backend
    // Hiện tại để placeholder
    setLoading(false);
  }, [classId]);

  if (loading) return <div className="text-center py-12 text-gray-400">Đang tải điểm số...</div>;
  if (error) return (
    <div className="flex flex-col items-center justify-center py-12 text-red-500 gap-2">
      <AlertCircle size={32} />
      <p>{error}</p>
    </div>
  );

  return (
    <div>
      {grades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <Award size={48} className="text-gray-300" />
          <p className="text-lg font-medium">Chưa có điểm nào</p>
          <p className="text-sm">Giáo viên chưa chấm điểm bài tập nào.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="pb-3 font-medium">Bài tập</th>
                <th className="pb-3 font-medium text-center">Điểm</th>
                <th className="pb-3 font-medium">Nhận xét</th>
                <th className="pb-3 font-medium">Ngày chấm</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade) => (
                <tr key={grade.gradeId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-800">{grade.Assignments?.title}</td>
                  <td className="py-3 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full font-semibold ${grade.score !== null ? (grade.score >= 5 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700") : "bg-gray-100 text-gray-500"}`}>
                      {grade.score !== null ? `${grade.score}/10` : "—"}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{grade.comment || "—"}</td>
                  <td className="py-3 text-gray-400 text-xs">
                    {grade.gradedAt ? new Date(grade.gradedAt).toLocaleDateString("vi-VN") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
