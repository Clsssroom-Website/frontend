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
};
