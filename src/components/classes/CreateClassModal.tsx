import { useState } from "react";
import { classroomService } from "../../services/classroomService";
import { X } from "lucide-react";
import toast from "react-hot-toast";

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export function CreateClassModal({ isOpen, onClose, onSuccess }: CreateClassModalProps) {
  const [formData, setFormData] = useState({
    className: "",
    description: "",
    room: "",
    topic: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [creating, setCreating] = useState(false);

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
    // Xóa lỗi của field đó ngay khi người dùng bắt đầu sửa
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setCreating(true);
    try {
      const data: any = await classroomService.createClass(formData);

      if (data.success) {
        toast.success(data.message || "Tạo lớp học thành công!");
        setFormData({ className: "", description: "", room: "", topic: "" });
        setErrors({});
        onSuccess();
      } else {
        toast.error(data.message || "Something went wrong!");
      }
    } catch (error: any) {
      const serverMessage =
        error?.response?.data?.message || "Tạo lớp học thất bại. Vui lòng thử lại.";
      toast.error(serverMessage);
      console.error("Failed to create class", error);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setFormData({ className: "", description: "", room: "", topic: "" });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-800">Tạo lớp học mới</h2>
          <button
            title="Đóng"
            onClick={handleClose}
            className="p-1 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleCreateClass} className="p-6 space-y-4">
          {/* Class Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Tên lớp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.className}
              onChange={(e) => handleChange("className", e.target.value)}
              maxLength={LIMITS.className + 10}
              className={`w-full px-3 py-2 border text-gray-600 rounded-md outline-none focus:ring-2 transition-shadow ${
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
            <label className="text-sm font-medium text-gray-700">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              maxLength={LIMITS.description + 10}
              className={`w-full px-3 py-2 border text-gray-600 rounded-md outline-none focus:ring-2 transition-shadow resize-none ${
                errors.description
                  ? "border-red-400 focus:ring-red-300"
                  : "border-gray-300 focus:ring-indigo-500"
              }`}
              placeholder="Mô tả về lớp học..."
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
              <label className="text-sm font-medium text-gray-700">Phòng học</label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => handleChange("room", e.target.value)}
                maxLength={LIMITS.room + 5}
                className={`w-full px-3 py-2 border text-gray-600 rounded-md outline-none focus:ring-2 transition-shadow ${
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
              <label className="text-sm font-medium text-gray-700">Chủ đề</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => handleChange("topic", e.target.value)}
                maxLength={LIMITS.topic + 10}
                className={`w-full px-3 py-2 border text-gray-600 rounded-md outline-none focus:ring-2 transition-shadow ${
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

          {/* Buttons */}
          <div className="pt-4 flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {creating ? "Đang tạo..." : "Tạo lớp học"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
