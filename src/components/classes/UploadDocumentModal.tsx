import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, UploadCloud, FileType } from "lucide-react";
import { documentService } from "../../services/document.service";
import toast from "react-hot-toast";

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onUploadSuccess: () => void;
}

export default function UploadDocumentModal({ isOpen, onClose, classId, onUploadSuccess }: UploadDocumentModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateAndAddFiles = (selectedFiles: File[]) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // docx
    ];
    
    const newFiles: File[] = [];
    for (const f of selectedFiles) {
      if (!validTypes.includes(f.type)) {
        toast.error(`Chỉ hỗ trợ file PDF hoặc DOCX. Tệp ${f.name} bị từ chối.`);
        continue;
      }
      if (f.size > 25 * 1024 * 1024) {
        toast.error(`Kích thước file ${f.name} vượt quá 25MB.`);
        continue;
      }
      newFiles.push(f);
    }
    
    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      // Tự động điền title nếu chưa có và chỉ chọn 1 file
      if (!title && files.length === 0 && newFiles.length === 1) {
        const fileNameWithoutExt = newFiles[0].name.split('.').slice(0, -1).join('.');
        setTitle(fileNameWithoutExt);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề tài liệu");
      return;
    }
    if (files.length === 0) {
      toast.error("Vui lòng chọn ít nhất một file đính kèm");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("classId", classId);
      formData.append("title", title);
      formData.append("description", description);
      files.forEach((f) => {
        formData.append("files", f);
      });

      await documentService.uploadDocument(formData);
      
      toast.success("Tải tài liệu lên thành công!");
      resetForm();
      onUploadSuccess();
      onClose();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Đã xảy ra lỗi khi upload tài liệu";
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Tải lên tài liệu</h2>
          <button 
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
            disabled={isUploading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">File đính kèm <span className="text-red-500">*</span></label>
            
            {files.length === 0 ? (
              <div 
                className="border-2 border-dashed border-gray-300 hover:border-indigo-400 bg-gray-50 hover:bg-indigo-50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition"
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
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3 text-indigo-600">
                  <UploadCloud size={24} />
                </div>
                <p className="text-sm font-medium text-gray-700 text-center">Kéo thả file vào đây hoặc click để chọn</p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <FileType size={12} /> Hỗ trợ PDF, DOCX (Tối đa 25MB/file)
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
                        <span className="text-base shrink-0">{f.name.toLowerCase().endsWith('.pdf') ? "📄" : "📝"}</span>
                        <span className="text-sm text-indigo-700 truncate font-medium flex-1" title={f.name}>
                          {f.name}
                        </span>
                        <span className="ml-1 shrink-0 text-xs text-indigo-500 font-medium">
                          ({(f.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Xóa file"
                        disabled={isUploading}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <label 
                  htmlFor="upload-doc-add-more-input"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer mt-1 pl-1 transition"
                >
                  <UploadCloud size={14} />
                  Thêm file khác
                </label>
                <input 
                  id="upload-doc-add-more-input"
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept=".pdf,.docx"
                  multiple
                  disabled={isUploading}
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề <span className="text-red-500">*</span></label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề tài liệu"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              disabled={isUploading}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả cho tài liệu (không bắt buộc)"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
              disabled={isUploading}
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition cursor-pointer"
              disabled={isUploading}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isUploading || files.length === 0 || !title.trim()}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition cursor-pointer"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang tải lên...
                </>
              ) : (
                "Tải lên"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
