import { useEffect, useState, useRef } from "react";
import { assignmentService } from "../../../../services/assignmentService";
import type { Assignment } from "../../../../types/assignment";
import { FileText, Clock, AlertCircle } from "lucide-react";
import AssignmentDetailView from "./AssignmentDetailView";

interface AssignmentsTabProps {
  classId: string;
  initialAssignmentId?: string;
}

export default function StudentAssignmentsTab({ classId, initialAssignmentId }: AssignmentsTabProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialId = useRef(initialAssignmentId);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data = await assignmentService.getAssignments(classId, "student");
        if (data && data.success) {
          setAssignments(data.data);
          if (initialId.current) {
            const found = data.data.find((a: Assignment) => a.assignmentId === initialId.current);
            if (found) setSelectedAssignment(found);
          }
        } else {
          setError(data?.message || "Không thể tải danh sách bài tập.");
        }
      } catch (err: unknown) {
        setError((err as { message?: string }).message || "Lỗi kết nối. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [classId]);

  if (loading)
    return <div className="text-center py-12 text-gray-400 text-sm">Đang tải bài tập...</div>;

  if (error)
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-2">
        <AlertCircle size={28} className="text-gray-300" />
        <p className="text-sm">{error}</p>
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

  if (assignments.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
        <FileText size={40} className="text-gray-300" />
        <p className="text-base font-medium text-gray-600">Chưa có bài tập nào</p>
        <p className="text-sm">Giáo viên chưa giao bài tập cho lớp này.</p>
      </div>
    );

  return (
    <div className="space-y-3">
      {assignments.map((assignment) => {
        const isOverdue = new Date(assignment.deadline) < new Date();
        const isQuiz = assignment.typeAssignment === "MULTIPLE_CHOICE";

        return (
          <div
            key={assignment.assignmentId}
            onClick={() => setSelectedAssignment(assignment)}
            className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md hover:border-gray-300 cursor-pointer transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm leading-snug">{assignment.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {assignment.description || "Không có mô tả"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 border rounded font-medium ${
                  isQuiz
                    ? "border-purple-200 bg-purple-50 text-purple-700"
                    : "border-blue-200 bg-blue-50 text-blue-700"
                }`}>
                  {isQuiz ? "Trắc nghiệm" : "Nộp tệp"}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded border font-medium ${
                  isOverdue
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-green-200 bg-green-50 text-green-700"
                }`}>
                  {isOverdue ? "Quá hạn" : "Còn hạn"}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock size={13} />
                <span>
                  {new Date(assignment.deadline).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <span className="text-xs text-gray-400 font-medium">
                Nhấn để xem →
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
