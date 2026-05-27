import { useState } from "react";
import type { ReactNode } from "react";
import { Settings, Share2, MoreVertical, Copy } from "lucide-react";
import type { Classroom } from "../../types/classroom";
import toast from "react-hot-toast";
import ClassSettingsModal from "./ClassSettingsModal";

interface TabConfig {
  id: string;
  label: string;
  icon: ReactNode;
}

interface ClassDetailLayoutProps {
  classroom: Classroom;
  role: "teacher" | "student";
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: ReactNode;
  onRefresh?: () => void;
}

export default function ClassDetailLayout({
  classroom,
  role,
  tabs,
  activeTab,
  onTabChange,
  children,
  onRefresh,
}: ClassDetailLayoutProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER BANNER */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="h-48 rounded-2xl bg-slate-800 relative overflow-hidden flex flex-col justify-end p-6 text-white">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-0"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511649475669-e288648b233a?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>

          <div className="relative z-10 flex justify-between items-end w-full">
            <div>
              <h1 className="text-3xl font-bold mb-1">{classroom.className}</h1>
              <p className="text-gray-200 text-lg">{classroom.topic || classroom.description}</p>
            </div>
            <div className="flex gap-3 mb-2">
              <button 
                onClick={() => {
                  const inviteLink = `${window.location.origin}/student/join?code=${classroom.joinCode}`;
                  navigator.clipboard.writeText(inviteLink);
                  toast.success("Đã sao chép link tham gia lớp học!");
                }}
                className="p-2 hover:bg-white/20 rounded-full transition"
                title="Sao chép link mời"
              >
                <Share2 size={20} />
              </button>
              {role === "teacher" && (
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                  title="Cài đặt lớp học"
                >
                  <Settings size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WARNING BANNER FOR ENDED CLASS */}
      {classroom.status === "ENDED" && (
        <div className="max-w-6xl mx-auto px-4 mt-4 animate-fade-in">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
            <span className="shrink-0 text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-sm">Lớp học này đã kết thúc</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Bạn chỉ có quyền xem nội dung lớp học. Mọi hoạt động chỉnh sửa, nộp bài, thảo luận hoặc chấm điểm đều bị khóa.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div className="max-w-6xl mx-auto px-4 mt-4 border-b border-gray-200">
        <div className="flex gap-6 px-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 pb-3 px-1 font-medium transition whitespace-nowrap ${activeTab === tab.id
                  ? "text-indigo-600 border-b-4 border-indigo-600"
                  : "text-gray-500 hover:text-gray-900"
                }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className={`max-w-6xl mx-auto px-4 py-6 ${activeTab === "stream" ? "grid grid-cols-1 md:grid-cols-4 gap-6" : ""}`}>
        {/* LEFT SIDEBAR — chỉ hiển thị ở tab Bảng tin */}
        {activeTab === "stream" && (
          <div className="hidden md:block col-span-1 space-y-4">
            {/* Mã lớp - chỉ teacher thấy */}
            {role === "teacher" && classroom.joinCode && (
              <div className="border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-sm text-gray-700">Mã lớp</h3>
                  <button className="p-1 hover:bg-gray-100 rounded-full text-gray-700">
                    <MoreVertical size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-semibold text-gray-800">{classroom.joinCode}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(classroom.joinCode);
                      toast.success("Đã sao chép mã lớp học thành công!");
                    }}
                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Thông tin lớp */}
            {classroom.room && (
              <div className="border border-gray-200 rounded-xl p-4 shadow-sm text-sm text-gray-600">
                <p className="font-medium text-gray-700 mb-1">Phòng học</p>
                <p>{classroom.room}</p>
              </div>
            )}
          </div>
        )}

        {/* RIGHT CONTENT — Tab Content */}
        <div className={activeTab === "stream" ? "col-span-1 md:col-span-3" : "w-full"}>
          {children}
        </div>
      </div>

      {/* Settings Modal */}
      <ClassSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        classroom={classroom}
        onSuccess={() => {
          setIsSettingsOpen(false);
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
