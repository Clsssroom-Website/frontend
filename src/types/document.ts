export interface DocumentAttachment {
  attachmentId: string;
  documentId: string;
  fileName: string;
  fileUri: string;
  fileSize: string | null;
  uploadedAt: string;
}

export interface Document {
  documentId: string;
  classId: string;
  title: string;
  description: string | null;
  uploadTime: string;
  DocumentAttachments: DocumentAttachment[];
}
