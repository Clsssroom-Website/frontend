export interface Attachment {
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  fileSize?: string | null;
}

export interface Assignment {
  assignmentId: string;
  classId: string;
  title: string;
  description: string;
  deadline: string;
  typeAssignment: string;
  status: string;
  createdAt: string;
  totalSubmissions?: number;
  AssignmentAttachments: Attachment[];
}

/** File đã tồn tại trên server (giữ lại khi edit) */
export interface ExistingAttachment {
  kind: "existing";
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  fileSize?: string | null;
}

/** File mới được chọn từ máy tính (chưa upload) */
export interface NewAttachment {
  kind: "new";
  file: File;
  previewName: string;
}

export type AttachmentItem = ExistingAttachment | NewAttachment;
