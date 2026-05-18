import axiosClient from "../config/axiosClient";
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
    // Lưu ý: axiosClient mặc định set Content-Type: application/json
    // Tuy nhiên, khi gửi FormData, trình duyệt sẽ tự động thiết lập Content-Type là multipart/form-data kèm theo boundary.
    // Vì vậy, ta cần override lại headers để xóa application/json đi (hoặc để trống để trình duyệt tự set).
    const response = await axiosClient.post<ApiResponse<Document>>("/documents/upload", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Lấy danh sách tài liệu của một lớp học
   * @param classId ID của lớp học
   */
  getDocumentsByClassId: async (classId: string): Promise<ApiResponse<Document[]>> => {
    const response = await axiosClient.get<ApiResponse<Document[]>>(`/documents/class/${classId}`);
    return response.data;
  },
};
