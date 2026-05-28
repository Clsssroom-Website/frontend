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

interface FormErrors {
  className?: string;
  description?: string;
  room?: string;
  topic?: string;
}

const LIMITS = {
  className: 100,
  description: 500,
  room: 50,
  topic: 100,
};

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
  const [errors, setErrors] = useState<FormErrors>({});
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
      setErrors({});
    }
  }, [classroom, isOpen]);

  if (!isOpen) return null;

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.className.trim()) {
      newErrors.className = "Tên lớp không được để trống.";
    } else if (formData.className.length > LIMITS.className) {
      newErrors.className = `Tên lớp không được vượt quá ${LIMITS.className} ký tự.`;
    }

    if (formData.description.length > LIMITS.description) {
      newErrors.description = `Mô tả không được vượt quá ${LIMITS.description} ký tự.`;
    }

    if (formData.room.length > LIMITS.room) {
      newErrors.room = `Tên phòng không được vượt quá ${LIMITS.room} ký tự.`;
    }

    if (formData.topic.length > LIMITS.topic) {
      newErrors.topic = `Chủ đề không được vượt quá ${LIMITS.topic} ký tự.`;
    }

    return newErrors;
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
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
            title="Đóng"
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
            {/* Class Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Tên lớp học *</label>
              <input
                type="text"
                disabled={isClassEnded}
                value={formData.className}
                onChange={(e) => handleChange("className", e.target.value)}
                maxLength={LIMITS.className + 10}
                className={`w-full px-3 py-2 border text-sm text-gray-800 rounded-md outline-none focus:ring-2 transition-shadow disabled:bg-gray-100 disabled:text-gray-400 ${
                  errors.className
                    ? "border-red-400 focus:ring-red-300"
                    : "border-gray-300 focus:ring-indigo-500"
                }`}
                placeholder="VD: Công nghệ phần mềm"
              />
              <div className="flex justify-between items-center">
                {errors.className ? (
                  <p className="text-xs text-red-500">{errors.className}</p>
                ) : (
                  <span />
                )}
                <span
                  className={`text-xs ml-auto ${
                    formData.className.length > LIMITS.className ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  {formData.className.length}/{LIMITS.className}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Mô tả lớp học</label>
              <textarea
                disabled={isClassEnded}
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                maxLength={LIMITS.description + 10}
                className={`w-full px-3 py-2 border text-sm text-gray-800 rounded-md outline-none focus:ring-2 transition-shadow resize-none disabled:bg-gray-100 disabled:text-gray-400 ${
                  errors.description
                    ? "border-red-400 focus:ring-red-300"
                    : "border-gray-300 focus:ring-indigo-500"
                }`}
                placeholder="Mô tả lớp học..."
                rows={2}
              />
              <div className="flex justify-between items-center">
                {errors.description ? (
                  <p className="text-xs text-red-500">{errors.description}</p>
                ) : (
                  <span />
                )}
                <span
                  className={`text-xs ml-auto ${
                    formData.description.length > LIMITS.description ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  {formData.description.length}/{LIMITS.description}
                </span>
              </div>
            </div>

            {/* Room & Topic */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Phòng học</label>
                <input
                  type="text"
                  disabled={isClassEnded}
                  value={formData.room}
                  onChange={(e) => handleChange("room", e.target.value)}
                  maxLength={LIMITS.room + 5}
                  className={`w-full px-3 py-2 border text-sm text-gray-800 rounded-md outline-none focus:ring-2 transition-shadow disabled:bg-gray-100 disabled:text-gray-400 ${
                    errors.room
                      ? "border-red-400 focus:ring-red-300"
                      : "border-gray-300 focus:ring-indigo-500"
                  }`}
                  placeholder="VD: A102"
                />
                {errors.room && <p className="text-xs text-red-500">{errors.room}</p>}
                <span
                  className={`text-xs ${
                    formData.room.length > LIMITS.room ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  {formData.room.length}/{LIMITS.room}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Chủ đề</label>
                <input
                  type="text"
                  disabled={isClassEnded}
                  value={formData.topic}
                  onChange={(e) => handleChange("topic", e.target.value)}
                  maxLength={LIMITS.topic + 10}
                  className={`w-full px-3 py-2 border text-sm text-gray-800 rounded-md outline-none focus:ring-2 transition-shadow disabled:bg-gray-100 disabled:text-gray-400 ${
                    errors.topic
                      ? "border-red-400 focus:ring-red-300"
                      : "border-gray-300 focus:ring-indigo-500"
                  }`}
                  placeholder="VD: HK2-2026"
                />
                {errors.topic && <p className="text-xs text-red-500">{errors.topic}</p>}
                <span
                  className={`text-xs ${
                    formData.topic.length > LIMITS.topic ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  {formData.topic.length}/{LIMITS.topic}
                </span>
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
