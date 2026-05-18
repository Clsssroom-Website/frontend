import { useState, useEffect, useCallback } from "react";
import { Upload, FileText, Download, Clock, Eye } from "lucide-react";
import UploadDocumentModal from "../../../../components/classes/UploadDocumentModal";
import { documentService } from "../../../../services/document.service";
import type { Document } from "../../../../types/document";
import toast from "react-hot-toast";

// --- Utilities ---
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const formatFileSize = (bytes?: string | number | null) => {
  if (!bytes) return null;
  return (Number(bytes) / (1024 * 1024)).toFixed(2) + " MB";
};

// --- Sub-components ---
interface DocumentItemProps {
  doc: Document;
}

const DocumentItem = ({ doc }: DocumentItemProps) => {
  const attachment = doc.DocumentAttachments?.[0];

  const handlePreview = async () => {
    try {
      const res = await documentService.getDownloadUrl(doc.documentId);
      if (res.success && res.data) {
        window.open(res.data, "_blank");
      }
    } catch (error) {
      toast.error("Không thể lấy link tài liệu.");
    }
  };

  const handleDownload = async () => {
    try {
      const res = await documentService.getDownloadUrl(doc.documentId, "download");
      if (res.success && res.data) {
        const link = document.createElement('a');
        link.href = res.data;
        link.download = attachment?.fileName || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      toast.error("Không thể lấy link tải tài liệu.");
    }
  };

  return (
    <div className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl flex-shrink-0">
          <FileText size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-800 truncate" title={doc.title}>
            {doc.title}
          </h3>
          {doc.description && (
            <p className="text-sm text-gray-500 truncate mt-0.5" title={doc.description}>
              {doc.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1.5">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDate(doc.uploadTime)}
            </span>
            {attachment?.fileSize && (
              <span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-medium">
                {formatFileSize(attachment.fileSize)}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {attachment && (
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          {attachment.fileName?.toLowerCase().endsWith('.pdf') && (
            <button 
              onClick={handlePreview}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-lg transition cursor-pointer"
              title="Xem trước trên trình duyệt"
            >
              <Eye size={16} />
              <span className="hidden sm:inline">Xem trước</span>
            </button>
          )}
          
          <button 
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow rounded-lg transition cursor-pointer"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Tải về</span>
          </button>
        </div>
      )}
    </div>
  );
};

// --- Main Component ---
interface DocumentsTabProps {
  classId: string;
}

export default function TeacherDocumentsTab({ classId }: DocumentsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
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
  }, [classId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

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
        <div className="flex flex-col gap-3">
          {documents.map((doc) => (
            <DocumentItem key={doc.documentId} doc={doc} />
          ))}
        </div>
      )}

      <UploadDocumentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        classId={classId}
        onUploadSuccess={fetchDocuments}
      />
    </div>
  );
}
