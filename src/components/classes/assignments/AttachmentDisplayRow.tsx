import { X } from "lucide-react";
import type { AttachmentItem } from "../../../types/assignment";

interface AttachmentDisplayRowProps {
  item: AttachmentItem;
  onRemove: () => void;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["pdf"].includes(ext ?? "")) return "📄";
  if (["doc", "docx"].includes(ext ?? "")) return "📝";
  if (["xls", "xlsx"].includes(ext ?? "")) return "📊";
  if (["jpg", "jpeg", "png", "gif"].includes(ext ?? "")) return "🖼️";
  if (["zip", "rar"].includes(ext ?? "")) return "📦";
  return "📎";
};

export default function AttachmentDisplayRow({ item, onRemove }: AttachmentDisplayRowProps) {
  const fileName = item.kind === "existing" ? item.fileName : item.previewName;
  const isNew = item.kind === "new";

  return (
    <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition ${
      isNew
        ? "bg-indigo-50 border-indigo-200"
        : "bg-gray-50 border-gray-200"
    }`}>
      <div className="flex items-center gap-2 overflow-hidden min-w-0">
        <span className="text-base shrink-0">{getFileIcon(fileName)}</span>

        {isNew ? (
          // File mới chọn từ máy — chưa upload
          <span className="text-sm text-indigo-700 truncate font-medium" title={fileName}>
            {fileName}
          </span>
        ) : (
          // File đã có trên server — có thể mở link
          <a
            href={
              item.fileUrl.startsWith("http")
                ? item.fileUrl
                : `${import.meta.env.VITE_MINIO_URL || "http://localhost:9000"}/${item.fileUrl}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:underline truncate"
            title={fileName}
          >
            {fileName}
          </a>
        )}

        {isNew && (
          <span className="ml-1 shrink-0 text-xs text-indigo-500 bg-indigo-100 px-1.5 py-0.5 rounded-full font-medium">
            Mới
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0 ml-2"
        title="Xóa file"
      >
        <X size={15} />
      </button>
    </div>
  );
}
