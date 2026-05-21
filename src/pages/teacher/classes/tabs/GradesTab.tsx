import { useEffect, useState } from "react";
import { classroomService } from "../../../../services/classroomService";
import { Search, AlertCircle, TrendingUp, Download, FileText, Info } from "lucide-react";

interface Assignment {
  assignmentId: string;
  title: string;
  deadline: string;
  typeAssignment: string;
}

type GradeStatus = "graded" | "absent" | "pending" | "not_started";

interface StudentGrade {
  assignmentId: string;
  title: string;
  score: number | null;
  comment: string | null;
  gradedAt: string | null;
  status: GradeStatus;
}

interface StudentGradeSummary {
  studentId: string;
  name: string;
  email: string;
  grades: StudentGrade[];
  averageScore: number | null;
}

interface GradesTabProps {
  classId: string;
}

export default function TeacherGradesTab({ classId }: GradesTabProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<StudentGradeSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await classroomService.getClassGrades(classId);
        if (res && res.success) {
          setAssignments(res.data.assignments || []);
          setStudents(res.data.students || []);
        } else {
          setError(res?.message || "Không thể tải bảng điểm lớp học.");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Lỗi kết nối. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchGrades();
    }
  }, [classId]);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return;

    // Create CSV content
    const headers = ["STT", "Họ và tên", "Email", ...assignments.map((a) => a.title), "Điểm trung bình"];
    const rows = filteredStudents.map((student, idx) => {
      const studentRow = [
        idx + 1,
        student.name,
        student.email,
        ...assignments.map((a) => {
          const grade = student.grades.find((g) => g.assignmentId === a.assignmentId);
          return grade?.score !== null && grade?.score !== undefined ? grade.score : "";
        }),
        student.averageScore !== null ? student.averageScore : "",
      ];
      return studentRow.map((val) => `"${val}"`).join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bang_Diem_Lop_Hoc_${classId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Đang tải bảng điểm...</div>;
  if (error)
    return (
      <div className="flex flex-col items-center justify-center py-12 text-red-500 gap-2">
        <AlertCircle size={32} />
        <p>{error}</p>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm học sinh theo tên hoặc email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {assignments.length > 0 && students.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-xl text-sm transition"
          >
            <Download size={16} />
            <span>Xuất file CSV</span>
          </button>
        )}
      </div>

      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3 border border-dashed border-gray-200 rounded-2xl">
          <FileText size={48} className="text-gray-300" />
          <p className="text-lg font-medium text-gray-600">Chưa có bài tập nào</p>
          <p className="text-sm text-gray-400">Tạo bài tập trong lớp để có thể hiển thị bảng điểm.</p>
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3 border border-dashed border-gray-200 rounded-2xl">
          <TrendingUp size={48} className="text-gray-300" />
          <p className="text-lg font-medium text-gray-600">Chưa có học sinh nào</p>
          <p className="text-sm text-gray-400">Học sinh cần tham gia lớp để hiển thị trong bảng điểm.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-200">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 font-medium">
                  <th className="py-4 px-6 text-left w-16">STT</th>
                  <th className="py-4 px-6 text-left sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] w-64">
                    Học sinh
                  </th>
                  {assignments.map((assignment) => (
                    <th key={assignment.assignmentId} className="py-4 px-4 text-center min-w-30">
                      <div className="flex flex-col items-center">
                        <span className="font-medium text-gray-700 line-clamp-1 max-w-37.5" title={assignment.title}>
                          {assignment.title}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5">
                          Hạn: {new Date(assignment.deadline).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="py-4 px-6 text-center w-36 font-semibold text-indigo-700 bg-indigo-50/30">
                    Điểm TB
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={assignments.length + 3} className="py-12 text-center text-gray-400">
                      Không tìm thấy học sinh phù hợp với từ khóa tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => (
                    <tr key={student.studentId} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6 text-gray-400">{idx + 1}</td>
                      <td className="py-4 px-6 sticky left-0 bg-white group-hover:bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold text-xs shrink-0">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate max-w-45">{student.name}</p>
                            <p className="text-xs text-gray-400 truncate max-w-45">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      {assignments.map((assignment) => {
                        const grade = student.grades.find((g) => g.assignmentId === assignment.assignmentId);
                        const status: GradeStatus = grade?.status ?? "not_started";
                        return (
                          <td key={assignment.assignmentId} className="py-4 px-4 text-center">
                            {status === "graded" && grade && (
                              <div className="inline-flex flex-col items-center gap-0.5">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    (grade.score ?? 0) >= 8.0
                                      ? "bg-green-50 text-green-700"
                                      : (grade.score ?? 0) >= 5.0
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-red-50 text-red-700"
                                  }`}
                                  title={grade.comment ? `Nhận xét: ${grade.comment}` : undefined}
                                >
                                  {grade.score}
                                </span>
                                {grade.comment && (
                                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5 max-w-25 truncate" title={grade.comment}>
                                    <Info size={10} className="shrink-0" />
                                    <span>{grade.comment}</span>
                                  </span>
                                )}
                              </div>
                            )}
                            {status === "absent" && (
                              <div className="inline-flex flex-col items-center gap-0.5">
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">0</span>
                                <span className="text-[10px] text-red-400 font-medium">Không nộp</span>
                              </div>
                            )}
                            {status === "pending" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-50 text-yellow-600 border border-yellow-200">
                                Chờ chấm
                              </span>
                            )}
                            {status === "not_started" && (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-4 px-6 text-center font-bold bg-indigo-50/10">
                        {student.averageScore !== null ? (
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-bold ${
                              student.averageScore >= 8.0
                                ? "bg-green-100 text-green-800"
                                : student.averageScore >= 5.0
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {student.averageScore}
                          </span>
                        ) : (
                          <span className="text-gray-300 font-medium">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

