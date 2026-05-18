import { useState, useEffect } from "react";
import { Upload, FileText, Download, Clock } from "lucide-react";
import UploadDocumentModal from "../../../../components/classes/UploadDocumentModal";
import { documentService } from "../../../../services/document.service";
import type { Document } from "../../../../types/document";
import toast from "react-hot-toast";

interface DocumentsTabProps {
  classId: string;
}

export default function TeacherDocumentsTab({ classId }: DocumentsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await documentService.getDocumentsByClassId(classId);
      if (res.success) {
        setDocuments(res.data);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách tài liệu");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [classId]);

  const handleUploadSuccess = () => {
    fetchDocuments();
  };

  // Hàm helper để parse URL (nếu lưu dạng backend URL)
  const getFileUrl = (uri: string) => {
    // Nếu uri là đường dẫn bucket của MinIO, ta có thể xây dựng url API để tải.
    // Tạm thời hiển thị dưới dạng link tới endpoint public của MinIO hoặc API tải xuống.
    // Nếu bạn có API endpoint riêng để download, hãy thay thế tại đây.
    if (uri.startsWith('http')) return uri;
    return `${import.meta.env.VITE_MINIO_URL || "http://localhost:9000"}/${uri}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Tài liệu bài giảng</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm hover:shadow-md"
        >
          <Upload size={16} />
          Upload tài liệu
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <FileText size={48} className="text-gray-300" />
          <p className="text-lg font-medium text-gray-600">Chưa có tài liệu nào</p>
          <p className="text-sm">Bấm "Upload tài liệu" để chia sẻ tài liệu với học sinh.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => {
            const attachment = doc.DocumentAttachments?.[0];
            return (
              <div key={doc.documentId} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition group flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <FileText size={24} />
                  </div>
                  {attachment && (
                    <a 
                      href={getFileUrl(attachment.fileUri)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition"
                      title="Tải xuống"
                    >
                      <Download size={18} />
                    </a>
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-800 line-clamp-1 mb-1" title={doc.title}>
                  {doc.title}
                </h3>
                
                {doc.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">
                    {doc.description}
                  </p>
                )}
                
                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(doc.uploadTime)}
                  </span>
                  {attachment?.fileSize && (
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                      {(Number(attachment.fileSize) / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <UploadDocumentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        classId={classId}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
