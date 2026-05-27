import { X, AlertTriangle, HelpCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title = "Xác nhận",
  message,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  let icon = <AlertTriangle size={20} className="stroke-[2.5]" />;
  let headerIconColor = "text-red-500";
  let confirmBtnColor = "bg-red-600 hover:bg-red-700 active:bg-red-800";

  if (variant === "warning") {
    icon = <AlertTriangle size={20} className="stroke-[2.5]" />;
    headerIconColor = "text-amber-500";
    confirmBtnColor = "bg-amber-600 hover:bg-amber-700 active:bg-amber-800";
  } else if (variant === "primary") {
    icon = <HelpCircle size={20} className="stroke-[2.5]" />;
    headerIconColor = "text-indigo-500";
    confirmBtnColor = "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 border border-gray-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className={`flex items-center gap-2 ${headerIconColor}`}>
            {icon}
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          </div>
          <button 
            type="button"
            onClick={onCancel}
            className="p-1.5 hover:bg-gray-200/70 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 bg-white">
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 active:bg-gray-200/70 transition-colors font-medium text-sm cursor-pointer shadow-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-colors font-medium text-sm cursor-pointer shadow-sm ${confirmBtnColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

