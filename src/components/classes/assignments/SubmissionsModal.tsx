import { useEffect, useState } from "react";
import { X, FileText, Download, Eye, Clock, User, Paperclip } from "lucide-react";
import { assignmentService } from "../../../services/assignmentService";
import type { Assignment, Submission } from "../../../types/assignment";
import toast from "react-hot-toast";

interface SubmissionsModalProps {
  isOpen: boolean;
  classId: string;
  assignment: Assignment;
  onClose: () => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatFileSize = (bytes?: string | number | null) => {
  if (!bytes) return null;
  return (Number(bytes) / (1024 * 1024)).toFixed(2) + " MB";
};

export default function SubmissionsModal({ isOpen, classId, assignment, onClose }: SubmissionsModalProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for grading feature
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState<string>("");
  const [commentInput, setCommentInput] = useState<string>("");
  const [savingGrade, setSavingGrade] = useState<boolean>(false);

  const startEditing = (sub: Submission) => {
    setEditingSubmissionId(sub.submissionId);
    setScoreInput(sub.grade ? sub.grade.score?.toString() || "" : "");
    setCommentInput(sub.grade ? sub.grade.comment || "" : "");
  };

  const handleSaveGrade = async (submissionId: string) => {
    const parsed = parseFloat(scoreInput);
    if (isNaN(parsed) || parsed < 0 || parsed > 10) {
      toast.error("Điểm số phải từ 0 đến 10.");
      return;
    }
    try {
      setSavingGrade(true);
      const res = await assignmentService.gradeSubmission(classId, assignment.assignmentId, submissionId, {
        score: parsed,
        comment: commentInput.trim(),
      });
      if (res.success) {
        toast.success("Chấm điểm thành công!");
        setSubmissions((prev) =>
          prev.map((s) => {
            if (s.submissionId === submissionId) {
              return {
                ...s,
                grade: {
                  gradeId: s.grade?.gradeId || "temp",
                  score: parsed,
                  comment: commentInput.trim(),
                  gradedAt: new Date().toISOString(),
                },
              };
            }
            return s;
          })
        );
        setEditingSubmissionId(null);
      } else {
        toast.error(res.message || "Lỗi khi chấm điểm.");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Lỗi kết nối.";
      toast.error(errMsg);
    } finally {
      setSavingGrade(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await assignmentService.getSubmissions(classId, assignment.assignmentId);
        if (res.success) {
          setSubmissions(res.data);
        } else {
          setError(res.message || "Không thể tải danh sách bài nộp.");
        }
      } catch (err: unknown) {
        console.error("Lỗi khi tải bài nộp:", err);
        const errMsg = err instanceof Error ? err.message : "Lỗi kết nối.";
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [isOpen, classId, assignment.assignmentId]);

  if (!isOpen) return null;

  const getFileUrl = (uri: string) => {
    if (uri.startsWith('http')) return uri;
    return `${import.meta.env.VITE_MINIO_URL || "http://localhost:9000"}/${uri}`;
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      const urlObj = new URL(getFileUrl(fileUrl));
      urlObj.searchParams.set("response-content-disposition", `attachment; filename="${fileName}"`);
      
      link.href = urlObj.toString();
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("Không thể lấy link tải tài liệu.");
    }
  };

  const handlePreview = (fileUrl: string) => {
    window.open(getFileUrl(fileUrl), "_blank");
  };

  const isLate = (submittedAtStr?: string) => {
    if (!submittedAtStr) return false;
    const submittedAt = new Date(submittedAtStr);
    const deadline = new Date(assignment.deadline);
    return submittedAt > deadline;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Danh sách học sinh đã nộp bài</h2>
            <p className="text-sm text-gray-500 mt-1 truncate max-w-xl font-medium">
              Bài tập: <span className="text-gray-700">{assignment.title}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <span className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
              <p className="font-medium text-sm">Đang tải danh sách bài nộp...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">
              <p className="font-medium">{error}</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center text-gray-500 py-16 bg-white border border-gray-100 rounded-xl shadow-sm">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">Chưa có học sinh nào nộp bài</p>
              <p className="text-sm text-gray-400 mt-1">Bài nộp của học sinh sẽ hiển thị tại đây.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => {
                const subLate = isLate(sub.submittedAt);
                return (
                  <div 
                    key={sub.submissionId} 
                    className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow transition flex flex-col md:flex-row md:items-start justify-between gap-4"
                  >
                    {/* Student details */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 font-bold">
                        {sub.student?.name ? sub.student.name.charAt(0).toUpperCase() : <User size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-gray-800 text-base truncate">{sub.student?.name || "Học sinh ẩn danh"}</h4>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{sub.student?.email}</p>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs">
                          <span className="flex items-center gap-1 text-gray-500">
                            <Clock size={12} />
                            Nộp lúc: {formatDate(sub.submittedAt)}
                          </span>
                          
                          {subLate ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                              Nộp muộn
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                              Đúng hạn
                            </span>
                          )}
                        </div>

                        {/* Grading Area */}
                        {editingSubmissionId === sub.submissionId ? (
                          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3 max-w-md">
                            <p className="text-xs font-bold text-gray-700">Chấm điểm bài làm</p>
                            <div className="flex gap-2">
                              <div className="w-24 shrink-0">
                                <label className="block text-[10px] text-gray-500 font-medium mb-1">Điểm (0-10)</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.1"
                                  value={scoreInput}
                                  onChange={(e) => setScoreInput(e.target.value)}
                                  placeholder="8.5"
                                  className="w-full text-xs font-bold text-gray-800 bg-white border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-[10px] text-gray-500 font-medium mb-1">Nhận xét</label>
                                <input
                                  type="text"
                                  value={commentInput}
                                  onChange={(e) => setCommentInput(e.target.value)}
                                  placeholder="Nhập nhận xét..."
                                  className="w-full text-xs text-gray-700 bg-white border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 text-xs">
                              <button
                                onClick={() => setEditingSubmissionId(null)}
                                disabled={savingGrade}
                                className="px-2.5 py-1 font-semibold text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 transition cursor-pointer"
                              >
                                Hủy
                              </button>
                              <button
                                onClick={() => handleSaveGrade(sub.submissionId)}
                                disabled={savingGrade}
                                className="px-2.5 py-1 font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition cursor-pointer flex items-center gap-1"
                              >
                                {savingGrade ? (
                                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : "Lưu"}
                              </button>
                            </div>
                          </div>
                        ) : sub.grade ? (
                          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-xs flex items-center justify-between max-w-md">
                            <div className="min-w-0">
                              <span className="font-bold text-sm text-emerald-800">{sub.grade.score}</span>{" "}
                              <span className="text-[10px] text-emerald-600">/ 10 điểm</span>
                              {sub.grade.comment && (
                                <p className="text-[11px] text-emerald-700 mt-1 italic truncate max-w-[280px]" title={sub.grade.comment}>
                                  Nhận xét: "{sub.grade.comment}"
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => startEditing(sub)}
                              className="px-2 py-1 text-[10px] font-bold text-emerald-700 bg-white hover:bg-emerald-100 border border-emerald-200 rounded transition cursor-pointer shrink-0 ml-2"
                            >
                              Sửa điểm
                            </button>
                          </div>
                        ) : (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs text-gray-400 italic">Chưa chấm điểm</span>
                            <button
                              onClick={() => startEditing(sub)}
                              className="px-2 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition cursor-pointer"
                            >
                              Chấm điểm
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Files list */}
                    <div className="shrink-0 w-full md:w-80 flex flex-col gap-2">
                      <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                        <Paperclip size={12} />
                        Tệp bài làm ({sub.SubmissionAttachments.length})
                      </p>
                      
                      {sub.SubmissionAttachments.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Không đính kèm tệp nào.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                          {sub.SubmissionAttachments.map((att) => {
                            const isPdf = att.fileName?.toLowerCase().endsWith('.pdf');
                            const isImage = att.fileName?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                            const canPreview = isPdf || isImage;
                            
                            return (
                              <div 
                                key={att.attachmentId} 
                                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition text-xs min-w-0"
                              >
                                <div className="flex items-center gap-2 truncate flex-1 min-w-0 mr-2">
                                  <span className="font-semibold text-gray-700 truncate" title={att.fileName}>
                                    {att.fileName}
                                  </span>
                                  {att.fileSize && (
                                    <span className="text-[10px] text-gray-400 shrink-0">
                                      ({formatFileSize(att.fileSize)})
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-1 shrink-0">
                                  {canPreview && (
                                    <button 
                                      onClick={() => handlePreview(att.fileUrl)}
                                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition"
                                      title="Xem trước"
                                    >
                                      <Eye size={14} />
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleDownload(att.fileUrl, att.fileName)}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded transition"
                                    title="Tải về"
                                  >
                                    <Download size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
