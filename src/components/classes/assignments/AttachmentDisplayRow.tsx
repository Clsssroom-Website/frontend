import { Paperclip, X } from "lucide-react";
import type { AttachmentInput } from "../../../types/assignment";

interface AttachmentDisplayRowProps {
  attachment: AttachmentInput;
  onRemove: () => void;
}

export default function AttachmentDisplayRow({
  attachment,
  onRemove,
}: AttachmentDisplayRowProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 overflow-hidden">
        <Paperclip size={15} className="text-gray-500 shrink-0" />
        <a
          href={attachment.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-indigo-600 hover:underline truncate"
        >
          {attachment.fileName}
        </a>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
      >
        <X size={15} />
      </button>
    </div>
  );
}
