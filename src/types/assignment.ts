export interface Attachment {
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  downloadUrl?: string;
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
  downloadUrl?: string;
  fileSize?: string | null;
}

/** File mới được chọn từ máy tính (chưa upload) */
export interface NewAttachment {
  kind: "new";
  file: File;
  previewName: string;
}

export type AttachmentItem = ExistingAttachment | NewAttachment;

export interface SubmissionAttachment {
  attachmentId: string;
  submissionId: string;
  fileName: string;
  fileUrl: string;
  downloadUrl?: string;
  fileSize?: string | null;
  uploadedAt?: string;
}

export interface SubmissionGrade {
  gradeId: string;
  score: number | null;
  comment?: string | null;
  gradedAt?: string;
}

export interface SubmissionStudent {
  userId: string;
  name: string;
  email: string;
}

export interface Submission {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  submittedAt: string;
  status: string;
  student: SubmissionStudent | null;
  SubmissionAttachments: SubmissionAttachment[];
  grade: SubmissionGrade | null;
}
