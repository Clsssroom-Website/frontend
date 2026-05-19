import { useEffect, useState } from "react";
import { assignmentService } from "../../../../services/assignmentService";
import { FileText, Clock, Upload, AlertCircle } from "lucide-react";
import AssignmentDetailView from "./AssignmentDetailView";

interface Assignment {
  assignmentId: string;
  title: string;
  description: string;
  deadline: string;
  typeAssignment: string;
  status: string;
  createdAt: string;
}

interface AssignmentsTabProps {
  classId: string;
}

export default function StudentAssignmentsTab({ classId }: AssignmentsTabProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data: any = await assignmentService.getAssignments(classId, "student");
        if (data && data.success) {
          setAssignments(data.data);
        } else {
          setError(data?.message || "Không thể tải danh sách bài tập.");
        }
      } catch (err: any) {
        setError(err.message || "Lỗi kết nối. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [classId]);

  if (loading) return <div className="text-center py-12 text-gray-400">Đang tải bài tập...</div>;
  if (error) return (
    <div className="flex flex-col items-center justify-center py-12 text-red-500 gap-2">
      <AlertCircle size={32} />
      <p>{error}</p>
    </div>
  );

  if (selectedAssignment) {
    return (
      <AssignmentDetailView 
        assignment={selectedAssignment} 
        onBack={() => setSelectedAssignment(null)} 
      />
    );
  }

  if (assignments.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
      <FileText size={48} className="text-gray-300" />
      <p className="text-lg font-medium">Chưa có bài tập nào</p>
      <p className="text-sm">Giáo viên chưa giao bài tập cho lớp này.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => {
        const isOverdue = new Date(assignment.deadline) < new Date();
        return (
          <div 
            key={assignment.assignmentId} 
            onClick={() => setSelectedAssignment(assignment)}
            className="border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 cursor-pointer transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 hover:text-indigo-600 transition-colors">{assignment.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{assignment.description || "Không có mô tả"}</p>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${isOverdue ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                {isOverdue ? "Quá hạn" : "Còn hạn"}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Clock size={15} />
                <span>Hạn nộp: {new Date(assignment.deadline).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <button
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
              >
                <Upload size={15} />
                Xem bài tập
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
