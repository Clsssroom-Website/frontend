import React, { useState, useRef } from "react";
import { X, UploadCloud, ChevronRight, Plus, Trash2 } from "lucide-react";
import { AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { assignmentService } from "../../../services/assignmentService";
import type { Assignment, AttachmentItem, QuizQuestionDraft, QuizOptionDraft } from "../../../types/assignment";
import { toDatetimeLocal } from "../../../utils/dateUtils";
import AttachmentDisplayRow from "./AttachmentDisplayRow";

interface AssignmentFormProps {
  classId: string;
  editTarget?: Assignment | null;
  onSaved: (assignment: Assignment) => void;
  onCancel: () => void;
}

function makeTempId() {
  return crypto.randomUUID();
}

function makeDefaultQuestion(sortOrder: number): QuizQuestionDraft {
  return {
    _tempId: makeTempId(),
    questionText: "",
    points: 1,
    sortOrder,
    options: [
      { _tempId: makeTempId(), optionText: "", isCorrect: false },
      { _tempId: makeTempId(), optionText: "", isCorrect: false },
    ],
  };
}

export default function AssignmentForm({ classId, editTarget, onSaved, onCancel }: AssignmentFormProps) {
  const isEdit = !!editTarget;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasSubmissions = isEdit && !!editTarget?.totalSubmissions && editTarget.totalSubmissions > 0;

  const [title, setTitle] = useState(editTarget?.title ?? "");
  const [typeAssignment, setTypeAssignment] = useState(editTarget?.typeAssignment ?? "ESSAY");
  const [deadline, setDeadline] = useState(editTarget ? toDatetimeLocal(editTarget.deadline) : "");
  const [description, setDescription] = useState(editTarget?.description ?? "");

  // Khởi tạo quiz questions từ DB data (khi edit) hoặc rỗng (khi tạo mới)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionDraft[]>(() => {
    if (editTarget?.QuizQuestions && editTarget.QuizQuestions.length > 0) {
      return editTarget.QuizQuestions.map((q, idx) => ({
        _tempId: q.questionId, // dùng DB ID làm tempId khi edit
        questionText: q.questionText,
        points: q.points,
        sortOrder: q.sortOrder ?? idx + 1,
        options: q.QuizOptions.map((o) => ({
          _tempId: o.optionId, // dùng DB ID
          optionText: o.optionText,
          isCorrect: o.isCorrect ?? false,
        })),
      }));
    }
    return [];
  });

  const [attachments, setAttachments] = useState<AttachmentItem[]>(() => {
    if (!editTarget) return [];
    return editTarget.AssignmentAttachments.map((a) => ({
      kind: "existing" as const,
      attachmentId: a.attachmentId,
      fileName: a.fileName,
      fileUrl: a.fileUrl,
      fileSize: a.fileSize,
    }));
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Quiz Question Handlers ────────────────────────────────────────────────

  const addQuestion = () => {
    setQuizQuestions((prev) => [...prev, makeDefaultQuestion(prev.length + 1)]);
  };

  const removeQuestion = (tempId: string) => {
    setQuizQuestions((prev) => prev.filter((q) => q._tempId !== tempId));
  };

  const updateQuestion = (tempId: string, patch: Partial<Omit<QuizQuestionDraft, "_tempId" | "options">>) => {
    setQuizQuestions((prev) =>
      prev.map((q) => (q._tempId === tempId ? { ...q, ...patch } : q))
    );
  };

  const addOption = (qTempId: string) => {
    setQuizQuestions((prev) =>
      prev.map((q) =>
        q._tempId !== qTempId
          ? q
          : { ...q, options: [...q.options, { _tempId: makeTempId(), optionText: "", isCorrect: false }] }
      )
    );
  };

  const removeOption = (qTempId: string, optTempId: string) => {
    setQuizQuestions((prev) =>
      prev.map((q) => {
        if (q._tempId !== qTempId) return q;
        const newOpts = q.options.filter((o) => o._tempId !== optTempId);
        return { ...q, options: newOpts };
      })
    );
  };

  const updateOption = (qTempId: string, optTempId: string, patch: Partial<Omit<QuizOptionDraft, "_tempId">>) => {
    setQuizQuestions((prev) =>
      prev.map((q) => {
        if (q._tempId !== qTempId) return q;
        return {
          ...q,
          options: q.options.map((o) => (o._tempId === optTempId ? { ...o, ...patch } : o)),
        };
      })
    );
  };

  const setCorrectOption = (qTempId: string, optTempId: string) => {
    setQuizQuestions((prev) =>
      prev.map((q) => {
        if (q._tempId !== qTempId) return q;
        return {
          ...q,
          options: q.options.map((o) => ({
            ...o,
            isCorrect: o._tempId === optTempId,
          })),
        };
      })
    );
  };

  // ─── File selection ────────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    
    const validItems: AttachmentItem[] = [];
    const MAX_SIZE = 25 * 1024 * 1024; // 25MB
    
    for (const file of files) {
      if (file.size > MAX_SIZE) {
        toast.error(`Kích thước file "${file.name}" vượt quá 25MB.`);
        continue;
      }
      validItems.push({
        kind: "new" as const,
        file,
        previewName: file.name,
      });
    }

    if (validItems.length > 0) {
      setAttachments((prev) => [...prev, ...validItems]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Validation ────────────────────────────────────────────────────────────

  const validate = (): string | null => {
    if (!title.trim()) return "Vui lòng nhập tiêu đề bài tập.";
    if (!deadline) return "Vui lòng chọn hạn nộp.";
    if (typeAssignment === "MULTIPLE_CHOICE") {
      if (quizQuestions.length === 0) return "Vui lòng thêm ít nhất một câu hỏi trắc nghiệm.";
      for (let i = 0; i < quizQuestions.length; i++) {
        const q = quizQuestions[i];
        if (!q.questionText.trim()) return `Câu hỏi ${i + 1} chưa nhập nội dung.`;
        if (q.options.length < 2) return `Câu hỏi ${i + 1} cần ít nhất 2 phương án.`;
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].optionText.trim())
            return `Phương án ${j + 1} của câu hỏi ${i + 1} không được để trống.`;
        }
        const texts = q.options.map((o) => o.optionText.trim());
        if (new Set(texts).size !== texts.length)
          return `Câu hỏi ${i + 1} có các phương án bị trùng lặp.`;
        const hasCorrect = q.options.some((o) => o.isCorrect);
        if (!hasCorrect) return `Câu hỏi ${i + 1} chưa chọn đáp án đúng.`;
        if (q.points <= 0) return `Điểm số của câu hỏi ${i + 1} phải lớn hơn 0.`;
      }
    }
    return null;
  };

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError(null);
    setSubmitting(true);

    try {
      const newFiles = typeAssignment === "MULTIPLE_CHOICE"
        ? []
        : attachments
            .filter((a): a is Extract<AttachmentItem, { kind: "new" }> => a.kind === "new")
            .map((a) => a.file);

      const keepIds = typeAssignment === "MULTIPLE_CHOICE"
        ? []
        : attachments
            .filter((a): a is Extract<AttachmentItem, { kind: "existing" }> => a.kind === "existing")
            .map((a) => a.attachmentId);

      // Chuyển QuizQuestionDraft[] → QuizQuestionInput[] cho backend
      const questionsPayload =
        typeAssignment === "MULTIPLE_CHOICE" && !hasSubmissions
          ? quizQuestions.map((q, idx) => ({
              questionText: q.questionText.trim(),
              points: q.points,
              sortOrder: idx + 1,
              options: q.options.map((o) => ({
                optionText: o.optionText.trim(),
                isCorrect: o.isCorrect,
              })),
            }))
          : undefined;

      let res: Awaited<ReturnType<typeof assignmentService.createAssignment>>;

      if (isEdit) {
        res = await assignmentService.updateAssignment(classId, editTarget!.assignmentId, {
          title: title.trim(),
          description,
          deadline: new Date(deadline).toISOString(),
          typeAssignment,
          questions: questionsPayload,
          keepAttachmentIds: keepIds,
          files: newFiles,
        });
      } else {
        res = await assignmentService.createAssignment(classId, {
          title: title.trim(),
          description,
          deadline: new Date(deadline).toISOString(),
          typeAssignment,
          questions: questionsPayload,
          files: newFiles,
        });
      }

      if (res.success) {
        onSaved(res.data);
      } else {
        setError(res.message || "Thao tác thất bại.");
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errorObj?.response?.data?.message || errorObj.message || "Lỗi kết nối.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-2xl border border-gray-200 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEdit ? "Chỉnh sửa bài tập" : "Giao bài tập mới"}
          </h2>
          <button onClick={onCancel} title="Đóng" className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Tiêu đề */}
          <div>
            <label htmlFor="assignmentTitleInput" className="block text-sm font-medium text-gray-700 mb-1.5">
              Tiêu đề bài tập <span className="text-red-500">*</span>
            </label>
            <input
              id="assignmentTitleInput"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Kiểm tra giữa kỳ môn Toán"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white"
            />
          </div>

          {/* Loại hình + Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Loại bài tập <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                {[
                  { value: "ESSAY", label: "Nộp tệp" },
                  { value: "MULTIPLE_CHOICE", label: "Trắc nghiệm" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition text-sm font-medium flex-1 justify-center ${
                      typeAssignment === opt.value
                        ? "border-gray-800 bg-gray-50 text-gray-800 font-semibold"
                        : "border-gray-300 text-gray-500 hover:border-gray-400"
                    } ${isEdit ? "opacity-60 cursor-not-allowed bg-gray-50/50" : "cursor-pointer"}`}
                  >
                    <input
                      type="radio"
                      name="typeAssignment"
                      value={opt.value}
                      checked={typeAssignment === opt.value}
                      onChange={() => !isEdit && setTypeAssignment(opt.value)}
                      disabled={isEdit}
                      className="accent-gray-700 disabled:opacity-50"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="assignmentDeadlineInput" className="block text-sm font-medium text-gray-700 mb-1.5">
                Hạn nộp <span className="text-red-500">*</span>
              </label>
              <input
                id="assignmentDeadlineInput"
                type="datetime-local"
                title="Chọn hạn nộp"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white"
              />
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label htmlFor="assignmentDescInput" className="block text-sm font-medium text-gray-700 mb-1.5">
              Hướng dẫn / Yêu cầu chi tiết
            </label>
            <textarea
              id="assignmentDescInput"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Nhập yêu cầu, hướng dẫn làm bài..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white"
            />
          </div>

          {/* Quiz builder hoặc File upload */}
          {typeAssignment === "MULTIPLE_CHOICE" ? (
            <div className="space-y-4">
              {hasSubmissions && (
                <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
                  <AlertCircle size={16} className="shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-bold">Không thể chỉnh sửa câu hỏi và đáp án</p>
                    <p className="mt-0.5">Bài tập trắc nghiệm này đã có học sinh nộp bài. Bạn chỉ có thể chỉnh sửa tiêu đề, mô tả và hạn nộp.</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <label className="block text-sm font-bold text-gray-800">
                  Câu hỏi trắc nghiệm
                </label>
                {!hasSubmissions && (
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm"
                  >
                    <Plus size={14} />
                    Thêm câu hỏi
                  </button>
                )}
              </div>

              {quizQuestions.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-indigo-100 rounded-xl bg-indigo-50/10 flex flex-col items-center gap-3">
                  <span className="text-sm text-indigo-400 font-medium">Chưa có câu hỏi. Nhấn nút bên trên để thêm câu hỏi đầu tiên.</span>
                  {!hasSubmissions && (
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-indigo-700 border border-indigo-200 bg-indigo-50/50 rounded-lg hover:bg-indigo-50 transition"
                    >
                      <Plus size={16} />
                      Tạo câu hỏi
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  {quizQuestions.map((q, idx) => (
                    <div key={q._tempId} className="border border-indigo-100 hover:border-indigo-200 rounded-xl p-4 bg-white shadow-sm space-y-4 transition">
                      {/* Header câu hỏi */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-bold text-gray-800">Câu hỏi</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <label htmlFor={`points-${q._tempId}`} className="text-xs text-gray-500 whitespace-nowrap">
                              Điểm:
                            </label>
                            <input
                              id={`points-${q._tempId}`}
                              type="number"
                              min={0.25}
                              step={0.25}
                              value={q.points}
                              disabled={hasSubmissions}
                              onChange={(e) => updateQuestion(q._tempId, { points: parseFloat(e.target.value) || 1 })}
                              className="w-16 px-2 py-1 text-center text-xs border border-indigo-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white font-semibold text-indigo-700 disabled:bg-gray-50 disabled:text-indigo-400 disabled:border-indigo-100 disabled:cursor-not-allowed"
                            />
                          </div>
                          {!hasSubmissions && (
                            <button
                              type="button"
                              onClick={() => removeQuestion(q._tempId)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition"
                              title="Xóa câu hỏi"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Nội dung câu hỏi */}
                      <input
                        type="text"
                        value={q.questionText}
                        disabled={hasSubmissions}
                        onChange={(e) => updateQuestion(q._tempId, { questionText: e.target.value })}
                        placeholder="Nhập nội dung câu hỏi..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:cursor-not-allowed"
                      />

                      {/* Các phương án */}
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-500">
                          Phương án trả lời — nhấn nút tròn để đánh dấu đáp án đúng:
                        </div>
                        {q.options.map((opt, oIdx) => (
                          <div key={opt._tempId} className="flex items-center gap-2">
                            {/* Chọn đáp án đúng */}
                            <button
                              type="button"
                              onClick={() => setCorrectOption(q._tempId, opt._tempId)}
                              disabled={hasSubmissions || !opt.optionText.trim()}
                              title={hasSubmissions ? "Không thể thay đổi đáp án đúng" : (opt.optionText.trim() ? "Đánh dấu là đáp án đúng" : "Nhập nội dung trước")}
                              className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{
                                borderColor: opt.isCorrect ? "#16a34a" : "#d1d5db",
                                backgroundColor: opt.isCorrect ? "#16a34a" : "white",
                              }}
                            >
                              {opt.isCorrect && (
                                <span className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </button>

                            {/* Input phương án */}
                            <input
                              type="text"
                              value={opt.optionText}
                              disabled={hasSubmissions}
                              onChange={(e) => updateOption(q._tempId, opt._tempId, { optionText: e.target.value })}
                              placeholder={`Phương án ${oIdx + 1}`}
                              className={`flex-1 px-3 py-1.5 border text-xs rounded-lg focus:outline-none focus:ring-1 bg-white transition disabled:bg-gray-50 disabled:text-gray-550 disabled:cursor-not-allowed ${
                                opt.isCorrect
                                  ? "border-green-600 bg-green-50/10 ring-1 ring-green-500/20 font-medium"
                                  : "border-gray-300"
                              }`}
                            />

                            {/* Label đúng */}
                            {opt.isCorrect && (
                              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 border border-green-200 rounded shrink-0 whitespace-nowrap">
                                Đúng
                              </span>
                            )}

                            {/* Xóa phương án */}
                            {q.options.length > 2 && !hasSubmissions && (
                              <button
                                type="button"
                                onClick={() => removeOption(q._tempId, opt._tempId)}
                                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition"
                                title="Xóa phương án"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        ))}

                        {!hasSubmissions && (
                          <button
                            type="button"
                            onClick={() => addOption(q._tempId)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-600 font-semibold hover:bg-indigo-50/50 rounded-md transition border border-indigo-200 mt-1"
                          >
                            <Plus size={12} />
                            Thêm phương án
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tài liệu đính kèm
                </label>
                <label 
                  htmlFor="teacher-attachment-input"
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer transition"
                >
                  <UploadCloud size={14} />
                  Thêm file
                </label>
              </div>

              {attachments.length === 0 ? (
                <label 
                  htmlFor="teacher-attachment-input"
                  className="w-full py-8 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-600 hover:border-indigo-400 hover:text-indigo-800 transition flex flex-col items-center justify-center gap-3 cursor-pointer bg-indigo-50/20"
                >
                  <UploadCloud size={28} className="text-indigo-450 animate-pulse" />
                  <span className="text-sm font-semibold">Nhấn để chọn file đính kèm</span>
                  <span className="text-xs text-indigo-400">PDF, DOCX, XLSX, PNG, JPG, ZIP — Tối đa 25MB/file</span>
                </label>
              ) : (
                <div className="space-y-2">
                  {attachments.map((item, i) => (
                    <AttachmentDisplayRow key={i} item={item} onRemove={() => removeAttachment(i)} />
                  ))}
                  <label 
                    htmlFor="teacher-attachment-input"
                    className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer mt-1.5 pl-1"
                  >
                    <UploadCloud size={13} />
                    Thêm file khác
                  </label>
                </div>
              )}

              <input 
                id="teacher-attachment-input"
                type="file" 
                multiple 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileSelect} 
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-60 transition"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ChevronRight size={16} />
              )}
              {isEdit ? "Lưu thay đổi" : "Giao bài tập"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
