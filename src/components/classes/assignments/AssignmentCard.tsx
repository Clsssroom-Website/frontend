import { useState } from "react";
import { FileText, Clock, Users, Paperclip, Pencil, Trash2, Eye, Download } from "lucide-react";
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDownload = (att: any) => {
    const link = document.createElement('a');
    // Cách gọi ép tải xuống đối với presigned url Minio, ta thêm param response-content-disposition
    const urlObj = new URL(getFileUrl(att.fileUrl));
    urlObj.searchParams.set("response-content-disposition", `attachment; filename="${att.fileName}"`);
    
    link.href = urlObj.toString();
    link.download = att.fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              <div className="space-y-2">
                {assignment.AssignmentAttachments.map((att) => (
                  <div key={att.attachmentId} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Paperclip size={14} className="text-indigo-500 shrink-0" />
                      <span className="text-sm font-medium text-gray-700 truncate">{att.fileName}</span>
                    </div>

                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      {att.fileName?.toLowerCase().match(/\.(pdf|jpg|jpeg|png|gif|webp)$/) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(getFileUrl(att.fileUrl), "_blank");
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 bg-white border border-indigo-200 rounded transition cursor-pointer"
                          title="Xem trước"
                        >
                          <Eye size={14} />
                          <span className="hidden sm:inline">Xem trước</span>
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(att);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow rounded transition cursor-pointer"
                        title="Tải về"
                      >
                        <Download size={14} />
                        <span className="hidden sm:inline">Tải về</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
