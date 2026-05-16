import { Plus, FileText, Clock, AlertCircle } from "lucide-react";

interface AssignmentsTabProps {
  classId: string;
}

export default function TeacherAssignmentsTab({ classId }: AssignmentsTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Danh sách bài tập</h2>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition">
          <Plus size={16} />
          Tạo bài tập
        </button>
      </div>

      {/* Placeholder - sẽ implement API sau */}
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
        <FileText size={48} className="text-gray-300" />
        <p className="text-lg font-medium">Chưa có bài tập nào</p>
        <p className="text-sm">Bấm "Tạo bài tập" để bắt đầu giao bài cho lớp.</p>
      </div>
    </div>
  );
}
