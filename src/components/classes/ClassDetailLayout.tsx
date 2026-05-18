import type { ReactNode } from "react";
import { Settings, Share2, MoreVertical, Copy } from "lucide-react";
import type { Classroom } from "../../types/classroom";

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
}

export default function ClassDetailLayout({
  classroom,
  role,
  tabs,
  activeTab,
  onTabChange,
  children,
}: ClassDetailLayoutProps) {
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
              <button className="p-2 hover:bg-white/20 rounded-full transition">
                <Share2 size={20} />
              </button>
              {role === "teacher" && (
                <button className="p-2 hover:bg-white/20 rounded-full transition">
                  <Settings size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

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
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* LEFT SIDEBAR */}
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
                    alert("Đã copy mã!");
                  }}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Google Meet Box */}
          {/* <div className="border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                <div className="bg-green-100 p-1.5 rounded-md">
                  <Video size={16} className="text-green-600" />
                </div>
                Meet
              </div>
              <button className="p-1 hover:bg-gray-100 rounded-full text-gray-700">
                <MoreVertical size={16} />
              </button>
            </div>
            <button className="w-full py-2 border border-gray-300 text-indigo-600 font-medium rounded-full hover:bg-indigo-50 transition">
              Tham gia
            </button>
          </div> */}

          {/* Thông tin lớp */}
          {classroom.room && (
            <div className="border border-gray-200 rounded-xl p-4 shadow-sm text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">Phòng học</p>
              <p>{classroom.room}</p>
            </div>
          )}
        </div>

        {/* RIGHT CONTENT — Tab Content */}
        <div className="col-span-1 md:col-span-3">
          {children}
        </div>
      </div>
    </div>
  );
}
