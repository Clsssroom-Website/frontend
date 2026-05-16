import { Upload, FileText, Download } from "lucide-react";

interface DocumentsTabProps {
  classId: string;
}

export default function TeacherDocumentsTab({ classId }: DocumentsTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Tài liệu bài giảng</h2>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition">
          <Upload size={16} />
          Upload tài liệu
        </button>
      </div>

      {/* Placeholder - sẽ implement API Documents sau */}
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
        <FileText size={48} className="text-gray-300" />
        <p className="text-lg font-medium">Chưa có tài liệu nào</p>
        <p className="text-sm">Bấm "Upload tài liệu" để chia sẻ tài liệu với học sinh.</p>
      </div>
    </div>
  );
}
