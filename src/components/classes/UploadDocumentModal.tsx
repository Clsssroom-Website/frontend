 import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, UploadCloud, FileType, CheckCircle2 } from "lucide-react";
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
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Kiểm tra file type cơ bản ở frontend
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // docx
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        toast.error("Chỉ hỗ trợ file PDF hoặc DOCX");
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Kiểm tra dung lượng (25MB = 25 * 1024 * 1024 bytes)
      if (selectedFile.size > 25 * 1024 * 1024) {
        toast.error("Kích thước file vượt quá 25MB");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setFile(selectedFile);
      // Tự động điền title nếu chưa có
      if (!title) {
        const fileNameWithoutExt = selectedFile.name.split('.').slice(0, -1).join('.');
        setTitle(fileNameWithoutExt);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Logic tương tự handleFileChange
      const droppedFile = e.dataTransfer.files[0];
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ];
      
      if (!validTypes.includes(droppedFile.type)) {
        toast.error("Chỉ hỗ trợ file PDF hoặc DOCX");
        return;
      }

      if (droppedFile.size > 25 * 1024 * 1024) {
        toast.error("Kích thước file vượt quá 25MB");
        return;
      }

      setFile(droppedFile);
      if (!title) {
        setTitle(droppedFile.name.split('.').slice(0, -1).join('.'));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề tài liệu");
      return;
    }
    if (!file) {
      toast.error("Vui lòng chọn một file đính kèm");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("classId", classId);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("file", file);

      await documentService.uploadDocument(formData);
      
      toast.success("Tải tài liệu lên thành công!");
      resetForm();
      onUploadSuccess();
      onClose();
    } catch (error: any) {
      // Lấy message lỗi từ backend (nếu có)
      const errorMsg = error.response?.data?.message || "Đã xảy ra lỗi khi upload tài liệu";
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Tải lên tài liệu</h2>
          <button 
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
            disabled={isUploading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">File đính kèm <span className="text-red-500">*</span></label>
            <div 
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer ${
                file ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-indigo-400 bg-gray-50 hover:bg-indigo-50"
              }`}
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
              />
              
              {file ? (
                <>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 text-green-600">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-sm font-medium text-gray-800 text-center">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <button 
                    type="button" 
                    className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    disabled={isUploading}
                  >
                    Chọn file khác
                  </button>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3 text-indigo-600">
                    <UploadCloud size={24} />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Kéo thả file vào đây hoặc click để chọn</p>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <FileType size={12} /> Hỗ trợ PDF, DOCX (Tối đa 25MB)
                  </p>
                </>
              )}
            </div>
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
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              disabled={isUploading}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isUploading || !file || !title.trim()}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
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
