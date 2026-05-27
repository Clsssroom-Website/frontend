import { useEffect, useState } from "react";
import { X, FileText, Download, Eye, Clock, User } from "lucide-react";
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

  // Grading state
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState<string>("");
  const [commentInput, setCommentInput] = useState<string>("");
  const [savingGrade, setSavingGrade] = useState<boolean>(false);

  // Expanded quiz answers
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);

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
            if (s.submissionId !== submissionId) return s;
            return {
              ...s,
              grade: {
                gradeId: s.grade?.gradeId || "temp",
                score: parsed,
                comment: commentInput.trim(),
                gradedAt: new Date().toISOString(),
              },
            };
          })
        );
        setEditingSubmissionId(null);
      } else {
        toast.error(res.message || "Lỗi khi chấm điểm.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Lỗi kết nối.");
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
        setError(err instanceof Error ? err.message : "Lỗi kết nối.");
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [isOpen, classId, assignment.assignmentId]);

  // Khóa cuộn trang nền khi mở modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isQuiz = assignment.typeAssignment === "MULTIPLE_CHOICE";

  const handlePreview = (fileUrl: string) => window.open(fileUrl, "_blank");
  const handleDownload = (fileUrl: string, downloadUrl?: string) => {
    window.location.href = downloadUrl || fileUrl;
  };

  const isLate = (submittedAtStr?: string) => {
    if (!submittedAtStr) return false;
    return new Date(submittedAtStr) > new Date(assignment.deadline);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Danh sách bài nộp</h2>
            <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xl">
              {assignment.title}
              {isQuiz && <span className="ml-2 text-xs text-gray-400">(Trắc nghiệm)</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 bg-gray-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <span className="w-7 h-7 border-4 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
              <p className="text-sm">Đang tải...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">
              <p>{error}</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-100 rounded-xl">
              <FileText size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-base font-medium text-gray-700">Chưa có học sinh nào nộp bài</p>
              <p className="text-sm text-gray-400 mt-1">Bài nộp sẽ hiển thị tại đây.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => {
                const subLate = isLate(sub.submittedAt);
                const quizAnswers = sub.quizAnswers ?? [];
                const correctCount = quizAnswers.filter((a) => a.isCorrect).length;

                return (
                  <div
                    key={sub.submissionId}
                    className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col gap-3"
                  >
                    {/* Row 1: Student info + meta */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-600 font-bold text-sm">
                        {sub.student?.name ? sub.student.name.charAt(0).toUpperCase() : <User size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-sm">{sub.student?.name || "Học sinh"}</h4>
                        <p className="text-xs text-gray-400 truncate">{sub.student?.email}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {formatDate(sub.submittedAt)}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            subLate
                              ? "bg-red-50 text-red-600 border-red-200"
                              : "bg-green-50 text-green-700 border-green-200"
                          }`}>
                            {subLate ? "Nộp muộn" : "Đúng hạn"}
                          </span>
                          {/* Quiz score badge */}
                          {isQuiz && sub.grade && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                              {sub.grade.score}/10 — Đúng {correctCount}/{quizAnswers.length} câu
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Grade area */}
                      <div className="shrink-0">
                        {editingSubmissionId === sub.submissionId ? null : sub.grade ? (
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-800">{sub.grade.score}<span className="text-xs text-gray-400">/10</span></div>
                            <button
                              onClick={() => startEditing(sub)}
                              className="text-[10px] text-gray-500 hover:text-gray-700 underline mt-0.5"
                            >
                              Sửa điểm
                            </button>
                          </div>
                        ) : (
                          !isQuiz && (
                            <button
                              onClick={() => startEditing(sub)}
                              className="px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                              Chấm điểm
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Grade editing form */}
                    {editingSubmissionId === sub.submissionId && (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                        <p className="text-xs font-semibold text-gray-700">Chấm điểm</p>
                        <div className="flex gap-2">
                          <div className="w-24 shrink-0">
                            <label className="block text-[10px] text-gray-500 mb-1">Điểm (0–10)</label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={scoreInput}
                              onChange={(e) => setScoreInput(e.target.value)}
                              placeholder="8.5"
                              className="w-full text-xs font-bold text-gray-800 bg-white border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-gray-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[10px] text-gray-500 mb-1">Nhận xét</label>
                            <input
                              type="text"
                              value={commentInput}
                              onChange={(e) => setCommentInput(e.target.value)}
                              placeholder="Nhận xét bài làm..."
                              className="w-full text-xs text-gray-700 bg-white border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-gray-500"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            onClick={() => setEditingSubmissionId(null)}
                            disabled={savingGrade}
                            className="px-3 py-1 font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 transition"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => handleSaveGrade(sub.submissionId)}
                            disabled={savingGrade}
                            className="px-3 py-1 font-semibold text-white bg-gray-800 rounded hover:bg-gray-700 transition flex items-center gap-1"
                          >
                            {savingGrade && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            Lưu
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Comment display (if graded and not editing) */}
                    {sub.grade?.comment && editingSubmissionId !== sub.submissionId && (
                      <div className="text-xs text-gray-500 italic pl-12">
                        Nhận xét: "{sub.grade.comment}"
                      </div>
                    )}

                    {/* Files (ESSAY) */}
                    {!isQuiz && (sub.SubmissionAttachments ?? []).length > 0 && (
                      <div className="pl-12">
                        <p className="text-xs font-medium text-gray-500 mb-1.5">
                          Tệp bài làm ({(sub.SubmissionAttachments ?? []).length})
                        </p>
                        <div className="space-y-1.5 max-h-28 overflow-y-auto">
                          {(sub.SubmissionAttachments ?? []).map((att) => {
                            const isPdf = att.fileName?.toLowerCase().endsWith(".pdf");
                            const isImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(att.fileName || "");

                            return (
                              <div
                                key={att.attachmentId}
                                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 text-xs"
                              >
                                <div className="flex items-center gap-2 truncate flex-1 min-w-0 mr-2">
                                  <span className="font-medium text-gray-700 truncate">{att.fileName}</span>
                                  {att.fileSize && (
                                    <span className="text-[10px] text-gray-400 shrink-0">
                                      ({formatFileSize(att.fileSize)})
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {(isPdf || isImage) && (
                                    <button
                                      onClick={() => handlePreview(att.fileUrl)}
                                      className="p-1 text-gray-500 hover:bg-gray-200 rounded transition"
                                      title="Xem trước"
                                    >
                                      <Eye size={13} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDownload(att.fileUrl, att.downloadUrl)}
                                    className="p-1 text-gray-500 hover:bg-gray-200 rounded transition"
                                    title="Tải về"
                                  >
                                    <Download size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quiz answers (MULTIPLE_CHOICE) */}
                    {isQuiz && quizAnswers.length > 0 && (
                      <div className="pl-12">
                        <button
                          onClick={() => setExpandedQuizId(
                            expandedQuizId === sub.submissionId ? null : sub.submissionId
                          )}
                          className="text-xs font-medium text-gray-600 hover:text-gray-800 underline"
                        >
                          {expandedQuizId === sub.submissionId ? "Ẩn" : "Xem"} câu trả lời ({quizAnswers.length} câu)
                        </button>

                        {expandedQuizId === sub.submissionId && (
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                            {quizAnswers.map((ans, i) => (
                              <div
                                key={ans.questionId}
                                className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs"
                              >
                                <span className="shrink-0 w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] font-bold">
                                  {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-700 font-medium mb-0.5 line-clamp-2">
                                    {ans.questionText || `Câu ${i + 1}`}
                                  </p>
                                  <p className="text-gray-500">
                                    Đã chọn:{" "}
                                    <span className="font-medium text-gray-700" style={{ wordBreak: "break-word" }}>
                                      {ans.selectedOptionText || ans.selectedOptionId}
                                    </span>
                                  </p>
                                </div>
                                <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                  ans.isCorrect
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : "border-red-200 bg-red-50 text-red-600"
                                }`}>
                                  {ans.isCorrect ? "Đúng" : "Sai"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
          <p className="text-xs text-gray-400">
            {submissions.length} bài nộp
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
