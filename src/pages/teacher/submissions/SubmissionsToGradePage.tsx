import { useEffect, useState } from "react";
import { 
  Download, 
  Eye, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { dashboardService } from "../../../services/dashboard.service";
import { assignmentService } from "../../../services/assignmentService";
import toast from "react-hot-toast";

interface Attachment {
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  downloadUrl?: string;
  fileSize?: string;
}

interface PendingSubmission {
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  submittedAt: string | null;
  attachments?: Attachment[];
}

export default function SubmissionsToGradePage() {
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Grading states
  const [selectedSub, setSelectedSub] = useState<PendingSubmission | null>(null);
  const [scoreInput, setScoreInput] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);

  const fetchPendingSubmissions = async (currentPage: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardService.getPendingSubmissionsToGrade(currentPage, limit);
      if (res.success && res.data) {
        setSubmissions(res.data.submissions || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        setPage(res.data.page || currentPage);
      } else {
        setError(res.message || "Không thể tải danh sách bài nộp cần chấm.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSubmissions(page);
  }, [page]);

  const openGradingModal = (sub: PendingSubmission) => {
    setSelectedSub(sub);
    setScoreInput("");
    setCommentInput("");
  };

  const closeGradingModal = () => {
    setSelectedSub(null);
    setScoreInput("");
    setCommentInput("");
  };

  const handleSaveGrade = async () => {
    if (!selectedSub) return;
    const score = parseFloat(scoreInput);
    if (isNaN(score) || score < 0 || score > 10) {
      toast.error("Điểm số phải nằm trong khoảng từ 0 đến 10.");
      return;
    }

    try {
      setSavingGrade(true);
      const res = await assignmentService.gradeSubmission(
        selectedSub.classId,
        selectedSub.assignmentId,
        selectedSub.submissionId,
        {
          score,
          comment: commentInput.trim(),
        }
      );

      if (res.success) {
        toast.success("Chấm điểm thành công!");
        closeGradingModal();
        // Refresh the list. If we are on a page where the last item is removed, go to previous page
        const isLastItemOnPage = submissions.length === 1;
        const nextPage = isLastItemOnPage && page > 1 ? page - 1 : page;
        if (nextPage !== page) {
          setPage(nextPage);
        } else {
          fetchPendingSubmissions(page);
        }
      } else {
        toast.error(res.message || "Lỗi khi lưu điểm số.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Lỗi kết nối.");
    } finally {
      setSavingGrade(false);
    }
  };

  const formatFileSize = (bytesStr?: string) => {
    if (!bytesStr) return "";
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return "";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "Không rõ";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Không rõ";
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Danh sách chấm bài</h1>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý và chấm điểm tất cả các bài nộp tự luận chưa chấm thuộc các lớp của bạn.
            </p>
          </div>
          <div className="shrink-0 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 text-indigo-700 text-sm font-semibold flex items-center gap-2 self-start md:self-auto">
            <CheckCircle className="w-5 h-5" />
            <span>Còn {total} bài cần chấm</span>
          </div>
        </div>

        {/* LIST / TABLE CARD */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {loading && submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <span className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500 font-medium">Đang tải danh sách bài nộp...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Đã xảy ra lỗi</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md">{error}</p>
              <button 
                onClick={() => fetchPendingSubmissions(page)}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
              >
                Thử lại
              </button>
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Tuyệt vời! Sạch bài cần chấm</h3>
              <p className="text-sm text-gray-400 mt-1 max-w-sm">
                Bạn đã hoàn thành chấm tất cả các bài nộp tự luận của học sinh.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Table Wrapper */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Bài tập</th>
                      <th className="px-6 py-4">Lớp học</th>
                      <th className="px-6 py-4">Học sinh</th>
                      <th className="px-6 py-4">Ngày nộp</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 text-sm text-gray-700">
                    {submissions.map((sub) => (
                      <tr key={sub.submissionId} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900">{sub.assignmentTitle}</td>
                        <td className="px-6 py-4 text-gray-500">{sub.className}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800">{sub.studentName}</span>
                            <span className="text-xs text-gray-400 mt-0.5">{sub.studentEmail}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Clock size={14} className="text-gray-400" />
                            <span>{formatDateTime(sub.submittedAt)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openGradingModal(sub)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                          >
                            Chấm điểm
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION PANEL */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Hiển thị trang <strong className="font-semibold text-gray-700">{page}</strong> trên <strong className="font-semibold text-gray-700">{totalPages}</strong> ({total} bài nộp)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      title="Trang trước"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      title="Trang sau"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* GRADING MODAL */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-600 font-bold text-sm">
                {selectedSub.studentName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  Chấm điểm cho {selectedSub.studentName}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{selectedSub.studentEmail}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span className="font-semibold text-gray-700 bg-gray-150 px-2 py-0.5 rounded">
                    {selectedSub.className}
                  </span>
                  <span>•</span>
                  <span className="truncate max-w-[200px]">{selectedSub.assignmentTitle}</span>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50/20">
              
              {/* Attachments Section */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Tệp đính kèm bài làm ({selectedSub.attachments?.length || 0})
                </label>
                {!selectedSub.attachments || selectedSub.attachments.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-400">
                    <HelpCircle size={15} />
                    <span>Không có tệp đính kèm nào được tải lên.</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {selectedSub.attachments.map((att) => {
                      const isPdf = att.fileName.toLowerCase().endsWith(".pdf");
                      const isImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(att.fileName);

                      return (
                        <div
                          key={att.attachmentId}
                          className="flex items-center justify-between p-2.5 bg-white border border-gray-150 rounded-xl text-xs shadow-xs hover:border-gray-300 transition"
                        >
                          <div className="flex items-center gap-2 truncate flex-1 mr-3 min-w-0">
                            <span className="text-base shrink-0">{isPdf ? "📄" : "📝"}</span>
                            <span className="font-medium text-gray-700 truncate" title={att.fileName}>
                              {att.fileName}
                            </span>
                            {att.fileSize && (
                              <span className="text-[10px] text-gray-400 shrink-0">
                                ({formatFileSize(att.fileSize)})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {(isPdf || isImage) && (
                              <button
                                onClick={() => window.open(att.fileUrl, "_blank")}
                                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 transition"
                                title="Xem trước"
                              >
                                <Eye size={14} />
                              </button>
                            )}
                            <a
                              href={att.downloadUrl || att.fileUrl}
                              className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 transition inline-block"
                              title="Tải xuống"
                            >
                              <Download size={14} />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Score Input */}
              <div className="space-y-1.5">
                <label htmlFor="modal-score-input" className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Điểm số (Thang điểm 10) <span className="text-red-500">*</span>
                </label>
                <input
                  id="modal-score-input"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                  placeholder="Nhập số điểm (VD: 8.5)"
                  className="w-full text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Comment Textarea */}
              <div className="space-y-1.5">
                <label htmlFor="modal-comment-input" className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Nhận xét bài làm
                </label>
                <textarea
                  id="modal-comment-input"
                  rows={3}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Nhập lời phê, nhận xét cho học sinh..."
                  className="w-full text-sm text-gray-700 bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={closeGradingModal}
                disabled={savingGrade}
                className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveGrade}
                disabled={savingGrade || !scoreInput}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition flex items-center gap-2"
              >
                {savingGrade && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Lưu kết quả
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
