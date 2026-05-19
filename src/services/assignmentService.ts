import api from "../config/axiosClient";
import type { Assignment } from "../types/assignment";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const assignmentService = {
  /**
   * Lấy danh sách bài tập theo lớp
   */
  getAssignments: async (
    classId: string,
    role: "teacher" | "student"
  ): Promise<ApiResponse<Assignment[]>> => {
    const endpoint =
      role === "teacher"
        ? `/classes/${classId}/assignments`
        : `/students/classes/${classId}/assignments`;
    const response = await api.get<ApiResponse<Assignment[]>>(endpoint);
    return response as unknown as ApiResponse<Assignment[]>;
  },

  /**
   * Tạo bài tập mới — gửi FormData kèm file trực tiếp lên MinIO qua backend
   */
  createAssignment: async (
    classId: string,
    payload: {
      title: string;
      description?: string;
      deadline: string;
      typeAssignment?: string;
      files?: File[];
    }
  ): Promise<ApiResponse<Assignment>> => {
    const formData = new FormData();
    formData.append("title", payload.title);
    if (payload.description) formData.append("description", payload.description);
    formData.append("deadline", payload.deadline);
    if (payload.typeAssignment) formData.append("typeAssignment", payload.typeAssignment);

    (payload.files ?? []).forEach((file) => {
      formData.append("attachments", file);
    });

    const response = await api.post<ApiResponse<Assignment>>(
      `/classes/${classId}/assignments`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response as unknown as ApiResponse<Assignment>;
  },

  /**
   * Cập nhật bài tập — gửi FormData kèm file mới + IDs của file cũ muốn giữ
   */
  updateAssignment: async (
    classId: string,
    assignmentId: string,
    payload: {
      title?: string;
      description?: string;
      deadline?: string;
      typeAssignment?: string;
      keepAttachmentIds?: string[]; // IDs của attachments cũ muốn giữ
      files?: File[];               // Files mới upload
    }
  ): Promise<ApiResponse<Assignment>> => {
    const formData = new FormData();
    if (payload.title !== undefined) formData.append("title", payload.title);
    if (payload.description !== undefined) formData.append("description", payload.description);
    if (payload.deadline !== undefined) formData.append("deadline", payload.deadline);
    if (payload.typeAssignment !== undefined)
      formData.append("typeAssignment", payload.typeAssignment);

    // Gửi danh sách attachmentIds muốn giữ lại dưới dạng JSON
    if (payload.keepAttachmentIds !== undefined) {
      formData.append("keepAttachmentIds", JSON.stringify(payload.keepAttachmentIds));
    }

    (payload.files ?? []).forEach((file) => {
      formData.append("attachments", file);
    });

    const response = await api.put<ApiResponse<Assignment>>(
      `/classes/${classId}/assignments/${assignmentId}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response as unknown as ApiResponse<Assignment>;
  },

  /**
   * Xóa bài tập
   */
  deleteAssignment: async (
    classId: string,
    assignmentId: string
  ): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(
      `/classes/${classId}/assignments/${assignmentId}`
    );
    return response as unknown as ApiResponse<void>;
  },

  /**
   * Xóa một file đính kèm đơn lẻ
   */
  deleteAttachment: async (
    classId: string,
    assignmentId: string,
    attachmentId: string
  ): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(
      `/classes/${classId}/assignments/${assignmentId}/attachments/${attachmentId}`
    );
    return response as unknown as ApiResponse<void>;
  },

  /**
   * Nộp bài tập (Dành cho học sinh)
   */
  submitAssignment: async (
    assignmentId: string,
    files: File[]
  ): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("attachments", file);
    });

    const response = await api.post<ApiResponse<any>>(
      `/students/assignments/${assignmentId}/submit`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response as unknown as ApiResponse<any>;
  },

  /**
   * Xem bài nộp và điểm (Dành cho học sinh)
   */
  getSubmissionAndGrade: async (
    assignmentId: string
  ): Promise<ApiResponse<any>> => {
    const response = await api.get<ApiResponse<any>>(
      `/students/assignments/${assignmentId}/submission`
    );
    return response as unknown as ApiResponse<any>;
  },
};
