import { useEffect, useState } from "react";
import { FileText, MoreVertical, Edit3, Clock } from "lucide-react";
import { classroomService } from "../../services/classroomService";

interface StreamTabProps {
  classId: string;
  role: "teacher" | "student";
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
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
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

  if (loading) {
    return <div className="text-center text-gray-500 py-10">Đang tải bảng tin...</div>;
  }

  if (stream.length === 0) {
    return <div className="text-center text-gray-500 py-10">Lớp học này chưa có thông báo, bài tập hay tài liệu nào.</div>;
  }

  return (
    <div className="space-y-6">

      {/* Danh sách bảng tin (stream) */}
      {stream.map((item) => (
        <div key={item.id} className="border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full text-white ${item.type === "assignment" ? "bg-indigo-500" : "bg-blue-500"}`}>
                {item.type === "assignment" ? <Edit3 size={20} /> : <FileText size={20} />}
              </div>
              <div>
                <h4 className="font-medium text-gray-800">
                  {role === "teacher" ? "Bạn" : "Giáo viên"} đã đăng một {item.type === "assignment" ? "bài tập mới" : "tài liệu mới"}: {item.title}
                </h4>
                <p className="text-xs text-gray-500">
                  {formatDate(item.createdAt || item.uploadTime)}

                  {item.type === "assignment" && item.deadline && (
                    <div className="ml-14 mb-4 mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">
                      <Clock size={14} />
                      Hạn nộp: {formatDate(item.deadline)}
                    </div>
                  )}
                </p>
              </div>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
              <MoreVertical size={20} />
            </button>
          </div>

          <div className="text-gray-800 mb-4 ml-14 whitespace-pre-wrap">
            {item.description}
          </div>
        </div>
      ))}
    </div>
  );
}
