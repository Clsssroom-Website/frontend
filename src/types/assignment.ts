export interface AttachmentInput {
  fileName: string;
  fileUrl: string;
}

export interface Attachment {
  attachmentId: string;
  fileName: string;
  fileUrl: string;
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
