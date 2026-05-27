import { Link } from "react-router-dom";
import { MapPin, Users, PenBox } from "lucide-react";
import type { Classroom } from "../../types/classroom";

interface ClassroomCardProps {
  cls: Classroom;
  linkTo: string;
  actions?: React.ReactNode;
}

export function ClassroomCard({ cls, linkTo, actions }: ClassroomCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group relative">
      <Link to={linkTo} className="absolute inset-0 z-0"></Link>
      <div className="h-32 bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500"></div>
      
      <div className="p-5 flex flex-col flex-1 space-y-4">
        <div className="flex justify-between items-start relative z-10">
          <div>
            <Link to={linkTo} className="hover:underline">
              <h3 className="font-semibold text-lg text-gray-800 line-clamp-1">{cls.className}</h3>
            </Link>
            <p className="text-gray-500 text-sm line-clamp-1">{cls.description || "No description"}</p>
          </div>
          <span className={`text-xs px-2 py-1 font-medium rounded-full border whitespace-nowrap ${cls.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
            {cls.status === "ACTIVE" ? "Đang hoạt động" : "Đã kết thúc"}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600 flex-1 relative z-10 pointer-events-none">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-gray-400" />
            <span className="line-clamp-1">Phòng: {cls.room || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-400" />
            <span>Sĩ số: {cls.totalStudents ?? "N/A"} học sinh</span>
          </div>
          <div className="flex items-center gap-2">
            <PenBox size={16} className="text-gray-400" />
            <span>Mã mời: {cls.joinCode}</span>
          </div>
        </div>

        {actions && (
          <div className="flex gap-2 mt-auto pt-2 border-t border-gray-50 relative z-10">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
