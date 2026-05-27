import React, { useState, useEffect, useRef } from "react";
import { FileText, UploadCloud, Clock, Download, X, AlertCircle } from "lucide-react";
import { assignmentService } from "../../../../services/assignmentService";
import { formatDeadline } from "../../../../utils/dateUtils";
import toast from "react-hot-toast";
import type { Assignment, Submission, QuizQuestionDB, QuizAnswerResult } from "../../../../types/assignment";
import ConfirmModal from "../../../../components/common/ConfirmModal";

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

  // Quiz questions từ API (với optionId, không có isCorrect)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionDB[]>([]);

  // selectedAnswers: questionId → optionId (DB IDs, không phải text)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  // Kết quả sau khi nộp: questionId → QuizAnswerResult
  const [quizResults, setQuizResults] = useState<Record<string, QuizAnswerResult>>({});

  // Trạng thái ConfirmModal nộp bài
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch cả submission lẫn assignment detail (để lấy quiz questions với optionId)
        const [subRes, detailRes] = await Promise.all([
          assignmentService.getSubmissionAndGrade(assignment.assignmentId),
          assignment.typeAssignment === "MULTIPLE_CHOICE"
            ? assignmentService.getAssignmentDetail(assignment.assignmentId)
            : Promise.resolve(null),
        ]);

        if (!active) return;

        if (subRes.success && subRes.data) {
          setSubmission(subRes.data);
          // Nếu đã nộp bài, map quiz results
          const answers = subRes.data.quizAnswers ?? subRes.data.answers ?? [];
          if (answers.length > 0) {
            const resultMap: Record<string, QuizAnswerResult> = {};
            answers.forEach((a) => { resultMap[a.questionId] = a; });
            setQuizResults(resultMap);
          }
        }

        if (detailRes?.success && detailRes.data.QuizQuestions) {
          setQuizQuestions(detailRes.data.QuizQuestions);
        } else if (assignment.QuizQuestions) {
          setQuizQuestions(assignment.QuizQuestions);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, [assignment.assignmentId, assignment.typeAssignment, assignment.QuizQuestions]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  // ─── Quiz submit ────────────────────────────────────────────────────────────

  const handleQuizSubmit = () => {
    const answeredCount = Object.keys(selectedAnswers).length;
    const totalCount = quizQuestions.length;

    const performSubmit = async () => {
      setConfirmModal(null);
      try {
        setSubmitting(true);
        setError(null);

        // Dùng optionId thật từ DB
        const answersPayload = quizQuestions.map((q) => ({
          questionId: q.questionId,
          selectedOptionId: selectedAnswers[q.questionId] ?? "",
        }));

        const res = await assignmentService.submitQuizAssignment(assignment.assignmentId, answersPayload);
        if (res.success) {
          setSubmission(res.data);
          const answers = res.data.answers ?? res.data.quizAnswers ?? [];
          const resultMap: Record<string, QuizAnswerResult> = {};
          answers.forEach((a) => { resultMap[a.questionId] = a; });
          setQuizResults(resultMap);
          toast.success("Nộp bài trắc nghiệm thành công!");
        } else {
          setError(res.message || "Có lỗi xảy ra khi nộp bài.");
        }
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        setError(e.response?.data?.message || e.message || "Lỗi kết nối.");
      } finally {
        setSubmitting(false);
      }
    };

    if (answeredCount < totalCount) {
      setConfirmModal({
        isOpen: true,
        title: "Chưa hoàn thành tất cả câu hỏi",
        message: `Bạn mới trả lời ${answeredCount}/${totalCount} câu hỏi. Bạn có chắc chắn muốn nộp bài ngay bây giờ không?`,
        onConfirm: performSubmit,
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: "Xác nhận nộp bài",
        message: "Bạn có chắc chắn muốn nộp bài trắc nghiệm này không?",
        onConfirm: performSubmit,
      });
    }
  };

  // ─── Essay submit ───────────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles: File[] = [];
      const MAX_SIZE = 25 * 1024 * 1024; // 25MB

      for (const file of filesArray) {
        if (file.size > MAX_SIZE) {
          toast.error(`Kích thước file "${file.name}" vượt quá 25MB.`);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEssaySubmit = async () => {
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
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || "Lỗi kết nối.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Derived state ─────────────────────────────────────────────────────────

  const isOverdue = new Date(assignment.deadline) < new Date();
  const hasSubmitted = !!submission;
  const isQuiz = assignment.typeAssignment === "MULTIPLE_CHOICE";
  const answeredCount = Object.keys(selectedAnswers).length;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Đang tải bài tập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative">

        {/* Sticky Header */}
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 leading-tight">{assignment.title}</h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span>Đăng: {new Date(assignment.createdAt).toLocaleDateString("vi-VN")}</span>
              <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-medium">
                {isQuiz ? "Trắc nghiệm" : "Nộp tệp"}
              </span>
            </div>
          </div>
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition"
            title="Đóng"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Details + Quiz */}
          <div className="lg:col-span-2 space-y-5">

            {/* Meta bar */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className={`flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white ${isOverdue && !hasSubmitted ? "text-red-600" : "text-gray-700"}`}>
                <Clock size={15} className="text-gray-400" />
                Hạn nộp: {formatDeadline(assignment.deadline)}
              </div>
              {!hasSubmitted && isOverdue && (
                <div className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 font-medium border border-gray-200 text-xs">
                  Đã quá hạn
                </div>
              )}
            </div>

            {/* Description */}
            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Hướng dẫn</h3>
              <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {assignment.description || "Không có hướng dẫn chi tiết."}
              </div>
            </div>

            {/* Quiz questions */}
            {isQuiz && (
              <div className="space-y-4">
                {quizQuestions.length === 0 ? (
                  <div className="text-center py-10 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-500">
                    Bài trắc nghiệm này chưa có câu hỏi.
                  </div>
                ) : (
                  quizQuestions.map((q, idx) => {
                    const result = quizResults[q.questionId];
                    const isAnswered = hasSubmitted ? !!result : !!selectedAnswers[q.questionId];

                    let cardClass = "border-gray-200 bg-white";
                    if (hasSubmitted && result) {
                      cardClass = result.isCorrect
                        ? "border-green-200 bg-green-50/5"
                        : "border-red-200 bg-red-50/5";
                    }

                    return (
                      <div
                        key={q.questionId}
                        className={`border rounded-xl p-5 shadow-sm space-y-3 transition ${cardClass}`}
                      >
                        {/* Question header */}
                        <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-2">
                          <div className="flex items-start gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-700 text-xs font-bold shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <h4 className="text-sm font-semibold text-gray-800 leading-relaxed">
                              {q.questionText}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {q.points} điểm
                            </span>
                            {hasSubmitted && result && (
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded border ${result.isCorrect
                                  ? "border-green-300 bg-green-100 text-green-700"
                                  : "border-red-300 bg-red-100 text-red-700"
                                }`}>
                                {result.isCorrect ? "Đúng" : "Sai"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          {q.QuizOptions.map((opt) => {
                            const isStudentSelected = hasSubmitted
                              ? result?.selectedOptionId === opt.optionId
                              : selectedAnswers[q.questionId] === opt.optionId;

                            const isCorrectOpt = hasSubmitted && result?.correctOptionId === opt.optionId;

                            let optClass = "border-gray-200 text-gray-700 hover:bg-gray-50";
                            let indicator = "";

                            if (hasSubmitted) {
                              if (isCorrectOpt && isStudentSelected) {
                                optClass = "border-green-500 bg-green-50 text-green-800 font-semibold";
                                indicator = "Bạn chọn — Đúng";
                              } else if (isStudentSelected && !isCorrectOpt) {
                                optClass = "border-red-300 bg-red-50 text-red-600 line-through";
                                indicator = "Bạn chọn — Sai";
                              } else if (isCorrectOpt) {
                                optClass = "border-green-400 bg-green-50/50 text-green-700 font-medium";
                                indicator = "Đáp án đúng";
                              } else {
                                optClass = "border-gray-150 text-gray-400 bg-gray-50/10";
                              }
                            } else if (isStudentSelected) {
                              optClass = "border-indigo-600 bg-indigo-50/50 text-indigo-950 font-medium ring-1 ring-indigo-500/20";
                            }

                            return (
                              <label
                                key={opt.optionId}
                                className={`flex items-center gap-3 p-3 rounded-lg border text-sm cursor-pointer transition ${optClass} ${hasSubmitted ? "cursor-default" : ""}`}
                              >
                                <input
                                  type="radio"
                                  name={`q-${q.questionId}`}
                                  value={opt.optionId}
                                  checked={isStudentSelected}
                                  onChange={() => !hasSubmitted && handleSelectOption(q.questionId, opt.optionId)}
                                  disabled={hasSubmitted}
                                  className={`shrink-0 ${hasSubmitted
                                      ? isCorrectOpt
                                        ? "accent-green-600"
                                        : "accent-red-600"
                                      : "accent-indigo-600"
                                    }`}
                                />
                                <span className="flex-1 leading-relaxed">{opt.optionText}</span>
                                {hasSubmitted && indicator && (
                                  <span className={`text-xs font-semibold shrink-0 ${isCorrectOpt
                                      ? "text-green-600"
                                      : isStudentSelected
                                        ? "text-red-500"
                                        : "text-green-600"
                                    }`}>
                                    {indicator}
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>

                        {/* Skipped hint */}
                        {hasSubmitted && !isAnswered && (
                          <p className="text-xs text-gray-400 italic pt-1">
                            Bạn đã bỏ qua câu này.
                            {result?.correctOptionId && (
                              <> Đáp án đúng: <strong className="text-gray-600">{
                                q.QuizOptions.find(o => o.optionId === result.correctOptionId)?.optionText
                              }</strong></>
                            )}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Teacher attachments */}
            {assignment.AssignmentAttachments && assignment.AssignmentAttachments.length > 0 && (
              <div className="rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Tài liệu từ Giáo viên</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {assignment.AssignmentAttachments.map((att) => (
                    <a
                      key={att.attachmentId}
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-400 transition group bg-white"
                    >
                      <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{att.fileName}</p>
                        {att.fileSize && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {(parseInt(att.fileSize) / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                      <Download size={16} className="text-gray-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Submission panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-800">Bài tập của bạn</h3>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${hasSubmitted
                    ? "bg-green-50 text-green-700 border-green-200"
                    : isOverdue
                      ? "bg-red-50 text-red-600 border-red-200"
                      : "bg-indigo-50 text-indigo-700 border-indigo-200"
                  }`}>
                  {hasSubmitted ? "Đã nộp" : isOverdue ? "Thiếu bài" : "Chưa nộp"}
                </span>
              </div>

              {/* QUIZ panel */}
              {isQuiz ? (
                hasSubmitted ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                      Bạn đã hoàn thành bài trắc nghiệm.
                    </div>

                    {/* Score */}
                    {(submission.grade || submission.score !== undefined) && (
                      <div className="pt-4 border-t border-gray-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 font-medium">Điểm số:</span>
                          <span className="text-2xl font-extrabold text-indigo-600">
                            {submission.grade?.score ?? submission.score}
                            <span className="text-sm text-gray-400 font-medium"> / 10</span>
                          </span>
                        </div>
                        {submission.grade?.comment && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <span className="font-medium text-gray-700 block mb-1">Nhận xét:</span>
                            <p className="leading-relaxed">{submission.grade.comment}</p>
                          </div>
                        )}
                        {/* Stats */}
                        {(submission.totalQuestions !== undefined) && (
                          <p className="text-xs text-gray-400 text-center">
                            Đúng {submission.correctAnswers}/{submission.totalQuestions} câu
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="font-medium text-gray-700 mb-1">Tiến độ:</p>
                      <p className="text-xs">
                        Đã chọn: <strong>{answeredCount}</strong> / {quizQuestions.length} câu
                      </p>
                      {quizQuestions.length > 0 && (
                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-600 rounded-full transition-all"
                            style={{ width: `${(answeredCount / quizQuestions.length) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleQuizSubmit}
                      disabled={submitting || quizQuestions.length === 0 || isOverdue}
                      className="w-full py-2.5 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                    >
                      {submitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Đang nộp...
                        </>
                      ) : (
                        "Nộp bài kiểm tra"
                      )}
                    </button>
                  </div>
                )
              ) : (
                /* ESSAY panel */
                hasSubmitted ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                      Bạn đã nộp bài tập này.
                    </div>

                    {/* Submitted files */}
                    {submission.SubmissionAttachments && submission.SubmissionAttachments.length > 0 && (
                      <div className="space-y-1.5">
                        {submission.SubmissionAttachments.map((att) => (
                          <a
                            key={att.attachmentId}
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-sm"
                          >
                            <FileText size={15} className="text-gray-400 shrink-0" />
                            <span className="text-gray-700 truncate flex-1">{att.fileName}</span>
                            <Download size={13} className="text-gray-400 shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Grade */}
                    {submission.grade && (
                      <div className="pt-3 border-t border-gray-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Điểm:</span>
                          <span className="text-2xl font-bold text-gray-800">
                            {submission.grade.score}
                            <span className="text-sm text-gray-400 font-medium">/10</span>
                          </span>
                        </div>
                        {submission.grade.comment && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <span className="font-medium text-gray-700 block mb-1">Nhận xét:</span>
                            <p className="leading-relaxed">{submission.grade.comment}</p>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 text-center">Không thể thay đổi bài đã nộp.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center py-7 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition cursor-pointer"
                    >
                      <UploadCloud size={22} className="text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-gray-600">Chọn file nộp bài</span>
                      <span className="text-xs text-gray-400 mt-0.5">PDF, DOCX, ZIP — Max 25MB</span>
                    </div>
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileSelect} 
                      onClick={(e) => e.stopPropagation()}
                    />

                    {selectedFiles.length > 0 && (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-lg text-sm">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileText size={14} className="text-gray-400 shrink-0" />
                              <span className="truncate text-gray-700">{file.name}</span>
                            </div>
                            <button
                              onClick={() => removeFile(idx)}
                              className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition shrink-0"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {error && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-2">
                        <AlertCircle size={15} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      onClick={handleEssaySubmit}
                      disabled={submitting || isOverdue || selectedFiles.length === 0}
                      className="w-full py-2.5 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                    >
                      {submitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Đang nộp...
                        </>
                      ) : (
                        <>
                          <UploadCloud size={16} />
                          Nộp bài tập
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                      <AlertCircle size={11} /> Không thể sửa đổi sau khi nộp
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel="Nộp bài"
          cancelLabel="Hủy"
          variant="primary"
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
