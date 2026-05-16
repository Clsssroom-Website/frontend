import { Link } from "react-router-dom";
import { MapPin, Users, PenBox, Link as LinkIcon, Trash2 } from "lucide-react";
import type { Classroom } from "../../pages/classes/types";

interface ClassroomCardProps {
  cls: Classroom;
  role: "student" | "teacher";
  onDelete: (classId: string) => void;
}

export function ClassroomCard({ cls, role, onDelete }: ClassroomCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group relative">
      <Link to={`/${role}/classes/${cls.classId}`} className="absolute inset-0 z-0"></Link>
      <div className="h-32 bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500"></div>
      
      <div className="p-5 flex flex-col flex-1 space-y-4">
        <div className="flex justify-between items-start relative z-10">
          <div>
            <Link to={`/${role}/classes/${cls.classId}`} className="hover:underline">
              <h3 className="font-semibold text-lg text-gray-800 line-clamp-1">{cls.className}</h3>
            </Link>
            <p className="text-gray-500 text-sm line-clamp-1">{cls.description || "No description"}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${cls.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {cls.status === "ACTIVE" ? "available" : "end"}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600 flex-1 relative z-10 pointer-events-none">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-gray-400" />
            <span className="line-clamp-1">Phòng: {cls.room || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-400" />
            <span>Sĩ số: N/A</span>
          </div>
          <div className="flex items-center gap-2">
            <PenBox size={16} className="text-gray-400" />
            <span>Mã mời: {cls.joinCode}</span>
          </div>
        </div>

        {role === "teacher" && (
          <div className="flex gap-2 mt-auto pt-2 border-t border-gray-50 relative z-10">
            <button 
              onClick={(e) => {
                e.preventDefault();
                navigator.clipboard.writeText(cls.joinCode);
                alert("Tạo mã mời đã copy!");
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700 text-sm transition-colors"
            >
              <LinkIcon size={16} />
              Copy link
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                onDelete(cls.classId);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-md hover:bg-red-50 text-red-600 text-sm transition-colors"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
