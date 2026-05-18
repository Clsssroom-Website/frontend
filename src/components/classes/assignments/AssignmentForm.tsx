import React, { useState } from "react";
import { X, Bold, Italic, List, Link as LinkIcon, UploadCloud, ChevronRight } from "lucide-react";
import { AlertCircle } from "lucide-react";
import axiosClient from "../../../../services/api/axiosClient";
import type { Assignment, AttachmentInput } from "../../../../types/assignment";
import { toDatetimeLocal } from "../../../../utils/dateUtils";
import AttachmentDisplayRow from "./AttachmentDisplayRow";

interface AssignmentFormProps {
  classId: string;
  editTarget?: Assignment | null; // null = create mode
  onSaved: (assignment: Assignment) => void;
  onCancel: () => void;
}

export default function AssignmentForm({ classId, editTarget, onSaved, onCancel }: AssignmentFormProps) {
  const isEdit = !!editTarget;

  const [title, setTitle] = useState(editTarget?.title ?? "");
  const [typeAssignment, setTypeAssignment] = useState(editTarget?.typeAssignment ?? "ESSAY");
  const [deadline, setDeadline] = useState(editTarget ? toDatetimeLocal(editTarget.deadline) : "");
  const [description, setDescription] = useState(editTarget?.description ?? "");
  const [attachments, setAttachments] = useState<AttachmentInput[]>(
    editTarget?.AssignmentAttachments.map((a) => ({ fileName: a.fileName, fileUrl: a.fileUrl })) ?? []
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res: any = await axiosClient.post("/api/v1/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.success) {
        setAttachments((prev) => [...prev, { fileName: res.data.data.fileName, fileUrl: res.data.data.fileUrl }]);
      } else {
        setError(res.message || "Tải file thất bại.");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải file lên máy chủ.");
    } finally {
      setUploading(false);
      e.target.value = ""; // reset input
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Vui lòng nhập tiêu đề bài tập."); return; }
    if (!deadline) { setError("Vui lòng chọn hạn nộp."); return; }

    const validAttachments = attachments.filter((a) => a.fileName.trim() && a.fileUrl.trim());

    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description,
        deadline: new Date(deadline).toISOString(),
        typeAssignment,
        attachments: validAttachments,
      };

      let res: any;
      if (isEdit) {
        res = await axiosClient.put(
          `/api/v1/classes/${classId}/assignments/${editTarget!.assignmentId}`,
          payload
        );
      } else {
        res = await axiosClient.post(`/api/v1/classes/${classId}/assignments`, payload);
      }

      if (res.success) {
        onSaved(res.data);
      } else {
        setError(res.message || "Thao tác thất bại.");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối.");
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

        <div className="p-6 space-y-5">
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
              <label className={`flex items-center gap-1.5 text-xs font-medium transition cursor-pointer ${
                uploading ? "text-gray-400" : "text-indigo-600 hover:text-indigo-800"
              }`}>
                {uploading ? (
                  <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UploadCloud size={14} />
                )}
                {uploading ? "Đang tải lên..." : "Tải file từ máy"}
                <input
                  type="file"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleFileSelect}
                />
              </label>
            </div>

            {attachments.length === 0 ? (
              <label className="w-full py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition flex flex-col items-center justify-center gap-3 cursor-pointer bg-gray-50/50">
                <input
                  type="file"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleFileSelect}
                />
                {uploading ? (
                  <>
                    <span className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    <span className="text-sm font-medium">Đang xử lý file...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={28} className="text-gray-300" />
                    <span className="text-sm font-medium">Nhấn để chọn file tải lên</span>
                  </>
                )}
              </label>
            ) : (
              <div className="space-y-2">
                {attachments.map((a, i) => (
                  <AttachmentDisplayRow
                    key={i}
                    attachment={a}
                    onRemove={() => removeAttachment(i)}
                  />
                ))}
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
