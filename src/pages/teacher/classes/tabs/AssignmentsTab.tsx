import { useEffect, useState } from "react";
import { assignmentService } from "../../../../services/assignmentService";
import { Plus, FileText, AlertCircle } from "lucide-react";
import type { Assignment } from "../../../../types/assignment";
import AssignmentCard from "../../../../components/classes/assignments/AssignmentCard";
import AssignmentForm from "../../../../components/classes/assignments/AssignmentForm";

interface AssignmentsTabProps {
  classId: string;
  isEnded?: boolean;
}

export default function TeacherAssignmentsTab({ classId, isEnded = false }: AssignmentsTabProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // null = hidden, undefined = create mode, Assignment = edit mode
  const [formTarget, setFormTarget] = useState<Assignment | null | undefined>(null);

  useEffect(() => {
    (async () => {
      try {
        const data: any = await assignmentService.getAssignments(classId, "teacher");
        if (data?.success) setAssignments(data.data);
        else setError(data?.message || "Không thể tải danh sách bài tập.");
      } catch (err: any) {
        setError(err.message || "Lỗi kết nối.");
      } finally {
        setLoading(false);
      }
    })();
  }, [classId]);

  const handleSaved = (saved: Assignment) => {
    setAssignments((prev) => {
      const exists = prev.find((a) => a.assignmentId === saved.assignmentId);
      if (exists) {
        return prev.map((a) =>
          a.assignmentId === saved.assignmentId
            ? { ...saved, totalSubmissions: saved.totalSubmissions ?? a.totalSubmissions }
            : a
        );
      }
      return [saved, ...prev];
    });
    setFormTarget(null);
  };

  const handleDeleted = (id: string) => setAssignments((prev) => prev.filter((a) => a.assignmentId !== id));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
        <span className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
        <p>Đang tải bài tập...</p>
      </div>
    );
  }

  const showForm = formTarget !== null; // null = hidden

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Danh sách bài tập
          {assignments.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">({assignments.length})</span>
          )}
        </h2>
        {!isEnded && (
          <button
            onClick={() => setFormTarget(undefined)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus size={16} />
            Tạo bài tập
          </button>
        )}
      </div>

      {/* Form tạo / chỉnh sửa (Modal overlay) */}
      {showForm && (
        <AssignmentForm
          classId={classId}
          editTarget={formTarget ?? undefined}
          onSaved={handleSaved}
          onCancel={() => setFormTarget(null)}
        />
      )}

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12 text-red-500 gap-2">
          <AlertCircle size={32} />
          <p>{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!error && assignments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3 border-2 border-dashed border-gray-200 rounded-2xl">
          <FileText size={48} className="text-gray-300" />
          <p className="text-lg font-medium">Chưa có bài tập nào</p>
          <p className="text-sm">Bấm "Tạo bài tập" để bắt đầu giao bài cho lớp.</p>
          {!isEnded && (
            <button
              onClick={() => setFormTarget(undefined)}
              className="mt-2 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus size={16} />
              Tạo bài tập đầu tiên
            </button>
          )}
        </div>
      )}

      {/* Assignment list */}
      {assignments.length > 0 && (
        <div className="space-y-3">
          {assignments.map((a) => (
            <AssignmentCard
              key={a.assignmentId}
              assignment={a}
              onEdit={(asgn) => setFormTarget(asgn)}
              onDelete={handleDeleted}
              isEnded={isEnded}
            />
          ))}
        </div>
      )}
    </div>
  );
}
