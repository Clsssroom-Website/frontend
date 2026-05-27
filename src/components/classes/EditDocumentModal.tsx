import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, UploadCloud, FileType } from "lucide-react";
import { documentService } from "../../services/document.service";
import type { Document, DocumentAttachment } from "../../types/document";
import toast from "react-hot-toast";

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  onEditSuccess: () => void;
}

export default function EditDocumentModal({ isOpen, onClose, document: doc, onEditSuccess }: EditDocumentModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [existingAttachments, setExistingAttachments] = useState<DocumentAttachment[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && doc) {
      setTitle(doc.title);
      setDescription(doc.description || "");
      setExistingAttachments(doc.DocumentAttachments || []);
      setNewFiles([]);
    }
  }, [isOpen, doc]);

  if (!isOpen) return null;

  const validateAndAddNewFiles = (selectedFiles: File[]) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    
    const validFiles: File[] = [];
    for (const f of selectedFiles) {
      if (!validTypes.includes(f.type)) {
        toast.error(`Chỉ hỗ trợ file PDF hoặc DOCX. Tệp ${f.name} bị từ chối.`);
        continue;
      }
      if (f.size > 25 * 1024 * 1024) {
        toast.error(`Kích thước file ${f.name} vượt quá 25MB.`);
        continue;
      }
      validFiles.push(f);
    }
    
    if (validFiles.length > 0) {
      setNewFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddNewFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddNewFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleRemoveExisting = (attachmentId: string) => {
    setExistingAttachments(prev => prev.filter(att => att.attachmentId !== attachmentId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề tài liệu");
      return;
    }
    
    const activeExistingCount = existingAttachments.length;
    const activeNewCount = newFiles.length;
    if (activeExistingCount + activeNewCount === 0) {
      toast.error("Tài liệu phải chứa ít nhất một file đính kèm");
      return;
    }

    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      
      const keepAttachmentIds = existingAttachments.map(att => att.attachmentId);
      formData.append("keepAttachmentIds", JSON.stringify(keepAttachmentIds));

      newFiles.forEach((f) => {
        formData.append("files", f);
      });

      await documentService.updateDocument(doc.documentId, formData);
      
      toast.success("Cập nhật tài liệu thành công!");
      onEditSuccess();
      onClose();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Đã xảy ra lỗi khi cập nhật tài liệu";
      toast.error(errorMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Chỉnh sửa tài liệu</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
            disabled={isUpdating}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Files List & Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tệp đính kèm hiện tại <span className="text-red-500">*</span></label>
            <div className="space-y-2">
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {/* Existing attachments */}
                {existingAttachments.map((att) => {
                  const isPdf = att.fileName.toLowerCase().endsWith('.pdf');
                  return (
                    <div key={att.attachmentId} className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
                        <span className="text-base shrink-0">{isPdf ? "📄" : "📝"}</span>
                        <span className="text-sm text-gray-700 truncate flex-1 font-medium" title={att.fileName}>
                          {att.fileName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExisting(att.attachmentId)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Xóa file"
                        disabled={isUpdating}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}

                {/* New attachments */}
                {newFiles.map((f, i) => {
                  const isPdf = f.name.toLowerCase().endsWith('.pdf');
                  return (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
                        <span className="text-base shrink-0">{isPdf ? "📄" : "📝"}</span>
                        <span className="text-sm text-indigo-700 truncate flex-1 font-medium" title={f.name}>
                          {f.name}
                        </span>
                        <span className="ml-1 shrink-0 text-xs text-indigo-500 font-medium">
                          ({(f.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                        <span className="ml-1 shrink-0 text-[10px] text-indigo-700 bg-indigo-100 px-1 py-0.5 rounded font-bold uppercase">Mới</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Xóa file"
                        disabled={isUpdating}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Upload Drag/Drop zone if total files is small or click button to add more */}
              <div 
                className="border border-dashed border-gray-300 hover:border-indigo-400 bg-gray-50 hover:bg-indigo-50 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,.docx"
                  multiple
                  disabled={isUpdating}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
                  <UploadCloud size={16} />
                  Kéo thả hoặc click để thêm tệp mới
                </div>
                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <FileType size={10} /> Hỗ trợ PDF, DOCX (Tối đa 25MB)
                </p>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề <span className="text-red-500">*</span></label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề tài liệu"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              disabled={isUpdating}
            />
          </div>

          <div>
            <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả cho tài liệu (không bắt buộc)"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
              disabled={isUpdating}
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition cursor-pointer"
              disabled={isUpdating}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isUpdating || (existingAttachments.length + newFiles.length === 0) || !title.trim()}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition cursor-pointer"
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang cập nhật...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
