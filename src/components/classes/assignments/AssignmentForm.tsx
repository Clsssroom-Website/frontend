import React, { useState, useRef } from "react";
import { X, Bold, Italic, List, Link as LinkIcon, UploadCloud, ChevronRight } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { assignmentService } from "../../../services/assignmentService";
import type { Assignment, AttachmentItem } from "../../../types/assignment";
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

    setError(null);
    setSubmitting(true);

    try {
      // Tách file mới và IDs file cũ muốn giữ
      const newFiles = attachments
        .filter((a): a is Extract<AttachmentItem, { kind: "new" }> => a.kind === "new")
        .map((a) => a.file);

      const keepIds = attachments
        .filter((a): a is Extract<AttachmentItem, { kind: "existing" }> => a.kind === "existing")
        .map((a) => a.attachmentId);

      let res: Awaited<ReturnType<typeof assignmentService.createAssignment>>;

      if (isEdit) {
        res = await assignmentService.updateAssignment(classId, editTarget!.assignmentId, {
          title: title.trim(),
          description,
          deadline: new Date(deadline).toISOString(),
          typeAssignment,
          keepAttachmentIds: keepIds,
          files: newFiles,
        });
      } else {
        res = await assignmentService.createAssignment(classId, {
          title: title.trim(),
          description,
          deadline: new Date(deadline).toISOString(),
          typeAssignment,
          files: newFiles,
        });
      }

      if (res.success) {
        onSaved(res.data);
      } else {
        setError(res.message || "Thao tác thất bại.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Lỗi kết nối.");
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
          <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Tiêu đề */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tiêu đề bài tập <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Báo cáo tiến độ Sprint 1"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Hạn nộp (Deadline) <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Hướng dẫn / Yêu cầu chi tiết
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent">
              <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50">
                {[Bold, Italic, List, LinkIcon].map((Icon, i) => (
                  <button key={i} type="button" className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition">
                    <Icon size={15} />
                  </button>
                ))}
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Nhập yêu cầu, hướng dẫn làm bài..."
                className="w-full px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none"
              />
            </div>
          </div>

          {/* Tài liệu đính kèm */}
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
