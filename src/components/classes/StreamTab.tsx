import { useEffect, useState } from "react";
import { FileText, MoreVertical, Edit3, Clock, Paperclip, Eye, Download } from "lucide-react";
import { classroomService } from "../../services/classroomService";
import toast from "react-hot-toast";

interface StreamTabProps {
  classId: string;
  role: "teacher" | "student";
}

interface Attachment {
  attachmentId: string;
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  fileType?: string;
}

interface StreamItem {
  id: string;
  type: "assignment" | "document";
  title: string;
  description?: string;
  createdAt?: string;
  uploadTime?: string;
  deadline?: string;
  status?: string;
  AssignmentAttachments?: Attachment[];
  DocumentAttachments?: Attachment[];
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const formatFileSize = (bytes?: string | number | null) => {
  if (!bytes) return null;
  return (Number(bytes) / (1024 * 1024)).toFixed(2) + " MB";
};

const getFileUrl = (uri: string) => {
  if (uri.startsWith('http')) return uri;
  return `${import.meta.env.VITE_MINIO_URL || "http://localhost:9000"}/${uri}`;
};

export default function StreamTab({ classId, role }: StreamTabProps) {
  const [stream, setStream] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStream = async () => {
      try {
        setLoading(true);
        const response: any = await classroomService.getStream(classId);
        if (response?.success) {
          setStream(response.data);
        }
      } catch (error) {
        console.error("Lỗi khi tải bảng tin:", error);
      } finally {
        setLoading(false);
      }
    };
    if (classId) {
      fetchStream();
    }
  }, [classId]);

  const handlePreview = (url: string) => {
    window.open(getFileUrl(url), "_blank");
  };

  const handleDownload = (url: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      const urlObj = new URL(getFileUrl(url));
      urlObj.searchParams.set("response-content-disposition", `attachment; filename="${fileName}"`);
      
      link.href = urlObj.toString();
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Không thể lấy link tải tài liệu.");
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500 py-10">Đang tải bảng tin...</div>;
  }

  if (stream.length === 0) {
    return <div className="text-center text-gray-500 py-10">Lớp học này chưa có thông báo, bài tập hay tài liệu nào.</div>;
  }

  return (
    <div className="space-y-6">

      {/* Danh sách bảng tin (stream) */}
      {stream.map((item) => {
        const attachments = item.type === "assignment" ? item.AssignmentAttachments || [] : item.DocumentAttachments || [];
        
        return (
        <div key={item.id} className="border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full text-white flex-shrink-0 ${item.type === "assignment" ? "bg-indigo-500" : "bg-blue-500"}`}>
                {item.type === "assignment" ? <Edit3 size={20} /> : <FileText size={20} />}
              </div>
              <div className="min-w-0">
                <h4 className="font-medium text-gray-800 break-words">
                  {role === "teacher" ? "Bạn" : "Giáo viên"} đã đăng một {item.type === "assignment" ? "bài tập mới" : "tài liệu mới"}: {item.title}
                </h4>
                <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span>{formatDate(item.createdAt || item.uploadTime)}</span>

                  {item.type === "assignment" && item.deadline && (
                    <span className="inline-flex items-center gap-1.5 font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                      <Clock size={14} />
                      Hạn nộp: {formatDate(item.deadline)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* <button className="p-1 hover:bg-gray-100 rounded-full text-gray-500 flex-shrink-0">
              <MoreVertical size={20} />
            </button> */}
          </div>

          <div className="text-gray-800 mb-4 ml-0 sm:ml-14 whitespace-pre-wrap break-words">
            {item.description}
          </div>

          {/* Attachments list */}
          {attachments.length > 0 && (
            <div className="ml-0 sm:ml-14 mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {attachments.map((att) => {
                const isPdf = att.fileName?.toLowerCase().endsWith('.pdf');
                const isImage = att.fileName?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                const canPreview = isPdf || isImage;
                
                return (
                  <div key={att.attachmentId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition group min-w-0">
                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                      <div className="p-2 bg-white rounded-md text-gray-400 group-hover:text-indigo-500 flex-shrink-0">
                        <Paperclip size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate" title={att.fileName}>
                          {att.fileName}
                        </p>
                        {att.fileSize && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatFileSize(att.fileSize)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {canPreview && (
                        <button 
                          onClick={() => handlePreview(att.fileUrl)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                          title="Xem trước"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDownload(att.fileUrl, att.fileName)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition"
                        title="Tải về"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )})}
    </div>
  );
}
