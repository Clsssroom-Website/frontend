import { useState, useEffect } from "react";
import { classroomService } from "../../services/classroomService";
import { X, Save, Lock, Unlock } from "lucide-react";
import toast from "react-hot-toast";
import type { Classroom } from "../../types/classroom";

interface ClassSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: Classroom;
  onSuccess: () => void;
}

export default function ClassSettingsModal({
  isOpen,
  onClose,
  classroom,
  onSuccess,
}: ClassSettingsModalProps) {
  const [formData, setFormData] = useState({
    className: "",
    description: "",
    room: "",
    topic: "",
  });
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    if (classroom) {
      setFormData({
        className: classroom.className || "",
        description: classroom.description || "",
        room: classroom.room || "",
        topic: classroom.topic || "",
      });
    }
  }, [classroom, isOpen]);

  if (!isOpen) return null;

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.className.trim()) {
      toast.error("Tên lớp học không được để trống.");
      return;
    }

    setSaving(true);
    try {
      const res = await classroomService.updateClass(classroom.classId, formData);
      if (res.success) {
        toast.success("Cập nhật thông tin lớp học thành công!");
        onSuccess();
      } else {
        toast.error(res.message || "Không thể cập nhật thông tin lớp.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Lỗi kết nối.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    const isCurrentlyActive = classroom.status === "ACTIVE";
    const nextStatus = isCurrentlyActive ? "ENDED" : "ACTIVE";
    const confirmMessage = isCurrentlyActive
      ? "Bạn có chắc chắn muốn KẾT THÚC lớp học này không? Học sinh sẽ không thể nộp bài và giáo viên không thể thay đổi thông tin."
      : "Bạn có chắc chắn muốn MỞ LẠI lớp học này không?";

    if (!window.confirm(confirmMessage)) return;

    setTogglingStatus(true);
    try {
      const res = await classroomService.updateClass(classroom.classId, {
        status: nextStatus,
      });
      if (res.success) {
        toast.success(
          isCurrentlyActive ? "Đã kết thúc lớp học thành công!" : "Đã mở lại lớp học thành công!"
        );
        onSuccess();
      } else {
        toast.error(res.message || "Không thể thay đổi trạng thái lớp.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Lỗi kết nối.");
    } finally {
      setTogglingStatus(false);
    }
  };

  const isClassEnded = classroom.status === "ENDED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800">Cài đặt lớp học</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status actions */}
          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Trạng thái lớp học</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isClassEnded ? "Lớp học đã kết thúc (Khóa chỉnh sửa)" : "Lớp học đang mở và hoạt động"}
              </p>
            </div>
            <button
              onClick={handleToggleStatus}
              disabled={togglingStatus}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm hover:shadow transition disabled:opacity-50 ${
                isClassEnded
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-rose-600 hover:bg-rose-700 text-white"
              }`}
            >
              {isClassEnded ? (
                <>
                  <Unlock size={14} />
                  Mở lại lớp
                </>
              ) : (
                <>
                  <Lock size={14} />
                  Kết thúc lớp
                </>
              )}
            </button>
          </div>

          {/* Edit details form */}
          <form onSubmit={handleUpdateDetails} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Tên lớp học *</label>
              <input
                required
                type="text"
                disabled={isClassEnded}
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="w-full px-3 py-2 border text-sm text-gray-800 border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow disabled:bg-gray-100 disabled:text-gray-400"
                placeholder="e.g. Quản lý dự án"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Mô tả lớp học</label>
              <textarea
                disabled={isClassEnded}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border text-sm text-gray-800 border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow resize-none disabled:bg-gray-100 disabled:text-gray-400"
                placeholder="Mô tả lớp học..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Phòng học</label>
                <input
                  type="text"
                  disabled={isClassEnded}
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  className="w-full px-3 py-2 border text-sm text-gray-800 border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow disabled:bg-gray-100 disabled:text-gray-400"
                  placeholder="e.g. 2D11"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Chủ đề</label>
                <input
                  type="text"
                  disabled={isClassEnded}
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full px-3 py-2 border text-sm text-gray-800 border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow disabled:bg-gray-100 disabled:text-gray-400"
                  placeholder="e.g. HK1-2025"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-xs font-semibold text-gray-700 rounded-md hover:bg-gray-50 transition"
              >
                Đóng
              </button>
              {!isClassEnded && (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save size={14} />
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
