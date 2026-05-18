import { MessageSquare, FileText, MoreVertical } from "lucide-react";

interface StreamTabProps {
  classId: string;
  role: "teacher" | "student";
}

export default function StreamTab({ role }: StreamTabProps) {
  return (
    <div className="space-y-6">
      {/* Input Box - chỉ teacher mới được đăng thông báo */}
      {role === "teacher" && (
        <div className="border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md cursor-pointer transition">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
            T
          </div>
          <div className="flex-1 text-gray-400 text-sm">Đăng thông báo cho lớp học...</div>
        </div>
      )}

      {/* Danh sách bài đăng (mock) */}
      {[1, 2].map((_, idx) => (
        <div key={idx} className="border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <img
                src="https://ui-avatars.com/api/?name=Nguyen+Ngoc+Can&background=random"
                alt="avatar"
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h4 className="font-medium text-gray-800">Giáo viên</h4>
                <p className="text-xs text-gray-500">16/05/2026</p>
              </div>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
              <MoreVertical size={20} />
            </button>
          </div>

          <div className="text-gray-800 mb-4">
            {idx === 0 ? "Chào mừng các bạn đến với lớp học!" : "Ngày mai lớp học online nhé các bạn."}
          </div>

          {idx === 1 && (
            <div className="border border-gray-200 rounded-xl p-3 flex items-center gap-4 mb-4 hover:bg-gray-50 cursor-pointer">
              <div className="bg-blue-500 p-3 rounded-lg text-white">
                <FileText size={24} />
              </div>
              <div>
                <h5 className="font-medium text-gray-800">TaiLieu_BaiGiang.pdf</h5>
                <p className="text-xs text-gray-500 uppercase">PDF</p>
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-3 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 cursor-pointer transition">
            <MessageSquare size={16} />
            Bình luận
          </div>
        </div>
      ))}
    </div>
  );
}
