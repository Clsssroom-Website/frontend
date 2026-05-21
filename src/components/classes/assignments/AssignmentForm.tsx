import React, { useState, useRef } from "react";
import { X, Bold, Italic, List, Link as LinkIcon, UploadCloud, ChevronRight, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { assignmentService } from "../../../services/assignmentService";
import type { Assignment, AttachmentItem, QuizQuestion } from "../../../types/assignment";
import { toDatetimeLocal } from "../../../utils/dateUtils";
import AttachmentDisplayRow from "./AttachmentDisplayRow";

interface AssignmentFormProps {
  classId: string;
  editTarget?: Assignment | null; // undefined/null = create mode
  onSaved: (assignment: Assignment) => void;
  onCancel: () => void;
}

export default function AssignmentForm({ classId, editTarget, onSaved, onCancel }: AssignmentFormProps) {
  const isEdit = !!editTarget;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(editTarget?.title ?? "");
  const [typeAssignment, setTypeAssignment] = useState(editTarget?.typeAssignment ?? "ESSAY");
  const [deadline, setDeadline] = useState(editTarget ? toDatetimeLocal(editTarget.deadline) : "");
  const [description, setDescription] = useState(editTarget?.description ?? "");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(() => {
    if (editTarget?.quizData) {
      try {
        return typeof editTarget.quizData === "string"
          ? JSON.parse(editTarget.quizData)
          : editTarget.quizData;
      } catch (err) {
        console.error("Failed to parse quizData:", err);
      }
    }
    return [];
  });

  const addQuestion = () => {
    const newQ: QuizQuestion = {
      id: crypto.randomUUID(),
      questionText: "",
      options: ["", ""],
      correctAnswer: "",
      score: 1,
    };
    setQuizQuestions([...quizQuestions, newQ]);
  };

  const removeQuestion = (id: string) => {
    setQuizQuestions(quizQuestions.filter((q) => q.id !== id));
  };

  const updateQuestionText = (id: string, text: string) => {
    setQuizQuestions(quizQuestions.map((q) => (q.id === id ? { ...q, questionText: text } : q)));
  };

  const updateQuestionScore = (id: string, score: number) => {
    setQuizQuestions(quizQuestions.map((q) => (q.id === id ? { ...q, score: Math.max(0.25, score) } : q)));
  };

  const addOption = (qId: string) => {
    setQuizQuestions(
      quizQuestions.map((q) => {
        if (q.id !== qId) return q;
        return { ...q, options: [...q.options, ""] };
      })
    );
  };

  const removeOption = (qId: string, optIndex: number) => {
    setQuizQuestions(
      quizQuestions.map((q) => {
        if (q.id !== qId) return q;
        const optionToRemove = q.options[optIndex];
        const newOptions = q.options.filter((_, idx) => idx !== optIndex);
        const newCorrect = q.correctAnswer === optionToRemove ? "" : q.correctAnswer;
        return { ...q, options: newOptions, correctAnswer: newCorrect };
      })
    );
  };

  const updateOptionText = (qId: string, optIndex: number, text: string) => {
    setQuizQuestions(
      quizQuestions.map((q) => {
        if (q.id !== qId) return q;
        const oldOptionText = q.options[optIndex];
        const newOptions = [...q.options];
        newOptions[optIndex] = text;
        const newCorrect = q.correctAnswer === oldOptionText ? text : q.correctAnswer;
        return { ...q, options: newOptions, correctAnswer: newCorrect };
      })
    );
  };

  const setCorrectOption = (qId: string, optionText: string) => {
    setQuizQuestions(
      quizQuestions.map((q) => {
        if (q.id !== qId) return q;
        return { ...q, correctAnswer: optionText };
      })
    );
  };

  /**
   * attachments: danh sách file hiển thị trong form.
   * - kind="existing": file đã có trên server (khi edit)
   * - kind="new":      file mới được chọn từ máy (chưa upload)
   */
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

  // ─── File selection ───────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const newItems: AttachmentItem[] = files.map((file) => ({
      kind: "new" as const,
      file,
      previewName: file.name,
    }));

    setAttachments((prev) => [...prev, ...newItems]);
    // Reset input để có thể chọn lại cùng file
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim()) { setError("Vui lòng nhập tiêu đề bài tập."); return; }
    if (!deadline) { setError("Vui lòng chọn hạn nộp."); return; }
    if (typeAssignment === "MULTIPLE_CHOICE") {
      if (quizQuestions.length === 0) {
        setError("Vui lòng thêm ít nhất một câu hỏi trắc nghiệm.");
        return;
      }
      for (let i = 0; i < quizQuestions.length; i++) {
        const q = quizQuestions[i];
        if (!q.questionText.trim()) {
          setError(`Câu hỏi thứ ${i + 1} chưa nhập nội dung.`);
          return;
        }
        if (q.options.length < 2) {
          setError(`Câu hỏi thứ ${i + 1} cần có ít nhất 2 phương án lựa chọn.`);
          return;
        }
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].trim()) {
            setError(`Phương án thứ ${j + 1} của câu hỏi thứ ${i + 1} không được để trống.`);
            return;
          }
        }
        const uniqueOptions = new Set(q.options.map(o => o.trim()));
        if (uniqueOptions.size !== q.options.length) {
          setError(`Câu hỏi thứ ${i + 1} có các phương án bị trùng lặp.`);
          return;
        }
        if (!q.correctAnswer) {
          setError(`Câu hỏi thứ ${i + 1} chưa chọn đáp án đúng.`);
          return;
        }
        if (!q.options.includes(q.correctAnswer)) {
          setError(`Câu hỏi thứ ${i + 1} có đáp án đúng không khớp với bất kỳ phương án nào.`);
          return;
        }
        if (q.score <= 0) {
          setError(`Câu hỏi thứ ${i + 1} điểm số phải lớn hơn 0.`);
          return;
        }
      }
    }

    setError(null);
    setSubmitting(true);

    try {
      // Tách file mới và IDs file cũ muốn giữ
      const newFiles = typeAssignment === "MULTIPLE_CHOICE" ? [] : attachments
        .filter((a): a is Extract<AttachmentItem, { kind: "new" }> => a.kind === "new")
        .map((a) => a.file);

      const keepIds = typeAssignment === "MULTIPLE_CHOICE" ? [] : attachments
        .filter((a): a is Extract<AttachmentItem, { kind: "existing" }> => a.kind === "existing")
        .map((a) => a.attachmentId);

      let res: Awaited<ReturnType<typeof assignmentService.createAssignment>>;

      if (isEdit) {
        res = await assignmentService.updateAssignment(classId, editTarget!.assignmentId, {
          title: title.trim(),
          description,
          deadline: new Date(deadline).toISOString(),
          typeAssignment,
          quizData: typeAssignment === "MULTIPLE_CHOICE" ? JSON.stringify(quizQuestions) : "",
          keepAttachmentIds: keepIds,
          files: newFiles,
        });
      } else {
        res = await assignmentService.createAssignment(classId, {
          title: title.trim(),
          description,
          deadline: new Date(deadline).toISOString(),
          typeAssignment,
          quizData: typeAssignment === "MULTIPLE_CHOICE" ? JSON.stringify(quizQuestions) : undefined,
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
              placeholder="VD: Báo cáo tiến độ Sprint 1"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
            />
          </div>

          {/* Loại hình + Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Loại hình bài tập <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                {[
                  { value: "ESSAY", label: "📄 Nộp tệp" },
                  { value: "MULTIPLE_CHOICE", label: "☑️ Trắc nghiệm" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition text-sm font-medium flex-1 justify-center ${
                      typeAssignment === opt.value
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="typeAssignment"
                      value={opt.value}
                      checked={typeAssignment === opt.value}
                      onChange={() => setTypeAssignment(opt.value)}
                      className="accent-indigo-600"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="assignmentDeadlineInput" className="block text-sm font-medium text-gray-700 mb-1.5">
                Hạn nộp (Deadline) <span className="text-red-500">*</span>
              </label>
              <input
                id="assignmentDeadlineInput"
                type="datetime-local"
                title="Chọn hạn nộp"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
              />
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label htmlFor="assignmentDescInput" className="block text-sm font-medium text-gray-700 mb-1.5">
              Hướng dẫn / Yêu cầu chi tiết
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent">
              <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50">
                {[
                  { Icon: Bold, title: "Chữ đậm" },
                  { Icon: Italic, title: "Chữ nghiêng" },
                  { Icon: List, title: "Danh sách" },
                  { Icon: LinkIcon, title: "Liên kết" }
                ].map(({ Icon, title: btnTitle }, i) => (
                  <button key={i} type="button" title={btnTitle} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition">
                    <Icon size={15} />
                  </button>
                ))}
              </div>
              <textarea
                id="assignmentDescInput"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Nhập yêu cầu, hướng dẫn làm bài..."
                className="w-full px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none bg-white"
              />
            </div>
          </div>

          {/* Tài liệu đính kèm hoặc Google Forms */}
          {typeAssignment === "MULTIPLE_CHOICE" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Danh sách câu hỏi trắc nghiệm
                </label>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                >
                  <Plus size={14} />
                  Thêm câu hỏi
                </button>
              </div>

              {quizQuestions.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 flex flex-col items-center justify-center gap-3">
                  <span className="text-sm font-medium text-gray-400">
                    Chưa có câu hỏi nào. Hãy tạo câu hỏi trắc nghiệm đầu tiên.
                  </span>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition"
                  >
                    <Plus size={16} />
                    Tạo câu hỏi
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {quizQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 shadow-sm relative space-y-4"
                    >
                      {/* Tiêu đề câu hỏi + Điểm số + Xóa */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-semibold text-gray-700">Câu hỏi</span>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Nhập điểm */}
                          <div className="flex items-center gap-1.5">
                            <label
                              htmlFor={`score-input-${q.id}`}
                              className="text-xs text-gray-500 font-medium whitespace-nowrap"
                            >
                              Điểm số:
                            </label>
                            <input
                              id={`score-input-${q.id}`}
                              type="number"
                              min={0.25}
                              step={0.25}
                              value={q.score}
                              onChange={(e) =>
                                updateQuestionScore(q.id, parseFloat(e.target.value) || 1)
                              }
                              className="w-16 px-2 py-1 text-center text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                            />
                          </div>

                          {/* Xóa câu hỏi */}
                          <button
                            type="button"
                            onClick={() => removeQuestion(q.id)}
                            className="p-1 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition"
                            title="Xóa câu hỏi"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Nội dung câu hỏi */}
                      <div>
                        <input
                          type="text"
                          value={q.questionText}
                          onChange={(e) => updateQuestionText(q.id, e.target.value)}
                          placeholder="Nhập nội dung câu hỏi trắc nghiệm..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        />
                      </div>

                      {/* Các phương án */}
                      <div className="space-y-2.5">
                        <div className="text-xs font-semibold text-gray-600">
                          Các phương án trả lời (Chọn nút hình tròn để chọn đáp án đúng):
                        </div>
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = q.correctAnswer !== "" && q.correctAnswer === opt;
                          return (
                            <div key={oIdx} className="flex items-center gap-2">
                              {/* Chọn đáp án đúng */}
                              <button
                                type="button"
                                onClick={() => setCorrectOption(q.id, opt)}
                                disabled={!opt.trim()}
                                className={`p-1 rounded-full transition ${
                                  isCorrect
                                    ? "text-green-600 hover:text-green-700"
                                    : "text-gray-400 hover:text-gray-600"
                                } disabled:opacity-30 disabled:cursor-not-allowed`}
                                title={
                                  opt.trim()
                                    ? "Đánh dấu đây là phương án đúng"
                                    : "Vui lòng nhập phương án trước khi chọn"
                                }
                              >
                                {isCorrect ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                              </button>

                              {/* Input phương án */}
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => updateOptionText(q.id, oIdx, e.target.value)}
                                placeholder={`Phương án ${oIdx + 1}`}
                                className={`flex-1 px-3 py-1.5 border text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white ${
                                  isCorrect ? "border-green-300 ring-1 ring-green-200" : "border-gray-300"
                                }`}
                              />

                              {/* Xóa phương án */}
                              {q.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(q.id, oIdx)}
                                  className="p-1 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition"
                                  title="Xóa phương án"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          );
                        })}

                        {/* Thêm phương án */}
                        <button
                          type="button"
                          onClick={() => addOption(q.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-600 font-medium hover:text-indigo-800 hover:bg-indigo-50/50 rounded-md transition"
                        >
                          <Plus size={12} />
                          Thêm phương án
                        </button>
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
                  Tài liệu đính kèm (Đề bài, biểu mẫu...)
                </label>
                <label className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer transition">
                  <UploadCloud size={14} />
                  Thêm file
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              {attachments.length === 0 ? (
                <label className="w-full py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition flex flex-col items-center justify-center gap-3 cursor-pointer bg-gray-50/50">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <UploadCloud size={28} className="text-gray-300" />
                  <span className="text-sm font-medium">Nhấn để chọn file đính kèm</span>
                  <span className="text-xs text-gray-400">PDF, DOCX, XLSX, PNG, JPG, ZIP — Tối đa 25MB/file</span>
                </label>
              ) : (
                <div className="space-y-2">
                  {attachments.map((item, i) => (
                    <AttachmentDisplayRow
                      key={i}
                      item={item}
                      onRemove={() => removeAttachment(i)}
                    />
                  ))}
                  {/* Nút thêm file tiếp */}
                  <label className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer mt-1 pl-1">
                    <UploadCloud size={13} />
                    Thêm file khác
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
              )}
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
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition"
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
