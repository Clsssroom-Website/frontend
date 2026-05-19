import api from "../config/axiosClient";
import type { Document } from "../types/document";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const documentService = {
  /**
   * Tải lên một tài liệu mới cho lớp học
   * @param data FormData bao gồm file, classId, title, description
   */
  uploadDocument: async (data: FormData): Promise<ApiResponse<Document>> => {
    const response = await api.post<ApiResponse<Document>>("/documents/upload", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response as unknown as ApiResponse<Document>;
  },
  /**
   * Lấy danh sách tài liệu của một lớp học
   * @param classId ID của lớp học
   */
  getDocumentsByClassId: async (classId: string): Promise<ApiResponse<Document[]>> => {
    const response = await api.get<ApiResponse<Document[]>>(`/documents/class/${classId}`);
    return response as unknown as ApiResponse<Document[]>;
  },
  /**
   * Lấy URL để tải xuống file tài liệu an toàn (Presigned URL)
   */
  getDownloadUrl: async (attachmentId: string, action?: string): Promise<ApiResponse<string>> => {
    const url = action ? `/documents/attachment/${attachmentId}/download?action=${action}` : `/documents/attachment/${attachmentId}/download`;
    const response = await api.get<ApiResponse<string>>(url);
    return response as unknown as ApiResponse<string>;
  },
  /**
   * Chỉnh sửa tài liệu đã upload
   */
  updateDocument: async (documentId: string, data: FormData): Promise<ApiResponse<Document>> => {
    const response = await api.put<ApiResponse<Document>>(`/documents/${documentId}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response as unknown as ApiResponse<Document>;
  },
  /**
   * Xóa tài liệu
   */
  deleteDocument: async (documentId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/documents/${documentId}`);
    return response as unknown as ApiResponse<void>;
  },
};
