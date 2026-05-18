import { useState } from "react";
import { FileText, Clock, Users, Paperclip, Pencil, Trash2, ExternalLink } from "lucide-react";
import { assignmentService } from "../../../services/assignmentService";
import type { Assignment } from "../../../types/assignment";
import { formatDeadline, isOverdue } from "../../../utils/dateUtils";

interface AssignmentCardProps {
  assignment: Assignment;
  onEdit: (assignment: Assignment) => void;
  onDelete: (id: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  ESSAY: "Nộp tệp",
  MULTIPLE_CHOICE: "Trắc nghiệm",
};

export default function AssignmentCard({ assignment, onEdit, onDelete }: AssignmentCardProps) {
  const overdue = isOverdue(assignment.deadline);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Xóa bài tập "${assignment.title}"?`)) return;
    setDeleting(true);
    try {
      const res: any = await assignmentService.deleteAssignment(assignment.classId, assignment.assignmentId);
      if (res.success) onDelete(assignment.assignmentId);
      else alert(res.message || "Xóa thất bại.");
    } catch {
      alert("Lỗi kết nối.");
    } finally {
      setDeleting(false);
    }
  };

  const getFileUrl = (uri: string) => {
    if (uri.startsWith('http')) return uri;
    return `${import.meta.env.VITE_MINIO_URL || "http://localhost:9000"}/${uri}`;
  };

  return (
    <div className="border border-gray-200 rounded-xl bg-white hover:shadow-sm transition overflow-hidden">
      {/* Main row */}
      <div
        className="flex items-start gap-4 p-5 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          assignment.typeAssignment === "MULTIPLE_CHOICE"
            ? "bg-purple-100 text-purple-600"
            : "bg-blue-100 text-blue-600"
        }`}>
          <FileText size={20} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-800 leading-tight">{assignment.title}</h3>
              {!expanded && assignment.description && (
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{assignment.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                {TYPE_LABELS[assignment.typeAssignment] ?? assignment.typeAssignment}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                overdue ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
              }`}>
                {overdue ? "Hết hạn" : "Đang mở"}
              </span>
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-5 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              Hạn nộp: {formatDeadline(assignment.deadline)}
            </span>
            <span className="flex items-center gap-1">
              <Users size={12} />
              {assignment.totalSubmissions ?? 0} bài đã nộp
            </span>
            {assignment.AssignmentAttachments.length > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip size={12} />
                {assignment.AssignmentAttachments.length} tài liệu
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(assignment)}
            title="Chỉnh sửa"
            className="p-2 rounded-full text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Xóa bài tập"
            className="p-2 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
          >
            {deleting
              ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
              : <Trash2 size={16} />
            }
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">
          {assignment.description && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Hướng dẫn</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
            </div>
          )}

          {assignment.AssignmentAttachments.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Tài liệu đính kèm</p>
              <div className="space-y-1.5">
                {assignment.AssignmentAttachments.map((att) => (
                  <a
                    key={att.attachmentId}
                    href={getFileUrl(att.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    <Paperclip size={13} />
                    {att.fileName}
                    <ExternalLink size={12} className="text-gray-400" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
