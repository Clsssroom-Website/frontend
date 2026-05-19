import { useState, useEffect, useCallback } from "react";
import { Upload, FileText, Download, Clock, Eye, ChevronRight, Paperclip, Edit, Trash2 } from "lucide-react";
import UploadDocumentModal from "../../../../components/classes/UploadDocumentModal";
import EditDocumentModal from "../../../../components/classes/EditDocumentModal";
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
  isTeacher: boolean;
  onEdit: (doc: Document) => void;
  onDelete: (documentId: string) => void;
}

const DocumentItem = ({ doc, isTeacher, onEdit, onDelete }: DocumentItemProps) => {
  const [expanded, setExpanded] = useState(false);

  const handlePreview = async (attachmentId: string) => {
    try {
      const res = await documentService.getDownloadUrl(attachmentId);
      if (res.success && res.data) {
        window.open(res.data, "_blank");
      }
    } catch (error) {
      toast.error("Không thể lấy link tài liệu.");
    }
  };

  const handleDownload = async (attachmentId: string) => {
    try {
      const res = await documentService.getDownloadUrl(attachmentId, "download");
      if (res.success && res.data) {
        window.location.href = res.data;
      }
    } catch (error) {
      toast.error("Không thể lấy link tải tài liệu.");
    }
  };

  const attachments = doc.DocumentAttachments || [];

  return (
    <div className="border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition overflow-hidden">
      {/* Main row */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/30 transition duration-150 select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl flex-shrink-0">
            <FileText size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-800 truncate text-base" title={doc.title}>
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
              <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Paperclip size={12} />
                {attachments.length} file đính kèm
              </span>
            </div>
          </div>
        </div>
        
        {/* Toggle & Action buttons */}
        <div className="flex items-center gap-1.5 ml-4 shrink-0" onClick={(e) => e.stopPropagation()}>
          {isTeacher && (
            <div className="flex items-center gap-1">
              <button 
                onClick={() => onEdit(doc)}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                title="Chỉnh sửa tài liệu"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => onDelete(doc.documentId)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                title="Xóa tài liệu"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
          <div 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronRight size={20} className={`transform transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </div>

      {/* Expanded Attachment List */}
      {expanded && (
        <div className="border-t border-gray-50 bg-gray-50/30 px-4 py-3 space-y-2">
          {attachments.length === 0 ? (
            <p className="text-sm text-gray-400 italic pl-0 sm:pl-12 py-1">Tài liệu này không có tệp đính kèm nào.</p>
          ) : (
            attachments.map((att) => {
              const isPdf = att.fileName?.toLowerCase().endsWith('.pdf');
              return (
                <div key={att.attachmentId} className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 px-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-gray-200 transition ml-0 sm:ml-12 gap-2">
                  <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1 mr-2">
                    <span className="text-base shrink-0">{isPdf ? "📄" : "📝"}</span>
                    <span className="text-sm font-medium text-gray-700 truncate" title={att.fileName}>
                      {att.fileName}
                    </span>
                    {att.fileSize && (
                      <span className="text-xs text-gray-400 shrink-0">
                        ({formatFileSize(att.fileSize)})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 justify-end">
                    {isPdf && (
                      <button 
                        onClick={() => handlePreview(att.attachmentId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-md transition cursor-pointer"
                        title="Xem trước trên trình duyệt"
                      >
                        <Eye size={14} />
                        <span>Xem trước</span>
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleDownload(att.attachmentId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm hover:shadow transition cursor-pointer"
                    >
                      <Download size={14} />
                      <span>Tải về</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// --- Main Component ---
interface DocumentsTabProps {
  classId: string;
  role?: "teacher" | "student";
}

export default function DocumentsTab({ classId, role = "teacher" }: DocumentsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
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
    const timer = setTimeout(() => {
      fetchDocuments();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDocuments]);

  const handleEdit = (doc: Document) => {
    setSelectedDocument(doc);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tài liệu này không? Tất cả các tệp đính kèm cũng sẽ bị xóa.")) {
      try {
        await documentService.deleteDocument(documentId);
        toast.success("Xóa tài liệu thành công!");
        fetchDocuments();
      } catch (error) {
        toast.error("Không thể xóa tài liệu");
      }
    }
  };

  const isTeacher = role === "teacher";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Tài liệu bài giảng</h2>
        {isTeacher && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm hover:shadow-md cursor-pointer"
          >
            <Upload size={16} />
            Upload tài liệu
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <FileText size={48} className="text-gray-300" />
          <p className="text-lg font-medium text-gray-600">Chưa có tài liệu nào</p>
          <p className="text-sm text-center px-4">
            {isTeacher 
              ? 'Bấm "Upload tài liệu" để chia sẻ tài liệu với học sinh.' 
              : 'Tài liệu bài giảng từ giáo viên sẽ xuất hiện ở đây.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {documents.map((doc) => (
            <DocumentItem 
              key={doc.documentId} 
              doc={doc} 
              isTeacher={isTeacher}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {isTeacher && (
        <UploadDocumentModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          classId={classId}
          onUploadSuccess={fetchDocuments}
        />
      )}

      {isTeacher && selectedDocument && (
        <EditDocumentModal 
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedDocument(null);
          }}
          document={selectedDocument}
          onEditSuccess={fetchDocuments}
        />
      )}
    </div>
  );
}
