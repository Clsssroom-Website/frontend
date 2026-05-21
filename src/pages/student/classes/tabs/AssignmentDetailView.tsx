import React, { useState, useEffect, useRef } from "react";
import { FileText, UploadCloud, Clock, CheckCircle2, Download, ExternalLink, Paperclip, X, AlertCircle } from "lucide-react";
import { assignmentService } from "../../../../services/assignmentService";
import { formatDeadline } from "../../../../utils/dateUtils";
import toast from "react-hot-toast";
import type { Assignment, Submission, QuizQuestion, StudentQuizAnswer } from "../../../../types/assignment";

interface AssignmentDetailViewProps {
  assignment: Assignment;
  onBack: () => void;
}

export default function AssignmentDetailView({ assignment, onBack }: AssignmentDetailViewProps) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const quizQuestions = React.useMemo<QuizQuestion[]>(() => {
    if (!assignment.quizData) return [];
    try {
      return typeof assignment.quizData === "string"
        ? JSON.parse(assignment.quizData)
        : assignment.quizData;
    } catch (e) {
      console.error(e);
      return [];
    }
  }, [assignment.quizData]);

  const studentAnswers = React.useMemo<StudentQuizAnswer[]>(() => {
    if (!submission?.quizAnswers) return [];
    try {
      return typeof submission.quizAnswers === "string"
        ? JSON.parse(submission.quizAnswers)
        : submission.quizAnswers;
    } catch (e) {
      console.error(e);
      return [];
    }
  }, [submission]);

  const handleSelectOption = (questionId: string, option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  useEffect(() => {
    let active = true;
    const fetchSub = async () => {
      try {
        setLoading(true);
        const res = await assignmentService.getSubmissionAndGrade(assignment.assignmentId);
        if (active && res.success && res.data) {
          setSubmission(res.data);
        }
      } catch (err: unknown) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchSub();
    return () => {
      active = false;
    };
  }, [assignment.assignmentId]);

  const handleQuizSubmit = async () => {
    const answeredCount = Object.keys(selectedAnswers).length;
    const totalCount = quizQuestions.length;

    if (answeredCount < totalCount) {
      const confirmSubmit = window.confirm(
        `Bạn mới trả lời ${answeredCount}/${totalCount} câu hỏi. Bạn có chắc chắn muốn nộp bài không?`
      );
      if (!confirmSubmit) return;
    } else {
      const confirmSubmit = window.confirm("Bạn có chắc chắn muốn nộp bài trắc nghiệm này không?");
      if (!confirmSubmit) return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const answersPayload = quizQuestions.map((q) => ({
        questionId: q.id,
        selectedAnswer: selectedAnswers[q.id] || "",
      }));

      const res = await assignmentService.submitQuizAssignment(assignment.assignmentId, answersPayload);
      if (res.success) {
        setSubmission(res.data);
        alert("Nộp bài trắc nghiệm thành công!");
      } else {
        setError(res.message || "Có lỗi xảy ra khi nộp bài.");
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errorObj.response?.data?.message || errorObj.message || "Lỗi kết nối.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      setError("Vui lòng chọn ít nhất một tệp để nộp bài.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const res = await assignmentService.submitAssignment(assignment.assignmentId, selectedFiles);
      if (res.success) {
        setSubmission(res.data);
        setSelectedFiles([]);
        toast.success("Nộp bài thành công!");
      } else {
        setError(res.message || "Có lỗi xảy ra khi nộp bài.");
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errorObj.response?.data?.message || errorObj.message || "Lỗi kết nối.");
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = new Date(assignment.deadline) < new Date();
  const hasSubmitted = !!submission;

  const getFileUrl = (uri: string) => uri || "";

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Đang tải thông tin bài tập...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200">
        
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 leading-tight">{assignment.title}</h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                <span>Đã đăng: {new Date(assignment.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            title="Đóng cửa sổ"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 mb-5 text-sm">
                <div className="flex items-center gap-1.5 font-medium text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                  <Clock size={16} className={isOverdue && !hasSubmitted ? "text-red-500" : "text-gray-500"} />
                  Hạn nộp: {formatDeadline(assignment.deadline)}
                </div>
                <div className="px-3 py-1.5 rounded-lg border border-gray-200 font-medium text-gray-600 bg-white shadow-sm">
                  Thang điểm: 10
                </div>
                {!hasSubmitted && isOverdue && (
                  <div className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-medium border border-red-100 shadow-sm">
                    Đã quá hạn
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Hướng dẫn chi tiết:</h3>
                <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap leading-relaxed font-normal">
                  {assignment.description || "Không có hướng dẫn chi tiết."}
                </div>
              </div>
            </div>

            {assignment.typeAssignment === "MULTIPLE_CHOICE" && (
              <div className="space-y-6">
                <div className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-indigo-950 mb-2">
                    📋 Bài trắc nghiệm trực tuyến
                  </h3>
                  <p className="text-xs text-gray-600">
                    {hasSubmitted
                      ? "Xem lại kết quả bài làm của bạn bên dưới. Các câu hỏi đã được chấm điểm tự động."
                      : "Vui lòng hoàn thành các câu hỏi bên dưới. Nhấp vào phương án bạn chọn và nhấn nút Nộp bài để hoàn tất."}
                  </p>
                </div>

                {quizQuestions.length === 0 ? (
                  <div className="text-center py-10 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-500 font-medium">
                    Bài trắc nghiệm này không có câu hỏi nào.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {quizQuestions.map((q, idx) => {
                      const studentAns = studentAnswers.find((a) => a.questionId === q.id);
                      const selectedAnswer = studentAns ? studentAns.selectedAnswer : "";
                      const isCorrect = studentAns ? studentAns.isCorrect : false;

                      return (
                        <div
                          key={q.id}
                          className={`border rounded-xl p-5 shadow-sm space-y-4 bg-white transition-colors ${
                            hasSubmitted
                              ? isCorrect
                                ? "border-green-200 bg-green-50/10"
                                : selectedAnswer
                                ? "border-red-200 bg-red-50/10"
                                : "border-gray-200"
                              : "border-gray-200 hover:border-indigo-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold shrink-0">
                                {idx + 1}
                              </span>
                              <h4 className="text-sm font-semibold text-gray-800 leading-relaxed">
                                {q.questionText}
                              </h4>
                            </div>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded shrink-0">
                              {q.score || 1} điểm
                            </span>
                          </div>

                          <div className="space-y-2">
                            {q.options.map((opt: string, oIdx: number) => {
                              const isOptionSelected = hasSubmitted
                                ? selectedAnswer === opt
                                : selectedAnswers[q.id] === opt;

                              const isOptionCorrect = q.correctAnswer === opt;

                              let optionStyle = "border-gray-200 hover:bg-gray-50/80";
                              if (hasSubmitted) {
                                if (isOptionCorrect) {
                                  optionStyle = "border-green-300 bg-green-50 text-green-800 font-medium";
                                } else if (isOptionSelected && !isOptionCorrect) {
                                  optionStyle = "border-red-300 bg-red-50 text-red-800 font-medium";
                                } else {
                                  optionStyle = "border-gray-200 opacity-60";
                                }
                              } else if (isOptionSelected) {
                                optionStyle = "border-indigo-500 bg-indigo-50/50 text-indigo-900 font-medium";
                              }

                              return (
                                <label
                                  key={oIdx}
                                  className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition ${optionStyle}`}
                                >
                                  <input
                                    type="radio"
                                    name={`question-${q.id}`}
                                    value={opt}
                                    checked={isOptionSelected}
                                    onChange={() => !hasSubmitted && handleSelectOption(q.id, opt)}
                                    disabled={hasSubmitted}
                                    className="accent-indigo-600 shrink-0"
                                  />
                                  <span className="flex-1 leading-relaxed">{opt}</span>

                                  {hasSubmitted && isOptionSelected && (
                                    <span className="text-[10px] uppercase font-bold tracking-wider shrink-0">
                                      {isOptionCorrect ? (
                                        <span className="text-green-600">Bạn chọn đúng</span>
                                      ) : (
                                        <span className="text-red-600">Bạn chọn sai</span>
                                      )}
                                    </span>
                                  )}
                                  {hasSubmitted && isOptionCorrect && !isOptionSelected && (
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-green-600 shrink-0">
                                      Đáp án đúng
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                          </div>

                          {hasSubmitted && (
                            <div className="text-xs pt-1">
                              {!selectedAnswer ? (
                                <p className="text-gray-500 italic">
                                  ⚠️ Bạn đã bỏ qua câu hỏi này. Đáp án đúng là:{" "}
                                  <strong className="text-green-700">{q.correctAnswer}</strong>
                                </p>
                              ) : !isCorrect ? (
                                <p className="text-red-600">
                                  ❌ Sai rồi. Đáp án đúng phải là:{" "}
                                  <strong className="text-green-700">{q.correctAnswer}</strong>
                                </p>
                              ) : (
                                <p className="text-green-600">✓ Chính xác!</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Teacher Attachments */}
            {assignment.AssignmentAttachments && assignment.AssignmentAttachments.length > 0 && (
              <div className="rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Tài liệu đính kèm từ Giáo viên</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {assignment.AssignmentAttachments.map((att) => (
                    <a
                      key={att.attachmentId}
                      href={getFileUrl(att.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition group bg-white"
                    >
                      <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-indigo-50 transition-colors">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate group-hover:text-indigo-600 transition-colors">
                          {att.fileName}
                        </p>
                        {att.fileSize && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {(parseInt(att.fileSize) / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                      <Download size={18} className="text-gray-400 group-hover:text-indigo-600 shrink-0 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Submission Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Bài tập của bạn</h3>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium shadow-sm ${hasSubmitted
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : isOverdue
                      ? "bg-red-100 text-red-600 border border-red-200"
                      : "bg-orange-100 text-orange-700 border border-orange-200"
                  }`}>
                  {hasSubmitted ? "Đã nộp" : isOverdue ? "Thiếu bài" : "Chưa nộp"}
                </span>
              </div>

              {assignment.typeAssignment === "MULTIPLE_CHOICE" ? (
                hasSubmitted ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg border border-green-200 mb-4 shadow-sm">
                      <CheckCircle2 size={20} className="shrink-0" />
                      <span className="text-sm font-medium">Bạn đã hoàn thành bài tập trắc nghiệm này</span>
                    </div>

                    {submission.grade !== undefined && submission.grade !== null && (
                      <div className="mt-6 pt-5 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Điểm số:</span>
                          <span className="text-2xl font-bold text-indigo-600">
                            {submission.grade.score}
                            <span className="text-sm text-gray-400 font-medium">/10</span>
                          </span>
                        </div>
                        {submission.grade.comment && (
                          <div className="mt-3 text-sm text-gray-700 bg-indigo-50 p-3.5 rounded-lg border border-indigo-100 shadow-sm">
                            <span className="font-semibold text-indigo-900 block mb-1">Nhận xét:</span>
                            <p className="leading-relaxed font-normal">{submission.grade.comment}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-indigo-800 bg-indigo-50 border border-indigo-100 rounded-xl p-4 leading-relaxed font-normal">
                      <p className="font-semibold text-indigo-950 mb-1">Trạng thái bài làm:</p>
                      <p className="text-xs">
                        Đã chọn:{" "}
                        <strong className="text-indigo-950">
                          {Object.keys(selectedAnswers).length} / {quizQuestions.length}
                        </strong>{" "}
                        câu hỏi.
                      </p>
                    </div>

                    <button
                      onClick={handleQuizSubmit}
                      disabled={submitting || quizQuestions.length === 0 || isOverdue}
                      className="w-full py-3 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Đang nộp bài...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          Nộp bài kiểm tra
                        </>
                      )}
                    </button>
                  </div>
                )
              ) : (
                hasSubmitted ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg border border-green-200 mb-4 shadow-sm">
                      <CheckCircle2 size={20} className="shrink-0" />
                      <span className="text-sm font-medium">Bạn đã nộp bài tập này</span>
                    </div>

                    {submission.SubmissionAttachments && submission.SubmissionAttachments.length > 0 && (
                      <div className="space-y-2">
                        {submission.SubmissionAttachments.map((att) => (
                          <a
                            key={att.attachmentId}
                            href={getFileUrl(att.fileUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition group shadow-sm"
                          >
                            <Paperclip size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-700 truncate flex-1 group-hover:text-indigo-600">
                              {att.fileName}
                            </span>
                            <ExternalLink size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Score section if graded */}
                    {submission.grade !== undefined && submission.grade !== null && (
                      <div className="mt-6 pt-5 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Điểm số:</span>
                          <span className="text-2xl font-bold text-indigo-600">{submission.grade.score}<span className="text-sm text-gray-400 font-medium">/10</span></span>
                        </div>
                        {submission.grade.comment && (
                          <div className="mt-3 text-sm text-gray-700 bg-indigo-50 p-3.5 rounded-lg border border-indigo-100 shadow-sm">
                            <span className="font-semibold text-indigo-900 block mb-1">Giáo viên nhận xét:</span>
                            <p className="leading-relaxed font-normal">{submission.grade.comment}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-gray-500 text-center mt-5 pt-3 border-t border-gray-50 font-normal">
                      Không thể thay đổi bài đã nộp.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Upload area */}
                    <label className="w-full flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:border-indigo-400 transition-colors cursor-pointer group">
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 group-hover:shadow transition-all duration-300">
                        <UploadCloud size={24} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
                      </div>
                      <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700">Thêm tệp đính kèm</span>
                      <span className="text-xs text-gray-400 mt-1 text-center font-normal">Hỗ trợ: PDF, DOCX, ZIP (Max 25MB)</span>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                      />
                    </label>

                    {/* Selected files list */}
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-gray-200 shadow-sm rounded-lg text-sm">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileText size={16} className="text-blue-500 shrink-0" />
                              <span className="truncate text-gray-700 font-medium">{file.name}</span>
                            </div>
                            <button
                              onClick={() => removeFile(idx)}
                              title="Xóa tệp đính kèm"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition shrink-0"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {error && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 shadow-sm flex items-start gap-2 mt-3 font-normal">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Submit button */}
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || isOverdue || selectedFiles.length === 0}
                      className="w-full py-3 mt-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Đang nộp bài...
                        </>
                      ) : (
                        <>
                          <UploadCloud size={18} />
                          Nộp bài tập
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1 mt-3 font-normal">
                      <AlertCircle size={12} /> Bạn không thể sửa đổi sau khi nộp
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
